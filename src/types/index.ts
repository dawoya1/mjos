/**
 * MJOS Core Types
 * 魔剑工作室操作系统核心类型定义
 */

// ============================================================================
// 基础类型定义
// ============================================================================

export interface MJOSConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  logging: LoggingConfig;
  memory: MemoryConfig;
  team: TeamConfig;
  mcp: MCPConfig;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'simple';
  outputs: ('console' | 'file')[];
  file?: {
    path: string;
    maxSize: string;
    maxFiles: number;
  };
}

export interface MemoryConfig {
  persistent: boolean;
  storage: 'memory' | 'file' | 'database';
  maxSize: number;
  ttl: number;
}

// ============================================================================
// 团队协作类型
// ============================================================================

export interface TeamConfig {
  name: string;
  description: string;
  roles: RoleConfig[];
  collaborationRules: CollaborationRule[];
  workflows: WorkflowConfig[];
}

export interface RoleConfig {
  id: string;
  name: string;
  type: RoleType;
  capabilities: string[];
  priority: number;
  initialState: string;
  memoryAccess: MemoryAccessLevel;
}

export type RoleType = 
  | 'architect' 
  | 'designer' 
  | 'developer' 
  | 'tester' 
  | 'product-manager' 
  | 'devops' 
  | 'specialist';

export type MemoryAccessLevel = 'private' | 'shared' | 'project' | 'global';

export interface CollaborationRule {
  type: 'handoff' | 'parallel' | 'review' | 'approval';
  from: string | string[];
  to: string | string[];
  condition?: string;
  timeout?: number;
}

export interface WorkflowConfig {
  name: string;
  description: string;
  phases: WorkflowPhase[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowPhase {
  name: string;
  owner: string;
  collaborators: string[];
  deliverables: string[];
  duration?: number;
  dependencies?: string[];
}

export interface WorkflowTrigger {
  event: string;
  condition: string;
  action: string;
}

// ============================================================================
// 状态管理类�?// ============================================================================

export interface TeamState {
  id: string;
  name: string;
  description: string;
  activeRoles: string[];
  collaborationMode: CollaborationMode;
  currentPhase?: string;
  progress: number;
  metadata: Record<string, any>;
}

export type CollaborationMode = 
  | 'idle' 
  | 'planning' 
  | 'development' 
  | 'collaboration' 
  | 'review' 
  | 'deployment';

export interface StateTransition {
  from: string;
  to: string;
  trigger: string;
  condition?: (context: any) => boolean;
  action?: (context: any) => void;
}

export interface StateContext {
  sessionId: string;
  userId?: string;
  projectId?: string;
  teamId: string;
  currentState: string;
  previousState?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

// ============================================================================
// 记忆系统类型
// ============================================================================

export interface MemoryEntry {
  id: string;
  type: MemoryEntryType;
  content: any;
  metadata: MemoryMetadata;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export type MemoryEntryType =
  | 'conversation'
  | 'project'
  | 'team'
  | 'role'
  | 'workflow'
  | 'insight'
  | 'lesson';

export interface MemoryMetadata {
  source: string;
  tags: string[];
  importance: number;
  accessLevel: MemoryAccessLevel;
  relatedEntries: string[];
}

// ============================================================================
// 事件系统类型
// ============================================================================

export interface MJOSEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface MJOSEventHandler {
  id: string;
  eventType: string;
  handler: (event: MJOSEvent) => void | Promise<void>;
  priority: number;
  once?: boolean;
}

// ============================================================================
// MCP集成类型
// ============================================================================

export interface MCPConfig {
  enabled: boolean;
  serverName: string;
  version: string;
  capabilities: MCPCapabilities;
  tools: MCPTool[];
  resources: MCPResource[];
}

export interface MCPCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any) => Promise<any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: () => Promise<string>;
}

// ============================================================================
// 错误处理类型
// ============================================================================

export interface MJOSError extends Error {
  code: string;
  component: string;
  context?: any;
  recoverable: boolean;
  timestamp: Date;
}

export interface ErrorRecoveryStrategy {
  errorCode: string;
  strategy: (error: MJOSError, context: any) => Promise<any>;
  maxRetries: number;
  backoffMs: number;
}

// ============================================================================
// 响应类型
// ============================================================================

export interface MJOSResponse<T = any> {
  success: boolean;
  data?: T;
  error?: MJOSError;
  metadata: {
    timestamp: Date;
    duration: number;
    component: string;
    version: string;
  };
}

export interface TeamCollaborationResponse {
  teamState: TeamState;
  roleStates: Record<string, any>;
  executionResult: {
    teamOutput: any;
    individualContributions: Record<string, any>;
    collaborationInsights: string[];
    qualityMetrics: Record<string, number>;
  };
  nextActions: {
    teamActions: string[];
    roleActions: Record<string, string[]>;
    recommendedWorkflow: string;
  };
  memoryUpdates: {
    newInsights: string[];
    lessonsLearned: string[];
    experienceAccumulated: Record<string, any>;
  };
  navigation: {
    currentPath: string[];
    possiblePaths: string[];
    recommendedNext: string;
  };
}

// ============================================================================
// 工具类型
// ============================================================================

// ============================================================================
// 新架构类型定义 - Knowledge Layer
// ============================================================================

export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  content: any;
  metadata: KnowledgeMetadata;
  relationships: KnowledgeRelationship[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeType =
  | 'concept'
  | 'fact'
  | 'rule'
  | 'pattern'
  | 'procedure'
  | 'experience';

export interface KnowledgeMetadata {
  source: string;
  confidence: number; // 0-1
  importance: number; // 0-1
  tags: string[];
  domain: string;
  version: number;
}

export interface KnowledgeRelationship {
  type: RelationshipType;
  targetId: string;
  strength: number; // 0-1
  metadata?: Record<string, any>;
}

export type RelationshipType =
  | 'is-a'
  | 'part-of'
  | 'related-to'
  | 'causes'
  | 'enables'
  | 'conflicts-with';

// ============================================================================
// Context Layer Types
// ============================================================================

export interface ContextSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  state: ContextState;
  metadata: Record<string, any>;
}

export interface ContextState {
  currentTask?: string;
  activeRoles: string[];
  workingMemory: Record<string, any>;
  conversationHistory: ContextMessage[];
  sharedContext: Record<string, any>;
}

export interface ContextMessage {
  id: string;
  role: string;
  content: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// Reasoning Layer Types
// ============================================================================

export interface ReasoningRequest {
  id: string;
  type: ReasoningType;
  input: any;
  context: Record<string, any>;
  constraints?: ReasoningConstraint[];
  timeout?: number;
}

export type ReasoningType =
  | 'deductive'
  | 'inductive'
  | 'abductive'
  | 'analogical'
  | 'causal'
  | 'probabilistic';

export interface ReasoningConstraint {
  type: string;
  value: any;
  priority: number;
}

export interface ReasoningResult {
  id: string;
  requestId: string;
  conclusion: any;
  confidence: number;
  reasoning: ReasoningStep[];
  alternatives?: ReasoningAlternative[];
  metadata: Record<string, any>;
}

export interface ReasoningStep {
  step: number;
  type: string;
  input: any;
  output: any;
  rule?: string;
  confidence: number;
}

export interface ReasoningAlternative {
  conclusion: any;
  confidence: number;
  reasoning: ReasoningStep[];
}

// ============================================================================
// Agent Layer Types
// ============================================================================

export interface AgentDefinition {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  configuration: AgentConfiguration;
  state: AgentState;
}

export type AgentType =
  | 'reactive'
  | 'deliberative'
  | 'hybrid'
  | 'learning'
  | 'collaborative';

export interface AgentCapability {
  name: string;
  type: CapabilityType;
  parameters: Record<string, any>;
  constraints?: Record<string, any>;
}

export type CapabilityType =
  | 'perception'
  | 'reasoning'
  | 'planning'
  | 'execution'
  | 'communication'
  | 'learning';

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  memoryLimit: number;
  learningRate?: number;
  collaborationMode: CollaborationMode;
  preferences: Record<string, any>;
}

export interface AgentState {
  status: AgentStatus;
  currentTasks: string[];
  performance: AgentPerformance;
  lastActivity: Date;
  metadata: Record<string, any>;
}

export type AgentStatus =
  | 'idle'
  | 'active'
  | 'busy'
  | 'learning'
  | 'error'
  | 'offline';

export interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  qualityScore: number;
  collaborationScore: number;
}

// ============================================================================
// Communication Layer Types
// ============================================================================

export interface Message {
  id: string;
  from: string;
  to: string | string[];
  type: MessageType;
  content: any;
  priority: MessagePriority;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type MessageType =
  | 'request'
  | 'response'
  | 'notification'
  | 'broadcast'
  | 'query'
  | 'command';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CommunicationProtocol {
  name: string;
  version: string;
  messageTypes: MessageType[];
  rules: ProtocolRule[];
  security: SecuritySettings;
}

export interface ProtocolRule {
  condition: string;
  action: string;
  priority: number;
}

export interface SecuritySettings {
  encryption: boolean;
  authentication: boolean;
  authorization: boolean;
  auditLog: boolean;
}

// ============================================================================
// 工具类型
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Callback<T = void> = (error?: Error, result?: T) => void;

export type AsyncCallback<T = void> = (error?: Error, result?: T) => Promise<void>;

export type EventHandler<T = any> = (event: T) => void | Promise<void>;
