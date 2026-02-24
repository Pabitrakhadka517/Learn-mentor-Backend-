/**
 * Generic Repository Interface
 * All repositories should implement this interface
 */
export interface IRepository<T, ID> {
  /**
   * Find entity by ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Find all entities with optional filtering
   */
  findAll(filter?: Partial<T>): Promise<T[]>;

  /**
   * Save entity (create or update)
   */
  save(entity: T): Promise<T>;

  /**
   * Delete entity by ID
   */
  delete(id: ID): Promise<boolean>;

  /**
   * Check if entity exists
   */
  exists(id: ID): Promise<boolean>;

  /**
   * Count entities with optional filtering
   */
  count(filter?: Partial<T>): Promise<number>;
}

/**
 * Paginated result interface
 */
export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Pagination options interface
 */
export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extended repository interface with pagination
 */
export interface IPaginatedRepository<T, ID> extends IRepository<T, ID> {
  findAllPaginated(
    filter?: Partial<T>,
    options?: IPaginationOptions
  ): Promise<IPaginatedResult<T>>;
}