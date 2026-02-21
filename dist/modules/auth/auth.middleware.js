"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.verifyTutor = exports.authorizeRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../../config/jwt");
const auth_repository_1 = require("./auth.repository");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.',
            });
        }
        const token = authHeader.substring(7);
        const payload = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.accessSecret);
        const user = await auth_repository_1.AuthRepository.findById(payload.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.',
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.',
            });
        }
        req.user = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please refresh your token or login again.',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.',
        });
    }
};
exports.authenticate = authenticate;
const authorizeRoles = (...roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This endpoint requires one of the following roles: ${roles.join(', ')}`,
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const verifyTutor = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
    }
    if (req.user.role === 'TUTOR') {
        const user = await auth_repository_1.AuthRepository.findById(req.user.userId);
        if (!user || !user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Your tutor account is not verified yet. Please wait for admin approval.',
            });
        }
    }
    next();
};
exports.verifyTutor = verifyTutor;
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const payload = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.accessSecret);
        const user = await auth_repository_1.AuthRepository.findById(payload.userId);
        if (user && user.isActive) {
            req.user = {
                userId: user._id.toString(),
                role: user.role,
                email: user.email,
            };
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.middleware.js.map