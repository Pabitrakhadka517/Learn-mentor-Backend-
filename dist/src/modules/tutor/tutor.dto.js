"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorQuerySchema = void 0;
const zod_1 = require("zod");
exports.TutorQuerySchema = zod_1.z.object({
    subject: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().optional(),
    maxPrice: zod_1.z.coerce.number().optional(),
    language: zod_1.z.string().optional(),
    availability: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    verifiedOnly: zod_1.z.coerce.boolean().optional(),
});
//# sourceMappingURL=tutor.dto.js.map