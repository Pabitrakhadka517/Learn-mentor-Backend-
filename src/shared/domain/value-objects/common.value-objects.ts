/**
 * Value Object base class
 * Value objects have no identity and are immutable
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Compare value objects by value equality
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}

/**
 * Email Value Object
 */
interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(email: string): Result<Email> {
    if (!email || email.length === 0) {
      return Result.fail<Email>('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.fail<Email>('Invalid email format');
    }

    return Result.ok<Email>(new Email({ value: email.toLowerCase().trim() }));
  }
}

/**
 * Phone Number Value Object
 */
interface PhoneProps {
  value: string;
}

export class Phone extends ValueObject<PhoneProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: PhoneProps) {
    super(props);
  }

  public static create(phone: string): Result<Phone> {
    if (!phone || phone.length === 0) {
      return Result.fail<Phone>('Phone number cannot be empty');
    }

    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    const cleanedPhone = phone.replace(/[\s-()]/g, '');
    
    if (!phoneRegex.test(cleanedPhone)) {
      return Result.fail<Phone>('Invalid phone number format');
    }

    return Result.ok<Phone>(new Phone({ value: cleanedPhone }));
  }
}

/**
 * Import the Result class
 */
import { Result } from '../../application/use-cases/base.usecase';