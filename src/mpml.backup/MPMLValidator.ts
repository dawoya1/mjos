/**
 * MPML Validator
 * Magic Prompt Markup Language 验证�? */

import { Logger } from 'winston';
import { MPMLDocument, MPMLMetadata } from './MPMLParser';
import { TeamConfig, RoleConfig, WorkflowConfig } from './types/index';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  suggestion?: string;
}

export interface ValidationOptions {
  strictMode?: boolean;
  checkReferences?: boolean;
  validateWorkflows?: boolean;
  customRules?: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  check: (document: MPMLDocument) => ValidationError[];
}

export class MPMLValidator {
  private readonly logger: Logger;
  private readonly customRules: ValidationRule[] = [];

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupDefaultRules();
  }

  /**
   * 验证MPML文档
   */
  public validate(document: MPMLDocument, options: ValidationOptions = {}): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      this.logger.debug('Starting MPML validation', {
        type: document.type,
        title: document.metadata.title
      });

      // 基础验证
      errors.push(...this.validateBasicStructure(document));
      
      // 元数据验�?      errors.push(...this.validateMetadata(document.metadata));
      
      // 团队配置验证
      if (document.teamConfig) {
        errors.push(...this.validateTeamConfig(document.teamConfig));
      }
      
      // 工作流验�?      if (document.workflow && options.validateWorkflows) {
        errors.push(...this.validateWorkflow(document.workflow));
      }
      
      // 引用验证
      if (options.checkReferences && document.projectMemory) {
        errors.push(...this.validateReferences(document));
      }
      
      // 自定义规则验�?      for (const rule of this.customRules) {
        errors.push(...rule.check(document));
      }
      
      // 用户自定义规�?      if (options.customRules) {
        for (const rule of options.customRules) {
          errors.push(...rule.check(document));
        }
      }
      
      // 生成警告
      warnings.push(...this.generateWarnings(document, options));
      
      const result: ValidationResult = {
        valid: errors.filter(e => e.severity === 'error').length === 0,
        errors,
        warnings
      };
      
      this.logger.info('MPML validation completed', {
        valid: result.valid,
        errorCount: errors.length,
        warningCount: warnings.length
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('MPML validation failed', { error });
      
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_FAILED',
          message: `Validation process failed: ${error instanceof Error ? error.message : String(error)}`,
          path: 'root',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * 添加自定义验证规�?   */
  public addCustomRule(rule: ValidationRule): void {
    this.customRules.push(rule);
    this.logger.debug('Custom validation rule added', { name: rule.name });
  }

  /**
   * 验证基础结构
   */
  private validateBasicStructure(document: MPMLDocument): ValidationError[] {
    const errors: ValidationError[] = [];

    // 验证版本
    if (!document.version) {
      errors.push({
        code: 'MISSING_VERSION',
        message: 'Document version is required',
        path: 'root.version',
        severity: 'error'
      });
    } else if (!this.isValidVersion(document.version)) {
      errors.push({
        code: 'INVALID_VERSION',
        message: `Invalid version format: ${document.version}`,
        path: 'root.version',
        severity: 'error'
      });
    }

    // 验证类型
    if (!document.type) {
      errors.push({
        code: 'MISSING_TYPE',
        message: 'Document type is required',
        path: 'root.type',
        severity: 'error'
      });
    } else if (!this.isValidType(document.type)) {
      errors.push({
        code: 'INVALID_TYPE',
        message: `Invalid document type: ${document.type}`,
        path: 'root.type',
        severity: 'error'
      });
    }

    // 验证类别
    if (!document.category) {
      errors.push({
        code: 'MISSING_CATEGORY',
        message: 'Document category is required',
        path: 'root.category',
        severity: 'warning'
      });
    }

    return errors;
  }

  /**
   * 验证元数�?   */
  private validateMetadata(metadata: MPMLMetadata): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!metadata.title) {
      errors.push({
        code: 'MISSING_TITLE',
        message: 'Metadata title is required',
        path: 'metadata.title',
        severity: 'error'
      });
    }

    if (!metadata.team) {
      errors.push({
        code: 'MISSING_TEAM',
        message: 'Metadata team is required',
        path: 'metadata.team',
        severity: 'error'
      });
    }

    if (!metadata.projectType) {
      errors.push({
        code: 'MISSING_PROJECT_TYPE',
        message: 'Metadata project type is required',
        path: 'metadata.projectType',
        severity: 'warning'
      });
    }

    if (!metadata.collaborationMode) {
      errors.push({
        code: 'MISSING_COLLABORATION_MODE',
        message: 'Metadata collaboration mode is required',
        path: 'metadata.collaborationMode',
        severity: 'warning'
      });
    }

    return errors;
  }

  /**
   * 验证团队配置
   */
  private validateTeamConfig(teamConfig: TeamConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    // 验证团队名称
    if (!teamConfig.name) {
      errors.push({
        code: 'MISSING_TEAM_NAME',
        message: 'Team name is required',
        path: 'teamConfig.name',
        severity: 'error'
      });
    }

    // 验证角色
    if (!teamConfig.roles || teamConfig.roles.length === 0) {
      errors.push({
        code: 'NO_ROLES',
        message: 'Team must have at least one role',
        path: 'teamConfig.roles',
        severity: 'error'
      });
    } else {
      errors.push(...this.validateRoles(teamConfig.roles));
    }

    // 验证协作规则
    if (teamConfig.collaborationRules) {
      errors.push(...this.validateCollaborationRules(teamConfig.collaborationRules, teamConfig.roles));
    }

    return errors;
  }

  /**
   * 验证角色
   */
  private validateRoles(roles: RoleConfig[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const roleIds = new Set<string>();

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const path = `teamConfig.roles[${i}]`;

      // 验证角色ID
      if (!role.id) {
        errors.push({
          code: 'MISSING_ROLE_ID',
          message: 'Role ID is required',
          path: `${path}.id`,
          severity: 'error'
        });
      } else if (roleIds.has(role.id)) {
        errors.push({
          code: 'DUPLICATE_ROLE_ID',
          message: `Duplicate role ID: ${role.id}`,
          path: `${path}.id`,
          severity: 'error'
        });
      } else {
        roleIds.add(role.id);
      }

      // 验证角色名称
      if (!role.name) {
        errors.push({
          code: 'MISSING_ROLE_NAME',
          message: 'Role name is required',
          path: `${path}.name`,
          severity: 'error'
        });
      }

      // 验证角色类型
      if (!role.type) {
        errors.push({
          code: 'MISSING_ROLE_TYPE',
          message: 'Role type is required',
          path: `${path}.type`,
          severity: 'error'
        });
      } else if (!this.isValidRoleType(role.type)) {
        errors.push({
          code: 'INVALID_ROLE_TYPE',
          message: `Invalid role type: ${role.type}`,
          path: `${path}.type`,
          severity: 'error'
        });
      }

      // 验证能力
      if (!role.capabilities || role.capabilities.length === 0) {
        errors.push({
          code: 'NO_CAPABILITIES',
          message: 'Role must have at least one capability',
          path: `${path}.capabilities`,
          severity: 'warning'
        });
      }

      // 验证优先�?      if (role.priority < 1 || role.priority > 10) {
        errors.push({
          code: 'INVALID_PRIORITY',
          message: 'Role priority must be between 1 and 10',
          path: `${path}.priority`,
          severity: 'warning'
        });
      }
    }

    return errors;
  }

  /**
   * 验证协作规则
   */
  private validateCollaborationRules(rules: any[], roles: RoleConfig[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const roleIds = new Set(roles.map(r => r.id));

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const path = `teamConfig.collaborationRules[${i}]`;

      // 验证规则类型
      if (!rule.type) {
        errors.push({
          code: 'MISSING_RULE_TYPE',
          message: 'Collaboration rule type is required',
          path: `${path}.type`,
          severity: 'error'
        });
      }

      // 验证from角色
      if (!rule.from) {
        errors.push({
          code: 'MISSING_RULE_FROM',
          message: 'Collaboration rule from is required',
          path: `${path}.from`,
          severity: 'error'
        });
      } else {
        const fromRoles = Array.isArray(rule.from) ? rule.from : [rule.from];
        for (const roleId of fromRoles) {
          if (!roleIds.has(roleId)) {
            errors.push({
              code: 'INVALID_RULE_FROM',
              message: `Unknown role in from: ${roleId}`,
              path: `${path}.from`,
              severity: 'error'
            });
          }
        }
      }

      // 验证to角色
      if (!rule.to) {
        errors.push({
          code: 'MISSING_RULE_TO',
          message: 'Collaboration rule to is required',
          path: `${path}.to`,
          severity: 'error'
        });
      } else {
        const toRoles = Array.isArray(rule.to) ? rule.to : [rule.to];
        for (const roleId of toRoles) {
          if (!roleIds.has(roleId)) {
            errors.push({
              code: 'INVALID_RULE_TO',
              message: `Unknown role in to: ${roleId}`,
              path: `${path}.to`,
              severity: 'error'
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * 验证工作�?   */
  private validateWorkflow(workflow: WorkflowConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!workflow.name) {
      errors.push({
        code: 'MISSING_WORKFLOW_NAME',
        message: 'Workflow name is required',
        path: 'workflow.name',
        severity: 'error'
      });
    }

    if (!workflow.phases || workflow.phases.length === 0) {
      errors.push({
        code: 'NO_WORKFLOW_PHASES',
        message: 'Workflow must have at least one phase',
        path: 'workflow.phases',
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * 验证引用
   */
  private validateReferences(document: MPMLDocument): ValidationError[] {
    const errors: ValidationError[] = [];

    if (document.projectMemory) {
      // 验证上下文引�?      for (let i = 0; i < document.projectMemory.context.length; i++) {
        const ref = document.projectMemory.context[i];
        if (!this.isValidMemoryReference(ref.ref)) {
          errors.push({
            code: 'INVALID_MEMORY_REFERENCE',
            message: `Invalid memory reference: ${ref.ref}`,
            path: `projectMemory.context[${i}].ref`,
            severity: 'warning'
          });
        }
      }
    }

    return errors;
  }

  /**
   * 生成警告
   */
  private generateWarnings(document: MPMLDocument, options: ValidationOptions): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // 检查是否有描述
    if (!document.metadata.title || document.metadata.title === 'Untitled MPML Document') {
      warnings.push({
        code: 'GENERIC_TITLE',
        message: 'Consider providing a more descriptive title',
        path: 'metadata.title',
        suggestion: 'Use a title that describes the project or team purpose'
      });
    }

    // 检查团队配�?    if (document.teamConfig && document.teamConfig.roles.length > 10) {
      warnings.push({
        code: 'TOO_MANY_ROLES',
        message: 'Large number of roles may impact performance',
        path: 'teamConfig.roles',
        suggestion: 'Consider grouping related roles or using role hierarchies'
      });
    }

    return warnings;
  }

  /**
   * 设置默认规则
   */
  private setupDefaultRules(): void {
    // 角色平衡检�?    this.addCustomRule({
      name: 'role-balance-check',
      check: (document: MPMLDocument) => {
        const errors: ValidationError[] = [];
        
        if (document.teamConfig) {
          const roleTypes = document.teamConfig.roles.map(r => r.type);
          const uniqueTypes = new Set(roleTypes);
          
          if (uniqueTypes.size < roleTypes.length / 2) {
            errors.push({
              code: 'UNBALANCED_ROLES',
              message: 'Team roles may be unbalanced - consider role diversity',
              path: 'teamConfig.roles',
              severity: 'warning'
            });
          }
        }
        
        return errors;
      }
    });

    // 工作流完整性检�?    this.addCustomRule({
      name: 'workflow-completeness-check',
      check: (document: MPMLDocument) => {
        const errors: ValidationError[] = [];
        
        if (document.workflow && document.teamConfig) {
          const workflowRoles = new Set<string>();
          
          for (const phase of document.workflow.phases) {
            if (typeof phase.owner === 'string') {
              workflowRoles.add(phase.owner);
            }
            if (Array.isArray(phase.collaborators)) {
              phase.collaborators.forEach(c => workflowRoles.add(c));
            }
          }
          
          const teamRoles = new Set(document.teamConfig.roles.map(r => r.id));
          const missingRoles = Array.from(workflowRoles).filter(r => !teamRoles.has(r));
          
          if (missingRoles.length > 0) {
            errors.push({
              code: 'WORKFLOW_MISSING_ROLES',
              message: `Workflow references undefined roles: ${missingRoles.join(', ')}`,
              path: 'workflow',
              severity: 'error'
            });
          }
        }
        
        return errors;
      }
    });
  }

  /**
   * 验证版本格式
   */
  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+$/.test(version);
  }

  /**
   * 验证文档类型
   */
  private isValidType(type: string): boolean {
    const validTypes = ['team-project', 'role-definition', 'workflow', 'memory-context'];
    return validTypes.includes(type);
  }

  /**
   * 验证角色类型
   */
  private isValidRoleType(type: string): boolean {
    const validTypes = ['architect', 'designer', 'developer', 'tester', 'product-manager', 'devops', 'specialist'];
    return validTypes.includes(type);
  }

  /**
   * 验证记忆引用
   */
  private isValidMemoryReference(ref: string): boolean {
    return /^@!memory:\/\/[\w\-\/]+$/.test(ref);
  }
}
