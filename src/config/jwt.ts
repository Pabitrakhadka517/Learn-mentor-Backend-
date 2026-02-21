export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "default_access_secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "default_refresh_secret",
  accessExpiry: "15m", // 15 minutes
  refreshExpiry: "7d", // 7 days
  resetTokenExpiry: "15m", // 15 minutes for password reset
};

export const bcryptConfig = {
  saltRounds: 10,
};
