/**
 * MMPT Prompt Template Engine
 * Magic Multi-role Prompt Toolkit 提示词模板引�? */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { StateContext, MJOSError } from './types/index';

export interface PromptTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  template: string;
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  version: string;
  status: TemplateStatus;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: VariableValidation;
}

export type VariableType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object' 
  | 'context' 
  | 'role';

export interface VariableValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: any[];
}

export type TemplateCategory = 
  | 'system' 
  | 'task' 
  | 'collaboration' 
  | 'reflection' 
  | 'error-handling' 
  | 'custom';

export type TemplateStatus = 'draft' | 'active' | 'deprecated' | 'archived';

export interface TemplateMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  description: string;
  usageCount: number;
  successRate: number;
  roleCompatibility: string[];
}

export interface PromptContext {
  roleId: string;
  sessionId: string;
  taskType?: string;
  collaborationMode?: string;
  variables: Map<string, any>;
  metadata: any;
}

export interface CompiledPrompt {
  id: string;
  templateId: string;
  content: string;
  context: PromptContext;
  compiledAt: Date;
  tokens: number;
  variables: Map<string, any>;
}

export interface TemplateLibrary {
  id: string;
  name: string;
  description: string;
  templates: Map<string, PromptTemplate>;
  version: string;
  author: string;
}

/**
 * 提示词模板引擎类
 * 管理和编译提示词模板
 */
export class PromptTemplateEngine {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  
  private templates = new Map<string, PromptTemplate>();
  private libraries = new Map<string, TemplateLibrary>();
  private compiledPrompts = new Map<string, CompiledPrompt>();
  private templateUsageHistory: Array<{
    templateId: string;
    roleId: string;
    timestamp: Date;
    success: boolean;
    context: any;
  }> = [];

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeDefaultTemplates();
    this.setupEventListeners();
    
    this.logger.info('Prompt Template Engine initialized');
  }

  /**
   * 注册模板
   */
  public async registerTemplate(template: PromptTemplate): Promise<boolean> {
    try {
      this.validateTemplate(template);
      
      this.templates.set(template.id, template);
      
      this.logger.info('Template registered', {
        templateId: template.id,
        name: template.name,
        category: template.category
      });

      this.eventBus.publishEvent('template.registered', {
        template
      }, 'PromptTemplateEngine');

      return true;

    } catch (error) {
      this.logger.error('Failed to register template', {
        templateId: template.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 编译提示�?   */
  public async compilePrompt(
    templateId: string,
    context: PromptContext
  ): Promise<CompiledPrompt | null> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      if (template.status !== 'active') {
        throw new Error(`Template is not active: ${template.status}`);
      }

      // 验证必需变量
      this.validateRequiredVariables(template, context.variables);

      // 编译模板
      const content = this.processTemplate(template.template, context);
      
      const compiledPrompt: CompiledPrompt = {
        id: `compiled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        content,
        context,
        compiledAt: new Date(),
        tokens: this.estimateTokens(content),
        variables: new Map(context.variables)
      };

      this.compiledPrompts.set(compiledPrompt.id, compiledPrompt);

      // 更新使用统计
      template.metadata.usageCount += 1;

      this.logger.debug('Prompt compiled', {
        templateId,
        compiledId: compiledPrompt.id,
        tokens: compiledPrompt.tokens,
        roleId: context.roleId
      });

      this.eventBus.publishEvent('prompt.compiled', {
        compiledPrompt,
        template
      }, 'PromptTemplateEngine');

      return compiledPrompt;

    } catch (error) {
      this.logger.error('Failed to compile prompt', {
        templateId,
        roleId: context.roleId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * 获取角色兼容的模�?   */
  public getCompatibleTemplates(
    roleId: string,
    category?: TemplateCategory
  ): PromptTemplate[] {
    let templates = Array.from(this.templates.values()).filter(template => 
      template.status === 'active' &&
      (template.metadata.roleCompatibility.length === 0 || 
       template.metadata.roleCompatibility.includes(roleId) ||
       template.metadata.roleCompatibility.includes('*'))
    );

    if (category) {
      templates = templates.filter(template => template.category === category);
    }

    return templates.sort((a, b) => b.metadata.successRate - a.metadata.successRate);
  }

  /**
   * 搜索模板
   */
  public searchTemplates(criteria: {
    name?: string;
    category?: TemplateCategory;
    tags?: string[];
    roleId?: string;
    variables?: string[];
  }): PromptTemplate[] {
    let results = Array.from(this.templates.values()).filter(t => t.status === 'active');

    if (criteria.name) {
      const namePattern = new RegExp(criteria.name, 'i');
      results = results.filter(template => namePattern.test(template.name));
    }

    if (criteria.category) {
      results = results.filter(template => template.category === criteria.category);
    }

    if (criteria.tags) {
      results = results.filter(template => 
        criteria.tags!.some(tag => template.metadata.tags.includes(tag))
      );
    }

    if (criteria.roleId) {
      results = results.filter(template => 
        template.metadata.roleCompatibility.length === 0 ||
        template.metadata.roleCompatibility.includes(criteria.roleId!) ||
        template.metadata.roleCompatibility.includes('*')
      );
    }

    if (criteria.variables) {
      results = results.filter(template => 
        criteria.variables!.every(varName => 
          template.variables.some(v => v.name === varName)
        )
      );
    }

    return results.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);
  }

  /**
   * 创建模板�?   */
  public createTemplateLibrary(
    id: string,
    name: string,
    description: string,
    templates: PromptTemplate[]
  ): TemplateLibrary {
    const library: TemplateLibrary = {
      id,
      name,
      description,
      templates: new Map(),
      version: '1.0.0',
      author: 'system'
    };

    for (const template of templates) {
      library.templates.set(template.id, template);
    }

    this.libraries.set(id, library);

    this.logger.info('Template library created', {
      libraryId: id,
      templateCount: templates.length
    });

    return library;
  }

  /**
   * 导入模板�?   */
  public async importTemplateLibrary(library: TemplateLibrary): Promise<boolean> {
    try {
      for (const template of library.templates.values()) {
        await this.registerTemplate(template);
      }

      this.libraries.set(library.id, library);

      this.logger.info('Template library imported', {
        libraryId: library.id,
        templateCount: library.templates.size
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to import template library', {
        libraryId: library.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * 记录模板使用结果
   */
  public recordTemplateUsage(
    templateId: string,
    roleId: string,
    success: boolean,
    context: any
  ): void {
    this.templateUsageHistory.push({
      templateId,
      roleId,
      timestamp: new Date(),
      success,
      context
    });

    // 更新模板成功�?    const template = this.templates.get(templateId);
    if (template) {
      const totalUsage = template.metadata.usageCount;
      const currentSuccessRate = template.metadata.successRate;
      const newSuccessRate = (currentSuccessRate * (totalUsage - 1) + (success ? 100 : 0)) / totalUsage;
      
      template.metadata.successRate = newSuccessRate;
    }

    // 限制历史记录大小
    if (this.templateUsageHistory.length > 10000) {
      this.templateUsageHistory.splice(0, 1000);
    }
  }

  /**
   * 获取模板统计
   */
  public getTemplateStatistics(): {
    totalTemplates: number;
    templatesByCategory: Record<TemplateCategory, number>;
    averageSuccessRate: number;
    mostUsedTemplates: Array<{ templateId: string; usageCount: number }>;
    recentUsage: number;
  } {
    const templates = Array.from(this.templates.values());
    const templatesByCategory: Record<TemplateCategory, number> = {} as any;
    
    let totalSuccessRate = 0;

    for (const template of templates) {
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;
      totalSuccessRate += template.metadata.successRate;
    }

    const averageSuccessRate = templates.length > 0 ? totalSuccessRate / templates.length : 0;

    const mostUsedTemplates = templates
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 10)
      .map(template => ({
        templateId: template.id,
        usageCount: template.metadata.usageCount
      }));

    const recentUsage = this.templateUsageHistory.filter(usage => 
      usage.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalTemplates: templates.length,
      templatesByCategory,
      averageSuccessRate,
      mostUsedTemplates,
      recentUsage
    };
  }

  /**
   * 验证模板
   */
  private validateTemplate(template: PromptTemplate): void {
    if (!template.id) {
      throw new Error('Template ID is required');
    }

    if (!template.name) {
      throw new Error('Template name is required');
    }

    if (!template.template) {
      throw new Error('Template content is required');
    }

    if (!template.version) {
      throw new Error('Template version is required');
    }

    // 验证变量定义
    for (const variable of template.variables) {
      if (!variable.name) {
        throw new Error('Variable name is required');
      }
      if (!variable.type) {
        throw new Error('Variable type is required');
      }
    }

    // 验证模板中的变量引用
    const templateVars = this.extractTemplateVariables(template.template);
    const definedVars = new Set(template.variables.map(v => v.name));
    
    for (const varName of templateVars) {
      if (!definedVars.has(varName)) {
        throw new Error(`Undefined variable in template: ${varName}`);
      }
    }
  }

  /**
   * 验证必需变量
   */
  private validateRequiredVariables(
    template: PromptTemplate,
    variables: Map<string, any>
  ): void {
    for (const variable of template.variables) {
      if (variable.required && !variables.has(variable.name)) {
        throw new Error(`Required variable missing: ${variable.name}`);
      }

      const value = variables.get(variable.name);
      if (value !== undefined && variable.validation) {
        this.validateVariableValue(variable, value);
      }
    }
  }

  /**
   * 验证变量�?   */
  private validateVariableValue(variable: TemplateVariable, value: any): void {
    const validation = variable.validation!;

    if (variable.type === 'string' && typeof value === 'string') {
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        throw new Error(`Variable ${variable.name} does not match pattern: ${validation.pattern}`);
      }
      if (validation.minLength && value.length < validation.minLength) {
        throw new Error(`Variable ${variable.name} is too short (min: ${validation.minLength})`);
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        throw new Error(`Variable ${variable.name} is too long (max: ${validation.maxLength})`);
      }
    }

    if (variable.type === 'number' && typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        throw new Error(`Variable ${variable.name} is too small (min: ${validation.min})`);
      }
      if (validation.max !== undefined && value > validation.max) {
        throw new Error(`Variable ${variable.name} is too large (max: ${validation.max})`);
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Variable ${variable.name} must be one of: ${validation.enum.join(', ')}`);
    }
  }

  /**
   * 处理模板
   */
  private processTemplate(template: string, context: PromptContext): string {
    let result = template;

    // 替换变量
    for (const [name, value] of context.variables) {
      const placeholder = `{{${name}}}`;
      const stringValue = this.formatVariableValue(value);
      result = result.replace(new RegExp(placeholder, 'g'), stringValue);
    }

    // 处理条件语句
    result = this.processConditionals(result, context);

    // 处理循环语句
    result = this.processLoops(result, context);

    return result.trim();
  }

  /**
   * 格式化变量�?   */
  private formatVariableValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  /**
   * 处理条件语句
   */
  private processConditionals(template: string, context: PromptContext): string {
    // 简化的条件处理：{{#if variable}}content{{/if}}
    const conditionalPattern = /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs;
    
    return template.replace(conditionalPattern, (match, varName, content) => {
      const value = context.variables.get(varName);
      return value ? content : '';
    });
  }

  /**
   * 处理循环语句
   */
  private processLoops(template: string, context: PromptContext): string {
    // 简化的循环处理：{{#each array}}{{this}}{{/each}}
    const loopPattern = /\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs;
    
    return template.replace(loopPattern, (match, varName, content) => {
      const array = context.variables.get(varName);
      if (!Array.isArray(array)) return '';
      
      return array.map(item => 
        content.replace(/\{\{this\}\}/g, String(item))
      ).join('');
    });
  }

  /**
   * 提取模板变量
   */
  private extractTemplateVariables(template: string): string[] {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  /**
   * 估算令牌�?   */
  private estimateTokens(content: string): number {
    // 简化的令牌估算：大�?个字�?= 1个令�?    return Math.ceil(content.length / 4);
  }

  /**
   * 初始化默认模�?   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'system-role-init',
        name: '角色初始化系统提示词',
        category: 'system',
        template: `你是{{roleName}}，{{roleDescription}}�?
你的主要职责包括�?{{#each responsibilities}}
- {{this}}
{{/each}}

你的工作方式�?- 决策模式：{{decisionMaking}}
- 沟通风格：{{communicationStyle}}
- 学习模式：{{learningMode}}

请确认你已理解你的角色定位，并准备开始工作。`,
        variables: [
          {
            name: 'roleName',
            type: 'string',
            required: true,
            description: '角色名称'
          },
          {
            name: 'roleDescription',
            type: 'string',
            required: true,
            description: '角色描述'
          },
          {
            name: 'responsibilities',
            type: 'array',
            required: true,
            description: '职责列表'
          },
          {
            name: 'decisionMaking',
            type: 'string',
            required: false,
            defaultValue: 'collaborative',
            description: '决策模式'
          },
          {
            name: 'communicationStyle',
            type: 'string',
            required: false,
            defaultValue: 'professional',
            description: '沟通风�?
          },
          {
            name: 'learningMode',
            type: 'string',
            required: false,
            defaultValue: 'active',
            description: '学习模式'
          }
        ],
        metadata: {
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['role', 'initialization', 'system'],
          description: '用于初始化角色的系统提示词模�?,
          usageCount: 0,
          successRate: 0,
          roleCompatibility: ['*']
        },
        version: '1.0.0',
        status: 'active'
      },
      {
        id: 'task-execution',
        name: '任务执行提示�?,
        category: 'task',
        template: `请执行以下任务：

任务描述：{{taskDescription}}

{{#if requirements}}
任务要求�?{{#each requirements}}
- {{this}}
{{/each}}
{{/if}}

{{#if context}}
上下文信息：{{context}}
{{/if}}

{{#if deadline}}
截止时间：{{deadline}}
{{/if}}

请按照你的专业能力完成这个任务，并提供详细的执行过程和结果。`,
        variables: [
          {
            name: 'taskDescription',
            type: 'string',
            required: true,
            description: '任务描述'
          },
          {
            name: 'requirements',
            type: 'array',
            required: false,
            description: '任务要求列表'
          },
          {
            name: 'context',
            type: 'string',
            required: false,
            description: '上下文信�?
          },
          {
            name: 'deadline',
            type: 'string',
            required: false,
            description: '截止时间'
          }
        ],
        metadata: {
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['task', 'execution'],
          description: '用于任务执行的提示词模板',
          usageCount: 0,
          successRate: 0,
          roleCompatibility: ['*']
        },
        version: '1.0.0',
        status: 'active'
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }

    this.logger.debug('Default templates initialized', {
      templateCount: defaultTemplates.length
    });
  }

  /**
   * 设置事件监听�?   */
  private setupEventListeners(): void {
    this.eventBus.subscribeEvent('role.task_completed', (event) => {
      const { roleId, templateId, success } = event.payload;
      
      if (templateId) {
        this.recordTemplateUsage(templateId, roleId, success, event.payload);
      }
    });

    this.eventBus.subscribeEvent('prompt.feedback', (event) => {
      const { templateId, roleId, rating, feedback } = event.payload;
      
      // 基于反馈更新模板质量评分
      const template = this.templates.get(templateId);
      if (template) {
        // 简化的评分更新逻辑
        const currentRate = template.metadata.successRate;
        const newRate = (currentRate + rating) / 2;
        template.metadata.successRate = Math.max(0, Math.min(100, newRate));
      }
    });
  }
}
