"use strict";
/**
 * MJOS REST API Server
 * 魔剑工作室操作系统REST API服务器
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const index_1 = require("../core/index");
class APIServer {
    constructor(mjos, options = {}) {
        this.mjos = mjos;
        this.options = {
            port: options.port || 3000,
            host: options.host || '0.0.0.0',
            enableCors: options.enableCors !== false,
            enableCompression: options.enableCompression !== false,
            enableRateLimit: options.enableRateLimit !== false,
            rateLimitPoints: options.rateLimitPoints || 100,
            rateLimitDuration: options.rateLimitDuration || 60,
            enableAuth: options.enableAuth || false,
            apiPrefix: options.apiPrefix || '/api/v1',
            ...options
        };
        this.logger = new index_1.Logger('APIServer');
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        // CORS
        if (this.options.enableCors) {
            this.app.use((0, cors_1.default)({
                origin: true,
                credentials: true
            }));
        }
        // Compression
        if (this.options.enableCompression) {
            this.app.use((0, compression_1.default)());
        }
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Rate limiting
        if (this.options.enableRateLimit) {
            this.rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
                points: this.options.rateLimitPoints,
                duration: this.options.rateLimitDuration
            });
            this.app.use(async (req, res, next) => {
                try {
                    if (this.rateLimiter) {
                        await this.rateLimiter.consume(req.ip || 'unknown');
                    }
                    next();
                }
                catch (rejRes) {
                    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
                    res.set('Retry-After', String(secs));
                    this.sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
                }
            });
        }
        // Request ID and logging
        this.app.use((req, res, next) => {
            req.requestId = this.generateRequestId();
            this.logger.debug(`${req.method} ${req.path}`, { requestId: req.requestId });
            next();
        });
    }
    setupRoutes() {
        const prefix = this.options.apiPrefix;
        // Health check
        this.app.get('/health', (req, res) => {
            this.sendSuccess(res, {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: this.mjos.getVersion()
            });
        });
        // System status
        this.app.get(`${prefix}/status`, (req, res) => {
            try {
                const status = this.mjos.getStatus();
                this.sendSuccess(res, status);
            }
            catch (error) {
                this.sendError(res, 'STATUS_ERROR', 'Failed to get system status', 500, error);
            }
        });
        // Memory endpoints
        this.app.post(`${prefix}/memory/store`, (req, res) => {
            try {
                const { content, tags = [], importance = 0.5, type } = req.body;
                const memoryId = this.mjos.getMemorySystem().store(content, tags, importance, type);
                this.sendSuccess(res, { memoryId }, 'Memory stored successfully');
            }
            catch (error) {
                this.sendError(res, 'MEMORY_STORE_ERROR', 'Failed to store memory', 500, error);
            }
        });
        this.app.post(`${prefix}/memory/query`, (req, res) => {
            try {
                const query = req.body;
                const results = this.mjos.getMemorySystem().query(query);
                this.sendSuccess(res, { results, count: results.length });
            }
            catch (error) {
                this.sendError(res, 'MEMORY_QUERY_ERROR', 'Failed to query memory', 500, error);
            }
        });
        this.app.get(`${prefix}/memory/:id`, (req, res) => {
            try {
                const memory = this.mjos.getMemorySystem().retrieve(req.params.id);
                if (memory) {
                    this.sendSuccess(res, memory);
                }
                else {
                    this.sendError(res, 'MEMORY_NOT_FOUND', 'Memory not found', 404);
                }
            }
            catch (error) {
                this.sendError(res, 'MEMORY_RETRIEVE_ERROR', 'Failed to retrieve memory', 500, error);
            }
        });
        // Knowledge endpoints
        this.app.post(`${prefix}/knowledge/add`, (req, res) => {
            try {
                const knowledgeData = req.body;
                const knowledgeId = this.mjos.getKnowledgeGraph().add(knowledgeData);
                this.sendSuccess(res, { knowledgeId }, 'Knowledge added successfully');
            }
            catch (error) {
                this.sendError(res, 'KNOWLEDGE_ADD_ERROR', 'Failed to add knowledge', 500, error);
            }
        });
        this.app.post(`${prefix}/knowledge/query`, (req, res) => {
            try {
                const query = req.body;
                const results = this.mjos.getKnowledgeGraph().query(query);
                this.sendSuccess(res, { results, count: results.length });
            }
            catch (error) {
                this.sendError(res, 'KNOWLEDGE_QUERY_ERROR', 'Failed to query knowledge', 500, error);
            }
        });
        // Context endpoints
        this.app.post(`${prefix}/context/sessions`, (req, res) => {
            try {
                const { userId } = req.body;
                const sessionId = this.mjos.getContextManager().createSession(userId);
                this.sendSuccess(res, { sessionId }, 'Session created successfully');
            }
            catch (error) {
                this.sendError(res, 'SESSION_CREATE_ERROR', 'Failed to create session', 500, error);
            }
        });
        this.app.get(`${prefix}/context/sessions/:id`, (req, res) => {
            try {
                const session = this.mjos.getContextManager().getSession(req.params.id);
                if (session) {
                    this.sendSuccess(res, session);
                }
                else {
                    this.sendError(res, 'SESSION_NOT_FOUND', 'Session not found', 404);
                }
            }
            catch (error) {
                this.sendError(res, 'SESSION_RETRIEVE_ERROR', 'Failed to retrieve session', 500, error);
            }
        });
        this.app.post(`${prefix}/context/sessions/:id/messages`, (req, res) => {
            try {
                const { role, content } = req.body;
                const success = this.mjos.getContextManager().addMessage(req.params.id, { role, content });
                if (success) {
                    this.sendSuccess(res, null, 'Message added successfully');
                }
                else {
                    this.sendError(res, 'SESSION_NOT_FOUND', 'Session not found', 404);
                }
            }
            catch (error) {
                this.sendError(res, 'MESSAGE_ADD_ERROR', 'Failed to add message', 500, error);
            }
        });
        // Reasoning endpoints
        this.app.post(`${prefix}/reasoning/reason`, async (req, res) => {
            try {
                const { type, input, context = {} } = req.body;
                const result = await this.mjos.reason(type, input, context);
                this.sendSuccess(res, result);
            }
            catch (error) {
                this.sendError(res, 'REASONING_ERROR', 'Failed to perform reasoning', 500, error);
            }
        });
        // Team endpoints
        this.app.get(`${prefix}/team/members`, (req, res) => {
            try {
                const members = this.mjos.getTeamManager().getAllMembers();
                this.sendSuccess(res, { members, count: members.length });
            }
            catch (error) {
                this.sendError(res, 'TEAM_MEMBERS_ERROR', 'Failed to get team members', 500, error);
            }
        });
        this.app.post(`${prefix}/team/tasks`, (req, res) => {
            try {
                const { title, description } = req.body;
                const taskId = this.mjos.createTask(title, description);
                this.sendSuccess(res, { taskId }, 'Task created successfully');
            }
            catch (error) {
                this.sendError(res, 'TASK_CREATE_ERROR', 'Failed to create task', 500, error);
            }
        });
        this.app.get(`${prefix}/team/tasks`, (req, res) => {
            try {
                const tasks = this.mjos.getTeamManager().getTasks();
                this.sendSuccess(res, { tasks, count: tasks.length });
            }
            catch (error) {
                this.sendError(res, 'TASKS_RETRIEVE_ERROR', 'Failed to retrieve tasks', 500, error);
            }
        });
        // Performance endpoints
        this.app.get(`${prefix}/performance/metrics`, (req, res) => {
            try {
                const metrics = this.mjos.getPerformanceMetrics();
                this.sendSuccess(res, metrics);
            }
            catch (error) {
                this.sendError(res, 'METRICS_ERROR', 'Failed to get performance metrics', 500, error);
            }
        });
        this.app.get(`${prefix}/performance/summary`, (req, res) => {
            try {
                const summary = this.mjos.getPerformanceSummary();
                this.sendSuccess(res, summary);
            }
            catch (error) {
                this.sendError(res, 'SUMMARY_ERROR', 'Failed to get performance summary', 500, error);
            }
        });
    }
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            this.sendError(res, 'NOT_FOUND', `Endpoint not found: ${req.method} ${req.path}`, 404);
        });
        // Global error handler
        this.app.use((error, req, res, _next) => {
            this.logger.error('Unhandled API error', error);
            this.sendError(res, 'INTERNAL_ERROR', 'Internal server error', 500, error);
        });
    }
    sendSuccess(res, data, message) {
        const response = {
            success: true,
            ...(data !== undefined ? { data } : {}),
            ...(message ? { message } : {}),
            timestamp: new Date().toISOString(),
            requestId: res.req.requestId
        };
        res.json(response);
    }
    sendError(res, code, message, status = 400, details) {
        const response = {
            success: false,
            error: code,
            message,
            timestamp: new Date().toISOString(),
            requestId: res.req.requestId
        };
        if (details && process.env.NODE_ENV === 'development') {
            response.data = { details: details.message || details };
        }
        res.status(status).json(response);
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Server lifecycle
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.options.port, this.options.host, () => {
                    this.logger.info(`API Server started on ${this.options.host}:${this.options.port}`);
                    resolve();
                });
                this.server.on('error', (error) => {
                    this.logger.error('API Server error', error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.logger.info('API Server stopped');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    getApp() {
        return this.app;
    }
}
exports.APIServer = APIServer;
//# sourceMappingURL=index.js.map