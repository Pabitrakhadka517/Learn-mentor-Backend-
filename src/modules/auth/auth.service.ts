import jwt, { SignOptions } from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { jwtConfig } from "../../config/jwt";
import {
  RegisterDTO,
  LoginDTO,
  LoginResponseDTO,
  RegisterDTOSchema,
  LoginDTOSchema,
} from "./auth.dto";
import { z } from "zod";

export class AuthService {
  /**
   * Register a new user with default 'user' role
   */
  static async register(dto: RegisterDTO): Promise<any> {
    // Validate DTO
    const validated = RegisterDTOSchema.parse(dto);

    // Check if email already exists
    const emailExists = await AuthRepository.emailExists(validated.email);
    if (emailExists) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash = await AuthRepository.hashPassword(validated.password);

    // Create user
    const user = await AuthRepository.createUser(
      validated.email,
      passwordHash,
      "user"
    );

    return {
      message: "User registered successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Register a user with a specific role
   */
  static async registerWithRole(
    dto: RegisterDTO,
    role: "user" | "admin" | "tutor"
  ): Promise<any> {
    // Validate DTO
    const validated = RegisterDTOSchema.parse(dto);

    // Check if email already exists
    const emailExists = await AuthRepository.emailExists(validated.email);
    if (emailExists) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash = await AuthRepository.hashPassword(validated.password);

    // Create user with role
    const user = await AuthRepository.createUser(
      validated.email,
      passwordHash,
      role
    );

    return {
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Login user and return access and refresh tokens
   */
  static async login(dto: LoginDTO): Promise<LoginResponseDTO> {
    // Validate DTO
    const validated = LoginDTOSchema.parse(dto);

    // Find user by email
    const user = await AuthRepository.findByEmail(validated.email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await AuthRepository.verifyPassword(
      validated.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user._id, role: user.role },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpiry } as SignOptions
    );

    const refreshToken = jwt.sign(
      { sub: user._id },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiry } as SignOptions
    );

    // Hash and store refresh token
    const refreshTokenHash = await AuthRepository.hashPassword(refreshToken);
    await AuthRepository.updateRefreshTokenHash(
      user._id.toString(),
      refreshTokenHash
    );

    return {
      message: "Logged in successfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
      },
    };
  }

  /**
   * Refresh access token
   */
  static async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, jwtConfig.refreshSecret) as any;

      const user = await AuthRepository.findById(payload.sub);
      if (!user || !user.refreshTokenHash) {
        throw new Error("Unauthorized");
      }

      // Verify refresh token hash
      const isValid = await AuthRepository.verifyPassword(
        refreshToken,
        user.refreshTokenHash
      );
      if (!isValid) {
        throw new Error("Unauthorized");
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { sub: user._id, role: user.role },
        jwtConfig.accessSecret,
        { expiresIn: jwtConfig.accessExpiry } as SignOptions
      );

      return { accessToken };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Logout user by clearing refresh token
   */
  static async logout(userId: string) {
    await AuthRepository.clearRefreshToken(userId);
  }
}
