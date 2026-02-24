"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phone = exports.Email = exports.ValueObject = void 0;
class ValueObject {
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(vo) {
        if (vo === null || vo === undefined) {
            return false;
        }
        if (vo.props === undefined) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
}
exports.ValueObject = ValueObject;
class Email extends ValueObject {
    get value() {
        return this.props.value;
    }
    constructor(props) {
        super(props);
    }
    static create(email) {
        if (!email || email.length === 0) {
            return base_usecase_1.Result.fail('Email cannot be empty');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return base_usecase_1.Result.fail('Invalid email format');
        }
        return base_usecase_1.Result.ok(new Email({ value: email.toLowerCase().trim() }));
    }
}
exports.Email = Email;
class Phone extends ValueObject {
    get value() {
        return this.props.value;
    }
    constructor(props) {
        super(props);
    }
    static create(phone) {
        if (!phone || phone.length === 0) {
            return base_usecase_1.Result.fail('Phone number cannot be empty');
        }
        const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
        const cleanedPhone = phone.replace(/[\s-()]/g, '');
        if (!phoneRegex.test(cleanedPhone)) {
            return base_usecase_1.Result.fail('Invalid phone number format');
        }
        return base_usecase_1.Result.ok(new Phone({ value: cleanedPhone }));
    }
}
exports.Phone = Phone;
const base_usecase_1 = require("../../application/use-cases/base.usecase");
//# sourceMappingURL=common.value-objects.js.map