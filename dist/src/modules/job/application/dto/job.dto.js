"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobNotificationDTO = exports.BatchJobOperationDTO = exports.JobStatisticsDTO = exports.JobFilterDTO = exports.UpdatePaymentStatusDTO = exports.UpdateJobStatusDTO = exports.CreateJobDTO = exports.JobDTO = void 0;
class JobDTO {
    constructor(id, title, description, senderId, receiverId, amount, status, paymentStatus, createdAt, updatedAt, senderName, receiverName, senderEmail, receiverEmail) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.amount = amount;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.senderName = senderName;
        this.receiverName = receiverName;
        this.senderEmail = senderEmail;
        this.receiverEmail = receiverEmail;
    }
    toSenderDTO() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            receiverId: this.receiverId,
            receiverName: this.receiverName,
            amount: this.amount,
            status: this.status,
            paymentStatus: this.paymentStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
    toReceiverDTO() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            senderId: this.senderId,
            senderName: this.senderName,
            amount: this.amount,
            status: this.status,
            paymentStatus: this.paymentStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
    toMinimalDTO() {
        return {
            id: this.id,
            title: this.title,
            amount: this.amount,
            status: this.status,
            paymentStatus: this.paymentStatus,
            createdAt: this.createdAt
        };
    }
    toFullDTO() {
        return this;
    }
}
exports.JobDTO = JobDTO;
class CreateJobDTO {
    constructor(title, description, receiverId, amount) {
        this.title = title;
        this.description = description;
        this.receiverId = receiverId;
        this.amount = amount;
    }
}
exports.CreateJobDTO = CreateJobDTO;
class UpdateJobStatusDTO {
    constructor(status) {
        this.status = status;
    }
}
exports.UpdateJobStatusDTO = UpdateJobStatusDTO;
class UpdatePaymentStatusDTO {
    constructor(paymentStatus, transactionId, paymentReference) {
        this.paymentStatus = paymentStatus;
        this.transactionId = transactionId;
        this.paymentReference = paymentReference;
    }
}
exports.UpdatePaymentStatusDTO = UpdatePaymentStatusDTO;
class JobFilterDTO {
    constructor(status, paymentStatus, search, dateFrom, dateTo, role, limit, offset, sortBy, sortOrder) {
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.search = search;
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
        this.role = role;
        this.limit = limit;
        this.offset = offset;
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
    }
}
exports.JobFilterDTO = JobFilterDTO;
class JobStatisticsDTO {
    constructor(totalJobs, activeJobs, completedJobs, cancelledJobs, totalEarnings, totalSpent, pendingPayments, jobsByStatus, jobsByPaymentStatus, averageJobValue, completionRate) {
        this.totalJobs = totalJobs;
        this.activeJobs = activeJobs;
        this.completedJobs = completedJobs;
        this.cancelledJobs = cancelledJobs;
        this.totalEarnings = totalEarnings;
        this.totalSpent = totalSpent;
        this.pendingPayments = pendingPayments;
        this.jobsByStatus = jobsByStatus;
        this.jobsByPaymentStatus = jobsByPaymentStatus;
        this.averageJobValue = averageJobValue;
        this.completionRate = completionRate;
    }
}
exports.JobStatisticsDTO = JobStatisticsDTO;
class BatchJobOperationDTO {
    constructor(jobIds, operation, newStatus, newPaymentStatus) {
        this.jobIds = jobIds;
        this.operation = operation;
        this.newStatus = newStatus;
        this.newPaymentStatus = newPaymentStatus;
    }
}
exports.BatchJobOperationDTO = BatchJobOperationDTO;
class JobNotificationDTO {
    constructor(jobId, type, message, recipientId, metadata) {
        this.jobId = jobId;
        this.type = type;
        this.message = message;
        this.recipientId = recipientId;
        this.metadata = metadata;
    }
}
exports.JobNotificationDTO = JobNotificationDTO;
//# sourceMappingURL=job.dto.js.map