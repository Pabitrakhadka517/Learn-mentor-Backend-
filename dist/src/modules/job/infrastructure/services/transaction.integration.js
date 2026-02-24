"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionIntegrationService = void 0;
class TransactionIntegrationService {
    constructor(transactionServiceUrl) {
        this.transactionServiceUrl = transactionServiceUrl;
        this.transactionServiceUrl = transactionServiceUrl || process.env.TRANSACTION_SERVICE_URL;
    }
    async processPayment(jobId, amount, senderId, receiverId) {
        try {
            if (amount <= 0) {
                return {
                    success: false,
                    error: 'Invalid amount'
                };
            }
            if (!senderId || !receiverId) {
                return {
                    success: false,
                    error: 'Invalid user IDs'
                };
            }
            const transactionId = this.generateTransactionId();
            await this.delay(1000);
            const isSuccess = Math.random() > 0.1;
            if (isSuccess) {
                console.log(`Payment processed: Job ${jobId}, Amount ${amount}, Transaction ${transactionId}`);
                return {
                    success: true,
                    transactionId
                };
            }
            else {
                return {
                    success: false,
                    error: 'Payment processing failed - insufficient funds or payment method error'
                };
            }
        }
        catch (error) {
            console.error('Transaction processing error:', error);
            return {
                success: false,
                error: `Transaction service error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async refundPayment(transactionId) {
        try {
            if (!transactionId) {
                throw new Error('Transaction ID is required');
            }
            console.log(`Refund processed for transaction: ${transactionId}`);
            await this.delay(500);
            return Math.random() > 0.05;
        }
        catch (error) {
            console.error('Refund processing error:', error);
            return false;
        }
    }
    async getPaymentStatus(transactionId) {
        try {
            if (!transactionId) {
                throw new Error('Transaction ID is required');
            }
            await this.delay(200);
            if (transactionId.includes('fail')) {
                return 'failed';
            }
            else if (transactionId.includes('pending')) {
                return 'pending';
            }
            else {
                return 'done';
            }
        }
        catch (error) {
            console.error('Get payment status error:', error);
            return 'failed';
        }
    }
    async createTransactionRecord(jobId, amount, senderId, receiverId, transactionId) {
        try {
            console.log(`Transaction record created: ID ${transactionId}, Job ${jobId}, Amount ${amount}`);
            return true;
        }
        catch (error) {
            console.error('Create transaction record error:', error);
            return false;
        }
    }
    calculateCommission(amount) {
        const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5');
        const platformFee = (amount * feePercentage) / 100;
        const receiverAmount = amount - platformFee;
        return {
            platformFee: Math.round(platformFee * 100) / 100,
            receiverAmount: Math.round(receiverAmount * 100) / 100,
            feePercentage
        };
    }
    async validatePaymentEligibility(senderId, amount) {
        try {
            if (amount > 10000) {
                return {
                    eligible: false,
                    reason: 'Amount exceeds maximum transaction limit'
                };
            }
            if (amount < 1) {
                return {
                    eligible: false,
                    reason: 'Minimum transaction amount is $1'
                };
            }
            return { eligible: true };
        }
        catch (error) {
            console.error('Payment validation error:', error);
            return {
                eligible: false,
                reason: 'Payment validation failed'
            };
        }
    }
    async callTransactionService(endpoint, data, method = 'POST') {
        throw new Error('Transaction service integration not implemented');
    }
    mapTransactionStatusToPaymentStatus(transactionStatus) {
        switch (transactionStatus?.toLowerCase()) {
            case 'completed':
            case 'success':
            case 'confirmed':
                return 'done';
            case 'failed':
            case 'declined':
            case 'error':
                return 'failed';
            case 'pending':
            case 'processing':
            case 'initiated':
            default:
                return 'pending';
        }
    }
    generateTransactionId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `job_tx_${timestamp}_${random}`;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.TransactionIntegrationService = TransactionIntegrationService;
//# sourceMappingURL=transaction.integration.js.map