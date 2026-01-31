"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_repository_1 = require("./auth.repository");
const jwt_1 = require("../../config/jwt");
const auth_dto_1 = require("./auth.dto");
class AuthService {
    static async register(dto) {
        const validated = auth_dto_1.RegisterDTOSchema.parse(dto);
        const emailExists = await auth_repository_1.AuthRepository.emailExists(validated.email);
        if (emailExists) {
            throw new Error("Email already exists");
        }
        const passwordHash = await auth_repository_1.AuthRepository.hashPassword(validated.password);
        const user = await auth_repository_1.AuthRepository.createUser(validated.email, passwordHash, "user");
        return {
            message: "User registered successfully",
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                speciality: user.speciality,
                address: user.address,
                profileImage: user.profileImage,
            },
        };
    }
    static async registerWithRole(dto, role) {
        const validated = auth_dto_1.RegisterDTOSchema.parse(dto);
        const emailExists = await auth_repository_1.AuthRepository.emailExists(validated.email);
        if (emailExists) {
            throw new Error("Email already exists");
        }
        const passwordHash = await auth_repository_1.AuthRepository.hashPassword(validated.password);
        const user = await auth_repository_1.AuthRepository.createUser(validated.email, passwordHash, role);
        return {
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                speciality: user.speciality,
                address: user.address,
                profileImage: user.profileImage,
            },
        };
    }
    static async login(dto) {
        const validated = auth_dto_1.LoginDTOSchema.parse(dto);
        const user = await auth_repository_1.AuthRepository.findByEmail(validated.email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        const isPasswordValid = await auth_repository_1.AuthRepository.verifyPassword(validated.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials");
        }
        const accessToken = jsonwebtoken_1.default.sign({ sub: user._id, role: user.role }, jwt_1.jwtConfig.accessSecret, { expiresIn: jwt_1.jwtConfig.accessExpiry });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: user._id }, jwt_1.jwtConfig.refreshSecret, { expiresIn: jwt_1.jwtConfig.refreshExpiry });
        const refreshTokenHash = await auth_repository_1.AuthRepository.hashPassword(refreshToken);
        await auth_repository_1.AuthRepository.updateRefreshTokenHash(user._id.toString(), refreshTokenHash);
        return {
            message: "Logged in successfully",
            accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role || "user",
                name: user.name,
                phone: user.phone,
                speciality: user.speciality,
                address: user.address,
                profileImage: user.profileImage,
            },
        };
    }
    static async refresh(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, jwt_1.jwtConfig.refreshSecret);
            const user = await auth_repository_1.AuthRepository.findById(payload.sub);
            if (!user || !user.refreshTokenHash) {
                throw new Error("Unauthorized");
            }
            const isValid = await auth_repository_1.AuthRepository.verifyPassword(refreshToken, user.refreshTokenHash);
            if (!isValid) {
                throw new Error("Unauthorized");
            }
            const accessToken = jsonwebtoken_1.default.sign({ sub: user._id, role: user.role }, jwt_1.jwtConfig.accessSecret, { expiresIn: jwt_1.jwtConfig.accessExpiry });
            return { accessToken };
        }
        catch (error) {
            throw new Error("Invalid refresh token");
        }
    }
    static async logout(userId) {
        await auth_repository_1.AuthRepository.clearRefreshToken(userId);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map