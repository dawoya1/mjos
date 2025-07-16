/**
 * MMPT Contextual Prompt Generator
 * Magic Multi-role Prompt Toolkit 上下文提示词生成�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, MJOSError } from './types/index';
import { PromptTemplateEngine, PromptContext, CompiledPrompt } from './PromptTemplateEngine';
import { RoleRegistry, RoleDefinition } from './RoleRegistry';

export interface ContextualPromptRequest {
  roleId: string;
  taskType: string;
  context: StateContext;
  requirements?: string[];
  constraints?: string[];
  collaborationContext?: CollaborationContext;
  adaptationLevel: AdaptationLevel;
}

export interface CollaborationContext {
  participants: string[];
  collaborationType: 'sequential' | 'parallel' | 'review' | 'brainstorming';
  sharedGoals: string[];
  communicationStyle: 'formal' | 'casual' | 'technical';
}

export type AdaptationLevel = 'minimal' | 'moderate' | 'extensive' | 'dynamic';

export interface GeneratedPrompt {
  id: string;
  roleId: string;
  content: string;
  adaptations: PromptAdaptation[];
  contextualElements: ContextualElement[];
  metadata: PromptMetadata;
  createdAt: Date;
}

export interface PromptAdaptation {
  type: AdaptationType;
  description: string;
  originalContent: string;
  adaptedContent: string;
  confidence: number;
}

export type AdaptationType = 
  | 'role-specific' 
  | 'context-aware' 
  | 'collaboration-focused' 
  | 'constraint-based' 
  | 'dynamic-adjustment';

export interface ContextualElement {
  type: ElementType;
  content: string;
  relevance: number;
  source: string;
}

export type ElementType = 
  | 'background-info' 
  | 'role-context' 
  | 'task-context' 
  | 'collaboration-info' 
  | 'constraint-info' 
  | 'historical-context';

export interface PromptMetadata {
  templateId?: string;
  adaptationLevel: AdaptationLevel;
  contextFactors: string[];
  estimatedEffectiveness: number;
  tokens: number;
  complexity: number;
}

export interface PromptOptimization {
  originalPrompt: string;
  optimizedPrompt: string;
  optimizations: OptimizationAction[];
  improvementScore: number;
}

export interface OptimizationAction {
  type: OptimizationType;
  description: string;
  impact: number;
}

export type OptimizationType = 
  | 'clarity-improvement' 
  | 'specificity-enhancement' 
  | 'redundancy-removal' 
  | 'structure-optimization' 
  | 'context-enrichment';

/**
 * 上下文提示词生成器类
 * 基于角色、任务和上下文智能生成优化的提示�? */
export class ContextualPromptGenerator {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly templateEngine: PromptTemplateEngine;
  private readonly roleRegistry: RoleRegistry;
  
  private generatedPrompts = new Map<string, GeneratedPrompt>();
  private contextHistory: Array<{
    roleId: string;
    context: StateContext;
    timestamp: Date;
    effectiveness: number;
  }> = [];

  constructor(
    logger: Logger,
    eventBus: EventBus,
    templateEngine: PromptTemplateEngine,
    roleRegistry: RoleRegistry
  ) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.templateEngine = templateEngine;
    this.roleRegistry = roleRegistry;
    
    this.setupEventListeners();
    
    this.logger.info('Contextual Prompt Generator initialized');
  }

  /**
   * 生成上下文提示词
   */
  public async generateContextualPrompt(
    request: ContextualPromptRequest
  ): Promise<GeneratedPrompt | null> {
    try {
      this.logger.debug('Generating contextual prompt', {
        roleId: request.roleId,
        taskType: request.taskType,
        adaptationLevel: request.adaptationLevel
      });

      // 获取角色定义
      const roleDefinition = this.roleRegistry.getRoleDefinition(request.roleId);
      if (!roleDefinition) {
        throw new Error(`Role not found: ${request.roleId}`);
      }

      // 分析上下�?      const contextualElements = await this.analyzeContext(request, roleDefinition);

      // 选择或生成基础提示�?      const basePrompt = await this.selectBasePrompt(request, roleDefinition);

      // 应用上下文适应
      const adaptedPrompt = await this.applyContextualAdaptations(
        basePrompt,
        request,
        roleDefinition,
        contextualElements
      );

      // 优化提示�?      const optimizedPrompt = await this.optimizePrompt(adaptedPrompt, request);

      // 创建生成的提示词对象
      const generatedPrompt: GeneratedPrompt = {
        id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roleId: request.roleId,
        content: optimizedPrompt.optimizedPrompt,
        adaptations: adaptedPrompt.adaptations,
        contextualElements,
        metadata: {
          templateId: basePrompt.templateId,
          adaptationLevel: request.adaptationLevel,
          contextFactors: this.extractContextFactors(request),
          estimatedEffectiveness: this.estimateEffectiveness(optimizedPrompt, request),
          tokens: this.estimateTokens(optimizedPrompt.optimizedPrompt),
          complexity: this.calculateComplexity(optimizedPrompt.optimizedPrompt)
        },
        createdAt: new Date()
      };

      this.generatedPrompts.set(generatedPrompt.id, generatedPrompt);

      this.logger.info('Contextual prompt generated', {
        promptId: generatedPrompt.id,
        roleId: request.roleId,
        tokens: generatedPrompt.metadata.tokens,
        effectiveness: generatedPrompt.metadata.estimatedEffectiveness
      });

      // 发布提示词生成事�?      this.eventBus.publishEvent('prompt.generated', {
        generatedPrompt,
        request
      }, 'ContextualPromptGenerator');

      return generatedPrompt;

    } catch (error) {
      this.logger.error('Failed to generate contextual prompt', {
        roleId: request.roleId,
        taskType: request.taskType,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 批量生成协作提示�?   */
  public async generateCollaborationPrompts(
    participants: string[],
    collaborationContext: CollaborationContext,
    baseContext: StateContext
  ): Promise<Map<string, GeneratedPrompt>> {
    const prompts = new Map<string, GeneratedPrompt>();

    for (const roleId of participants) {
      const request: ContextualPromptRequest = {
        roleId,
        taskType: 'collaboration',
        context: baseContext,
        collaborationContext,
        adaptationLevel: 'extensive'
      };

      const prompt = await this.generateContextualPrompt(request);
      if (prompt) {
        prompts.set(roleId, prompt);
      }
    }

    this.logger.info('Collaboration prompts generated', {
      participantCount: participants.length,
      generatedCount: prompts.size
    });

    return prompts;
  }

  /**
   * 动态调整提示词
   */
  public async adjustPromptDynamically(
    promptId: string,
    feedback: {
      effectiveness: number;
      issues: string[];
      suggestions: string[];
    }
  ): Promise<GeneratedPrompt | null> {
    try {
      const originalPrompt = this.generatedPrompts.get(promptId);
      if (!originalPrompt) {
        throw new Error(`Prompt not found: ${promptId}`);
      }

      this.logger.debug('Adjusting prompt dynamically', {
        promptId,
        effectiveness: feedback.effectiveness,
        issueCount: feedback.issues.length
      });

      // 分析反馈
      const adjustments = this.analyzeFeedback(feedback, originalPrompt);

      // 应用调整
      const adjustedContent = this.applyAdjustments(originalPrompt.content, adjustments);

      // 创建新的提示词版�?      const adjustedPrompt: GeneratedPrompt = {
        ...originalPrompt,
        id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: adjustedContent,
        adaptations: [
          ...originalPrompt.adaptations,
          ...adjustments.map(adj => ({
            type: 'dynamic-adjustment' as AdaptationType,
            description: adj.description,
            originalContent: originalPrompt.content,
            adaptedContent: adjustedContent,
            confidence: adj.confidence
          }))
        ],
        metadata: {
          ...originalPrompt.metadata,
          estimatedEffectiveness: Math.min(
            originalPrompt.metadata.estimatedEffectiveness + 10,
            100
          )
        },
        createdAt: new Date()
      };

      this.generatedPrompts.set(adjustedPrompt.id, adjustedPrompt);

      this.logger.info('Prompt adjusted dynamically', {
        originalId: promptId,
        adjustedId: adjustedPrompt.id,
        adjustmentCount: adjustments.length
      });

      return adjustedPrompt;

    } catch (error) {
      this.logger.error('Failed to adjust prompt dynamically', {
        promptId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 分析上下�?   */
  private async analyzeContext(
    request: ContextualPromptRequest,
    roleDefinition: RoleDefinition
  ): Promise<ContextualElement[]> {
    const elements: ContextualElement[] = [];

    // 角色上下�?    elements.push({
      type: 'role-context',
      content: `Role: ${roleDefinition.name} - ${roleDefinition.prompts.system}`,
      relevance: 100,
      source: 'role-definition'
    });

    // 任务上下�?    elements.push({
      type: 'task-context',
      content: `Task Type: ${request.taskType}`,
      relevance: 90,
      source: 'request'
    });

    // 协作上下�?    if (request.collaborationContext) {
      elements.push({
        type: 'collaboration-info',
        content: `Collaboration: ${request.collaborationContext.collaborationType} with ${request.collaborationContext.participants.join(', ')}`,
        relevance: 85,
        source: 'collaboration-context'
      });
    }

    // 约束上下�?    if (request.constraints && request.constraints.length > 0) {
      elements.push({
        type: 'constraint-info',
        content: `Constraints: ${request.constraints.join(', ')}`,
        relevance: 80,
        source: 'request'
      });
    }

    // 历史上下�?    const historicalContext = this.getHistoricalContext(request.roleId, request.taskType);
    if (historicalContext) {
      elements.push({
        type: 'historical-context',
        content: historicalContext,
        relevance: 70,
        source: 'history'
      });
    }

    return elements.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * 选择基础提示�?   */
  private async selectBasePrompt(
    request: ContextualPromptRequest,
    roleDefinition: RoleDefinition
  ): Promise<CompiledPrompt> {
    // 尝试从模板引擎获取合适的模板
    const templates = this.templateEngine.getCompatibleTemplates(
      request.roleId,
      this.mapTaskTypeToCategory(request.taskType)
    );

    if (templates.length > 0) {
      const bestTemplate = templates[0];
      const promptContext: PromptContext = {
        roleId: request.roleId,
        sessionId: request.context.sessionId,
        taskType: request.taskType,
        variables: this.createTemplateVariables(request, roleDefinition),
        metadata: request
      };

      const compiled = await this.templateEngine.compilePrompt(bestTemplate.id, promptContext);
      if (compiled) {
        return compiled;
      }
    }

    // 回退到角色默认提示词
    return {
      id: `fallback-${Date.now()}`,
      templateId: 'role-default',
      content: roleDefinition.prompts.system,
      context: {
        roleId: request.roleId,
        sessionId: request.context.sessionId,
        variables: new Map(),
        metadata: request
      },
      compiledAt: new Date(),
      tokens: this.estimateTokens(roleDefinition.prompts.system),
      variables: new Map()
    };
  }

  /**
   * 应用上下文适应
   */
  private async applyContextualAdaptations(
    basePrompt: CompiledPrompt,
    request: ContextualPromptRequest,
    roleDefinition: RoleDefinition,
    contextualElements: ContextualElement[]
  ): Promise<{ content: string; adaptations: PromptAdaptation[] }> {
    let adaptedContent = basePrompt.content;
    const adaptations: PromptAdaptation[] = [];

    // 根据适应级别应用不同的适应策略
    switch (request.adaptationLevel) {
      case 'minimal':
        adaptedContent = this.applyMinimalAdaptations(adaptedContent, request);
        break;
      
      case 'moderate':
        const moderateResult = this.applyModerateAdaptations(adaptedContent, request, contextualElements);
        adaptedContent = moderateResult.content;
        adaptations.push(...moderateResult.adaptations);
        break;
      
      case 'extensive':
        const extensiveResult = this.applyExtensiveAdaptations(adaptedContent, request, roleDefinition, contextualElements);
        adaptedContent = extensiveResult.content;
        adaptations.push(...extensiveResult.adaptations);
        break;
      
      case 'dynamic':
        const dynamicResult = this.applyDynamicAdaptations(adaptedContent, request, roleDefinition, contextualElements);
        adaptedContent = dynamicResult.content;
        adaptations.push(...dynamicResult.adaptations);
        break;
    }

    return { content: adaptedContent, adaptations };
  }

  /**
   * 应用最小适应
   */
  private applyMinimalAdaptations(content: string, request: ContextualPromptRequest): string {
    // 只添加基本的任务类型信息
    return `${content}\n\nCurrent task: ${request.taskType}`;
  }

  /**
   * 应用中等适应
   */
  private applyModerateAdaptations(
    content: string,
    request: ContextualPromptRequest,
    contextualElements: ContextualElement[]
  ): { content: string; adaptations: PromptAdaptation[] } {
    const adaptations: PromptAdaptation[] = [];
    let adaptedContent = content;

    // 添加上下文信�?    const relevantElements = contextualElements.filter(e => e.relevance > 80);
    if (relevantElements.length > 0) {
      const contextInfo = relevantElements.map(e => e.content).join('\n');
      adaptedContent += `\n\nContext:\n${contextInfo}`;
      
      adaptations.push({
        type: 'context-aware',
        description: 'Added relevant context information',
        originalContent: content,
        adaptedContent,
        confidence: 80
      });
    }

    return { content: adaptedContent, adaptations };
  }

  /**
   * 应用广泛适应
   */
  private applyExtensiveAdaptations(
    content: string,
    request: ContextualPromptRequest,
    roleDefinition: RoleDefinition,
    contextualElements: ContextualElement[]
  ): { content: string; adaptations: PromptAdaptation[] } {
    const adaptations: PromptAdaptation[] = [];
    let adaptedContent = content;

    // 添加详细的角色特定信�?    const roleSpecificInfo = this.generateRoleSpecificContext(roleDefinition, request);
    adaptedContent += `\n\n${roleSpecificInfo}`;
    
    adaptations.push({
      type: 'role-specific',
      description: 'Enhanced with role-specific context',
      originalContent: content,
      adaptedContent,
      confidence: 90
    });

    // 添加协作信息
    if (request.collaborationContext) {
      const collaborationInfo = this.generateCollaborationContext(request.collaborationContext);
      adaptedContent += `\n\n${collaborationInfo}`;
      
      adaptations.push({
        type: 'collaboration-focused',
        description: 'Added collaboration context',
        originalContent: content,
        adaptedContent,
        confidence: 85
      });
    }

    return { content: adaptedContent, adaptations };
  }

  /**
   * 应用动态适应
   */
  private applyDynamicAdaptations(
    content: string,
    request: ContextualPromptRequest,
    roleDefinition: RoleDefinition,
    contextualElements: ContextualElement[]
  ): { content: string; adaptations: PromptAdaptation[] } {
    // 动态适应基于历史表现和实时反�?    const extensiveResult = this.applyExtensiveAdaptations(content, request, roleDefinition, contextualElements);
    
    // 添加动态调�?    const dynamicAdjustments = this.generateDynamicAdjustments(request);
    let adaptedContent = extensiveResult.content + `\n\n${dynamicAdjustments}`;
    
    const dynamicAdaptation: PromptAdaptation = {
      type: 'dynamic-adjustment',
      description: 'Applied dynamic adjustments based on context',
      originalContent: extensiveResult.content,
      adaptedContent,
      confidence: 75
    };

    return {
      content: adaptedContent,
      adaptations: [...extensiveResult.adaptations, dynamicAdaptation]
    };
  }

  /**
   * 优化提示�?   */
  private async optimizePrompt(
    adaptedPrompt: { content: string; adaptations: PromptAdaptation[] },
    request: ContextualPromptRequest
  ): Promise<PromptOptimization> {
    const optimizations: OptimizationAction[] = [];
    let optimizedContent = adaptedPrompt.content;

    // 清晰度改�?    const clarityImprovement = this.improveClarityAndSpecificity(optimizedContent);
    if (clarityImprovement.improved) {
      optimizedContent = clarityImprovement.content;
      optimizations.push({
        type: 'clarity-improvement',
        description: 'Improved clarity and specificity',
        impact: 15
      });
    }

    // 移除冗余
    const redundancyRemoval = this.removeRedundancy(optimizedContent);
    if (redundancyRemoval.improved) {
      optimizedContent = redundancyRemoval.content;
      optimizations.push({
        type: 'redundancy-removal',
        description: 'Removed redundant information',
        impact: 10
      });
    }

    // 结构优化
    const structureOptimization = this.optimizeStructure(optimizedContent);
    if (structureOptimization.improved) {
      optimizedContent = structureOptimization.content;
      optimizations.push({
        type: 'structure-optimization',
        description: 'Optimized prompt structure',
        impact: 12
      });
    }

    const improvementScore = optimizations.reduce((sum, opt) => sum + opt.impact, 0);

    return {
      originalPrompt: adaptedPrompt.content,
      optimizedPrompt: optimizedContent,
      optimizations,
      improvementScore
    };
  }

  /**
   * 映射任务类型到类�?   */
  private mapTaskTypeToCategory(taskType: string): any {
    const mapping: Record<string, string> = {
      'collaboration': 'collaboration',
      'analysis': 'task',
      'development': 'task',
      'review': 'task',
      'planning': 'task'
    };
    
    return mapping[taskType] || 'task';
  }

  /**
   * 创建模板变量
   */
  private createTemplateVariables(
    request: ContextualPromptRequest,
    roleDefinition: RoleDefinition
  ): Map<string, any> {
    const variables = new Map<string, any>();
    
    variables.set('roleName', roleDefinition.name);
    variables.set('roleDescription', roleDefinition.prompts.system);
    variables.set('taskType', request.taskType);
    variables.set('sessionId', request.context.sessionId);
    
    if (request.requirements) {
      variables.set('requirements', request.requirements);
    }
    
    if (request.constraints) {
      variables.set('constraints', request.constraints);
    }
    
    return variables;
  }

  /**
   * 获取历史上下�?   */
  private getHistoricalContext(roleId: string, taskType: string): string | null {
    const relevantHistory = this.contextHistory
      .filter(h => h.roleId === roleId && h.effectiveness > 70)
      .slice(-3);
    
    if (relevantHistory.length === 0) return null;
    
    return `Based on recent successful interactions, this role performs well with ${taskType} tasks.`;
  }

  /**
   * 生成角色特定上下�?   */
  private generateRoleSpecificContext(roleDefinition: RoleDefinition, request: ContextualPromptRequest): string {
    return `Role-specific guidance:
- Decision making: ${roleDefinition.behaviors.decisionMaking}
- Communication style: ${roleDefinition.behaviors.communicationStyle}
- Learning mode: ${roleDefinition.behaviors.learningMode}
- Workflow preference: ${roleDefinition.behaviors.workflowPreference}`;
  }

  /**
   * 生成协作上下�?   */
  private generateCollaborationContext(collaborationContext: CollaborationContext): string {
    return `Collaboration context:
- Type: ${collaborationContext.collaborationType}
- Participants: ${collaborationContext.participants.join(', ')}
- Communication style: ${collaborationContext.communicationStyle}
- Shared goals: ${collaborationContext.sharedGoals.join(', ')}`;
  }

  /**
   * 生成动态调�?   */
  private generateDynamicAdjustments(request: ContextualPromptRequest): string {
    return `Dynamic adjustments:
- Adapt your responses based on real-time feedback
- Monitor collaboration effectiveness
- Adjust communication style as needed`;
  }

  /**
   * 提取上下文因�?   */
  private extractContextFactors(request: ContextualPromptRequest): string[] {
    const factors: string[] = [];
    
    factors.push(`task-type:${request.taskType}`);
    factors.push(`adaptation-level:${request.adaptationLevel}`);
    
    if (request.collaborationContext) {
      factors.push(`collaboration:${request.collaborationContext.collaborationType}`);
    }
    
    if (request.requirements) {
      factors.push(`requirements:${request.requirements.length}`);
    }
    
    return factors;
  }

  /**
   * 估算效果
   */
  private estimateEffectiveness(optimization: PromptOptimization, request: ContextualPromptRequest): number {
    let baseEffectiveness = 70;
    
    // 基于优化分数调整
    baseEffectiveness += optimization.improvementScore;
    
    // 基于适应级别调整
    const adaptationBonus = {
      'minimal': 0,
      'moderate': 5,
      'extensive': 10,
      'dynamic': 15
    };
    
    baseEffectiveness += adaptationBonus[request.adaptationLevel];
    
    return Math.min(baseEffectiveness, 100);
  }

  /**
   * 估算令牌�?   */
  private estimateTokens(content: string): number {
    return Math.ceil(content.length / 4);
  }

  /**
   * 计算复杂�?   */
  private calculateComplexity(content: string): number {
    const factors = [
      content.length / 1000, // 长度因子
      (content.match(/\n/g) || []).length / 10, // 结构因子
      (content.match(/[.!?]/g) || []).length / 5 // 句子因子
    ];
    
    return Math.min(factors.reduce((sum, factor) => sum + factor, 0), 10);
  }

  /**
   * 分析反馈
   */
  private analyzeFeedback(
    feedback: { effectiveness: number; issues: string[]; suggestions: string[] },
    prompt: GeneratedPrompt
  ): Array<{ description: string; confidence: number; adjustment: string }> {
    const adjustments: Array<{ description: string; confidence: number; adjustment: string }> = [];
    
    if (feedback.effectiveness < 70) {
      adjustments.push({
        description: 'Low effectiveness detected, enhancing specificity',
        confidence: 80,
        adjustment: 'enhance-specificity'
      });
    }
    
    for (const issue of feedback.issues) {
      adjustments.push({
        description: `Addressing issue: ${issue}`,
        confidence: 70,
        adjustment: 'address-issue'
      });
    }
    
    return adjustments;
  }

  /**
   * 应用调整
   */
  private applyAdjustments(content: string, adjustments: Array<{ adjustment: string; description: string }>): string {
    let adjustedContent = content;
    
    for (const adjustment of adjustments) {
      switch (adjustment.adjustment) {
        case 'enhance-specificity':
          adjustedContent += '\n\nPlease be more specific and detailed in your responses.';
          break;
        case 'address-issue':
          adjustedContent += `\n\nNote: ${adjustment.description}`;
          break;
      }
    }
    
    return adjustedContent;
  }

  /**
   * 改进清晰度和特异�?   */
  private improveClarityAndSpecificity(content: string): { improved: boolean; content: string } {
    // 简化的清晰度改进逻辑
    if (content.length < 100) {
      return {
        improved: true,
        content: content + '\n\nPlease provide detailed and specific responses.'
      };
    }
    
    return { improved: false, content };
  }

  /**
   * 移除冗余
   */
  private removeRedundancy(content: string): { improved: boolean; content: string } {
    // 简化的冗余移除逻辑
    const lines = content.split('\n');
    const uniqueLines = [...new Set(lines)];
    
    if (uniqueLines.length < lines.length) {
      return {
        improved: true,
        content: uniqueLines.join('\n')
      };
    }
    
    return { improved: false, content };
  }

  /**
   * 优化结构
   */
  private optimizeStructure(content: string): { improved: boolean; content: string } {
    // 简化的结构优化逻辑
    if (!content.includes('\n\n')) {
      const sentences = content.split('. ');
      if (sentences.length > 3) {
        return {
          improved: true,
          content: sentences.join('.\n\n')
        };
      }
    }
    
    return { improved: false, content };
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('prompt.feedback', (event) => {
      const { promptId, effectiveness, roleId, taskType } = event.payload;
      
      // 记录上下文历�?      this.contextHistory.push({
        roleId,
        context: event.payload.context,
        timestamp: new Date(),
        effectiveness
      });
      
      // 限制历史记录大小
      if (this.contextHistory.length > 1000) {
        this.contextHistory.splice(0, 100);
      }
    });
  }
}
