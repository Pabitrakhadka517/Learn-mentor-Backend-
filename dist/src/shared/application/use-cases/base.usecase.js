"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseUseCase = exports.Result = void 0;
class Result {
    constructor(isSuccess, value, error) {
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
    getValue() {
        if (!this.isSuccess) {
            throw new Error("Can't get the value of an error result. Use 'errorValue' instead.");
        }
        return this._value;
    }
    static ok(value) {
        return new Result(true, value);
    }
    static fail(error) {
        return new Result(false, undefined, error);
    }
    static combine(results) {
        for (const result of results) {
            if (result.isFailure)
                return result;
        }
        return Result.ok();
    }
}
exports.Result = Result;
class BaseUseCase {
    ok(value) {
        return Result.ok(value);
    }
    fail(error) {
        return Result.fail(error);
    }
}
exports.BaseUseCase = BaseUseCase;
//# sourceMappingURL=base.usecase.js.map