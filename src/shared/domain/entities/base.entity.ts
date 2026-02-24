import { Types } from 'mongoose';

/**
 * Base Entity class for Domain Layer
 * All entities should extend this class
 */
export abstract class BaseEntity {
  public readonly id: Types.ObjectId;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  protected constructor(
    id: Types.ObjectId,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check if two entities are equal based on their ID
   */
  public equals(other: BaseEntity): boolean {
    return this.id.equals(other.id);
  }

  /**
   * Get string representation of entity ID
   */
  public getId(): string {
    return this.id.toString();
  }

  /**
   * Check if entity is new (has no ID)
   */
  public isNew(): boolean {
    return !this.id;
  }

  /**
   * Domain events that should be published
   */
  protected domainEvents: any[] = [];

  public clearEvents(): void {
    this.domainEvents = [];
  }

  protected addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  public getUncommittedEvents(): any[] {
    return this.domainEvents;
  }
}