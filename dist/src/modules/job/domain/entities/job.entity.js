"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobEntity = void 0;
const job_dto_1 = require("../../application/dto/job.dto");
class JobEntity {
    constructor(title, description, senderId, receiverId, amount, status = 'pending', paymentStatus = 'pending', createdAt = new Date(), updatedAt = new Date(), id) {
        this.title = title;
        this.description = description;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.amount = amount;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.id = id;
        this.validateTitle(title);
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        this.validateUserIds(senderId, receiverId);
    }
    validateTitle(title) {
        if (!title || title.trim().length < 2 || title.trim().length > 200) {
            throw new Error('Title must be between 2 and 200 characters');
        }
    }
    validateAmount() {
        if (this.amount <= 0) {
            return {
                isValid: false,
                error: 'Amount must be greater than 0'
            };
        }
        return { isValid: true };
    }
    validateUserIds(senderId, receiverId) {
        if (!senderId || !receiverId) {
            throw new Error('Sender and receiver IDs are required');
        }
        if (senderId.toString() === receiverId.toString()) {
            throw new Error('Sender and receiver cannot be the same user');
        }
    }
    static validateDescription(description) {
        if (description && description.length > 2000) {
            return {
                isValid: false,
                error: 'Description cannot exceed 2000 characters'
            };
        }
        return { isValid: true };
    }
    updateStatus(newStatus) {
        const validTransition = this.validateStatusTransition(newStatus);
        if (!validTransition.isValid) {
            throw new Error(validTransition.error);
        }
        return new JobEntity(this.title, this.description, this.senderId, this.receiverId, this.amount, newStatus, this.paymentStatus, this.createdAt, new Date(), this.id);
    }
    updatePaymentStatus(newPaymentStatus) {
        const validTransition = this.validatePaymentStatusTransition(newPaymentStatus);
        if (!validTransition.isValid) {
            throw new Error(validTransition.error);
        }
        return new JobEntity(this.title, this.description, this.senderId, this.receiverId, this.amount, this.status, newPaymentStatus, this.createdAt, new Date(), this.id);
    }
    validateStatusTransition(newStatus) {
        const allowedTransitions = {
            'pending': ['active', 'cancelled'],
            'active': ['finished', 'cancelled'],
            'finished': [],
            'cancelled': []
        };
        const allowed = allowedTransitions[this.status];
        if (!allowed.includes(newStatus)) {
            return {
                isValid: false,
                error: `Cannot transition from ${this.status} to ${newStatus}`
            };
        }
        return { isValid: true };
    }
    validatePaymentStatusTransition(newPaymentStatus) {
        const allowedTransitions = {
            'pending': ['done', 'failed'],
            'done': [],
            'failed': ['pending', 'done']
        };
        const allowed = allowedTransitions[this.paymentStatus];
        if (!allowed.includes(newPaymentStatus)) {
            return {
                isValid: false,
                error: `Cannot transition payment status from ${this.paymentStatus} to ${newPaymentStatus}`
            };
        }
        return { isValid: true };
    }
    canBeDeleted() {
        if (this.status === 'active' || this.paymentStatus === 'done') {
            return {
                isValid: false,
                error: 'Cannot delete active jobs or jobs with completed payments'
            };
        }
        return { isValid: true };
    }
    canUpdateStatus(userId) {
        const userIdStr = userId.toString();
        const senderIdStr = this.senderId.toString();
        const receiverIdStr = this.receiverId.toString();
        if (userIdStr !== senderIdStr && userIdStr !== receiverIdStr) {
            return {
                isValid: false,
                error: 'Only job participants can update status'
            };
        }
        return { isValid: true };
    }
    canBeDeletedBy(userId) {
        if (userId.toString() !== this.senderId.toString()) {
            return {
                isValid: false,
                error: 'Only the job creator can delete the job'
            };
        }
        return this.canBeDeleted();
    }
    static create(title, description, senderId, receiverId, amount) {
        if (description) {
            const descValidation = this.validateDescription(description);
            if (!descValidation.isValid) {
                throw new Error(descValidation.error);
            }
        }
        return new JobEntity(title.trim(), description?.trim() || null, senderId, receiverId, amount);
    }
    mapToDTO() {
        return new job_dto_1.JobDTO(this.id?.toString() || '', this.title, this.description, this.senderId.toString(), this.receiverId.toString(), this.amount, this.status, this.paymentStatus, this.createdAt, this.updatedAt);
    }
    isTerminal() {
        return this.status === 'finished' || this.status === 'cancelled';
    }
    getAgeInHours() {
        const now = new Date();
        const diffMs = now.getTime() - this.createdAt.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60));
    }
}
exports.JobEntity = JobEntity;
//# sourceMappingURL=job.entity.js.map