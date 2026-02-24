/**
 * Result wrapper for use cases
 * Implements Railway Oriented Programming pattern
 */
export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error?: string;
  private _value?: T;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error("Can't get the value of an error result. Use 'errorValue' instead.");
    }
    return this._value as T;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, undefined, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }
}

/**
 * Base Use Case interface
 * All use cases should implement this interface
 */
export interface IUseCase<IRequest, IResponse> {
  execute(request?: IRequest): Promise<Result<IResponse>>;
}

/**
 * Base Use Case class
 * Provides common functionality for all use cases
 */
export abstract class BaseUseCase<IRequest, IResponse> implements IUseCase<IRequest, IResponse> {
  public abstract execute(request?: IRequest): Promise<Result<IResponse>>;

  protected ok<U>(value?: U): Result<U> {
    return Result.ok<U>(value);
  }

  protected fail<U>(error: string): Result<U> {
    return Result.fail<U>(error);
  }
}