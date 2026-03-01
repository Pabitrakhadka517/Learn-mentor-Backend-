
import { Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../auth/auth.middleware';
import { Job } from '../job/job.model';
import { Booking } from '../booking/booking.model';
import { Transaction } from './transaction.model';
import { User } from '../auth/user.model';
import { NotificationService } from '../notification/notification.service';

const ESEWA_SIGNED_FIELD_NAMES = 'total_amount,transaction_uuid,product_code';

function formatEsewaAmount(amount: number): string {
    const normalized = Number(amount).toFixed(2);
    return normalized.replace(/\.00$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function createEsewaSignature(params: {
    totalAmount: string;
    transactionUuid: string;
    productCode: string;
    secret: string;
}): string {
    const hashString = `total_amount=${params.totalAmount},transaction_uuid=${params.transactionUuid},product_code=${params.productCode}`;

    return crypto
        .createHmac('sha256', params.secret)
        .update(hashString)
        .digest('base64');
}

export const initBookingTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // 1. Validate Booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify ownership (sender/student must be the one paying)
        if (booking.student.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Only the student can initiate payment' });
        }

        // 3. Ensure no completed transaction exists
        const existingCompletedTransaction = await Transaction.findOne({
            booking: bookingId,
            status: 'done'
        });

        if (existingCompletedTransaction) {
            return res.status(400).json({ message: 'Booking already paid' });
        }

        // Check for existing pending transaction to reuse or update
        let transaction = await Transaction.findOne({
            booking: bookingId,
            status: 'pending'
        });

        const transactionUuid = uuidv4();
        const productCode = (process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST').trim();

        if (!transaction) {
            // Create new transaction
            transaction = new Transaction({
                booking: bookingId,
                sender: booking.student,
                receiver: booking.tutor,
                amount: booking.price,
                productCode,
                transactionUuid,
                status: 'pending'
            });
        } else {
            // Update the UUID for the fresh attempt
            transaction.transactionUuid = transactionUuid;
            transaction.productCode = productCode;
        }

        await transaction.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const totalAmount = formatEsewaAmount(transaction.amount);
        const signed_field_names = ESEWA_SIGNED_FIELD_NAMES;
        const secret = process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q';
        const signature = createEsewaSignature({
            totalAmount,
            transactionUuid: transaction.transactionUuid,
            productCode: transaction.productCode,
            secret,
        });

        // Return details for eSewa
        res.json({
            transactionId: transaction._id,
            amount: transaction.amount,
            total_amount: totalAmount,
            product_code: transaction.productCode,
            transaction_uuid: transaction.transactionUuid,
            signed_field_names,
            signature,
            success_url: `${frontendUrl}/dashboard/payment/success`,
            failure_url: `${frontendUrl}/dashboard/payment/failure`
        });

    } catch (error: any) {
        console.error('Init Booking Transaction Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const initTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { jobId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // 1. Validate Job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Verify ownership (sender must be the one paying)
        if (job.sender.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Only the sender can initiate payment' });
        }

        // 2. Ensure Job is Finished
        if (job.status !== 'finished') {
            return res.status(400).json({ message: 'Job is not finished yet' });
        }

        // 3. Ensure no completed transaction exists
        const existingCompletedTransaction = await Transaction.findOne({
            job: jobId,
            status: 'done'
        });

        if (existingCompletedTransaction) {
            return res.status(400).json({ message: 'Job already paid' });
        }

        // Check for existing pending transaction to reuse
        let transaction = await Transaction.findOne({
            job: jobId,
            status: 'pending'
        });

        const productCode = (process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST').trim();

        if (!transaction) {
            // Create new transaction
            const transactionUuid = uuidv4();

            transaction = new Transaction({
                job: jobId,
                sender: job.sender,
                receiver: job.receiver,
                amount: job.amount,
                productCode,
                transactionUuid,
                status: 'pending'
            });

            await transaction.save();
        } else {
            transaction.productCode = productCode;
            await transaction.save();
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const totalAmount = formatEsewaAmount(transaction.amount);
        const signed_field_names = ESEWA_SIGNED_FIELD_NAMES;
        const secret = process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q';
        const signature = createEsewaSignature({
            totalAmount,
            transactionUuid: transaction.transactionUuid,
            productCode: transaction.productCode,
            secret,
        });

        // Return details for eSewa
        res.json({
            transactionId: transaction._id,
            amount: transaction.amount,
            total_amount: totalAmount,
            product_code: transaction.productCode,
            transaction_uuid: transaction.transactionUuid,
            signed_field_names,
            signature,
            success_url: `${frontendUrl}/dashboard/payment/success`,
            failure_url: `${frontendUrl}/dashboard/payment/failure`
        });

    } catch (error: any) {
        console.error('Init Transaction Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Parse eSewa amount string robustly (handles "1,000.0", "1000", "1000.00")
 */
function parseEsewaAmount(amountStr: string | number): number {
    if (typeof amountStr === 'number') return amountStr;
    // Remove commas (thousands separator) then parse
    return parseFloat(String(amountStr).replace(/,/g, ''));
}

/**
 * Verify HMAC-SHA256 signature from eSewa callback data
 */
function verifyEsewaSignature(callbackData: any, secret: string): boolean {
    try {
        const { signed_field_names, signature } = callbackData;
        if (!signed_field_names || !signature) {
            console.warn('[eSewa Signature] Missing signed_field_names or signature');
            return false;
        }

        // Build the hash string from the signed fields
        const fields = signed_field_names.split(',');
        const hashString = fields.map((field: string) => `${field}=${callbackData[field]}`).join(',');

        // Compute HMAC-SHA256
        const computedSignature = crypto
            .createHmac('sha256', secret)
            .update(hashString)
            .digest('base64');

        console.log('[eSewa Signature] Hash string:', hashString);
        console.log('[eSewa Signature] Computed:', computedSignature);
        console.log('[eSewa Signature] Received:', signature);
        console.log('[eSewa Signature] Secret used (length):', secret.length);

        return computedSignature === signature;
    } catch (err) {
        console.error('[eSewa Signature] Verification error:', err);
        return false;
    }
}

/**
 * Verify payment via eSewa status API (fallback)
 */
async function verifyViaEsewaApi(transaction: any): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
        const esewaStatusUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/v2?product_code=${encodeURIComponent(transaction.productCode)}&total_amount=${transaction.amount}&transaction_uuid=${encodeURIComponent(transaction.transactionUuid)}`;

        console.log('[eSewa API Verify] URL:', esewaStatusUrl);

        const esewaResponse = await fetch(esewaStatusUrl);

        if (!esewaResponse.ok) {
            const errorText = await esewaResponse.text();
            console.error(`[eSewa API Verify] HTTP ${esewaResponse.status}: ${errorText}`);
            return { success: false, error: `eSewa API returned HTTP ${esewaResponse.status}` };
        }

        const responseText = await esewaResponse.text();
        let esewaData: any;
        try {
            esewaData = JSON.parse(responseText);
        } catch {
            console.error('[eSewa API Verify] Non-JSON response:', responseText.substring(0, 500));
            return { success: false, error: 'eSewa returned non-JSON response' };
        }

        console.log('[eSewa API Verify] Response:', JSON.stringify(esewaData));

        if (esewaData.status === 'COMPLETE') {
            return { success: true, status: 'COMPLETE' };
        }
        return { success: false, status: esewaData.status || 'Unknown' };
    } catch (err: any) {
        console.error('[eSewa API Verify] Network error:', err?.message || err);
        return { success: false, error: 'Could not reach eSewa API' };
    }
}

export const payTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { transactionCode, esewaCallbackData } = req.body;
        const { tId } = req.params;
        const userId = req.user?.userId;

        console.log('[PayTransaction] tId:', tId, '| Has callback data:', !!esewaCallbackData);

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Support finding by ID or UUID
        const isObjectId = mongoose.Types.ObjectId.isValid(tId);
        const query = isObjectId ? { _id: tId } : { transactionUuid: tId };

        const transaction = await Transaction.findOne(query)
            .populate('receiver sender job booking');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found. Please contact support.' });
        }

        // Verify status
        if (transaction.status === 'done') {
            // If already done, treat as success (idempotent)
            return res.json({ success: true, message: 'Payment already verified and processed.' });
        }

        // Security: Ensure the user verifying is the sender
        if (transaction.sender._id.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized transaction verification' });
        }

        const amountFromDB = transaction.amount;
        const esewaSecret = process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q';
        let verified = false;

        // --- Method 1: Server-side HMAC Signature Verification ---
        if (esewaCallbackData && esewaCallbackData.signature) {
            console.log('[PayTransaction] Attempting signature verification...');
            console.log('[PayTransaction] Callback data:', JSON.stringify(esewaCallbackData));

            const isValidSignature = verifyEsewaSignature(esewaCallbackData, esewaSecret);

            if (isValidSignature) {
                // Verify the amount matches what we expect
                const callbackAmount = parseEsewaAmount(esewaCallbackData.total_amount);
                if (Math.abs(callbackAmount - amountFromDB) > 0.01) {
                    console.error(`[eSewa Verify] Amount mismatch: expected ${amountFromDB}, got ${callbackAmount}`);
                    if (transaction.booking) {
                        await Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
                    }
                    return res.status(400).json({
                        success: false,
                        message: 'Payment verification failed: amount mismatch.'
                    });
                }

                // Verify the callback status is COMPLETE
                if (esewaCallbackData.status !== 'COMPLETE') {
                    if (transaction.booking) {
                        await Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
                    }
                    return res.status(400).json({
                        success: false,
                        message: `Payment verification failed. eSewa status: ${esewaCallbackData.status || 'Unknown'}`
                    });
                }

                console.log('[eSewa Verify] Signature verified successfully');
                verified = true;
            } else {
                console.warn('[eSewa Verify] Signature mismatch — will try eSewa API fallback');
            }
        }

        // --- Method 2: Fallback to eSewa Status API ---
        if (!verified) {
            console.log('[PayTransaction] Trying eSewa API verification...');
            const apiResult = await verifyViaEsewaApi(transaction);

            if (apiResult.success) {
                console.log('[eSewa Verify] API verification successful');
                verified = true;
            } else if (apiResult.status) {
                // eSewa API reachable but payment not complete
                if (transaction.booking) {
                    await Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
                }
                return res.status(400).json({
                    success: false,
                    message: `Payment verification failed. eSewa status: ${apiResult.status}`
                });
            } else {
                // Both methods failed — eSewa unreachable and signature didn't match
                return res.status(502).json({
                    success: false,
                    message: apiResult.error || 'Could not verify payment. Please try again in a moment.'
                });
            }
        }

        // Commission logic
        const commissionRate = 0.1; // 10%
        const commission = amountFromDB * commissionRate;
        const receiverAmount = amountFromDB - commission;

        // Atomic Updates (Sequential as transactions are excluded for compatibility)

        // 1. Update Receiver balance
        await User.findByIdAndUpdate(
            transaction.receiver._id,
            { $inc: { balance: receiverAmount } }
        );

        // 2. Mark Transaction as Done
        transaction.status = 'done';
        transaction.transactionCode = transactionCode;
        transaction.commission = commission;
        transaction.receiverAmount = receiverAmount;
        await transaction.save();

        // 3. Update Job/Booking Payment Status
        if (transaction.job) {
            await Job.findByIdAndUpdate(
                transaction.job._id,
                { paymentStatus: 'paid' }
            );
        }

        if (transaction.booking) {
            await Booking.findByIdAndUpdate(
                transaction.booking._id,
                {
                    paymentStatus: 'paid',
                    status: 'PAID'
                }
            );

            // 3.5 Enable Chatting for this booking
            try {
                const { ChatService } = require('../chat/chat.service');
                await ChatService.createChatForBooking(transaction.booking._id);
            } catch (chatError) {
                console.error('Failed to enable chat after payment:', chatError);
            }
        }

        // 4. Notify both participants
        try {
            const studentName = (transaction.sender as any).fullName || 'a student';
            const tutorName = (transaction.receiver as any).fullName || 'your tutor';

            await NotificationService.createNotification({
                recipient: transaction.receiver._id,
                sender: transaction.sender._id,
                type: 'PAYMENT_SUCCESS',
                message: `Payment of Rs. ${receiverAmount} received from ${studentName} for session booking`,
                relatedId: transaction._id
            });

            await NotificationService.createNotification({
                recipient: transaction.sender._id,
                sender: transaction.receiver._id,
                type: 'PAYMENT_SUCCESS',
                message: `Your payment of Rs. ${amountFromDB} to ${tutorName} was completed successfully`,
                relatedId: transaction._id
            });
        } catch (notifError) {
            console.error('Notification failed', notifError);
        }

        res.json({ success: true, message: 'Payment verified and processed successfully' });

    } catch (error: any) {
        console.error('Pay Transaction Error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const getSenderTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const transactions = await Transaction.find({ sender: userId })
            .populate('receiver', 'fullName email profileImage')
            .populate('booking', 'startTime endTime')
            .sort({ createdAt: -1 });

        // Map data to match frontend expectations
        const mappedTransactions = transactions.map(tx => {
            const txObj = tx.toObject();
            if (txObj.booking) {
                (txObj.booking as any).startTime = (tx.booking as any).startTime;
            }
            return {
                ...txObj,
                status: tx.status === 'done' ? 'completed' : tx.status,
                receiver: tx.receiver ? {
                    ...txObj.receiver,
                    name: (tx.receiver as any).fullName // Frontend expects 'name'
                } : null
            };
        });

        res.json({
            success: true,
            transactions: mappedTransactions
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getReceiverTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const transactions = await Transaction.find({
            receiver: userId,
            status: 'done'
        })
            .populate('sender', 'fullName email profileImage')
            .populate('booking', 'startTime endTime')
            .sort({ createdAt: -1 });

        // Map data to match frontend expectations
        const mappedTransactions = transactions.map(tx => {
            const txObj = tx.toObject();
            if (txObj.booking) {
                (txObj.booking as any).startTime = (tx.booking as any).startTime;
            }
            return {
                ...txObj,
                amount: tx.receiverAmount, // For tutors, the income is the receiverAmount
                status: 'completed',
                sender: tx.sender ? {
                    ...txObj.sender,
                    name: (tx.sender as any).fullName
                } : null
            };
        });

        res.json({
            success: true,
            transactions: mappedTransactions
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
