/**
 * MCP Module Exports
 * Model Context Protocol 模块导出
 */

export { 
  MCPAdapter, 
  MCPServerInfo, 
  MCPCapabilities, 
  LoggingCapability, 
  PromptsCapability, 
  ResourcesCapability, 
  ToolsCapability, 
  SamplingCapability, 
  MCPRequest, 
  MCPResponse, 
  MCPError, 
  MCPNotification, 
  MCPTool, 
  MCPPrompt, 
  MCPResource 
} from './MCPAdapter';

export { 
  CrossPlatformBridge, 
  PlatformConfig, 
  PlatformType, 
  BridgeConnection, 
  ConnectionStatus, 
  BridgeMessage, 
  MessageType, 
  MessagePriority, 
  SyncRequest, 
  SyncType, 
  SyncResponse, 
  SyncConflict 
} from './CrossPlatformBridge';

export { 
  MemorySynchronizer, 
  SyncConfiguration, 
  ConflictResolution, 
  SyncScope, 
  RetryPolicy, 
  SyncEndpoint, 
  EndpointType, 
  EndpointStatus, 
  SyncCredentials, 
  SyncOperation, 
  SyncOperationType, 
  SyncOperationStatus, 
  SyncError, 
  SyncStatistics 
} from './MemorySynchronizer';

export { 
  IntegrationTester, 
  TestSuite, 
  TestCase, 
  TestCategory, 
  TestPriority, 
  TestResult, 
  TestStatus, 
  TestMetrics, 
  TestArtifact, 
  ArtifactType, 
  TestExecution, 
  ExecutionStatus, 
  TestSummary 
} from './IntegrationTester';

// 便捷函数
export { createMCPIntegration, MCPIntegration } from './MCPIntegration';

// 新的生产级MCP服务�?export { MJOSMCPServer } from './MJOSMCPServer';
export type { MJOSMCPServerConfig } from './MJOSMCPServer';
