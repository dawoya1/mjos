/**
 * MJOS REST API Server
 * 魔剑工作室操作系统REST API服务器
 */
import { Express } from 'express';
import { MJOS } from '../index';
export interface APIServerOptions {
    port?: number;
    host?: string;
    enableCors?: boolean;
    enableCompression?: boolean;
    enableRateLimit?: boolean;
    rateLimitPoints?: number;
    rateLimitDuration?: number;
    enableAuth?: boolean;
    apiPrefix?: string;
}
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
    requestId: string;
}
export interface APIError {
    code: string;
    message: string;
    details?: any;
}
export declare class APIServer {
    private app;
    private server?;
    private logger;
    private options;
    private mjos;
    private rateLimiter?;
    constructor(mjos: MJOS, options?: APIServerOptions);
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private sendSuccess;
    private sendError;
    private generateRequestId;
    start(): Promise<void>;
    stop(): Promise<void>;
    getApp(): Express;
}
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}
//# sourceMappingURL=index.d.ts.map