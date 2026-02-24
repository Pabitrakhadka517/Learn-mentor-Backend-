"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnection = exports.DatabaseConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_service_1 = require("../logging/logger.service");
class DatabaseConnection {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async connect() {
        if (this.isConnected) {
            logger_service_1.logger.info('MongoDB already connected');
            return;
        }
        try {
            const mongoUri = process.env.MONGO_URI;
            if (!mongoUri) {
                throw new Error('MONGO_URI environment variable is not defined');
            }
            await mongoose_1.default.connect(mongoUri, {
                maxPoolSize: 10,
                minPoolSize: 5,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            this.isConnected = true;
            logger_service_1.logger.info('✅ MongoDB connected successfully');
            mongoose_1.default.connection.on('error', (error) => {
                logger_service_1.logger.error('MongoDB connection error', { error: error.message });
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_service_1.logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                logger_service_1.logger.info('MongoDB reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            logger_service_1.logger.error('❌ MongoDB connection failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            logger_service_1.logger.info('MongoDB disconnected gracefully');
        }
        catch (error) {
            logger_service_1.logger.error('Error disconnecting from MongoDB', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    getConnection() {
        return mongoose_1.default;
    }
}
exports.DatabaseConnection = DatabaseConnection;
exports.dbConnection = DatabaseConnection.getInstance();
//# sourceMappingURL=mongodb.connection.js.map