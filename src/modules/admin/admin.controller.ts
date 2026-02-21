import { Request, Response } from "express";
import { AdminService } from "./admin.service";
import { seedTutors } from "../tutor/tutor.seeding";

export class AdminController {
    /**
     * Get all registered users with pagination
     */
    static async getAllUsers(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const role = req.query.role as string;

            const result = await AdminService.getUsers(page, limit, role);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message || "Internal server error" });
        }
    }

    /**
     * Get platform statistics
     */
    static async getPlatformStats(req: Request, res: Response) {
        try {
            const stats = await AdminService.getStats();
            res.status(200).json(stats);
        } catch (error: any) {
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }

    /**
     * Seed random tutors (Admin only)
     */
    static async seedTutors(req: Request, res: Response) {
        try {
            const count = parseInt(req.query.count as string) || 5;
            await seedTutors(count);
            res.status(200).json({ success: true, message: `Successfully seeded ${count} tutors` });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Verify a Tutor status
     */
    static async verifyTutor(req: Request, res: Response) {
        try {
            const { tutorId } = req.params;
            const { status } = req.body; // VERIFIED, REJECTED, PENDING

            if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status" });
            }

            const profile = await AdminService.verifyTutor(tutorId, status);
            if (!profile) {
                return res.status(404).json({ success: false, message: "Tutor profile not found" });
            }

            res.status(200).json({
                success: true,
                message: `Tutor status updated to ${status}`,
                profile
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = await AdminService.getUserById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.status(200).json({ success: true, user });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update user details
     */
    static async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = await AdminService.updateUser(id, req.body);
            res.status(200).json({ success: true, message: "User updated successfully", user });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete user
     */
    static async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await AdminService.deleteUser(id);
            res.status(200).json({ success: true, message: "User deleted successfully" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
