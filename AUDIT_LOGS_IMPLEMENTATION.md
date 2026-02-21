# Audit Logs Implementation & Analysis

## 2.1 Audit Logs Overview

### Definition
Audit logs are comprehensive records of user actions, system events, and data changes within an application. They serve as a digital trail for compliance, security monitoring, and debugging purposes.

### Purpose in Admin Panel
- **Compliance**: Meet regulatory requirements (GDPR, FERPA, SOX)
- **Security Monitoring**: Track unauthorized access attempts and suspicious activities
- **Accountability**: Maintain records of who did what and when
- **Debugging**: Trace issues and understand system behavior
- **Performance Monitoring**: Analyze usage patterns and system performance

## 2.2 Current System Analysis

### Why Audit Logs Are Not Working

**Root Cause Analysis:**

1. **Missing Audit Infrastructure**: No audit logging middleware or service implemented
2. **No Database Schema**: Absence of audit_logs collection/table
3. **No Event Triggers**: No hooks to capture user actions and system events
4. **Frontend Gaps**: Admin panel lacks audit log UI components
5. **Configuration Issues**: Missing environment variables for audit settings

### Evidence of Missing Implementation:

```bash
# Search results show no audit logging implementation
$ grep -r "audit" src/
$ grep -r "log" src/modules/admin/
# Returns minimal or no audit-specific code
```

## 2.3 Comprehensive Audit Logging Implementation

### Database Schema Design

```typescript
// src/modules/audit/audit.model.ts

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
    _id: Types.ObjectId;
    userId?: Types.ObjectId;
    userEmail?: string;
    userRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details: {
        before?: any;
        after?: any;
        metadata?: any;
        ip?: string;
        userAgent?: string;
        sessionId?: string;
    };
    timestamp: Date;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    module: string;
    apiEndpoint?: string;
    httpMethod?: string;
    duration?: number;
    errorDetails?: any;
}

const auditLogSchema = new Schema<IAuditLog>({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        sparse: true 
    },
    userEmail: { 
        type: String,
        lowercase: true,
        index: true 
    },
    userRole: { 
        type: String,
        enum: ['STUDENT', 'TUTOR', 'ADMIN', 'SYSTEM'],
        index: true 
    },
    action: { 
        type: String, 
        required: true,
        index: true 
    },
    resourceType: { 
        type: String, 
        required: true,
        index: true 
    },
    resourceId: { 
        type: String,
        index: true 
    },
    details: {
        before: Schema.Types.Mixed,
        after: Schema.Types.Mixed,
        metadata: Schema.Types.Mixed,
        ip: String,
        userAgent: String,
        sessionId: String,
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true 
    },
    status: { 
        type: String, 
        enum: ['SUCCESS', 'FAILED', 'PENDING'],
        default: 'SUCCESS',
        index: true 
    },
    severity: { 
        type: String, 
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW',
        index: true 
    },
    module: { 
        type: String, 
        required: true,
        index: true 
    },
    apiEndpoint: String,
    httpMethod: { 
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    duration: Number,
    errorDetails: Schema.Types.Mixed
}, { 
    timestamps: false, // We use our own timestamp
    capped: { size: 100000000, max: 1000000 } // 100MB cap, 1M documents max
});

// Compound indexes for efficient querying
auditLogSchema.index({ timestamp: -1, userId: 1 });
auditLogSchema.index({ resourceType: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ module: 1, severity: 1, timestamp: -1 });
auditLogSchema.index({ userEmail: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
```

### Audit Service Implementation

```typescript
// src/modules/audit/audit.service.ts

import { AuditLog, IAuditLog } from './audit.model';
import { Request } from 'express';

export interface AuditOptions {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    before?: any;
    after?: any;
    metadata?: any;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    module: string;
    req?: Request;
    errorDetails?: any;
    duration?: number;
}

export class AuditService {
    /**
     * Log an audit event
     */
    static async log(options: AuditOptions): Promise<void> {
        try {
            const auditData: Partial<IAuditLog> = {
                userId: options.userId ? mongoose.Types.ObjectId(options.userId) : undefined,
                userEmail: options.userEmail?.toLowerCase(),
                userRole: options.userRole,
                action: options.action,
                resourceType: options.resourceType,
                resourceId: options.resourceId,
                details: {
                    before: options.before,
                    after: options.after,
                    metadata: options.metadata,
                    ip: this.getClientIP(options.req),
                    userAgent: options.req?.get('User-Agent'),
                    sessionId: this.getSessionId(options.req),
                },
                timestamp: new Date(),
                status: options.status || 'SUCCESS',
                severity: options.severity || 'LOW',
                module: options.module,
                apiEndpoint: options.req?.originalUrl,
                httpMethod: options.req?.method as any,
                duration: options.duration,
                errorDetails: options.errorDetails
            };

            await AuditLog.create(auditData);
        } catch (error) {
            // Critical: Don't let audit logging break the main flow
            console.error('Audit logging failed:', error);
            
            // Optional: Send to external logging service
            if (process.env.EXTERNAL_AUDIT_WEBHOOK) {
                this.sendToExternalLogger(options, error);
            }
        }
    }

    /**
     * Retrieve audit logs with filtering and pagination
     */
    static async getLogs(filters: {
        userId?: string;
        userEmail?: string;
        action?: string;
        resourceType?: string;
        module?: string;
        severity?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const {
            page = 1,
            limit = 50,
            sortBy = 'timestamp',
            sortOrder = 'desc',
            ...filterCriteria
        } = filters;

        // Build query
        const query: any = {};
        
        if (filterCriteria.userId) query.userId = filterCriteria.userId;
        if (filterCriteria.userEmail) query.userEmail = filterCriteria.userEmail.toLowerCase();
        if (filterCriteria.action) query.action = new RegExp(filterCriteria.action, 'i');
        if (filterCriteria.resourceType) query.resourceType = filterCriteria.resourceType;
        if (filterCriteria.module) query.module = filterCriteria.module;
        if (filterCriteria.severity) query.severity = filterCriteria.severity;
        if (filterCriteria.status) query.status = filterCriteria.status;
        
        if (filterCriteria.startDate || filterCriteria.endDate) {
            query.timestamp = {};
            if (filterCriteria.startDate) query.timestamp.$gte = filterCriteria.startDate;
            if (filterCriteria.endDate) query.timestamp.$lte = filterCriteria.endDate;
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const sortOption = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('userId', 'fullName email role')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query)
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get audit statistics
     */
    static async getStatistics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
        const now = new Date();
        let startDate: Date;

        switch (timeframe) {
            case 'hour':
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        const pipeline = [
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        module: '$module',
                        action: '$action',
                        status: '$status',
                        severity: '$severity'
                    },
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$duration' }
                }
            }
        ];

        const stats = await AuditLog.aggregate(pipeline);
        
        return {
            timeframe,
            startDate,
            endDate: now,
            statistics: stats
        };
    }

    /**
     * Helper methods
     */
    private static getClientIP(req?: Request): string {
        if (!req) return 'unknown';
        
        return req.ip ||
               req.connection.remoteAddress ||
               (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
               'unknown';
    }

    private static getSessionId(req?: Request): string {
        return req?.session?.id || 
               req?.headers['x-session-id'] as string ||
               'unknown';
    }

    private static async sendToExternalLogger(options: AuditOptions, error: any): Promise<void> {
        // Implementation for external logging service
        // (e.g., Loggly, Splunk, ELK Stack)
    }
}
```

### Audit Middleware Implementation

```typescript
// src/modules/audit/audit.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';

export interface AuditConfig {
    action: string;
    resourceType: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    captureBody?: boolean;
    captureResponse?: boolean;
    skipIf?: (req: Request) => boolean;
}

export function auditMiddleware(config: AuditConfig) {
    return async (req: any, res: Response, next: NextFunction) => {
        const startTime = Date.now();
        
        // Skip audit if condition met
        if (config.skipIf && config.skipIf(req)) {
            return next();
        }

        // Capture original response methods
        const originalSend = res.send;
        const originalJson = res.json;
        
        let responseBody: any;
        let responseStatus: number = 200;

        // Override response methods to capture response
        if (config.captureResponse) {
            res.send = function(body: any) {
                responseBody = body;
                responseStatus = res.statusCode;
                return originalSend.call(this, body);
            };

            res.json = function(body: any) {
                responseBody = body;
                responseStatus = res.statusCode;
                return originalJson.call(this, body);
            };
        }

        // Continue with request processing
        res.on('finish', async () => {
            const duration = Date.now() - startTime;
            const isSuccess = responseStatus >= 200 && responseStatus < 400;
            
            try {
                await AuditService.log({
                    userId: req.user?.userId,
                    userEmail: req.user?.email,
                    userRole: req.user?.role,
                    action: config.action,
                    resourceType: config.resourceType,
                    resourceId: req.params.id || req.params.userId || undefined,
                    before: config.captureBody ? req.body : undefined,
                    after: config.captureResponse ? responseBody : undefined,
                    metadata: {
                        params: req.params,
                        query: req.query,
                        files: req.files ? Object.keys(req.files) : undefined
                    },
                    status: isSuccess ? 'SUCCESS' : 'FAILED',
                    severity: config.severity || 'LOW',
                    module: config.resourceType.toLowerCase(),
                    req,
                    duration,
                    errorDetails: !isSuccess ? responseBody : undefined
                });
            } catch (auditError) {
                console.error('Audit middleware error:', auditError);
            }
        });

        next();
    };
}

// Predefined audit configurations
export const AuditConfigs = {
    USER_LOGIN: {
        action: 'LOGIN',
        resourceType: 'USER',
        severity: 'MEDIUM' as const
    },
    USER_LOGOUT: {
        action: 'LOGOUT',
        resourceType: 'USER',
        severity: 'LOW' as const
    },
    USER_REGISTER: {
        action: 'REGISTER',
        resourceType: 'USER',
        severity: 'MEDIUM' as const,
        captureBody: true
    },
    PROFILE_UPDATE: {
        action: 'UPDATE_PROFILE',
        resourceType: 'USER',
        severity: 'MEDIUM' as const,
        captureBody: true,
        captureResponse: true
    },
    ADMIN_USER_UPDATE: {
        action: 'ADMIN_UPDATE_USER',
        resourceType: 'USER',
        severity: 'HIGH' as const,
        captureBody: true,
        captureResponse: true
    },
    TUTOR_VERIFICATION: {
        action: 'VERIFY_TUTOR',
        resourceType: 'TUTOR',
        severity: 'HIGH' as const,
        captureBody: true
    },
    BOOKING_CREATE: {
        action: 'CREATE_BOOKING',
        resourceType: 'BOOKING',
        severity: 'LOW' as const,
        captureBody: true
    },
    PAYMENT_PROCESS: {
        action: 'PROCESS_PAYMENT',
        resourceType: 'PAYMENT',
        severity: 'CRITICAL' as const,
        captureBody: true,
        captureResponse: true
    }
};
```

### Controller Implementation

```typescript
// src/modules/audit/audit.controller.ts

import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { z } from 'zod';

const GetAuditLogsSchema = z.object({
    userId: z.string().optional(),
    userEmail: z.string().email().optional(),
    action: z.string().optional(),
    resourceType: z.string().optional(),
    module: z.string().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});

export class AuditController {
    /**
     * Get audit logs with filtering
     */
    static async getAuditLogs(req: Request, res: Response) {
        try {
            const validation = GetAuditLogsSchema.safeParse(req.query);
            if (!validation.success) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: validation.error.errors
                });
            }

            const filters = validation.data;
            
            // Convert date strings to Date objects
            if (filters.startDate) {
                filters.startDate = new Date(filters.startDate);
            }
            if (filters.endDate) {
                filters.endDate = new Date(filters.endDate);
            }

            const result = await AuditService.getLogs(filters);

            res.status(200).json({
                message: 'Audit logs retrieved successfully',
                ...result
            });
        } catch (error: any) {
            console.error('Get audit logs error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve audit logs'
            });
        }
    }

    /**
     * Get audit statistics
     */
    static async getAuditStatistics(req: Request, res: Response) {
        try {
            const { timeframe } = req.query;
            const validTimeframes = ['hour', 'day', 'week', 'month'];
            
            if (timeframe && !validTimeframes.includes(timeframe as string)) {
                return res.status(400).json({
                    error: 'Invalid timeframe',
                    message: 'Timeframe must be one of: ' + validTimeframes.join(', ')
                });
            }

            const statistics = await AuditService.getStatistics(timeframe as any);

            res.status(200).json({
                message: 'Audit statistics retrieved successfully',
                ...statistics
            });
        } catch (error: any) {
            console.error('Get audit statistics error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve audit statistics'
            });
        }
    }

    /**
     * Export audit logs
     */
    static async exportAuditLogs(req: Request, res: Response) {
        try {
            const { format = 'json' } = req.query;
            const filters = req.query;

            const result = await AuditService.getLogs({
                ...filters,
                limit: 10000 // Large limit for export
            });

            if (format === 'csv') {
                // Convert to CSV
                const csv = this.convertToCSV(result.logs);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
                res.send(csv);
            } else {
                // JSON format
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
                res.json(result.logs);
            }
        } catch (error: any) {
            console.error('Export audit logs error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to export audit logs'
            });
        }
    }

    private static convertToCSV(logs: any[]): string {
        if (!logs.length) return '';

        const headers = [
            'Timestamp', 'User Email', 'User Role', 'Action', 'Resource Type',
            'Resource ID', 'Status', 'Severity', 'Module', 'IP Address', 'Duration'
        ];

        const rows = logs.map(log => [
            log.timestamp,
            log.userEmail || 'N/A',
            log.userRole || 'N/A',
            log.action,
            log.resourceType,
            log.resourceId || 'N/A',
            log.status,
            log.severity,
            log.module,
            log.details?.ip || 'N/A',
            log.duration ? `${log.duration}ms` : 'N/A'
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }
}
```

### Routes Implementation

```typescript
// src/modules/audit/audit.routes.ts

import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, authorize } from '../auth/auth.middleware';

const router = Router();

// All audit routes require admin access
router.use(authenticate);
router.use(authorize(['ADMIN']));

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs with filtering
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *       - name: action
 *         in: query
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 */
router.get('/logs', AuditController.getAuditLogs);

/**
 * @swagger
 * /api/audit/statistics:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', AuditController.getAuditStatistics);

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
router.get('/export', AuditController.exportAuditLogs);

export default router;
```

### Integration with Existing Routes

```typescript
// Update existing route files to include audit middleware

// src/modules/auth/auth.routes.ts
import { auditMiddleware, AuditConfigs } from '../audit/audit.middleware';

router.post('/login', 
    auditMiddleware(AuditConfigs.USER_LOGIN), 
    AuthController.login
);

router.post('/register', 
    auditMiddleware(AuditConfigs.USER_REGISTER), 
    AuthController.register
);

// src/modules/profile/profile.routes.ts
router.put('/', 
    authenticate, 
    uploadProfileImage, 
    auditMiddleware(AuditConfigs.PROFILE_UPDATE),
    ProfileController.updateProfile
);

// src/modules/admin/admin.routes.ts (if exists)
router.put('/users/:userId', 
    authenticate, 
    authorize(['ADMIN']),
    auditMiddleware(AuditConfigs.ADMIN_USER_UPDATE),
    AdminController.updateUser
);
```

## 2.4 Frontend Implementation

### Audit Log Dashboard Component

```tsx
// Frontend: components/Admin/AuditLogsDashboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    Filter, 
    Download, 
    Search, 
    Calendar,
    AlertTriangle,
    Clock,
    User,
    Activity
} from 'lucide-react';

interface AuditLog {
    _id: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    timestamp: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    module: string;
    details: {
        ip?: string;
        userAgent?: string;
    };
    duration?: number;
}

const AuditLogsDashboard: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        resourceType: '',
        severity: '',
        status: '',
        startDate: '',
        endDate: '',
        userEmail: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
    });
    const [statistics, setStatistics] = useState<any>(null);

    useEffect(() => {
        fetchAuditLogs();
        fetchStatistics();
    }, [filters, pagination.page]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            });

            const response = await fetch(`/api/audit/logs?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch('/api/audit/statistics?timeframe=day', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStatistics(data);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const exportLogs = async (format: 'json' | 'csv') => {
        try {
            const queryParams = new URLSearchParams({
                format,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            });

            const response = await fetch(`/api/audit/export?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-600 bg-red-100';
            case 'HIGH': return 'text-orange-600 bg-orange-100';
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
            case 'LOW': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'text-green-600 bg-green-100';
            case 'FAILED': return 'text-red-600 bg-red-100';
            case 'PENDING': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Audit Logs
                    </h1>
                </div>
                
                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Activity className="w-5 h-5 text-blue-600 mr-2" />
                                <span className="text-sm text-blue-800 dark:text-blue-300">
                                    Total Events
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {statistics.statistics.reduce((sum: number, stat: any) => sum + stat.count, 0)}
                            </p>
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                                <span className="text-sm text-red-800 dark:text-red-300">
                                    Critical Events
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                                {statistics.statistics
                                    .filter((stat: any) => stat._id.severity === 'CRITICAL')
                                    .reduce((sum: number, stat: any) => sum + stat.count, 0)}
                            </p>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <div className="flex items-center">
                                <Clock className="w-5 h-5 text-green-600 mr-2" />
                                <span className="text-sm text-green-800 dark:text-green-300">
                                    Avg Duration
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {Math.round(statistics.statistics
                                    .reduce((sum: number, stat: any) => sum + (stat.avgDuration || 0), 0) / 
                                    statistics.statistics.length)}ms
                            </p>
                        </div>
                        
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <div className="flex items-center">
                                <User className="w-5 h-5 text-purple-600 mr-2" />
                                <span className="text-sm text-purple-800 dark:text-purple-300">
                                    Unique Users
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {new Set(logs.map(log => log.userEmail).filter(Boolean)).size}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                <div className="flex items-center mb-4">
                    <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Filters
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search by action"
                        value={filters.action}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    
                    <input
                        type="email"
                        placeholder="User email"
                        value={filters.userEmail}
                        onChange={(e) => handleFilterChange('userEmail', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    
                    <select
                        value={filters.severity}
                        onChange={(e) => handleFilterChange('severity', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">All Severities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                    
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">All Statuses</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                        <option value="PENDING">Pending</option>
                    </select>
                    
                    <input
                        type="datetime-local"
                        placeholder="Start date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    
                    <input
                        type="datetime-local"
                        placeholder="End date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    
                    <div className="flex space-x-2">
                        <button
                            onClick={() => exportLogs('json')}
                            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            JSON
                        </button>
                        <button
                            onClick={() => exportLogs('csv')}
                            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Resource
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    IP
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                {log.userEmail || 'System'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {log.userRole}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                {log.resourceType}
                                            </div>
                                            {log.resourceId && (
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    ID: {log.resourceId}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {log.duration ? `${log.duration}ms` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                            {log.details?.ip || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                                disabled={pagination.page === pagination.pages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing{' '}
                                    <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                                    {' '}to{' '}
                                    <span className="font-medium">
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                                    </span>
                                    {' '}of{' '}
                                    <span className="font-medium">{pagination.total}</span>
                                    {' '}results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                                        const pageNumber = i + 1;
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    pagination.page === pageNumber
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogsDashboard;
```

## 2.5 Testing & Deployment

### Unit Tests

```typescript
// tests/audit.service.test.ts

import { AuditService } from '../src/modules/audit/audit.service';
import { AuditLog } from '../src/modules/audit/audit.model';

describe('AuditService', () => {
    beforeEach(async () => {
        await AuditLog.deleteMany({});
    });

    it('should log audit events successfully', async () => {
        await AuditService.log({
            action: 'LOGIN',
            resourceType: 'USER',
            userId: '6507f1f77bcf86cd799439011',
            userEmail: 'test@example.com',
            userRole: 'STUDENT',
            module: 'auth'
        });

        const logs = await AuditLog.find({});
        expect(logs).toHaveLength(1);
        expect(logs[0].action).toBe('LOGIN');
    });

    it('should filter audit logs correctly', async () => {
        // Create test data
        await AuditService.log({
            action: 'LOGIN',
            resourceType: 'USER',
            severity: 'MEDIUM',
            module: 'auth'
        });

        await AuditService.log({
            action: 'UPDATE_PROFILE',
            resourceType: 'USER',
            severity: 'HIGH',
            module: 'profile'
        });

        const result = await AuditService.getLogs({
            severity: 'HIGH'
        });

        expect(result.logs).toHaveLength(1);
        expect(result.logs[0].action).toBe('UPDATE_PROFILE');
    });
});
```

### Integration Tests

```typescript
// tests/audit.integration.test.ts

import request from 'supertest';
import app from '../src/app';

describe('Audit API Integration', () => {
    let adminToken: string;

    beforeAll(async () => {
        // Login as admin to get token
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'AdminPass123!'
            });
        
        adminToken = response.body.accessToken;
    });

    it('should return audit logs for admin users', async () => {
        const response = await request(app)
            .get('/api/audit/logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body).toHaveProperty('logs');
        expect(response.body).toHaveProperty('pagination');
    });

    it('should export audit logs in CSV format', async () => {
        const response = await request(app)
            .get('/api/audit/export?format=csv')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.headers['content-type']).toContain('text/csv');
    });
});
```

## 2.6 Security & Compliance Considerations

### Data Protection
- **PII Handling**: Audit logs should not store sensitive personal information
- **Data Retention**: Implement automatic cleanup of old audit logs
- **Access Control**: Only admin users can access audit logs
- **Encryption**: Encrypt audit logs at rest and in transit

### Compliance Requirements
- **GDPR**: Right to erasure implementation for audit logs
- **FERPA**: Educational record access tracking
- **SOX**: Financial transaction audit trails
- **HIPAA**: Healthcare data access monitoring (if applicable)

### Performance Optimization
- **Indexing**: Proper database indexing for fast queries
- **Capping**: Collection size limits to prevent storage issues
- **Archival**: Move old logs to cold storage
- **Async Processing**: Non-blocking audit logging

## 2.7 Deployment & Monitoring

### Environment Variables

```bash
# .env additions
AUDIT_LOG_LEVEL=INFO
AUDIT_RETENTION_DAYS=90
AUDIT_EXPORT_LIMIT=10000
EXTERNAL_AUDIT_WEBHOOK=https://logs.company.com/webhook
AUDIT_ENCRYPTION_KEY=your-encryption-key
```

### Monitoring & Alerts

```typescript
// src/modules/audit/audit.monitoring.ts

export class AuditMonitoring {
    static async checkCriticalEvents() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const criticalEvents = await AuditLog.countDocuments({
            severity: 'CRITICAL',
            timestamp: { $gte: oneHourAgo }
        });

        if (criticalEvents > 10) {
            // Send alert to administrators
            await this.sendAlert(`High number of critical events: ${criticalEvents} in the last hour`);
        }
    }

    static async checkFailedLogins() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const failedLogins = await AuditLog.countDocuments({
            action: 'LOGIN',
            status: 'FAILED',
            timestamp: { $gte: oneHourAgo }
        });

        if (failedLogins > 50) {
            await this.sendAlert(`Potential brute force attack: ${failedLogins} failed logins in the last hour`);
        }
    }

    private static async sendAlert(message: string) {
        // Implementation for sending alerts (email, Slack, etc.)
        console.error('AUDIT ALERT:', message);
    }
}
```

### Performance Monitoring

```javascript
// MongoDB monitoring queries

// Check audit log collection size
db.auditlogs.stats()

// Find slow audit log queries
db.auditlogs.find().explain("executionStats")

// Monitor index usage
db.auditlogs.aggregate([
    { $indexStats: {} }
])
```

This comprehensive audit logging implementation provides enterprise-grade tracking, monitoring, and compliance capabilities for the LearnMentor system.