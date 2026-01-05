import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { z } from "zod";

/**
 * Handle Zod validation errors
 */
const handleValidationError = (error: any, res: Response) => {
  if (error instanceof z.ZodError) {
    const errors = error.errors.map((err: any) => ({
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

export class AuthController {
  /**
   * Register a new user with default 'user' role
   */
  static async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (handleValidationError(error, res)) return;

      if (error.message === "Email already exists") {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Register a new admin user
   */
  static async registerAdmin(req: Request, res: Response) {
    try {
      const result = await AuthService.registerWithRole(req.body, "admin");
      res.status(201).json(result);
    } catch (error: any) {
      if (handleValidationError(error, res)) return;

      if (error.message === "Email already exists") {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Register a new regular user
   */
  static async registerUser(req: Request, res: Response) {
    try {
      const result = await AuthService.registerWithRole(req.body, "user");
      res.status(201).json(result);
    } catch (error: any) {
      if (handleValidationError(error, res)) return;

      if (error.message === "Email already exists") {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Register a new tutor user
   */
  static async registerTutor(req: Request, res: Response) {
    try {
      const result = await AuthService.registerWithRole(req.body, "tutor");
      res.status(201).json(result);
    } catch (error: any) {
      if (handleValidationError(error, res)) return;

      if (error.message === "Email already exists") {
        return res.status(409).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Login user and return tokens
   */
  static async login(req: Request, res: Response) {
    try {
      const tokens = await AuthService.login(req.body);
      res.status(200).json(tokens);
    } catch (error: any) {
      if (handleValidationError(error, res)) return;

      if (error.message === "Invalid credentials") {
        return res.status(401).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refresh(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ error: "Refresh token is required in Authorization header" });
      }

      const result = await AuthService.refresh(token);
      res.json(result);
    } catch (error: any) {
      res
        .status(401)
        .json({ error: error.message || "Invalid refresh token" });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: any, res: Response) {
    try {
      if (!req.user || !req.user.sub) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await AuthService.logout(req.user.sub);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}
