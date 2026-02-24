import { Types } from 'mongoose';

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * User Domain Entity
 * Contains business logic and validation rules for users
 */
export class UserEntity {
  public readonly id?: string;
  public readonly email: string;
  public readonly passwordHash: string;
  public readonly role: UserRole;
  public readonly fullName?: string;
  public readonly phone?: string;
  public readonly isVerified: boolean;
  public readonly isActive: boolean;
  public readonly profileImage?: string;
  public readonly speciality?: string;
  public readonly address?: string;
  public readonly balance: number;
  public readonly theme: ThemePreference;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly location?: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };

  constructor(
    email: string,
    passwordHash: string,
    role: UserRole,
    fullName?: string,
    phone?: string,
    isVerified: boolean = false,
    isActive: boolean = true,
    balance: number = 0,
    theme: ThemePreference = 'system',
    profileImage?: string,
    speciality?: string,
    address?: string,
    location?: {
      lat: number;
      lng: number;
      city?: string;
      country?: string;
    },
    createdAt?: Date,
    updatedAt?: Date,
    id?: string
  ) {
    // Validate business rules
    this.validateEmail(email);
    this.validatePasswordHash(passwordHash);
    this.validateRole(role);
    this.validatePhone(phone);
    this.validateBalance(balance);
    
    // Apply business rules
    this.email = email.toLowerCase().trim();
    this.passwordHash = passwordHash;
    this.role = role;
    this.fullName = fullName?.trim();
    this.phone = phone?.trim();
    this.isVerified = role === 'ADMIN' ? true : isVerified; // Auto-verify admins
    this.isActive = isActive;
    this.profileImage = profileImage;
    this.speciality = speciality?.trim();
    this.address = address?.trim();
    this.balance = Math.max(0, balance); // Ensure non-negative balance
    this.theme = theme;
    this.location = location;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.id = id;
  }

  /**
   * Validates email format
   */
  private validateEmail(email: string): void {
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

  /**
   * Validates password hash
   */
  private validatePasswordHash(passwordHash: string): void {
    if (!passwordHash || typeof passwordHash !== 'string') {
      throw new Error('Password hash is required');
    }

    // bcrypt hash should start with $2a$, $2b$, $2x$, or $2y$ and be 60 characters
    const bcryptRegex = /^\$2[abyxz]\$\d{2}\$.{53}$/;
    if (!bcryptRegex.test(passwordHash)) {
      throw new Error('Invalid password hash format');
    }
  }

  /**
   * Validates user role
   */
  private validateRole(role: UserRole): void {
    const validRoles: UserRole[] = ['STUDENT', 'TUTOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
  }

  /**
   * Validates phone number if provided
   */
  private validatePhone(phone?: string): void {
    if (phone && typeof phone === 'string') {
      const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
        throw new Error('Invalid phone number format');
      }
    }
  }

  /**
   * Validates balance
   */
  private validateBalance(balance: number): void {
    if (typeof balance !== 'number' || isNaN(balance)) {
      throw new Error('Balance must be a valid number');
    }
  }

  /**
   * Creates a copy with updated verification status
   */
  public withVerification(isVerified: boolean): UserEntity {
    return new UserEntity(
      this.email,
      this.passwordHash,
      this.role,
      this.fullName,
      this.phone,
      isVerified,
      this.isActive,
      this.balance,
      this.theme,
      this.profileImage,
      this.speciality,
      this.address,
      this.location,
      this.createdAt,
      new Date(),
      this.id
    );
  }

  /**
   * Creates a copy with updated active status
   */
  public withActiveStatus(isActive: boolean): UserEntity {
    return new UserEntity(
      this.email,
      this.passwordHash,
      this.role,
      this.fullName,
      this.phone,
      this.isVerified,
      isActive,
      this.balance,
      this.theme,
      this.profileImage,
      this.speciality,
      this.address,
      this.location,
      this.createdAt,
      new Date(),
      this.id
    );
  }

  /**
   * Creates a copy with updated profile information
   */
  public withProfile(
    fullName?: string,
    phone?: string,
    profileImage?: string,
    address?: string,
    speciality?: string
  ): UserEntity {
    return new UserEntity(
      this.email,
      this.passwordHash,
      this.role,
      fullName || this.fullName,
      phone || this.phone,
      this.isVerified,
      this.isActive,
      this.balance,
      this.theme,
      profileImage || this.profileImage,
      speciality || this.speciality,
      address || this.address,
      this.location,
      this.createdAt,
      new Date(),
      this.id
    );
  }

  /**
   * Creates a copy with updated password hash
   */
  public withNewPassword(newPasswordHash: string): UserEntity {
    this.validatePasswordHash(newPasswordHash);
    
    return new UserEntity(
      this.email,
      newPasswordHash,
      this.role,
      this.fullName,
      this.phone,
      this.isVerified,
      this.isActive,
      this.balance,
      this.theme,
      this.profileImage,
      this.speciality,
      this.address,
      this.location,
      this.createdAt,
      new Date(),
      this.id
    );
  }

  /**
   * Checks if user can perform admin actions
   */
  public canPerformAdminActions(): boolean {
    return this.role === 'ADMIN' && this.isActive && this.isVerified;
  }

  /**
   * Checks if user can create jobs
   */
  public canCreateJobs(): boolean {
    return ['STUDENT', 'TUTOR'].includes(this.role) && this.isActive;
  }

  /**
   * Checks if user can receive jobs
   */
  public canReceiveJobs(): boolean {
    return this.role === 'TUTOR' && this.isActive && this.isVerified;
  }

  /**
   * Checks if user profile is complete
   */
  public hasCompleteProfile(): boolean {
    return !!(this.fullName && this.phone && this.email);
  }

  /**
   * Gets display name
   */
  public getDisplayName(): string {
    return this.fullName || this.email.split('@')[0];
  }

  /**
   * Converts to public object (without sensitive data)
   */
  public toPublicObject(): {
    id: string;
    email: string;
    role: UserRole;
    fullName?: string;
    phone?: string;
    isVerified: boolean;
    isActive: boolean;
    profileImage?: string;
    speciality?: string;
    address?: string;
    balance: number;
    theme: ThemePreference;
    createdAt: Date;
    updatedAt: Date;
  } {
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