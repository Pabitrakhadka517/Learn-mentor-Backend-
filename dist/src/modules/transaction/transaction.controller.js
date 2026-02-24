"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReceiverTransactions = exports.getSenderTransactions = exports.payTransaction = exports.initTransaction = exports.initBookingTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const job_model_1 = require("../job/job.model");
const booking_model_1 = require("../booking/booking.model");
const transaction_model_1 = require("./transaction.model");
const user_model_1 = require("../auth/user.model");
const notification_service_1 = require("../notification/notification.service");
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
        if (!transaction) {
            transaction = new transaction_model_1.Transaction({
                booking: bookingId,
                sender: booking.student,
                receiver: booking.tutor,
                amount: booking.price,
                productCode: 'EPAYTEST',
                transactionUuid,
                status: 'pending'
            });
        }
        else {
            transaction.transactionUuid = transactionUuid;
        }
        await transaction.save();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.json({
            transactionId: transaction._id,
            amount: transaction.amount,
            product_code: transaction.productCode,
            transaction_uuid: transaction.transactionUuid,
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
        if (!transaction) {
            const transactionUuid = (0, uuid_1.v4)();
            transaction = new transaction_model_1.Transaction({
                job: jobId,
                sender: job.sender,
                receiver: job.receiver,
                amount: job.amount,
                productCode: 'EPAYTEST',
                transactionUuid,
                status: 'pending'
            });
            await transaction.save();
        }
        res.json({
            transactionId: transaction._id,
            amount: transaction.amount,
            product_code: transaction.productCode,
            transaction_uuid: transaction.transactionUuid,
            signature: '',
            success_url: `${process.env.FRONTEND_URL}/dashboard/payment/success`,
            failure_url: `${process.env.FRONTEND_URL}/dashboard/payment/failure`
        });
    }
    catch (error) {
        console.error('Init Transaction Error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.initTransaction = initTransaction;
const payTransaction = async (req, res) => {
    try {
        const { transactionCode } = req.body;
        const { tId } = req.params;
        const userId = req.user?.userId;
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
            return res.status(400).json({ message: 'Transaction already completed' });
        }
        if (transaction.sender._id.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized transaction verification' });
        }
        const amountFromDB = transaction.amount;
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
            await job_model_1.Job.findByIdAndUpdate(transaction.job._id, { paymentStatus: 'done' });
        }
        if (transaction.booking) {
            await booking_model_1.Booking.findByIdAndUpdate(transaction.booking._id, {
                paymentStatus: 'DONE',
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
            await notification_service_1.NotificationService.createNotification({
                recipient: transaction.receiver._id,
                sender: transaction.sender._id,
                type: 'PAYMENT_SUCCESS',
                message: `Payment of Rs. ${receiverAmount} received from ${studentName} for session booking`,
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