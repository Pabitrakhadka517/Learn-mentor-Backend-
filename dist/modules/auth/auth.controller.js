"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const zod_1 = require("zod");
const handleValidationError = (error, res) => {
    if (error instanceof zod_1.z.ZodError) {
        const errors = error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }));
        return res.status(400).json({
            error: "Validation failed",
            details: errors,
        });
    }
    return false;
};
class AuthController {
    static async register(req, res) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            if (handleValidationError(error, res))
                return;
            if (error.message === "Email already exists") {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
    static async registerAdmin(req, res) {
        try {
            const result = await auth_service_1.AuthService.registerWithRole(req.body, "admin");
            res.status(201).json(result);
        }
        catch (error) {
            if (handleValidationError(error, res))
                return;
            if (error.message === "Email already exists") {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
    static async registerUser(req, res) {
        try {
            const result = await auth_service_1.AuthService.registerWithRole(req.body, "user");
            res.status(201).json(result);
        }
        catch (error) {
            if (handleValidationError(error, res))
                return;
            if (error.message === "Email already exists") {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
    static async registerTutor(req, res) {
        try {
            const result = await auth_service_1.AuthService.registerWithRole(req.body, "tutor");
            res.status(201).json(result);
        }
        catch (error) {
            if (handleValidationError(error, res))
                return;
            if (error.message === "Email already exists") {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
    static async login(req, res) {
        try {
            const tokens = await auth_service_1.AuthService.login(req.body);
            res.status(200).json(tokens);
        }
        catch (error) {
            if (handleValidationError(error, res))
                return;
            if (error.message === "Invalid credentials") {
                return res.status(401).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
    static async refresh(req, res) {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res
                    .status(401)
                    .json({ error: "Refresh token is required in Authorization header" });
            }
            const result = await auth_service_1.AuthService.refresh(token);
            res.json(result);
        }
        catch (error) {
            res
                .status(401)
                .json({ error: error.message || "Invalid refresh token" });
        }
    }
    static async logout(req, res) {
        try {
            if (!req.user || !req.user.sub) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            await auth_service_1.AuthService.logout(req.user.sub);
            res.status(200).json({ message: "Logged out successfully" });
        }
        catch (error) {
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map