"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logConfiguration = exports.logHealthCheck = exports.stream = exports.createChildLogger = exports.logBusinessEvent = exports.logSecurityEvent = exports.logUserAction = exports.logPerformance = exports.logApiCall = exports.logDatabaseOperation = exports.logError = exports.requestLogger = exports.createServiceLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        verbose: 'cyan',
        debug: 'blue',
        silly: 'grey'
    }
};
winston_1.default.addColors(customLevels.colors);
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, service, ...metadata }) => {
    let msg = `[${timestamp}] [${service || 'APP'}] ${level}: ${message}`;
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const createLogger = (serviceName = 'APP') => {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logDir = process.env.LOG_DIR || 'logs';
    const transports = [
        new winston_1.default.transports.Console({
            level: logLevel,
            format: consoleFormat
        })
    ];
    if (process.env.NODE_ENV === 'production') {
        transports.push(new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log'),
            level: 'info',
            format: fileFormat,
            maxsize: 5242880,
            maxFiles: 5
        }), new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880,
            maxFiles: 5
        }));
    }
    return winston_1.default.createLogger({
        levels: customLevels.levels,
        level: logLevel,
        defaultMeta: { service: serviceName },
        transports,
        exitOnError: false
    });
};
exports.logger = createLogger();
const createServiceLogger = (serviceName) => {
    return createLogger(serviceName);
};
exports.createServiceLogger = createServiceLogger;
const requestLogger = (serviceName) => {
    const requestLog = serviceName ? (0, exports.createServiceLogger)(serviceName) : exports.logger;
    return (req, res, next) => {
        const start = Date.now();
        const { method, url, ip, headers } = req;
        requestLog.http('Incoming request', {
            method,
            url,
            ip: ip || headers['x-forwarded-for'] || 'unknown',
            userAgent: headers['user-agent']
        });
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            res.end = originalEnd;
            res.end(chunk, encoding);
            const duration = Date.now() - start;
            const { statusCode } = res;
            requestLog.http('Request completed', {
                method,
                url,
                statusCode,
                duration: `${duration}ms`,
                contentLength: res.get('content-length') || 0
            });
        };
        next();
    };
};
exports.requestLogger = requestLogger;
const logError = (error, context) => {
    exports.logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        context
    });
};
exports.logError = logError;
const logDatabaseOperation = (operation, collection, query, duration) => {
    exports.logger.debug('Database operation', {
        operation,
        collection,
        query: query ? JSON.stringify(query) : undefined,
        duration: duration ? `${duration}ms` : undefined
    });
};
exports.logDatabaseOperation = logDatabaseOperation;
const logApiCall = (method, url, statusCode, duration, error) => {
    const logData = {
        method,
        url,
        statusCode,
        duration: duration ? `${duration}ms` : undefined
    };
    if (error) {
        exports.logger.warn('External API call failed', {
            ...logData,
            error: error.message
        });
    }
    else {
        exports.logger.info('External API call completed', logData);
    }
};
exports.logApiCall = logApiCall;
const logPerformance = (operation, duration, metadata) => {
    exports.logger.info('Performance metric', {
        operation,
        duration: `${duration}ms`,
        ...metadata
    });
};
exports.logPerformance = logPerformance;
const logUserAction = (userId, action, details) => {
    exports.logger.info('User action', {
        userId,
        action,
        details
    });
};
exports.logUserAction = logUserAction;
const logSecurityEvent = (event, details, severity = 'medium') => {
    exports.logger.warn('Security event', {
        event,
        severity,
        details,
        timestamp: new Date().toISOString()
    });
};
exports.logSecurityEvent = logSecurityEvent;
const logBusinessEvent = (event, details) => {
    exports.logger.info('Business event', {
        event,
        details,
        timestamp: new Date().toISOString()
    });
};
exports.logBusinessEvent = logBusinessEvent;
const createChildLogger = (parentLogger, context) => {
    return parentLogger.child(context);
};
exports.createChildLogger = createChildLogger;
exports.stream = {
    write: (message) => {
        exports.logger.http(message.trim());
    }
};
const logHealthCheck = (serviceName, status, details) => {
    const logLevel = status === 'healthy' ? 'info' : 'error';
    exports.logger.log(logLevel, 'Health check', {
        service: serviceName,
        status,
        details
    });
};
exports.logHealthCheck = logHealthCheck;
const logConfiguration = (config, serviceName) => {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api_key', 'private'];
    const sanitizedConfig = { ...config };
    const sanitizeObject = (obj) => {
        Object.keys(obj).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                obj[key] = '[REDACTED]';
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        });
    };
    sanitizeObject(sanitizedConfig);
    exports.logger.info('Service configuration', {
        service: serviceName,
        config: sanitizedConfig
    });
};
exports.logConfiguration = logConfiguration;
//# sourceMappingURL=logger.js.map