"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
exports.jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "default_access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "default_refresh_secret",
    accessExpiry: "10m",
    refreshExpiry: "7d",
};
//# sourceMappingURL=jwt.js.map