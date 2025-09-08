import mongoose from 'mongoose';
export declare class DatabaseConnection {
    private static instance;
    private isConnected;
    static getInstance(): DatabaseConnection;
    connect(uri: string, dbName?: string): Promise<void>;
    disconnect(): Promise<void>;
    isConnectedToDB(): boolean;
    getConnection(): mongoose.Connection;
}
export declare const connectDatabase: (uri: string, dbName?: string) => Promise<void>;
export declare const disconnectDatabase: () => Promise<void>;
export declare const isDatabaseConnected: () => boolean;
export declare const timestampPlugin: (schema: mongoose.Schema) => void;
export declare const paginationPipeline: (page?: number, limit?: number) => ({
    $skip: number;
    $limit?: undefined;
} | {
    $limit: number;
    $skip?: undefined;
})[];
export declare const searchPipeline: (searchTerm: string, fields: string[]) => {
    $match: {
        $or: {
            [x: string]: {
                $regex: string;
                $options: string;
            };
        }[];
    };
}[];
export declare const sortPipeline: (sortBy?: string, sortOrder?: "asc" | "desc") => {
    $sort: {
        [x: string]: number;
    };
}[];
export declare const withTransaction: <T>(callback: (session: mongoose.ClientSession) => Promise<T>) => Promise<T>;
//# sourceMappingURL=database.d.ts.map