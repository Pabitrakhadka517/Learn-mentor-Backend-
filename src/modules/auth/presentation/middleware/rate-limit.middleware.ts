import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate limiting configuration for authentication endpoints
 * Following the specification: max 100 requests per 15 minutes
 */

/**
 * Authentication rate limiter
 * Limits: 100 requests per 15 minutes per IP
 * Applied to: /api/auth/register, /api/auth/login
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    const resetTime = new Date(Date.now() + 15 * 60 * 1000);
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication requests from this IP',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
      resetTime: resetTime.toISOString()
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for certain IPs or conditions if needed
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return req.ip ? whitelistedIPs.includes(req.ip) : false;
  }
});

/**
 * Strict rate limiter for login attempts
 * Limits: 10 login attempts per 15 minutes per IP
 * Applied to: /api/auth/login only
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const resetTime = new Date(Date.now() + 15 * 60 * 1000);
    
    // Log failed login attempts for security monitoring
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
  keyGenerator: (req: Request) => {
    // Generate key based on IP and optionally email for failed attempts
    return `login_${req.ip}_${req.body?.email || 'unknown'}`;
  }
});

/**
 * Registration rate limiter
 * Limits: 5 registration attempts per hour per IP
 * Applied to: /api/auth/register only
 */
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const resetTime = new Date(Date.now() + 60 * 60 * 1000);
    
    // Log registration rate limit events
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
      retryAfter: 3600, // 1 hour in seconds
      resetTime: resetTime.toISOString()
    });
  }
});

/**
 * Password reset rate limiter
 * Limits: 5 password reset requests per hour per IP
 * Applied to: /api/auth/forgot-password
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Generate key based on IP and email
    return `password_reset_${req.ip}_${req.body?.email || 'unknown'}`;
  }
});

/**
 * Token refresh rate limiter
 * Limits: 60 token refresh requests per hour per token
 * Applied to: /api/auth/refresh
 */
export const tokenRefreshRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // Limit each token to 60 refresh attempts per hour
  message: {
    success: false,
    message: 'Too many token refresh requests, please try again later.',
    retryAfter: '1 hour'
  },
  keyGenerator: (req: Request) => {
    // Generate key based on refresh token or IP
    const refreshToken = req.body?.refreshToken || req.headers.authorization?.split(' ')[1];
    return `token_refresh_${refreshToken?.substring(0, 20) || req.ip}`;
  }
});

/**
 * Custom rate limiting middleware with enhanced features
 */
export class CustomRateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Enhanced rate limiter with sliding window and custom logic
   */
  static createSlidingWindowLimiter(options: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessful?: boolean;
  }) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = options.keyGenerator ? options.keyGenerator(req) : (req.ip || 'unknown');
      const now = Date.now();
      const windowStart = now - options.windowMs;
      
      // Clean up old entries
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
      
      // Update or create entry
      const entry = current || { count: 0, resetTime: now + options.windowMs };
      entry.count += 1;
      
      this.attempts.set(key, entry);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
      
      next();
    };
  }

  /**
   * Cleanup old entries to prevent memory leaks
   */
  private static cleanupOldEntries(cutoffTime: number): void {
    for (const [key, entry] of this.attempts.entries()) {
      if (entry.resetTime < cutoffTime) {
        this.attempts.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  static resetLimitForKey(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Request frequency analyzer for suspicious activity detection
 */
export class RequestFrequencyAnalyzer {
  private static requestTimes: Map<string, number[]> = new Map();

  /**
   * Analyzes request patterns to detect suspicious activity
   */
  static analyze(req: Request): {
    isSuspicious: boolean;
    reason?: string;
    confidence: number;
  } {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    // Get or create request history
    const times = this.requestTimes.get(key) || [];
    
    // Remove old entries
    const recentTimes = times.filter(time => now - time < windowMs);
    
    // Add current request
    recentTimes.push(now);
    
    // Update map
    this.requestTimes.set(key, recentTimes);
    
    // Analyze patterns
    const requestCount = recentTimes.length;
    const intervals = this.calculateIntervals(recentTimes);
    
    // Check for rapid-fire requests (less than 1 second apart)
    const rapidRequests = intervals.filter(interval => interval < 1000);
    
    // Check for uniform timing (bot-like behavior)
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = this.calculateVariance(intervals, avgInterval);
    
    let isSuspicious = false;
    let reason = '';
    let confidence = 0;
    
    if (requestCount > 20) {
      isSuspicious = true;
      reason = 'High request frequency';
      confidence = Math.min(0.9, requestCount / 30);
    } else if (rapidRequests.length > 5) {
      isSuspicious = true;
      reason = 'Rapid successive requests';
      confidence = Math.min(0.8, rapidRequests.length / 10);
    } else if (variance < 100 && intervals.length > 3) {
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

  private static calculateIntervals(times: number[]): number[] {
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }
    return intervals;
  }

  private static calculateVariance(values: number[], mean: number): number {
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    return squareDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}