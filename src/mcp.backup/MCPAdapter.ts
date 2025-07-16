/**
 * MCP Adapter
 * Model Context Protocol 适配�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, TeamConfig, MJOSError } from './types/index';

export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: MCPCapabilities;
}

export interface MCPCapabilities {
  logging?: LoggingCapability;
  prompts?: PromptsCapability;
  resources?: ResourcesCapability;
  tools?: ToolsCapability;
  sampling?: SamplingCapability;
}

export interface LoggingCapability {
  level?: 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';
}

export interface PromptsCapability {
  listChanged?: boolean;
}

export interface ResourcesCapability {
  subscribe?: boolean;
  listChanged?: boolean;
}

export interface ToolsCapability {
  listChanged?: boolean;
}

export interface SamplingCapability {}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP适配器类
 * 实现Model Context Protocol规范，提供与AI编程环境的标准化接口
 */
export class MCPAdapter {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private serverInfo: MCPServerInfo;
  private isInitialized = false;
  private requestHandlers = new Map<string, (params: any) => Promise<any>>();
  private notificationHandlers = new Map<string, (params: any) => Promise<void>>();

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.serverInfo = {
      name: 'MJOS-MCP-Server',
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      capabilities: {
        logging: { level: 'info' },
        prompts: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        tools: { listChanged: true },
        sampling: {}
      }
    };
    
    this.setupDefaultHandlers();
    this.setupEventListeners();
    
    this.logger.info('MCP Adapter initialized');
  }

  /**
   * 初始化MCP服务�?   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('MCP Adapter already initialized');
      return;
    }

    try {
      this.logger.info('Initializing MCP Server', {
        name: this.serverInfo.name,
        version: this.serverInfo.version,
        protocolVersion: this.serverInfo.protocolVersion
      });

      this.isInitialized = true;
      
      this.logger.info('MCP Server initialized successfully');

      this.eventBus.publishEvent('mcp.initialized', {
        serverInfo: this.serverInfo
      }, 'MCPAdapter');

    } catch (error) {
      const mcpError = this.createMCPError(error, 'initialize', {});
      this.logger.error('MCP Server initialization failed', { error: mcpError });
      throw mcpError;
    }
  }

  /**
   * 处理MCP请求
   */
  public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      this.logger.debug('Handling MCP request', {
        method: request.method,
        id: request.id
      });

      const handler = this.requestHandlers.get(request.method);
      if (!handler) {
        return this.createErrorResponse(
          request.id,
          -32601,
          `Method not found: ${request.method}`
        );
      }

      const result = await handler(request.params || {});
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };

    } catch (error) {
      this.logger.error('MCP request handling failed', {
        method: request.method,
        id: request.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createErrorResponse(
        request.id,
        -32603,
        'Internal error',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 处理MCP通知
   */
  public async handleNotification(notification: MCPNotification): Promise<void> {
    try {
      this.logger.debug('Handling MCP notification', {
        method: notification.method
      });

      const handler = this.notificationHandlers.get(notification.method);
      if (handler) {
        await handler(notification.params || {});
      } else {
        this.logger.warn('Unknown notification method', {
          method: notification.method
        });
      }

    } catch (error) {
      this.logger.error('MCP notification handling failed', {
        method: notification.method,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 发送通知
   */
  public async sendNotification(method: string, params?: any): Promise<void> {
    const notification: MCPNotification = {
      jsonrpc: '2.0',
      method,
      params
    };

    this.logger.debug('Sending MCP notification', {
      method,
      params
    });

    this.eventBus.publishEvent('mcp.notification_sent', {
      notification
    }, 'MCPAdapter');
  }

  /**
   * 注册工具
   */
  public registerTool(tool: MCPTool, handler: (params: any) => Promise<any>): void {
    this.requestHandlers.set(`tools/call/${tool.name}`, handler);
    
    this.logger.info('MCP tool registered', {
      toolName: tool.name,
      description: tool.description
    });

    // 通知工具列表变化
    this.sendNotification('notifications/tools/list_changed');
  }

  /**
   * 注册提示�?   */
  public registerPrompt(prompt: MCPPrompt, handler: (params: any) => Promise<any>): void {
    this.requestHandlers.set(`prompts/get/${prompt.name}`, handler);
    
    this.logger.info('MCP prompt registered', {
      promptName: prompt.name,
      description: prompt.description
    });

    // 通知提示词列表变�?    this.sendNotification('notifications/prompts/list_changed');
  }

  /**
   * 注册资源
   */
  public registerResource(resource: MCPResource, handler: (params: any) => Promise<any>): void {
    this.requestHandlers.set(`resources/read/${encodeURIComponent(resource.uri)}`, handler);
    
    this.logger.info('MCP resource registered', {
      resourceUri: resource.uri,
      resourceName: resource.name
    });

    // 通知资源列表变化
    this.sendNotification('notifications/resources/list_changed');
  }

  /**
   * 获取服务器信�?   */
  public getServerInfo(): MCPServerInfo {
    return { ...this.serverInfo };
  }

  /**
   * 设置默认处理�?   */
  private setupDefaultHandlers(): void {
    // 初始化处理器
    this.requestHandlers.set('initialize', async (params) => {
      return {
        protocolVersion: this.serverInfo.protocolVersion,
        capabilities: this.serverInfo.capabilities,
        serverInfo: {
          name: this.serverInfo.name,
          version: this.serverInfo.version
        }
      };
    });

    // 工具列表处理�?    this.requestHandlers.set('tools/list', async (params) => {
      return {
        tools: this.getRegisteredTools()
      };
    });

    // 提示词列表处理器
    this.requestHandlers.set('prompts/list', async (params) => {
      return {
        prompts: this.getRegisteredPrompts()
      };
    });

    // 资源列表处理�?    this.requestHandlers.set('resources/list', async (params) => {
      return {
        resources: this.getRegisteredResources()
      };
    });

    // 日志处理�?    this.notificationHandlers.set('notifications/message', async (params) => {
      const { level, logger, data } = params;
      this.logger.log(level, `MCP Client: ${logger}`, data);
    });

    this.logger.debug('Default MCP handlers setup completed');
  }

  /**
   * 获取已注册的工具
   */
  private getRegisteredTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    
    for (const [method, handler] of this.requestHandlers) {
      if (method.startsWith('tools/call/')) {
        const toolName = method.replace('tools/call/', '');
        tools.push({
          name: toolName,
          description: `MJOS tool: ${toolName}`,
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        });
      }
    }
    
    return tools;
  }

  /**
   * 获取已注册的提示�?   */
  private getRegisteredPrompts(): MCPPrompt[] {
    const prompts: MCPPrompt[] = [];
    
    for (const [method, handler] of this.requestHandlers) {
      if (method.startsWith('prompts/get/')) {
        const promptName = method.replace('prompts/get/', '');
        prompts.push({
          name: promptName,
          description: `MJOS prompt: ${promptName}`,
          arguments: []
        });
      }
    }
    
    return prompts;
  }

  /**
   * 获取已注册的资源
   */
  private getRegisteredResources(): MCPResource[] {
    const resources: MCPResource[] = [];
    
    for (const [method, handler] of this.requestHandlers) {
      if (method.startsWith('resources/read/')) {
        const encodedUri = method.replace('resources/read/', '');
        const uri = decodeURIComponent(encodedUri);
        resources.push({
          uri,
          name: `MJOS resource: ${uri}`,
          description: `MJOS managed resource`,
          mimeType: 'application/json'
        });
      }
    }
    
    return resources;
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(
    id: string | number,
    code: number,
    message: string,
    data?: any
  ): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听MJOS事件并转换为MCP通知
    this.eventBus.subscribeEvent('team.activated', (event) => {
      this.sendNotification('mjos/team/activated', event.payload);
    });

    this.eventBus.subscribeEvent('role.activated', (event) => {
      this.sendNotification('mjos/role/activated', event.payload);
    });

    this.eventBus.subscribeEvent('memory.stored', (event) => {
      this.sendNotification('mjos/memory/stored', event.payload);
    });

    this.eventBus.subscribeEvent('workflow.completed', (event) => {
      this.sendNotification('mjos/workflow/completed', event.payload);
    });

    this.eventBus.subscribeEvent('collaboration.started', (event) => {
      this.sendNotification('mjos/collaboration/started', event.payload);
    });
  }

  /**
   * 创建MCP错误
   */
  private createMCPError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const mcpError = new Error(`MCP ${operation} failed: ${message}`) as MJOSError;
    
    mcpError.code = 'MCPError';
    mcpError.component = 'MCPAdapter';
    mcpError.context = context;
    mcpError.recoverable = true;
    mcpError.timestamp = new Date();
    
    return mcpError;
  }
}
