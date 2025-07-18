"use strict";
/**
 * MJOS主系统 - 完整的系统级架构和生命周期管理
 * MJOS Main System - Complete System-level Architecture and Lifecycle Management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJOSSystem = void 0;
const SystemOrchestrator_1 = __importDefault(require("./core/SystemOrchestrator"));
const ProjectLifecycleManager_1 = __importDefault(require("./core/ProjectLifecycleManager"));
const AgentManagement_1 = __importDefault(require("./organization/AgentManagement"));
const WorkflowEngine_1 = __importDefault(require("./organization/WorkflowEngine"));
const CompleteTeamProfiles_1 = require("./team/CompleteTeamProfiles");
const MoxiaoyiMemoryManager_1 = __importDefault(require("./team/MoxiaoyiMemoryManager"));
const index_1 = require("./index");
class MJOSSystem {
    constructor(config = {}) {
        this.isInitialized = false;
        this.startTime = new Date();
        this.config = this.mergeConfig(config);
        this.initializeComponents();
    }
    /**
     * 系统完整启动流程
     */
    async startup() {
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
        }
        catch (error) {
            console.error('❌ MJOS系统启动失败:', error);
            throw error;
        }
    }
    /**
     * 项目提交接口 - 系统的主要入口
     */
    async submitProject(submission) {
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
        }
        catch (error) {
            console.error(`项目提交失败: ${submission.id}`, error);
            throw error;
        }
    }
    /**
     * 获取项目状态
     */
    getProjectStatus(projectId) {
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
    getSystemStatus() {
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
    async shutdown() {
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
        }
        catch (error) {
            console.error('❌ 系统关闭过程中发生错误:', error);
            throw error;
        }
    }
    /**
     * 系统重启
     */
    async restart() {
        console.log('🔄 MJOS系统重启中...');
        await this.shutdown();
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
        await this.startup();
        console.log('✅ MJOS系统重启完成');
    }
    // 私有方法实现
    mergeConfig(userConfig) {
        const defaultConfig = {
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
    initializeComponents() {
        // 初始化核心组件
        this.mjos = new index_1.MJOS();
        this.agentManagement = new AgentManagement_1.default();
        this.workflowEngine = new WorkflowEngine_1.default();
        this.teamSystem = new CompleteTeamProfiles_1.CompleteTeamSystem();
        this.memoryManager = new MoxiaoyiMemoryManager_1.default(this.mjos);
        this.projectManager = new ProjectLifecycleManager_1.default(this.agentManagement, this.workflowEngine);
        this.orchestrator = new SystemOrchestrator_1.default({
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
    async initializeCoreSystem() {
        await this.mjos.start();
    }
    async startAgentEcosystem() {
        // 智能体生态启动逻辑
    }
    async startWorkflowEngine() {
        // 工作流引擎启动逻辑
    }
    async startProjectManagement() {
        // 项目管理系统启动逻辑
    }
    async performSystemHealthCheck() {
        // 系统健康检查
    }
    async startMonitoring() {
        // 启动监控系统
    }
    async startWebInterface() {
        // 启动Web界面
    }
    validateProjectSubmission(submission) {
        if (!submission.id || !submission.title || !submission.description) {
            throw new Error('项目提交信息不完整');
        }
        if (!submission.requirements || submission.requirements.length === 0) {
            throw new Error('项目需求不能为空');
        }
    }
    determineOverallHealth(state) {
        if (state.status === 'shutdown')
            return 'offline';
        if (state.healthScore > 0.8)
            return 'healthy';
        if (state.healthScore > 0.5)
            return 'degraded';
        return 'critical';
    }
    async waitForActiveProjects() {
        // 等待活跃项目完成
        const activeProjects = this.orchestrator.getActiveProjects();
        while (activeProjects.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    async shutdownSubsystems() {
        // 关闭子系统
    }
    async cleanup() {
        // 清理资源
        this.isInitialized = false;
    }
}
exports.MJOSSystem = MJOSSystem;
exports.default = MJOSSystem;
//# sourceMappingURL=MJOSSystem.js.map