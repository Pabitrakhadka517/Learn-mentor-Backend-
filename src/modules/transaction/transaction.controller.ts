
import { Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../auth/auth.middleware';
import { Job } from '../job/job.model';
import { Booking } from '../booking/booking.model';
import { Transaction } from './transaction.model';
import { User } from '../auth/user.model';
import { NotificationService } from '../notification/notification.service';

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

        if (!transaction) {
            // Create new transaction
            transaction = new Transaction({
                booking: bookingId,
                sender: booking.student,
                receiver: booking.tutor,
                amount: booking.price,
                productCode: 'EPAYTEST',
                transactionUuid,
                status: 'pending'
            });
        } else {
            // Update the UUID for the fresh attempt
            transaction.transactionUuid = transactionUuid;
        }

        await transaction.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Return details for eSewa
        res.json({
            transactionId: transaction._id,
            amount: transaction.amount,
            product_code: transaction.productCode,
            transaction_uuid: transaction.transactionUuid,
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

        if (!transaction) {
            // Create new transaction
            const transactionUuid = uuidv4();

            transaction = new Transaction({
                job: jobId,
                sender: job.sender,
                receiver: job.receiver,
                amount: job.amount,
                productCode: 'EPAYTEST', // Default for testing
                transactionUuid,
                status: 'pending'
            });

            await transaction.save();
        }

        // Return details for eSewa
        res.json({
            transactionId: transaction._id,
            amount: transaction.amount,
            product_code: transaction.productCode,
            transaction_uuid: transaction.transactionUuid,
            signature: '',
            success_url: `${process.env.FRONTEND_URL}/dashboard/payment/success`,
            failure_url: `${process.env.FRONTEND_URL}/dashboard/payment/failure`
        });

    } catch (error: any) {
        console.error('Init Transaction Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const payTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { transactionCode } = req.body;
        const { tId } = req.params;
        const userId = req.user?.userId;

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
            return res.status(400).json({ message: 'Transaction already completed' });
        }

        // Security: Ensure the user verifying is the sender
        if (transaction.sender._id.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized transaction verification' });
        }

        const amountFromDB = transaction.amount;

        // --- Server-side eSewa Verification ---
        try {
            const esewaStatusUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/v2?product_code=${transaction.productCode}&total_amount=${amountFromDB}&transaction_uuid=${transaction.transactionUuid}`;
            
            const esewaResponse = await fetch(esewaStatusUrl);
            const esewaData = await esewaResponse.json();

            if (esewaData.status !== 'COMPLETE') {
                if (transaction.booking) {
                    await Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
                }
                return res.status(400).json({ 
                    success: false, 
                    message: `Payment verification failed. eSewa status: ${esewaData.status || 'Unknown'}` 
                });
            }
            // If we are here, eSewa has confirmed the payment
        } catch (verifyError: any) {
            console.error('eSewa verification request failed', verifyError);
            if (transaction.booking) {
                await Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
            }
            return res.status(500).json({ success: false, message: 'Failed to verify payment with eSewa. Please try again later.' });
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

        // 4. Notify Tutor
        try {
            const studentName = (transaction.sender as any).fullName || 'a student';
            await NotificationService.createNotification({
                recipient: transaction.receiver._id,
                sender: transaction.sender._id,
                type: 'PAYMENT_SUCCESS',
                message: `Payment of Rs. ${receiverAmount} received from ${studentName} for session booking`,
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
