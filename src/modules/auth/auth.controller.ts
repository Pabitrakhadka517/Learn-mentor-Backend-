import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = await AuthService.register(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const tokens = await AuthService.login(req.body);
      res.json(tokens);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1];
    const access = await AuthService.refresh(token as string);
    res.json(access);
  }

  static async logout(req: any, res: Response) {
    await AuthService.logout(req.user.sub);
    res.status(204).send();
  }
}
