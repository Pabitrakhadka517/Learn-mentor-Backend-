export const jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    accessExpiry: '15m', // 15 minutes
    refreshExpiry: '7d', // 7 days
    resetTokenExpiry: '15m', // 15 minutes for password reset
};

export const bcryptConfig = {
    saltRounds: 10,
};
