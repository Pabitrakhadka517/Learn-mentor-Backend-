import { z } from 'zod';

export const TutorQuerySchema = z.object({
    subject: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    language: z.string().optional(),
    availability: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    verifiedOnly: z.coerce.boolean().optional(),
});

export type TutorQueryDTO = z.infer<typeof TutorQuerySchema>;

export interface TutorResponseDTO {
    tutors: any[];
    total: number;
    page: number;
    totalPages: number;
}
