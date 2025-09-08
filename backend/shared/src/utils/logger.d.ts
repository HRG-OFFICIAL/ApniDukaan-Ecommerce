import winston from 'winston';
export declare const logger: winston.Logger;
export declare const createServiceLogger: (serviceName: string) => winston.Logger;
export declare const requestLogger: (serviceName?: string) => (req: any, res: any, next: any) => void;
export declare const logError: (error: Error, context?: any) => void;
export declare const logDatabaseOperation: (operation: string, collection: string, query?: any, duration?: number) => void;
export declare const logApiCall: (method: string, url: string, statusCode?: number, duration?: number, error?: Error) => void;
export declare const logPerformance: (operation: string, duration: number, metadata?: any) => void;
export declare const logUserAction: (userId: string, action: string, details?: any) => void;
export declare const logSecurityEvent: (event: string, details: any, severity?: "low" | "medium" | "high") => void;
export declare const logBusinessEvent: (event: string, details: any) => void;
export declare const createChildLogger: (parentLogger: winston.Logger, context: any) => winston.Logger;
export declare const stream: {
    write: (message: string) => void;
};
export declare const logHealthCheck: (serviceName: string, status: "healthy" | "unhealthy", details?: any) => void;
export declare const logConfiguration: (config: any, serviceName?: string) => void;
//# sourceMappingURL=logger.d.ts.map