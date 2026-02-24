"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestFrequencyAnalyzer = exports.CustomRateLimiter = exports.tokenRefreshRateLimit = exports.passwordResetRateLimit = exports.registrationRateLimit = exports.loginRateLimit = exports.authRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many authentication requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const resetTime = new Date(Date.now() + 15 * 60 * 1000);
        res.status(429).json({
            success: false,
            message: 'Too many authentication requests from this IP',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 900,
            resetTime: resetTime.toISOString()
        });
    },
    skip: (req) => {
        const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
        return req.ip ? whitelistedIPs.includes(req.ip) : false;
    }
});
exports.loginRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const resetTime = new Date(Date.now() + 15 * 60 * 1000);
        console.warn('Rate limit exceeded for login attempts', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            email: req.body?.email ? req.body.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined
        });
        res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.',
            error: 'LOGIN_RATE_LIMIT_EXCEEDED',
            retryAfter: 900,
            resetTime: resetTime.toISOString()
        });
    },
    keyGenerator: (req) => {
        return `login_${req.ip}_${req.body?.email || 'unknown'}`;
    }
});
exports.registrationRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many registration attempts from this IP, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const resetTime = new Date(Date.now() + 60 * 60 * 1000);
        console.warn('Rate limit exceeded for registration attempts', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            email: req.body?.email ? req.body.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined
        });
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts. Please try again in 1 hour.',
            error: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
            retryAfter: 3600,
            resetTime: resetTime.toISOString()
        });
    }
});
exports.passwordResetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many password reset requests, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `password_reset_${req.ip}_${req.body?.email || 'unknown'}`;
    }
});
exports.tokenRefreshRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 60,
    message: {
        success: false,
        message: 'Too many token refresh requests, please try again later.',
        retryAfter: '1 hour'
    },
    keyGenerator: (req) => {
        const refreshToken = req.body?.refreshToken || req.headers.authorization?.split(' ')[1];
        return `token_refresh_${refreshToken?.substring(0, 20) || req.ip}`;
    }
});
class CustomRateLimiter {
    static createSlidingWindowLimiter(options) {
        return (req, res, next) => {
            const key = options.keyGenerator ? options.keyGenerator(req) : (req.ip || 'unknown');
            const now = Date.now();
            const windowStart = now - options.windowMs;
            this.cleanupOldEntries(windowStart);
            const current = this.attempts.get(key);
            if (current && current.resetTime > now) {
                if (current.count >= options.maxRequests) {
                    const resetTime = new Date(current.resetTime);
                    return res.status(429).json({
                        success: false,
                        message: 'Rate limit exceeded',
                        retryAfter: Math.ceil((current.resetTime - now) / 1000),
                        resetTime: resetTime.toISOString()
                    });
                }
            }
            const entry = current || { count: 0, resetTime: now + options.windowMs };
            entry.count += 1;
            this.attempts.set(key, entry);
            res.setHeader('X-RateLimit-Limit', options.maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - entry.count));
            res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
            next();
        };
    }
    static cleanupOldEntries(cutoffTime) {
        for (const [key, entry] of this.attempts.entries()) {
            if (entry.resetTime < cutoffTime) {
                this.attempts.delete(key);
            }
        }
    }
    static resetLimitForKey(key) {
        this.attempts.delete(key);
    }
}
exports.CustomRateLimiter = CustomRateLimiter;
CustomRateLimiter.attempts = new Map();
class RequestFrequencyAnalyzer {
    static analyze(req) {
        const key = req.ip || 'unknown';
        const now = Date.now();
        const windowMs = 60 * 1000;
        const times = this.requestTimes.get(key) || [];
        const recentTimes = times.filter(time => now - time < windowMs);
        recentTimes.push(now);
        this.requestTimes.set(key, recentTimes);
        const requestCount = recentTimes.length;
        const intervals = this.calculateIntervals(recentTimes);
        const rapidRequests = intervals.filter(interval => interval < 1000);
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = this.calculateVariance(intervals, avgInterval);
        let isSuspicious = false;
        let reason = '';
        let confidence = 0;
        if (requestCount > 20) {
            isSuspicious = true;
            reason = 'High request frequency';
            confidence = Math.min(0.9, requestCount / 30);
        }
        else if (rapidRequests.length > 5) {
            isSuspicious = true;
            reason = 'Rapid successive requests';
            confidence = Math.min(0.8, rapidRequests.length / 10);
        }
        else if (variance < 100 && intervals.length > 3) {
            isSuspicious = true;
            reason = 'Uniform request timing (bot-like)';
            confidence = 0.7;
        }
        return {
            isSuspicious,
            reason,
            confidence
        };
    }
    static calculateIntervals(times) {
        const intervals = [];
        for (let i = 1; i < times.length; i++) {
            intervals.push(times[i] - times[i - 1]);
        }
        return intervals;
    }
    static calculateVariance(values, mean) {
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        return squareDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
}
exports.RequestFrequencyAnalyzer = RequestFrequencyAnalyzer;
RequestFrequencyAnalyzer.requestTimes = new Map();
//# sourceMappingURL=rate-limit.middleware.js.map