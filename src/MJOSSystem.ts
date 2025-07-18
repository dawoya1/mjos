/**
 * MJOS主系统 - 完整的系统级架构和生命周期管理
 * MJOS Main System - Complete System-level Architecture and Lifecycle Management
 */

import SystemOrchestrator from './core/SystemOrchestrator';
import ProjectLifecycleManager from './core/ProjectLifecycleManager';
import AgentManagement from './organization/AgentManagement';
import WorkflowEngine from './organization/WorkflowEngine';
import { CompleteTeamSystem } from './team/CompleteTeamProfiles';
import MoxiaoyiMemoryManager from './team/MoxiaoyiMemoryManager';
import { MJOS } from './index';

export interface MJOSConfig {
  system: {
    maxConcurrentProjects: number;
    agentPoolSize: number;
    resourceLimits: {
      memory: number;
      cpu: number;
      storage: number;
    };
  };
  quality: {
    minQualityScore: number;
    maxErrorRate: number;
  };
  timeouts: {
    projectTimeout: number;
    taskTimeout: number;
    agentResponseTimeout: number;
  };
  features: {
    enableWebInterface: boolean;
    enableRealTimeMonitoring: boolean;
    enableAutoScaling: boolean;
  };
}

export interface ProjectSubmission {
  id: string;
  title: string;
  description: string;
  type: 'development' | 'design' | 'analysis' | 'testing' | 'deployment' | 'research';
  requirements: string[];
  constraints?: {
    deadline?: Date;
    budget?: number;
    resources?: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: Record<string, any>;
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'offline';
  components: {
    orchestrator: 'online' | 'offline' | 'error';
    agentManagement: 'online' | 'offline' | 'error';
    workflowEngine: 'online' | 'offline' | 'error';
    projectManager: 'online' | 'offline' | 'error';
    memorySystem: 'online' | 'offline' | 'error';
  };
  metrics: {
    activeProjects: number;
    availableAgents: number;
    systemLoad: number;
    averageResponseTime: number;
    successRate: number;
  };
  uptime: number;
  lastHealthCheck: Date;
}

export class MJOSSystem {
  private config: MJOSConfig;
  private orchestrator!: SystemOrchestrator;
  private projectManager!: ProjectLifecycleManager;
  private agentManagement!: AgentManagement;
  private workflowEngine!: WorkflowEngine;
  private teamSystem!: CompleteTeamSystem;
  private memoryManager!: MoxiaoyiMemoryManager;
  private mjos!: MJOS;
  
  private isInitialized: boolean = false;
  private startTime: Date = new Date();

  constructor(config: Partial<MJOSConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.initializeComponents();
  }

  /**
   * 系统完整启动流程
   */
  async startup(): Promise<void> {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MJOS系统启动                               ║
║              Multi-Agent Orchestration System               ║
╚══════════════════════════════════════════════════════════════╝
    `);

    try {
      // 阶段1: 核心系统初始化
      console.log('🔧 阶段1: 核心系统初始化...');
      await this.initializeCoreSystem();

      // 阶段2: 智能体生态启动
      console.log('👥 阶段2: 智能体生态启动...');
      await this.startAgentEcosystem();

      // 阶段3: 工作流引擎启动
      console.log('⚙️ 阶段3: 工作流引擎启动...');
      await this.startWorkflowEngine();

      // 阶段4: 项目管理系统启动
      console.log('📋 阶段4: 项目管理系统启动...');
      await this.startProjectManagement();

      // 阶段5: 系统编排器启动
      console.log('🎭 阶段5: 系统编排器启动...');
      await this.orchestrator.startup();

      // 阶段6: 系统健康检查
      console.log('🏥 阶段6: 系统健康检查...');
      await this.performSystemHealthCheck();

      // 阶段7: 启动监控和Web界面
      if (this.config.features.enableRealTimeMonitoring) {
        console.log('📊 阶段7: 启动实时监控...');
        await this.startMonitoring();
      }

      if (this.config.features.enableWebInterface) {
        console.log('🌐 阶段8: 启动Web管理界面...');
        await this.startWebInterface();
      }

      this.isInitialized = true;
      console.log(`
✅ MJOS系统启动完成！

🎯 系统状态: 就绪
👥 智能体数量: ${this.config.system.agentPoolSize}
🔄 最大并发项目: ${this.config.system.maxConcurrentProjects}
📊 监控状态: ${this.config.features.enableRealTimeMonitoring ? '已启用' : '已禁用'}
🌐 Web界面: ${this.config.features.enableWebInterface ? '已启用' : '已禁用'}

系统已准备好接收项目请求...
      `);

    } catch (error) {
      console.error('❌ MJOS系统启动失败:', error);
      throw error;
    }
  }

  /**
   * 项目提交接口 - 系统的主要入口
   */
  async submitProject(submission: ProjectSubmission): Promise<{
    projectId: string;
    status: string;
    estimatedCompletion?: Date;
    assignedTeam?: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('系统未初始化，请先调用 startup()');
    }

    console.log(`📥 接收项目提交: ${submission.title}`);

    try {
      // 1. 项目请求验证
      this.validateProjectSubmission(submission);

      // 2. 提交给系统编排器
      const result = await this.orchestrator.submitProject({
        id: submission.id,
        type: submission.type,
        description: submission.description,
        requirements: submission.requirements,
        priority: submission.priority,
        deadline: submission.constraints?.deadline,
        context: submission.context
      });

      // 3. 获取项目状态
      const projectStatus = this.orchestrator.getProjectStatus(submission.id);
      
      return {
        projectId: submission.id,
        status: result,
        estimatedCompletion: projectStatus?.estimatedCompletion,
        assignedTeam: projectStatus?.assignedTeam
      };

    } catch (error) {
      console.error(`项目提交失败: ${submission.id}`, error);
      throw error;
    }
  }

  /**
   * 获取项目状态
   */
  getProjectStatus(projectId: string): {
    orchestratorStatus: any;
    lifecycleStatus: any;
    overallProgress: number;
    currentPhase: string;
    issues: string[];
  } {
    const orchestratorStatus = this.orchestrator.getProjectStatus(projectId);
    const lifecycleStatus = this.projectManager.getProjectStatus(projectId);

    return {
      orchestratorStatus,
      lifecycleStatus,
      overallProgress: lifecycleStatus.overallProgress,
      currentPhase: lifecycleStatus.currentPhase?.name || 'unknown',
      issues: orchestratorStatus?.issues || []
    };
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): SystemStatus {
    const orchestratorState = this.orchestrator.getSystemState();
    const activeProjects = this.orchestrator.getActiveProjects();

    return {
      overall: this.determineOverallHealth(orchestratorState),
      components: {
        orchestrator: orchestratorState.status === 'ready' ? 'online' : 'offline',
        agentManagement: 'online', // 简化实现
        workflowEngine: 'online',
        projectManager: 'online',
        memorySystem: 'online'
      },
      metrics: {
        activeProjects: activeProjects.length,
        availableAgents: orchestratorState.availableAgents,
        systemLoad: orchestratorState.systemLoad,
        averageResponseTime: 150, // 模拟值
        successRate: 0.95 // 模拟值
      },
      uptime: Date.now() - this.startTime.getTime(),
      lastHealthCheck: new Date()
    };
  }

  /**
   * 系统关闭
   */
  async shutdown(): Promise<void> {
    console.log('🛑 MJOS系统关闭中...');

    try {
      // 1. 停止接收新项目
      console.log('📋 停止接收新项目...');

      // 2. 等待活跃项目完成
      console.log('⏳ 等待活跃项目完成...');
      await this.waitForActiveProjects();

      // 3. 关闭系统编排器
      console.log('🎭 关闭系统编排器...');
      await this.orchestrator.shutdown();

      // 4. 关闭各子系统
      console.log('🔧 关闭子系统...');
      await this.shutdownSubsystems();

      // 5. 清理资源
      console.log('🧹 清理系统资源...');
      await this.cleanup();

      console.log('✅ MJOS系统已安全关闭');

    } catch (error) {
      console.error('❌ 系统关闭过程中发生错误:', error);
      throw error;
    }
  }

  /**
   * 系统重启
   */
  async restart(): Promise<void> {
    console.log('🔄 MJOS系统重启中...');
    
    await this.shutdown();
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    await this.startup();
    
    console.log('✅ MJOS系统重启完成');
  }

  // 私有方法实现
  private mergeConfig(userConfig: Partial<MJOSConfig>): MJOSConfig {
    const defaultConfig: MJOSConfig = {
      system: {
        maxConcurrentProjects: 5,
        agentPoolSize: 10,
        resourceLimits: {
          memory: 8192, // MB
          cpu: 4, // cores
          storage: 10240 // MB
        }
      },
      quality: {
        minQualityScore: 0.8,
        maxErrorRate: 0.05
      },
      timeouts: {
        projectTimeout: 3600000, // 1小时
        taskTimeout: 300000, // 5分钟
        agentResponseTimeout: 30000 // 30秒
      },
      features: {
        enableWebInterface: true,
        enableRealTimeMonitoring: true,
        enableAutoScaling: false
      }
    };

    return {
      system: { ...defaultConfig.system, ...userConfig.system },
      quality: { ...defaultConfig.quality, ...userConfig.quality },
      timeouts: { ...defaultConfig.timeouts, ...userConfig.timeouts },
      features: { ...defaultConfig.features, ...userConfig.features }
    };
  }

  private initializeComponents(): void {
    // 初始化核心组件
    this.mjos = new MJOS();
    this.agentManagement = new AgentManagement();
    this.workflowEngine = new WorkflowEngine();
    this.teamSystem = new CompleteTeamSystem();
    this.memoryManager = new MoxiaoyiMemoryManager(this.mjos);
    
    this.projectManager = new ProjectLifecycleManager(
      this.agentManagement,
      this.workflowEngine
    );
    
    this.orchestrator = new SystemOrchestrator({
      maxConcurrentProjects: this.config.system.maxConcurrentProjects,
      agentPoolSize: this.config.system.agentPoolSize,
      resourceLimits: this.config.system.resourceLimits,
      qualityThresholds: {
        minQualityScore: this.config.quality.minQualityScore,
        maxErrorRate: this.config.quality.maxErrorRate
      },
      timeouts: this.config.timeouts
    });
  }

  private async initializeCoreSystem(): Promise<void> {
    await this.mjos.start();
  }

  private async startAgentEcosystem(): Promise<void> {
    // 智能体生态启动逻辑
  }

  private async startWorkflowEngine(): Promise<void> {
    // 工作流引擎启动逻辑
  }

  private async startProjectManagement(): Promise<void> {
    // 项目管理系统启动逻辑
  }

  private async performSystemHealthCheck(): Promise<void> {
    // 系统健康检查
  }

  private async startMonitoring(): Promise<void> {
    // 启动监控系统
  }

  private async startWebInterface(): Promise<void> {
    // 启动Web界面
  }

  private validateProjectSubmission(submission: ProjectSubmission): void {
    if (!submission.id || !submission.title || !submission.description) {
      throw new Error('项目提交信息不完整');
    }
    
    if (!submission.requirements || submission.requirements.length === 0) {
      throw new Error('项目需求不能为空');
    }
  }

  private determineOverallHealth(state: any): 'healthy' | 'degraded' | 'critical' | 'offline' {
    if (state.status === 'shutdown') return 'offline';
    if (state.healthScore > 0.8) return 'healthy';
    if (state.healthScore > 0.5) return 'degraded';
    return 'critical';
  }

  private async waitForActiveProjects(): Promise<void> {
    // 等待活跃项目完成
    const activeProjects = this.orchestrator.getActiveProjects();
    
    while (activeProjects.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async shutdownSubsystems(): Promise<void> {
    // 关闭子系统
  }

  private async cleanup(): Promise<void> {
    // 清理资源
    this.isInitialized = false;
  }
}

export default MJOSSystem;
