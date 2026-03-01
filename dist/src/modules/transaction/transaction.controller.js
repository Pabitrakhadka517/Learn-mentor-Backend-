"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReceiverTransactions = exports.getSenderTransactions = exports.payTransaction = exports.initTransaction = exports.initBookingTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const job_model_1 = require("../job/job.model");
const booking_model_1 = require("../booking/booking.model");
const transaction_model_1 = require("./transaction.model");
const user_model_1 = require("../auth/user.model");
const notification_service_1 = require("../notification/notification.service");
const ESEWA_SIGNED_FIELD_NAMES = 'total_amount,transaction_uuid,product_code';
function formatEsewaAmount(amount) {
    const normalized = Number(amount).toFixed(2);
    return normalized.replace(/\.00$/, '').replace(/(\.\d*?)0+$/, '$1');
}
function createEsewaSignature(params) {
    const hashString = `total_amount=${params.totalAmount},transaction_uuid=${params.transactionUuid},product_code=${params.productCode}`;
    return crypto_1.default
        .createHmac('sha256', params.secret)
        .update(hashString)
        .digest('base64');
}
const initBookingTransaction = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const booking = await booking_model_1.Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.student.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Only the student can initiate payment' });
        }
        const existingCompletedTransaction = await transaction_model_1.Transaction.findOne({
            booking: bookingId,
            status: 'done'
        });
        if (existingCompletedTransaction) {
            return res.status(400).json({ message: 'Booking already paid' });
        }
        let transaction = await transaction_model_1.Transaction.findOne({
            booking: bookingId,
            status: 'pending'
        });
        const transactionUuid = (0, uuid_1.v4)();
        const productCode = (process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST').trim();
        if (!transaction) {
            transaction = new transaction_model_1.Transaction({
                booking: bookingId,
                sender: booking.student,
                receiver: booking.tutor,
                amount: booking.price,
                productCode,
                transactionUuid,
                status: 'pending'
            });
        }
        else {
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
    }
    catch (error) {
        console.error('Init Booking Transaction Error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.initBookingTransaction = initBookingTransaction;
const initTransaction = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const job = await job_model_1.Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        if (job.sender.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized: Only the sender can initiate payment' });
        }
        if (job.status !== 'finished') {
            return res.status(400).json({ message: 'Job is not finished yet' });
        }
        const existingCompletedTransaction = await transaction_model_1.Transaction.findOne({
            job: jobId,
            status: 'done'
        });
        if (existingCompletedTransaction) {
            return res.status(400).json({ message: 'Job already paid' });
        }
        let transaction = await transaction_model_1.Transaction.findOne({
            job: jobId,
            status: 'pending'
        });
        const productCode = (process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST').trim();
        if (!transaction) {
            const transactionUuid = (0, uuid_1.v4)();
            transaction = new transaction_model_1.Transaction({
                job: jobId,
                sender: job.sender,
                receiver: job.receiver,
                amount: job.amount,
                productCode,
                transactionUuid,
                status: 'pending'
            });
            await transaction.save();
        }
        else {
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
    }
    catch (error) {
        console.error('Init Transaction Error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.initTransaction = initTransaction;
function parseEsewaAmount(amountStr) {
    if (typeof amountStr === 'number')
        return amountStr;
    return parseFloat(String(amountStr).replace(/,/g, ''));
}
function verifyEsewaSignature(callbackData, secret) {
    try {
        const { signed_field_names, signature } = callbackData;
        if (!signed_field_names || !signature) {
            console.warn('[eSewa Signature] Missing signed_field_names or signature');
            return false;
        }
        const fields = signed_field_names.split(',');
        const hashString = fields.map((field) => `${field}=${callbackData[field]}`).join(',');
        const computedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(hashString)
            .digest('base64');
        console.log('[eSewa Signature] Hash string:', hashString);
        console.log('[eSewa Signature] Computed:', computedSignature);
        console.log('[eSewa Signature] Received:', signature);
        console.log('[eSewa Signature] Secret used (length):', secret.length);
        return computedSignature === signature;
    }
    catch (err) {
        console.error('[eSewa Signature] Verification error:', err);
        return false;
    }
}
async function verifyViaEsewaApi(transaction) {
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
        let esewaData;
        try {
            esewaData = JSON.parse(responseText);
        }
        catch {
            console.error('[eSewa API Verify] Non-JSON response:', responseText.substring(0, 500));
            return { success: false, error: 'eSewa returned non-JSON response' };
        }
        console.log('[eSewa API Verify] Response:', JSON.stringify(esewaData));
        if (esewaData.status === 'COMPLETE') {
            return { success: true, status: 'COMPLETE' };
        }
        return { success: false, status: esewaData.status || 'Unknown' };
    }
    catch (err) {
        console.error('[eSewa API Verify] Network error:', err?.message || err);
        return { success: false, error: 'Could not reach eSewa API' };
    }
}
const payTransaction = async (req, res) => {
    try {
        const { transactionCode, esewaCallbackData } = req.body;
        const { tId } = req.params;
        const userId = req.user?.userId;
        console.log('[PayTransaction] tId:', tId, '| Has callback data:', !!esewaCallbackData);
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const isObjectId = mongoose_1.default.Types.ObjectId.isValid(tId);
        const query = isObjectId ? { _id: tId } : { transactionUuid: tId };
        const transaction = await transaction_model_1.Transaction.findOne(query)
            .populate('receiver sender job booking');
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found. Please contact support.' });
        }
        if (transaction.status === 'done') {
            return res.json({ success: true, message: 'Payment already verified and processed.' });
        }
        if (transaction.sender._id.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized transaction verification' });
        }
        const amountFromDB = transaction.amount;
        const esewaSecret = process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q';
        let verified = false;
        if (esewaCallbackData && esewaCallbackData.signature) {
            console.log('[PayTransaction] Attempting signature verification...');
            console.log('[PayTransaction] Callback data:', JSON.stringify(esewaCallbackData));
            const isValidSignature = verifyEsewaSignature(esewaCallbackData, esewaSecret);
            if (isValidSignature) {
                const callbackAmount = parseEsewaAmount(esewaCallbackData.total_amount);
                if (Math.abs(callbackAmount - amountFromDB) > 0.01) {
                    console.error(`[eSewa Verify] Amount mismatch: expected ${amountFromDB}, got ${callbackAmount}`);
                    if (transaction.booking) {
                        await booking_model_1.Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
                    }
                    return res.status(400).json({
                        success: false,
                        message: 'Payment verification failed: amount mismatch.'
                    });
                }
                if (esewaCallbackData.status !== 'COMPLETE') {
                    if (transaction.booking) {
                        await booking_model_1.Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
                    }
                    return res.status(400).json({
                        success: false,
                        message: `Payment verification failed. eSewa status: ${esewaCallbackData.status || 'Unknown'}`
                    });
                }
                console.log('[eSewa Verify] Signature verified successfully');
                verified = true;
            }
            else {
                console.warn('[eSewa Verify] Signature mismatch — will try eSewa API fallback');
            }
        }
        if (!verified) {
            console.log('[PayTransaction] Trying eSewa API verification...');
            const apiResult = await verifyViaEsewaApi(transaction);
            if (apiResult.success) {
                console.log('[eSewa Verify] API verification successful');
                verified = true;
            }
            else if (apiResult.status) {
                if (transaction.booking) {
                    await booking_model_1.Booking.findByIdAndUpdate(transaction.booking._id, { paymentStatus: 'failed' });
                }
                return res.status(400).json({
                    success: false,
                    message: `Payment verification failed. eSewa status: ${apiResult.status}`
                });
            }
            else {
                return res.status(502).json({
                    success: false,
                    message: apiResult.error || 'Could not verify payment. Please try again in a moment.'
                });
            }
        }
        const commissionRate = 0.1;
        const commission = amountFromDB * commissionRate;
        const receiverAmount = amountFromDB - commission;
        await user_model_1.User.findByIdAndUpdate(transaction.receiver._id, { $inc: { balance: receiverAmount } });
        transaction.status = 'done';
        transaction.transactionCode = transactionCode;
        transaction.commission = commission;
        transaction.receiverAmount = receiverAmount;
        await transaction.save();
        if (transaction.job) {
            await job_model_1.Job.findByIdAndUpdate(transaction.job._id, { paymentStatus: 'paid' });
        }
        if (transaction.booking) {
            await booking_model_1.Booking.findByIdAndUpdate(transaction.booking._id, {
                paymentStatus: 'paid',
                status: 'PAID'
            });
            try {
                const { ChatService } = require('../chat/chat.service');
                await ChatService.createChatForBooking(transaction.booking._id);
            }
            catch (chatError) {
                console.error('Failed to enable chat after payment:', chatError);
            }
        }
        try {
            const studentName = transaction.sender.fullName || 'a student';
            const tutorName = transaction.receiver.fullName || 'your tutor';
            await notification_service_1.NotificationService.createNotification({
                recipient: transaction.receiver._id,
                sender: transaction.sender._id,
                type: 'PAYMENT_SUCCESS',
                message: `Payment of Rs. ${receiverAmount} received from ${studentName} for session booking`,
                relatedId: transaction._id
            });
            await notification_service_1.NotificationService.createNotification({
                recipient: transaction.sender._id,
                sender: transaction.receiver._id,
                type: 'PAYMENT_SUCCESS',
                message: `Your payment of Rs. ${amountFromDB} to ${tutorName} was completed successfully`,
                relatedId: transaction._id
            });
        }
        catch (notifError) {
            console.error('Notification failed', notifError);
        }
        res.json({ success: true, message: 'Payment verified and processed successfully' });
    }
    catch (error) {
        console.error('Pay Transaction Error:', error);
        res.status(400).json({ message: error.message });
    }
};
exports.payTransaction = payTransaction;
const getSenderTransactions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const transactions = await transaction_model_1.Transaction.find({ sender: userId })
            .populate('receiver', 'fullName email profileImage')
            .populate('booking', 'startTime endTime')
            .sort({ createdAt: -1 });
        const mappedTransactions = transactions.map(tx => {
            const txObj = tx.toObject();
            if (txObj.booking) {
                txObj.booking.startTime = tx.booking.startTime;
            }
            return {
                ...txObj,
                status: tx.status === 'done' ? 'completed' : tx.status,
                receiver: tx.receiver ? {
                    ...txObj.receiver,
                    name: tx.receiver.fullName
                } : null
            };
        });
        res.json({
            success: true,
            transactions: mappedTransactions
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSenderTransactions = getSenderTransactions;
const getReceiverTransactions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const transactions = await transaction_model_1.Transaction.find({
            receiver: userId,
            status: 'done'
        })
            .populate('sender', 'fullName email profileImage')
            .populate('booking', 'startTime endTime')
            .sort({ createdAt: -1 });
        const mappedTransactions = transactions.map(tx => {
            const txObj = tx.toObject();
            if (txObj.booking) {
                txObj.booking.startTime = tx.booking.startTime;
            }
            return {
                ...txObj,
                amount: tx.receiverAmount,
                status: 'completed',
                sender: tx.sender ? {
                    ...txObj.sender,
                    name: tx.sender.fullName
                } : null
            };
        });
        res.json({
            success: true,
            transactions: mappedTransactions
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getReceiverTransactions = getReceiverTransactions;
//# sourceMappingURL=transaction.controller.js.map