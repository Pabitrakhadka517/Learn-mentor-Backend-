"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
class LoggerService {
    constructor() {
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
        const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...metadata }) => {
            let msg = `${timestamp} [${level}] : ${message}`;
            if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
        }));
        this.logger = winston_1.default.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            defaultMeta: { service: 'learnmentor-backend' },
            transports: [
                new winston_1.default.transports.Console({
                    format: consoleFormat
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join('logs', 'error.log'),
                    level: 'error',
                    maxsize: 5242880,
                    maxFiles: 5
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join('logs', 'combined.log'),
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ],
            exceptionHandlers: [
                new winston_1.default.transports.File({
                    filename: path_1.default.join('logs', 'exceptions.log')
                })
            ],
            rejectionHandlers: [
                new winston_1.default.transports.File({
                    filename: path_1.default.join('logs', 'rejections.log')
                })
            ]
        });
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    error(message, meta) {
        this.logger.error(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    http(message, meta) {
        this.logger.http(message, meta);
    }
}
exports.logger = new LoggerService();
//# sourceMappingURL=logger.service.js.map