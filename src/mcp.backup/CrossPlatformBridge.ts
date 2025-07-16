/**
 * Cross Platform Bridge
 * 跨平台桥接器
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, MJOSError } from './types/index';
import { MCPAdapter } from './MCPAdapter';

export interface PlatformConfig {
  name: string;
  type: PlatformType;
  endpoint?: string;
  apiKey?: string;
  capabilities: string[];
  metadata: Record<string, any>;
}

export type PlatformType = 
  | 'cursor' 
  | 'vscode' 
  | 'claude-desktop' 
  | 'chatgpt' 
  | 'copilot' 
  | 'custom';

export interface BridgeConnection {
  id: string;
  platform: PlatformConfig;
  status: ConnectionStatus;
  lastHeartbeat: Date;
  mcpAdapter: MCPAdapter;
  messageQueue: BridgeMessage[];
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface BridgeMessage {
  id: string;
  source: string;
  target: string;
  type: MessageType;
  payload: any;
  timestamp: Date;
  priority: MessagePriority;
}

export type MessageType = 
  | 'command' 
  | 'query' 
  | 'response' 
  | 'notification' 
  | 'heartbeat' 
  | 'sync';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SyncRequest {
  type: SyncType;
  resourceId: string;
  lastSyncTime?: Date;
  checksum?: string;
}

export type SyncType = 'memory' | 'config' | 'state' | 'full';

export interface SyncResponse {
  success: boolean;
  resourceId: string;
  data?: any;
  checksum: string;
  timestamp: Date;
  conflicts?: SyncConflict[];
}

export interface SyncConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
}

/**
 * 跨平台桥接器�? * 管理与不同AI编程环境的连接和数据同步
 */
export class CrossPlatformBridge {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private connections = new Map<string, BridgeConnection>();
  private messageHandlers = new Map<MessageType, (message: BridgeMessage) => Promise<void>>();
  private syncHandlers = new Map<SyncType, (request: SyncRequest) => Promise<SyncResponse>>();
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.setupMessageHandlers();
    this.setupSyncHandlers();
    this.setupEventListeners();
    this.startHeartbeat();
    
    this.logger.info('Cross Platform Bridge initialized');
  }

  /**
   * 注册平台连接
   */
  public async registerPlatform(config: PlatformConfig): Promise<string> {
    try {
      const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建MCP适配�?      const mcpAdapter = new MCPAdapter(this.logger, this.eventBus);
      await mcpAdapter.initialize();
      
      // 注册MJOS特定的工具和资源
      this.registerMJOSTools(mcpAdapter);
      this.registerMJOSPrompts(mcpAdapter);
      this.registerMJOSResources(mcpAdapter);
      
      const connection: BridgeConnection = {
        id: connectionId,
        platform: config,
        status: 'connecting',
        lastHeartbeat: new Date(),
        mcpAdapter,
        messageQueue: []
      };

      this.connections.set(connectionId, connection);

      this.logger.info('Platform registered', {
        connectionId,
        platformName: config.name,
        platformType: config.type
      });

      // 尝试建立连接
      await this.establishConnection(connectionId);

      this.eventBus.publishEvent('bridge.platform_registered', {
        connectionId,
        platform: config
      }, 'CrossPlatformBridge');

      return connectionId;

    } catch (error) {
      this.logger.error('Failed to register platform', {
        platformName: config.name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.createBridgeError(error, 'registerPlatform', { config });
    }
  }

  /**
   * 发送消�?   */
  public async sendMessage(
    connectionId: string,
    type: MessageType,
    payload: any,
    priority: MessagePriority = 'normal'
  ): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      const message: BridgeMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'mjos',
        target: connection.platform.name,
        type,
        payload,
        timestamp: new Date(),
        priority
      };

      if (connection.status === 'connected') {
        await this.deliverMessage(connection, message);
      } else {
        // 添加到消息队�?        connection.messageQueue.push(message);
        this.logger.debug('Message queued for delivery', {
          connectionId,
          messageId: message.id,
          type
        });
      }

      return true;

    } catch (error) {
      this.logger.error('Failed to send message', {
        connectionId,
        type,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 同步数据
   */
  public async syncData(
    connectionId: string,
    syncRequest: SyncRequest
  ): Promise<SyncResponse | null> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      this.logger.info('Starting data sync', {
        connectionId,
        syncType: syncRequest.type,
        resourceId: syncRequest.resourceId
      });

      const handler = this.syncHandlers.get(syncRequest.type);
      if (!handler) {
        throw new Error(`No sync handler for type: ${syncRequest.type}`);
      }

      const response = await handler(syncRequest);

      this.logger.info('Data sync completed', {
        connectionId,
        syncType: syncRequest.type,
        success: response.success,
        conflictCount: response.conflicts?.length || 0
      });

      this.eventBus.publishEvent('bridge.data_synced', {
        connectionId,
        syncRequest,
        syncResponse: response
      }, 'CrossPlatformBridge');

      return response;

    } catch (error) {
      this.logger.error('Data sync failed', {
        connectionId,
        syncRequest,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 获取连接状�?   */
  public getConnectionStatus(connectionId: string): ConnectionStatus | null {
    const connection = this.connections.get(connectionId);
    return connection ? connection.status : null;
  }

  /**
   * 获取所有连�?   */
  public getAllConnections(): Array<{
    id: string;
    platform: PlatformConfig;
    status: ConnectionStatus;
    lastHeartbeat: Date;
    queueSize: number;
  }> {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      platform: conn.platform,
      status: conn.status,
      lastHeartbeat: conn.lastHeartbeat,
      queueSize: conn.messageQueue.length
    }));
  }

  /**
   * 断开连接
   */
  public async disconnectPlatform(connectionId: string): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return true; // 已经不存�?      }

      connection.status = 'disconnected';
      this.connections.delete(connectionId);

      this.logger.info('Platform disconnected', {
        connectionId,
        platformName: connection.platform.name
      });

      this.eventBus.publishEvent('bridge.platform_disconnected', {
        connectionId,
        platform: connection.platform
      }, 'CrossPlatformBridge');

      return true;

    } catch (error) {
      this.logger.error('Failed to disconnect platform', {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 建立连接
   */
  private async establishConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)!;
    
    try {
      // 模拟连接建立过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      connection.status = 'connected';
      connection.lastHeartbeat = new Date();

      this.logger.info('Connection established', {
        connectionId,
        platformName: connection.platform.name
      });

      // 处理排队的消�?      await this.processMessageQueue(connection);

      this.eventBus.publishEvent('bridge.connection_established', {
        connectionId,
        platform: connection.platform
      }, 'CrossPlatformBridge');

    } catch (error) {
      connection.status = 'error';
      this.logger.error('Failed to establish connection', {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 处理消息队列
   */
  private async processMessageQueue(connection: BridgeConnection): Promise<void> {
    const messages = connection.messageQueue.splice(0); // 清空队列
    
    for (const message of messages) {
      try {
        await this.deliverMessage(connection, message);
      } catch (error) {
        this.logger.error('Failed to deliver queued message', {
          connectionId: connection.id,
          messageId: message.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * 投递消�?   */
  private async deliverMessage(connection: BridgeConnection, message: BridgeMessage): Promise<void> {
    // 通过MCP适配器发送消�?    await connection.mcpAdapter.sendNotification('mjos/message', {
      messageId: message.id,
      type: message.type,
      payload: message.payload,
      timestamp: message.timestamp,
      priority: message.priority
    });

    this.logger.debug('Message delivered', {
      connectionId: connection.id,
      messageId: message.id,
      type: message.type
    });
  }

  /**
   * 注册MJOS工具
   */
  private registerMJOSTools(mcpAdapter: MCPAdapter): void {
    // 团队激活工�?    mcpAdapter.registerTool({
      name: 'activate_team',
      description: 'Activate MJOS team with specified configuration',
      inputSchema: {
        type: 'object',
        properties: {
          teamConfig: {
            type: 'object',
            description: 'Team configuration object'
          }
        },
        required: ['teamConfig']
      }
    }, async (params) => {
      this.eventBus.publishEvent('mcp.tool.activate_team', params, 'CrossPlatformBridge');
      return { success: true, message: 'Team activation initiated' };
    });

    // 记忆查询工具
    mcpAdapter.registerTool({
      name: 'query_memory',
      description: 'Query MJOS memory system',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Memory query expression'
          },
          options: {
            type: 'object',
            description: 'Query options'
          }
        },
        required: ['query']
      }
    }, async (params) => {
      this.eventBus.publishEvent('mcp.tool.query_memory', params, 'CrossPlatformBridge');
      return { success: true, message: 'Memory query executed' };
    });

    // 工作流执行工�?    mcpAdapter.registerTool({
      name: 'execute_workflow',
      description: 'Execute MJOS workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'Workflow identifier'
          },
          context: {
            type: 'object',
            description: 'Execution context'
          }
        },
        required: ['workflowId']
      }
    }, async (params) => {
      this.eventBus.publishEvent('mcp.tool.execute_workflow', params, 'CrossPlatformBridge');
      return { success: true, message: 'Workflow execution initiated' };
    });
  }

  /**
   * 注册MJOS提示�?   */
  private registerMJOSPrompts(mcpAdapter: MCPAdapter): void {
    // 角色初始化提示词
    mcpAdapter.registerPrompt({
      name: 'role_initialization',
      description: 'Initialize MJOS role with context',
      arguments: [
        {
          name: 'roleId',
          description: 'Role identifier',
          required: true
        },
        {
          name: 'context',
          description: 'Initialization context',
          required: false
        }
      ]
    }, async (params) => {
      this.eventBus.publishEvent('mcp.prompt.role_initialization', params, 'CrossPlatformBridge');
      return {
        messages: [
          {
            role: 'system',
            content: `Initializing MJOS role: ${params.roleId}`
          }
        ]
      };
    });

    // 协作提示�?    mcpAdapter.registerPrompt({
      name: 'collaboration_prompt',
      description: 'Generate collaboration prompt for team work',
      arguments: [
        {
          name: 'participants',
          description: 'Collaboration participants',
          required: true
        },
        {
          name: 'objective',
          description: 'Collaboration objective',
          required: true
        }
      ]
    }, async (params) => {
      this.eventBus.publishEvent('mcp.prompt.collaboration', params, 'CrossPlatformBridge');
      return {
        messages: [
          {
            role: 'system',
            content: `Collaboration between ${params.participants.join(', ')} for: ${params.objective}`
          }
        ]
      };
    });
  }

  /**
   * 注册MJOS资源
   */
  private registerMJOSResources(mcpAdapter: MCPAdapter): void {
    // 团队配置资源
    mcpAdapter.registerResource({
      uri: 'mjos://team/config',
      name: 'Team Configuration',
      description: 'Current MJOS team configuration',
      mimeType: 'application/json'
    }, async (params) => {
      this.eventBus.publishEvent('mcp.resource.team_config', params, 'CrossPlatformBridge');
      return {
        contents: [
          {
            uri: 'mjos://team/config',
            mimeType: 'application/json',
            text: JSON.stringify({ message: 'Team configuration data' }, null, 2)
          }
        ]
      };
    });

    // 记忆状态资�?    mcpAdapter.registerResource({
      uri: 'mjos://memory/state',
      name: 'Memory State',
      description: 'Current MJOS memory system state',
      mimeType: 'application/json'
    }, async (params) => {
      this.eventBus.publishEvent('mcp.resource.memory_state', params, 'CrossPlatformBridge');
      return {
        contents: [
          {
            uri: 'mjos://memory/state',
            mimeType: 'application/json',
            text: JSON.stringify({ message: 'Memory state data' }, null, 2)
          }
        ]
      };
    });
  }

  /**
   * 设置消息处理�?   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set('command', async (message) => {
      this.logger.debug('Processing command message', {
        messageId: message.id,
        payload: message.payload
      });
      
      this.eventBus.publishEvent('bridge.command_received', {
        message
      }, 'CrossPlatformBridge');
    });

    this.messageHandlers.set('query', async (message) => {
      this.logger.debug('Processing query message', {
        messageId: message.id,
        payload: message.payload
      });
      
      this.eventBus.publishEvent('bridge.query_received', {
        message
      }, 'CrossPlatformBridge');
    });

    this.messageHandlers.set('heartbeat', async (message) => {
      const connection = Array.from(this.connections.values())
        .find(conn => conn.platform.name === message.source);
      
      if (connection) {
        connection.lastHeartbeat = new Date();
      }
    });
  }

  /**
   * 设置同步处理�?   */
  private setupSyncHandlers(): void {
    this.syncHandlers.set('memory', async (request) => {
      this.logger.info('Processing memory sync', { resourceId: request.resourceId });
      
      return {
        success: true,
        resourceId: request.resourceId,
        data: { message: 'Memory sync completed' },
        checksum: 'mock-checksum',
        timestamp: new Date(),
        conflicts: []
      };
    });

    this.syncHandlers.set('config', async (request) => {
      this.logger.info('Processing config sync', { resourceId: request.resourceId });
      
      return {
        success: true,
        resourceId: request.resourceId,
        data: { message: 'Config sync completed' },
        checksum: 'mock-checksum',
        timestamp: new Date(),
        conflicts: []
      };
    });

    this.syncHandlers.set('state', async (request) => {
      this.logger.info('Processing state sync', { resourceId: request.resourceId });
      
      return {
        success: true,
        resourceId: request.resourceId,
        data: { message: 'State sync completed' },
        checksum: 'mock-checksum',
        timestamp: new Date(),
        conflicts: []
      };
    });

    this.syncHandlers.set('full', async (request) => {
      this.logger.info('Processing full sync', { resourceId: request.resourceId });
      
      return {
        success: true,
        resourceId: request.resourceId,
        data: { message: 'Full sync completed' },
        checksum: 'mock-checksum',
        timestamp: new Date(),
        conflicts: []
      };
    });
  }

  /**
   * 启动心跳检�?   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkConnections();
    }, 30000); // �?0秒检查一�?
    this.logger.debug('Heartbeat timer started');
  }

  /**
   * 检查连接状�?   */
  private checkConnections(): void {
    const now = new Date();
    const timeout = 60000; // 60秒超�?
    for (const [connectionId, connection] of this.connections) {
      const timeSinceHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > timeout && connection.status === 'connected') {
        connection.status = 'disconnected';
        
        this.logger.warn('Connection timeout detected', {
          connectionId,
          platformName: connection.platform.name,
          timeSinceHeartbeat
        });

        this.eventBus.publishEvent('bridge.connection_timeout', {
          connectionId,
          platform: connection.platform
        }, 'CrossPlatformBridge');
      }
    }
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    // 监听MJOS内部事件并广播到所有连�?    this.eventBus.subscribeEvent('team.activated', (event) => {
      this.broadcastToAllConnections('notification', {
        type: 'team_activated',
        data: event.payload
      });
    });

    this.eventBus.subscribeEvent('memory.stored', (event) => {
      this.broadcastToAllConnections('notification', {
        type: 'memory_stored',
        data: event.payload
      });
    });

    this.eventBus.subscribeEvent('workflow.completed', (event) => {
      this.broadcastToAllConnections('notification', {
        type: 'workflow_completed',
        data: event.payload
      });
    });
  }

  /**
   * 广播消息到所有连�?   */
  private broadcastToAllConnections(type: MessageType, payload: any): void {
    for (const [connectionId, connection] of this.connections) {
      if (connection.status === 'connected') {
        this.sendMessage(connectionId, type, payload, 'normal');
      }
    }
  }

  /**
   * 创建桥接错误
   */
  private createBridgeError(error: unknown, operation: string, context: any): MJOSError {
    const message = error instanceof Error ? error.message : String(error);
    const bridgeError = new Error(`Cross Platform Bridge ${operation} failed: ${message}`) as MJOSError;
    
    bridgeError.code = 'BridgeError';
    bridgeError.component = 'CrossPlatformBridge';
    bridgeError.context = context;
    bridgeError.recoverable = true;
    bridgeError.timestamp = new Date();
    
    return bridgeError;
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    this.connections.clear();
    
    this.logger.info('Cross Platform Bridge destroyed');
  }
}
