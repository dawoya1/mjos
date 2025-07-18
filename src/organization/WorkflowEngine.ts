/**
 * MJOS工作流引擎 - 仿公司标准操作程序（SOP）
 * Workflow Engine - Mimicking Company Standard Operating Procedures
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  
  // 流程定义
  steps: WorkflowStep[];
  
  // 质量控制
  qualityGates: QualityGate[];
  
  // 审批流程
  approvalNodes: ApprovalNode[];
  
  // 角色权限
  rolePermissions: Map<string, string[]>; // 角色 -> 允许的操作
  
  // 流程配置
  config: {
    timeout: number;
    retryCount: number;
    parallelExecution: boolean;
    autoApproval: boolean;
  };
  
  // 元数据
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    usageCount: number;
    successRate: number;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'merge' | 'wait' | 'notification';
  description: string;
  
  // 执行配置
  executor: string; // 执行者角色或具体成员
  estimatedDuration: number; // 预估时间(分钟)
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // 输入输出
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  
  // 条件和规则
  preconditions: string[];
  postconditions: string[];
  businessRules: string[];
  
  // 下一步
  nextSteps: string[]; // 下一步的step id
  
  // 异常处理
  errorHandling: {
    retryCount: number;
    fallbackStep?: string;
    escalationRole?: string;
  };
}

export interface QualityGate {
  id: string;
  name: string;
  position: string; // 在哪个step之后
  criteria: QualityCriteria[];
  autoCheck: boolean;
  reviewer?: string;
  
  // 检查结果
  passAction: 'continue' | 'skip' | 'notify';
  failAction: 'retry' | 'escalate' | 'terminate';
}

export interface QualityCriteria {
  name: string;
  type: 'metric' | 'checklist' | 'review' | 'test';
  threshold: any;
  weight: number; // 权重
  mandatory: boolean;
}

export interface ApprovalNode {
  id: string;
  name: string;
  position: string; // 在哪个step之后
  approvers: string[]; // 审批者角色或成员
  approvalType: 'any' | 'all' | 'majority';
  timeout: number; // 审批超时时间
  
  // 审批规则
  rules: {
    autoApprovalConditions?: string[];
    escalationRules?: string[];
    delegationRules?: string[];
  };
}

export interface WorkflowInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
  validation?: string;
}

export interface WorkflowOutput {
  name: string;
  type: string;
  description: string;
  target?: string; // 输出目标
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  
  // 执行信息
  startedBy: string;
  startedAt: Date;
  completedAt?: Date;
  currentStep: string;
  
  // 执行上下文
  context: Map<string, any>;
  variables: Map<string, any>;
  
  // 执行历史
  executionHistory: StepExecution[];
  
  // 审批记录
  approvalHistory: ApprovalRecord[];
  
  // 质量检查记录
  qualityCheckHistory: QualityCheckRecord[];
  
  // 性能指标
  metrics: {
    totalDuration: number;
    stepCount: number;
    errorCount: number;
    approvalCount: number;
  };
}

export interface StepExecution {
  stepId: string;
  executor: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputs: any;
  outputs?: any;
  error?: string;
  duration: number;
}

export interface ApprovalRecord {
  nodeId: string;
  approver: string;
  decision: 'approved' | 'rejected' | 'delegated';
  timestamp: Date;
  comments?: string;
  reason?: string;
}

export interface QualityCheckRecord {
  gateId: string;
  checker: string;
  result: 'passed' | 'failed';
  timestamp: Date;
  score: number;
  details: any;
  recommendations?: string[];
}

export class WorkflowEngine {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private executionQueue: string[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.initializeStandardWorkflows();
    this.startProcessingEngine();
  }

  /**
   * 创建工作流模板
   */
  createTemplate(template: Omit<WorkflowTemplate, 'metadata'>): string {
    const templateId = `wf_template_${Date.now()}`;
    
    const fullTemplate: WorkflowTemplate = {
      ...template,
      id: templateId,
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        usageCount: 0,
        successRate: 0
      }
    };

    this.templates.set(templateId, fullTemplate);
    return templateId;
  }

  /**
   * 启动工作流实例
   */
  async startWorkflow(
    templateId: string, 
    initiator: string, 
    context: any = {}
  ): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`工作流模板 ${templateId} 不存在`);
    }

    const instanceId = `wf_instance_${Date.now()}`;
    
    const instance: WorkflowInstance = {
      id: instanceId,
      templateId,
      name: `${template.name} - ${new Date().toLocaleString()}`,
      status: 'pending',
      startedBy: initiator,
      startedAt: new Date(),
      currentStep: template.steps[0].id,
      context: new Map(Object.entries(context)),
      variables: new Map(),
      executionHistory: [],
      approvalHistory: [],
      qualityCheckHistory: [],
      metrics: {
        totalDuration: 0,
        stepCount: 0,
        errorCount: 0,
        approvalCount: 0
      }
    };

    this.instances.set(instanceId, instance);
    this.executionQueue.push(instanceId);
    
    // 更新模板使用统计
    template.metadata.usageCount++;
    
    return instanceId;
  }

  /**
   * 执行工作流步骤
   */
  async executeStep(instanceId: string, stepId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例 ${instanceId} 不存在`);
    }

    const template = this.templates.get(instance.templateId);
    if (!template) {
      throw new Error(`工作流模板 ${instance.templateId} 不存在`);
    }

    const step = template.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`工作流步骤 ${stepId} 不存在`);
    }

    try {
      // 检查前置条件
      const preconditionsMet = await this.checkPreconditions(step, instance);
      if (!preconditionsMet) {
        throw new Error(`步骤 ${step.name} 的前置条件未满足`);
      }

      // 开始执行步骤
      const execution: StepExecution = {
        stepId,
        executor: step.executor,
        startedAt: new Date(),
        status: 'running',
        inputs: this.prepareStepInputs(step, instance),
        duration: 0
      };

      instance.executionHistory.push(execution);
      instance.status = 'running';
      instance.currentStep = stepId;

      // 根据步骤类型执行不同逻辑
      const result = await this.executeStepByType(step, instance, execution);
      
      // 更新执行记录
      execution.completedAt = new Date();
      execution.status = result.success ? 'completed' : 'failed';
      execution.outputs = result.outputs;
      execution.error = result.error;
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      // 检查后置条件
      if (result.success) {
        const postconditionsMet = await this.checkPostconditions(step, instance);
        if (!postconditionsMet) {
          execution.status = 'failed';
          execution.error = '后置条件检查失败';
          result.success = false;
        }
      }

      // 质量检查
      if (result.success) {
        const qualityPassed = await this.performQualityCheck(step, instance);
        if (!qualityPassed) {
          execution.status = 'failed';
          execution.error = '质量检查未通过';
          result.success = false;
        }
      }

      // 审批流程
      if (result.success) {
        const approvalPassed = await this.performApproval(step, instance);
        if (!approvalPassed) {
          instance.status = 'paused';
          return false; // 等待审批
        }
      }

      // 更新实例状态
      instance.metrics.stepCount++;
      if (!result.success) {
        instance.metrics.errorCount++;
      }

      // 确定下一步
      if (result.success && step.nextSteps.length > 0) {
        instance.currentStep = step.nextSteps[0]; // 简化实现，选择第一个下一步
      } else if (result.success) {
        // 工作流完成
        instance.status = 'completed';
        instance.completedAt = new Date();
        instance.metrics.totalDuration = instance.completedAt.getTime() - instance.startedAt.getTime();
        
        // 更新模板成功率
        this.updateTemplateSuccessRate(template.id, true);
      } else {
        // 步骤失败，处理错误
        await this.handleStepError(step, instance, execution);
      }

      return result.success;

    } catch (error) {
      console.error(`执行工作流步骤失败:`, error);
      instance.status = 'failed';
      instance.metrics.errorCount++;
      this.updateTemplateSuccessRate(template.id, false);
      return false;
    }
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(instanceId: string): WorkflowInstance | null {
    return this.instances.get(instanceId) || null;
  }

  /**
   * 暂停工作流
   */
  pauseWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === 'running') {
      instance.status = 'paused';
      return true;
    }
    return false;
  }

  /**
   * 恢复工作流
   */
  resumeWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === 'paused') {
      instance.status = 'running';
      this.executionQueue.push(instanceId);
      return true;
    }
    return false;
  }

  /**
   * 取消工作流
   */
  cancelWorkflow(instanceId: string, reason: string): boolean {
    const instance = this.instances.get(instanceId);
    if (instance && ['pending', 'running', 'paused'].includes(instance.status)) {
      instance.status = 'cancelled';
      instance.completedAt = new Date();
      
      // 记录取消原因
      instance.context.set('cancellationReason', reason);
      
      return true;
    }
    return false;
  }

  /**
   * 生成工作流报告
   */
  generateWorkflowReport(): string {
    const totalInstances = this.instances.size;
    const completedInstances = Array.from(this.instances.values()).filter(i => i.status === 'completed').length;
    const failedInstances = Array.from(this.instances.values()).filter(i => i.status === 'failed').length;
    const runningInstances = Array.from(this.instances.values()).filter(i => i.status === 'running').length;

    const avgDuration = this.calculateAverageDuration();
    const topTemplates = this.getTopUsedTemplates();
    const performanceMetrics = this.calculatePerformanceMetrics();

    return `
🔄 MJOS工作流引擎报告

📊 实例统计:
• 总实例数: ${totalInstances}
• 已完成: ${completedInstances}
• 失败: ${failedInstances}
• 运行中: ${runningInstances}
• 成功率: ${totalInstances > 0 ? (completedInstances / totalInstances * 100).toFixed(1) : 0}%

⏱️ 性能指标:
• 平均执行时间: ${avgDuration}分钟
• 平均步骤数: ${performanceMetrics.avgSteps}
• 平均错误率: ${performanceMetrics.avgErrorRate.toFixed(2)}%

🏆 热门模板:
${topTemplates.map((template, index) => 
  `${index + 1}. ${template.name} - ${template.usageCount}次使用`
).join('\n')}

💡 优化建议:
${this.generateOptimizationSuggestions().join('\n')}
    `;
  }

  // 私有方法实现
  private initializeStandardWorkflows(): void {
    // 初始化标准工作流模板
    this.createStandardTemplates();
  }

  private startProcessingEngine(): void {
    // 启动工作流处理引擎
    setInterval(() => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.processNextWorkflow();
      }
    }, 1000);
  }

  private async processNextWorkflow(): Promise<void> {
    if (this.executionQueue.length === 0) return;

    this.isProcessing = true;
    const instanceId = this.executionQueue.shift()!;
    
    try {
      const instance = this.instances.get(instanceId);
      if (instance && instance.status === 'running') {
        await this.executeStep(instanceId, instance.currentStep);
      }
    } catch (error) {
      console.error('处理工作流失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 其他私有方法的简化实现
  private createStandardTemplates(): void {
    // 创建标准工作流模板
    const templates = [
      {
        name: '新功能开发流程',
        category: 'development',
        steps: [
          { id: 'requirement-analysis', name: '需求分析', type: 'task' as const, executor: 'moxiaozhi' },
          { id: 'ui-design', name: 'UI设计', type: 'task' as const, executor: 'moxiaomei' },
          { id: 'development', name: '开发实现', type: 'task' as const, executor: 'moxiaoma' },
          { id: 'testing', name: '质量测试', type: 'task' as const, executor: 'moxiaoce' },
          { id: 'deployment', name: '部署上线', type: 'task' as const, executor: 'moxiaoyun' }
        ]
      }
    ];

    templates.forEach(template => {
      this.createTemplate({
        id: `template-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: template.name,
        description: `标准${template.name}`,
        category: template.category,
        version: '1.0',
        steps: template.steps.map(step => ({
          ...step,
          description: step.name,
          estimatedDuration: 60,
          priority: 'medium' as const,
          inputs: [],
          outputs: [],
          preconditions: [],
          postconditions: [],
          businessRules: [],
          nextSteps: [],
          errorHandling: { retryCount: 3 }
        })),
        qualityGates: [],
        approvalNodes: [],
        rolePermissions: new Map(),
        config: {
          timeout: 3600,
          retryCount: 3,
          parallelExecution: false,
          autoApproval: true
        }
      });
    });
  }

  private async checkPreconditions(step: WorkflowStep, instance: WorkflowInstance): Promise<boolean> { return true; }
  private async checkPostconditions(step: WorkflowStep, instance: WorkflowInstance): Promise<boolean> { return true; }
  private prepareStepInputs(step: WorkflowStep, instance: WorkflowInstance): any { return {}; }
  private async executeStepByType(step: WorkflowStep, instance: WorkflowInstance, execution: StepExecution): Promise<any> {
    return { success: true, outputs: {} };
  }
  private async performQualityCheck(step: WorkflowStep, instance: WorkflowInstance): Promise<boolean> { return true; }
  private async performApproval(step: WorkflowStep, instance: WorkflowInstance): Promise<boolean> { return true; }
  private async handleStepError(step: WorkflowStep, instance: WorkflowInstance, execution: StepExecution): Promise<void> {}
  private updateTemplateSuccessRate(templateId: string, success: boolean): void {}
  private calculateAverageDuration(): number { return 45; }
  private getTopUsedTemplates(): any[] { return []; }
  private calculatePerformanceMetrics(): any { return { avgSteps: 5, avgErrorRate: 2.5 }; }
  private generateOptimizationSuggestions(): string[] { return ['优化步骤执行时间', '减少错误率']; }
}

export default WorkflowEngine;
