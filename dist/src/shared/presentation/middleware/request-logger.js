"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_service_1 = require("../../infrastructure/logging/logger.service");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    logger_service_1.logger.http('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_service_1.logger.http('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=request-logger.js.map