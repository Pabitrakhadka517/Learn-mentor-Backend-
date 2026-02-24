"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = void 0;
class BaseEntity {
    constructor(id, createdAt = new Date(), updatedAt = new Date()) {
        this.domainEvents = [];
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    equals(other) {
        return this.id.equals(other.id);
    }
    getId() {
        return this.id.toString();
    }
    isNew() {
        return !this.id;
    }
    clearEvents() {
        this.domainEvents = [];
    }
    addDomainEvent(event) {
        this.domainEvents.push(event);
    }
    getUncommittedEvents() {
        return this.domainEvents;
    }
}
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=base.entity.js.map