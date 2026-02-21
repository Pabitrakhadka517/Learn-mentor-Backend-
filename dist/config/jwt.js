"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcryptConfig = exports.jwtConfig = void 0;
exports.jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "default_access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "default_refresh_secret",
    accessExpiry: "15m",
    refreshExpiry: "7d",
    resetTokenExpiry: "15m",
};
exports.bcryptConfig = {
    saltRounds: 10,
};
//# sourceMappingURL=jwt.js.map