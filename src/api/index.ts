/**
 * MJOS REST API Server
 * 魔剑工作室操作系统REST API服务器
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Logger } from '../core/index';
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

export class APIServer {
  private app: Express;
  private server?: any;
  private logger: Logger;
  private options: APIServerOptions;
  private mjos: MJOS;
  private rateLimiter?: RateLimiterMemory;

  constructor(mjos: MJOS, options: APIServerOptions = {}) {
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

    this.logger = new Logger('APIServer');
    this.app = express();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    if (this.options.enableCors) {
      this.app.use(cors({
        origin: true,
        credentials: true
      }));
    }

    // Compression
    if (this.options.enableCompression) {
      this.app.use(compression());
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    if (this.options.enableRateLimit) {
      this.rateLimiter = new RateLimiterMemory({
        points: this.options.rateLimitPoints!,
        duration: this.options.rateLimitDuration!
      });

      this.app.use(async (req: Request, res: Response, next: NextFunction) => {
        try {
          if (this.rateLimiter) {
            await this.rateLimiter.consume(req.ip || 'unknown');
          }
          next();
        } catch (rejRes: any) {
          const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
          res.set('Retry-After', String(secs));
          this.sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests', 429);
        }
      });
    }

    // Request ID and logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.requestId = this.generateRequestId();
      this.logger.debug(`${req.method} ${req.path}`, { requestId: req.requestId });
      next();
    });
  }

  private setupRoutes(): void {
    const prefix = this.options.apiPrefix!;

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      this.sendSuccess(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: this.mjos.getVersion()
      });
    });

    // System status
    this.app.get(`${prefix}/status`, (req: Request, res: Response) => {
      try {
        const status = this.mjos.getStatus();
        this.sendSuccess(res, status);
      } catch (error) {
        this.sendError(res, 'STATUS_ERROR', 'Failed to get system status', 500, error);
      }
    });

    // Memory endpoints
    this.app.post(`${prefix}/memory/store`, (req: Request, res: Response) => {
      try {
        const { content, tags = [], importance = 0.5, type } = req.body;
        const memoryId = this.mjos.getMemorySystem().store(content, tags, importance, type);
        this.sendSuccess(res, { memoryId }, 'Memory stored successfully');
      } catch (error) {
        this.sendError(res, 'MEMORY_STORE_ERROR', 'Failed to store memory', 500, error);
      }
    });

    this.app.post(`${prefix}/memory/query`, (req: Request, res: Response) => {
      try {
        const query = req.body;
        const results = this.mjos.getMemorySystem().query(query);
        this.sendSuccess(res, { results, count: results.length });
      } catch (error) {
        this.sendError(res, 'MEMORY_QUERY_ERROR', 'Failed to query memory', 500, error);
      }
    });

    this.app.get(`${prefix}/memory/:id`, (req: Request, res: Response) => {
      try {
        const memory = this.mjos.getMemorySystem().retrieve(req.params.id!);
        if (memory) {
          this.sendSuccess(res, memory);
        } else {
          this.sendError(res, 'MEMORY_NOT_FOUND', 'Memory not found', 404);
        }
      } catch (error) {
        this.sendError(res, 'MEMORY_RETRIEVE_ERROR', 'Failed to retrieve memory', 500, error);
      }
    });

    // Knowledge endpoints
    this.app.post(`${prefix}/knowledge/add`, (req: Request, res: Response) => {
      try {
        const knowledgeData = req.body;
        const knowledgeId = this.mjos.getKnowledgeGraph().add(knowledgeData);
        this.sendSuccess(res, { knowledgeId }, 'Knowledge added successfully');
      } catch (error) {
        this.sendError(res, 'KNOWLEDGE_ADD_ERROR', 'Failed to add knowledge', 500, error);
      }
    });

    this.app.post(`${prefix}/knowledge/query`, (req: Request, res: Response) => {
      try {
        const query = req.body;
        const results = this.mjos.getKnowledgeGraph().query(query);
        this.sendSuccess(res, { results, count: results.length });
      } catch (error) {
        this.sendError(res, 'KNOWLEDGE_QUERY_ERROR', 'Failed to query knowledge', 500, error);
      }
    });

    // Context endpoints
    this.app.post(`${prefix}/context/sessions`, (req: Request, res: Response) => {
      try {
        const { userId } = req.body;
        const sessionId = this.mjos.getContextManager().createSession(userId);
        this.sendSuccess(res, { sessionId }, 'Session created successfully');
      } catch (error) {
        this.sendError(res, 'SESSION_CREATE_ERROR', 'Failed to create session', 500, error);
      }
    });

    this.app.get(`${prefix}/context/sessions/:id`, (req: Request, res: Response) => {
      try {
        const session = this.mjos.getContextManager().getSession(req.params.id!);
        if (session) {
          this.sendSuccess(res, session);
        } else {
          this.sendError(res, 'SESSION_NOT_FOUND', 'Session not found', 404);
        }
      } catch (error) {
        this.sendError(res, 'SESSION_RETRIEVE_ERROR', 'Failed to retrieve session', 500, error);
      }
    });

    this.app.post(`${prefix}/context/sessions/:id/messages`, (req: Request, res: Response) => {
      try {
        const { role, content } = req.body;
        const success = this.mjos.getContextManager().addMessage(req.params.id!, { role, content });
        if (success) {
          this.sendSuccess(res, null, 'Message added successfully');
        } else {
          this.sendError(res, 'SESSION_NOT_FOUND', 'Session not found', 404);
        }
      } catch (error) {
        this.sendError(res, 'MESSAGE_ADD_ERROR', 'Failed to add message', 500, error);
      }
    });

    // Reasoning endpoints
    this.app.post(`${prefix}/reasoning/reason`, async (req: Request, res: Response) => {
      try {
        const { type, input, context = {} } = req.body;
        const result = await this.mjos.reason(type, input, context);
        this.sendSuccess(res, result);
      } catch (error) {
        this.sendError(res, 'REASONING_ERROR', 'Failed to perform reasoning', 500, error);
      }
    });

    // Team endpoints
    this.app.get(`${prefix}/team/members`, (req: Request, res: Response) => {
      try {
        const members = this.mjos.getTeamManager().getAllMembers();
        this.sendSuccess(res, { members, count: members.length });
      } catch (error) {
        this.sendError(res, 'TEAM_MEMBERS_ERROR', 'Failed to get team members', 500, error);
      }
    });

    this.app.post(`${prefix}/team/tasks`, (req: Request, res: Response) => {
      try {
        const { title, description } = req.body;
        const taskId = this.mjos.createTask(title, description);
        this.sendSuccess(res, { taskId }, 'Task created successfully');
      } catch (error) {
        this.sendError(res, 'TASK_CREATE_ERROR', 'Failed to create task', 500, error);
      }
    });

    this.app.get(`${prefix}/team/tasks`, (req: Request, res: Response) => {
      try {
        const tasks = this.mjos.getTeamManager().getTasks();
        this.sendSuccess(res, { tasks, count: tasks.length });
      } catch (error) {
        this.sendError(res, 'TASKS_RETRIEVE_ERROR', 'Failed to retrieve tasks', 500, error);
      }
    });

    // Performance endpoints
    this.app.get(`${prefix}/performance/metrics`, (req: Request, res: Response) => {
      try {
        const metrics = this.mjos.getPerformanceMetrics();
        this.sendSuccess(res, metrics);
      } catch (error) {
        this.sendError(res, 'METRICS_ERROR', 'Failed to get performance metrics', 500, error);
      }
    });

    this.app.get(`${prefix}/performance/summary`, (req: Request, res: Response) => {
      try {
        const summary = this.mjos.getPerformanceSummary();
        this.sendSuccess(res, summary);
      } catch (error) {
        this.sendError(res, 'SUMMARY_ERROR', 'Failed to get performance summary', 500, error);
      }
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      this.sendError(res, 'NOT_FOUND', `Endpoint not found: ${req.method} ${req.path}`, 404);
    });

    // Global error handler
    this.app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
      this.logger.error('Unhandled API error', error);
      this.sendError(res, 'INTERNAL_ERROR', 'Internal server error', 500, error);
    });
  }

  private sendSuccess<T>(res: Response, data?: T, message?: string): void {
    const response: APIResponse<T> = {
      success: true,
      ...(data !== undefined ? { data } : {}),
      ...(message ? { message } : {}),
      timestamp: new Date().toISOString(),
      requestId: (res.req as any).requestId
    };
    res.json(response);
  }

  private sendError(res: Response, code: string, message: string, status: number = 400, details?: any): void {
    const response: APIResponse = {
      success: false,
      error: code,
      message,
      timestamp: new Date().toISOString(),
      requestId: (res.req as any).requestId
    };

    if (details && process.env.NODE_ENV === 'development') {
      response.data = { details: details.message || details };
    }

    res.status(status).json(response);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Server lifecycle
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.options.port!, this.options.host!, () => {
          this.logger.info(`API Server started on ${this.options.host}:${this.options.port}`);
          resolve();
        });

        this.server.on('error', (error: any) => {
          this.logger.error('API Server error', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getApp(): Express {
    return this.app;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}
