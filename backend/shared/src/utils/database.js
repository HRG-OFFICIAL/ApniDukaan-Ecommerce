"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = exports.sortPipeline = exports.searchPipeline = exports.paginationPipeline = exports.timestampPlugin = exports.isDatabaseConnected = exports.disconnectDatabase = exports.connectDatabase = exports.DatabaseConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./logger");
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
    async connect(uri, dbName) {
        if (this.isConnected) {
            logger_1.logger.info('Database already connected');
            return;
        }
        try {
            await mongoose_1.default.connect(uri, {
                dbName,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false
            });
            this.isConnected = true;
            logger_1.logger.info(`Database connected successfully to ${dbName || 'default'}`);
            mongoose_1.default.connection.on('error', (error) => {
                logger_1.logger.error('Database connection error:', error);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.logger.warn('Database disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                logger_1.logger.info('Database reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            logger_1.logger.error('Database connection failed:', error);
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
            logger_1.logger.info('Database disconnected successfully');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from database:', error);
            throw error;
        }
    }
    isConnectedToDB() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    getConnection() {
        return mongoose_1.default.connection;
    }
}
exports.DatabaseConnection = DatabaseConnection;
const connectDatabase = async (uri, dbName) => {
    const db = DatabaseConnection.getInstance();
    await db.connect(uri, dbName);
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    const db = DatabaseConnection.getInstance();
    await db.disconnect();
};
exports.disconnectDatabase = disconnectDatabase;
const isDatabaseConnected = () => {
    const db = DatabaseConnection.getInstance();
    return db.isConnectedToDB();
};
exports.isDatabaseConnected = isDatabaseConnected;
const timestampPlugin = (schema) => {
    schema.add({
        createdAt: {
            type: Date,
            default: Date.now,
            immutable: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });
    schema.pre('save', function () {
        this.updatedAt = new Date();
    });
    schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function () {
        this.set({ updatedAt: new Date() });
    });
};
exports.timestampPlugin = timestampPlugin;
const paginationPipeline = (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return [
        { $skip: skip },
        { $limit: limit }
    ];
};
exports.paginationPipeline = paginationPipeline;
const searchPipeline = (searchTerm, fields) => {
    if (!searchTerm)
        return [];
    return [
        {
            $match: {
                $or: fields.map(field => ({
                    [field]: { $regex: searchTerm, $options: 'i' }
                }))
            }
        }
    ];
};
exports.searchPipeline = searchPipeline;
const sortPipeline = (sortBy = 'createdAt', sortOrder = 'desc') => {
    return [
        { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } }
    ];
};
exports.sortPipeline = sortPipeline;
const withTransaction = async (callback) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.withTransaction = withTransaction;
//# sourceMappingURL=database.js.map