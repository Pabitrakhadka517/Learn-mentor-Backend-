"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterTutorDTOSchema = exports.RegisterUserDTOSchema = exports.RegisterAdminDTOSchema = exports.LoginDTOSchema = exports.RegisterDTOSchema = void 0;
const zod_1 = require("zod");
exports.RegisterDTOSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase(),
    password: zod_1.z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters long")
        .min(1, "Password cannot be empty"),
});
exports.LoginDTOSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase(),
    password: zod_1.z
        .string({ required_error: "Password is required" })
        .min(1, "Password cannot be empty"),
});
exports.RegisterAdminDTOSchema = exports.RegisterDTOSchema.extend({
    role: zod_1.z.literal('admin').optional(),
});
exports.RegisterUserDTOSchema = exports.RegisterDTOSchema.extend({
    role: zod_1.z.literal('user').optional(),
});
exports.RegisterTutorDTOSchema = exports.RegisterDTOSchema.extend({
    role: zod_1.z.literal('tutor').optional(),
});
//# sourceMappingURL=auth.dto.js.map