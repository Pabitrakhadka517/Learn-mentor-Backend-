"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcryptConfig = exports.jwtConfig = void 0;
exports.jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    accessExpiry: '15m',
    refreshExpiry: '7d',
    resetTokenExpiry: '15m',
};
exports.bcryptConfig = {
    saltRounds: 10,
};
//# sourceMappingURL=auth.config.js.map