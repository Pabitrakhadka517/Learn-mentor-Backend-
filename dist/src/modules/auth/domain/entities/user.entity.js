"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
class UserEntity {
    constructor(email, passwordHash, role, fullName, phone, isVerified = false, isActive = true, balance = 0, theme = 'system', profileImage, speciality, address, location, createdAt, updatedAt, id) {
        this.validateEmail(email);
        this.validatePasswordHash(passwordHash);
        this.validateRole(role);
        this.validatePhone(phone);
        this.validateBalance(balance);
        this.email = email.toLowerCase().trim();
        this.passwordHash = passwordHash;
        this.role = role;
        this.fullName = fullName?.trim();
        this.phone = phone?.trim();
        this.isVerified = role === 'ADMIN' ? true : isVerified;
        this.isActive = isActive;
        this.profileImage = profileImage;
        this.speciality = speciality?.trim();
        this.address = address?.trim();
        this.balance = Math.max(0, balance);
        this.theme = theme;
        this.location = location;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
        this.id = id;
    }
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            throw new Error('Email is required');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        if (email.length > 320) {
            throw new Error('Email is too long');
        }
    }
    validatePasswordHash(passwordHash) {
        if (!passwordHash || typeof passwordHash !== 'string') {
            throw new Error('Password hash is required');
        }
        const bcryptRegex = /^\$2[abyxz]\$\d{2}\$.{53}$/;
        if (!bcryptRegex.test(passwordHash)) {
            throw new Error('Invalid password hash format');
        }
    }
    validateRole(role) {
        const validRoles = ['STUDENT', 'TUTOR', 'ADMIN'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }
    }
    validatePhone(phone) {
        if (phone && typeof phone === 'string') {
            const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
                throw new Error('Invalid phone number format');
            }
        }
    }
    validateBalance(balance) {
        if (typeof balance !== 'number' || isNaN(balance)) {
            throw new Error('Balance must be a valid number');
        }
    }
    withVerification(isVerified) {
        return new UserEntity(this.email, this.passwordHash, this.role, this.fullName, this.phone, isVerified, this.isActive, this.balance, this.theme, this.profileImage, this.speciality, this.address, this.location, this.createdAt, new Date(), this.id);
    }
    withActiveStatus(isActive) {
        return new UserEntity(this.email, this.passwordHash, this.role, this.fullName, this.phone, this.isVerified, isActive, this.balance, this.theme, this.profileImage, this.speciality, this.address, this.location, this.createdAt, new Date(), this.id);
    }
    withProfile(fullName, phone, profileImage, address, speciality) {
        return new UserEntity(this.email, this.passwordHash, this.role, fullName || this.fullName, phone || this.phone, this.isVerified, this.isActive, this.balance, this.theme, profileImage || this.profileImage, speciality || this.speciality, address || this.address, this.location, this.createdAt, new Date(), this.id);
    }
    withNewPassword(newPasswordHash) {
        this.validatePasswordHash(newPasswordHash);
        return new UserEntity(this.email, newPasswordHash, this.role, this.fullName, this.phone, this.isVerified, this.isActive, this.balance, this.theme, this.profileImage, this.speciality, this.address, this.location, this.createdAt, new Date(), this.id);
    }
    canPerformAdminActions() {
        return this.role === 'ADMIN' && this.isActive && this.isVerified;
    }
    canCreateJobs() {
        return ['STUDENT', 'TUTOR'].includes(this.role) && this.isActive;
    }
    canReceiveJobs() {
        return this.role === 'TUTOR' && this.isActive && this.isVerified;
    }
    hasCompleteProfile() {
        return !!(this.fullName && this.phone && this.email);
    }
    getDisplayName() {
        return this.fullName || this.email.split('@')[0];
    }
    toPublicObject() {
        return {
            id: this.id || '',
            email: this.email,
            role: this.role,
            fullName: this.fullName,
            phone: this.phone,
            isVerified: this.isVerified,
            isActive: this.isActive,
            profileImage: this.profileImage,
            speciality: this.speciality,
            address: this.address,
            balance: this.balance,
            theme: this.theme,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map