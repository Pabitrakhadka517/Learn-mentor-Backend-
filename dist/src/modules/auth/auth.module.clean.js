"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = exports.AuthModuleClean = void 0;
exports.createAuthModule = createAuthModule;
const auth_repository_impl_1 = require("./infrastructure/repositories/auth.repository.impl");
const token_service_1 = require("./infrastructure/services/token.service");
const register_usecase_1 = require("./application/use-cases/register.usecase");
const login_usecase_1 = require("./application/use-cases/login.usecase");
const refresh_token_usecase_1 = require("./application/use-cases/refresh-token.usecase");
const logout_usecase_1 = require("./application/use-cases/logout.usecase");
const auth_controller_clean_1 = require("./presentation/controllers/auth.controller.clean");
const auth_routes_clean_1 = require("./presentation/routes/auth.routes.clean");
class AuthModuleClean {
    constructor() {
        this.authRepository = new auth_repository_impl_1.AuthRepositoryImpl();
        this.tokenService = new token_service_1.TokenService();
        this.registerUseCase = new register_usecase_1.RegisterUseCase(this.authRepository, this.tokenService);
        this.loginUseCase = new login_usecase_1.LoginUseCase(this.authRepository, this.tokenService);
        this.refreshTokenUseCase = new refresh_token_usecase_1.RefreshTokenUseCase(this.authRepository, this.tokenService);
        this.logoutUseCase = new logout_usecase_1.LogoutUseCase(this.authRepository, this.tokenService);
        this.authController = new auth_controller_clean_1.AuthControllerClean(this.registerUseCase, this.loginUseCase);
        this.router = (0, auth_routes_clean_1.createAuthRoutes)(this.authController);
        AuthModuleClean.isInitialized = true;
    }
    static getInstance() {
        if (!AuthModuleClean.instance) {
            AuthModuleClean.instance = new AuthModuleClean();
        }
        return AuthModuleClean.instance;
    }
    getRouter() {
        return this.router;
    }
    getController() {
        return this.authController;
    }
    getRepository() {
        return this.authRepository;
    }
    getTokenService() {
        return this.tokenService;
    }
    getUseCases() {
        return {
            register: this.registerUseCase,
            login: this.loginUseCase,
            refreshToken: this.refreshTokenUseCase,
            logout: this.logoutUseCase
        };
    }
    async healthCheck() {
        try {
            const dbHealthy = await this.testDatabaseConnection();
            const tokenHealthy = await this.testTokenService();
            const repoHealthy = await this.testRepository();
            const allHealthy = dbHealthy && tokenHealthy && repoHealthy;
            return {
                status: allHealthy ? 'healthy' : 'unhealthy',
                checks: {
                    database: dbHealthy,
                    tokenService: tokenHealthy,
                    repository: repoHealthy
                }
            };
        }
        catch (error) {
            console.error('Auth Module health check failed:', error);
            return {
                status: 'unhealthy',
                checks: {
                    database: false,
                    tokenService: false,
                    repository: false
                }
            };
        }
    }
    async testDatabaseConnection() {
        try {
            await this.authRepository.getUserCount();
            return true;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
    async testTokenService() {
        try {
            const { accessToken } = await this.tokenService.generateTokens('test-user-id', 'STUDENT', 'test@example.com');
            await this.tokenService.verifyAccessToken(accessToken);
            return true;
        }
        catch (error) {
            console.error('Token service test failed:', error);
            return false;
        }
    }
    async testRepository() {
        try {
            const testEmail = 'health-check@test.com';
            const exists = await this.authRepository.emailExists(testEmail);
            return exists === false;
        }
        catch (error) {
            console.error('Repository test failed:', error);
            return false;
        }
    }
    async cleanupExpiredTokens() {
        try {
            return await this.authRepository.cleanupExpiredTokens();
        }
        catch (error) {
            console.error('Token cleanup failed:', error);
            return 0;
        }
    }
    async shutdown() {
        try {
            console.log('Auth Module shutting down gracefully...');
            const cleanedTokens = await this.cleanupExpiredTokens();
            console.log(`Cleaned up ${cleanedTokens} expired tokens`);
            AuthModuleClean.isInitialized = false;
            console.log('Auth Module shutdown complete');
        }
        catch (error) {
            console.error('Error during Auth Module shutdown:', error);
        }
    }
    getModuleInfo() {
        return {
            name: 'AuthModuleClean',
            version: '1.0.0',
            initialized: AuthModuleClean.isInitialized,
            dependencies: [
                'mongodb',
                'mongoose',
                'jsonwebtoken',
                'bcryptjs',
                'express',
                'express-rate-limit',
                'zod'
            ]
        };
    }
    static async initialize() {
        const module = AuthModuleClean.getInstance();
        console.log('Auth Module (Clean Architecture) initialized successfully');
        return module;
    }
}
exports.AuthModuleClean = AuthModuleClean;
AuthModuleClean.isInitialized = false;
exports.default = AuthModuleClean.getInstance;
exports.authRouter = AuthModuleClean.getInstance().getRouter();
function createAuthModule() {
    return AuthModuleClean.getInstance().getRouter();
}
//# sourceMappingURL=auth.module.clean.js.map