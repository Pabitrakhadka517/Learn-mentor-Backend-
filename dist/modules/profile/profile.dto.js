"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileDTOSchema = void 0;
const zod_1 = require("zod");
exports.UpdateProfileDTOSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: zod_1.z.string().regex(/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits').optional(),
    speciality: zod_1.z.string().min(2).max(200).optional(),
    address: zod_1.z.string().min(5).max(500).optional(),
    oldPassword: zod_1.z.string().min(6).optional(),
    newPassword: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional()
}).refine((data) => {
    if (data.newPassword && !data.oldPassword) {
        return false;
    }
    return true;
}, {
    message: 'Old password is required when changing password',
    path: ['oldPassword']
});
//# sourceMappingURL=profile.dto.js.map