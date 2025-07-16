/**
 * MPML Utilities
 * Magic Prompt Markup Language 工具函数
 */

import { Logger } from 'winston';
import { EventBus } from '@core/EventBus';
import { LoggerFactory } from '@core/LoggerFactory';
import { MPMLParser, MPMLDocument, MPMLParseOptions } from './MPMLParser';
import { MPMLValidator, ValidationResult, ValidationOptions } from './MPMLValidator';

/**
 * 创建MPML解析�? */
export function createMPMLParser(logger?: Logger, eventBus?: EventBus): MPMLParser {
  const defaultLogger = logger || LoggerFactory.createLogger({
    level: 'info',
    format: 'simple',
    outputs: ['console']
  });
  
  const defaultEventBus = eventBus || new EventBus(defaultLogger);
  
  return new MPMLParser(defaultLogger, defaultEventBus);
}

/**
 * 解析MPML内容的便捷函�? */
export async function parseMPML(
  content: string, 
  options: MPMLParseOptions = {},
  logger?: Logger,
  eventBus?: EventBus
): Promise<MPMLDocument> {
  const parser = createMPMLParser(logger, eventBus);
  return await parser.parse(content, options);
}

/**
 * 验证MPML文档的便捷函�? */
export function validateMPML(
  document: MPMLDocument,
  options: ValidationOptions = {},
  logger?: Logger
): ValidationResult {
  const defaultLogger = logger || LoggerFactory.createLogger({
    level: 'info',
    format: 'simple',
    outputs: ['console']
  });
  
  const validator = new MPMLValidator(defaultLogger);
  return validator.validate(document, options);
}

/**
 * 生成MPML模板
 */
export function generateMPMLTemplate(templateType: 'basic' | 'team-project' | 'workflow' = 'basic'): string {
  switch (templateType) {
    case 'team-project':
      return generateTeamProjectTemplate();
    case 'workflow':
      return generateWorkflowTemplate();
    default:
      return generateBasicTemplate();
  }
}

/**
 * 生成基础模板
 */
function generateBasicTemplate(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="general">
  <metadata>
    <title>新建MPML项目</title>
    <team>魔剑工作�?/team>
    <project-type>general</project-type>
    <collaboration-mode>sequential</collaboration-mode>
  </metadata>

  <team-config>
    <roles>
      <role id="architect" type="architect" priority="1" initial-state="READY" memory-access="global">
        <name>架构�?/name>
        <capabilities>system-design,team-coordination</capabilities>
      </role>
    </roles>
    
    <collaboration-rules>
      <rule type="handoff" from="architect" to="developer" condition="design_complete"/>
    </collaboration-rules>
  </team-config>
</mjos>`;
}

/**
 * 生成团队项目模板
 */
function generateTeamProjectTemplate(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="team-project" category="full-stack-development">
  <metadata>
    <title>魔剑工作室多端应用开发项�?/title>
    <team>魔剑工作�?/team>
    <project-type>multi-platform-application</project-type>
    <collaboration-mode>hybrid</collaboration-mode>
  </metadata>

  <team-config>
    <roles>
      <role id="moxiaozhi" type="architect" priority="1" initial-state="READY" memory-access="global">
        <name>莫小�?/name>
        <capabilities>role-creation,system-architecture,team-collaboration</capabilities>
      </role>
      <role id="moxiaomei" type="designer" priority="2" initial-state="READY" memory-access="shared">
        <name>莫小�?/name>
        <capabilities>ui-design,ux-optimization,visual-design</capabilities>
      </role>
      <role id="moxiaoma" type="developer" priority="2" initial-state="READY" memory-access="shared">
        <name>莫小�?/name>
        <capabilities>frontend-development,backend-development,system-integration</capabilities>
      </role>
      <role id="moxiaocang" type="specialist" priority="2" initial-state="READY" memory-access="shared">
        <name>莫小�?/name>
        <capabilities>cangjie-language,multi-platform-development,performance-optimization</capabilities>
      </role>
    </roles>
    
    <collaboration-rules>
      <rule type="handoff" from="moxiaozhi" to="moxiaomei" condition="requirements_complete"/>
      <rule type="handoff" from="moxiaomei" to="moxiaoma,moxiaocang" condition="design_complete"/>
      <rule type="parallel" from="moxiaoma,moxiaocang" to="moxiaoceshi" condition="development_complete"/>
    </collaboration-rules>
  </team-config>

  <project-memory>
    <context>
      <ref>@!memory://project/requirements</ref>
      <ref>@!memory://project/constraints</ref>
    </context>
    <history>
      <ref>@!memory://project/previous-projects</ref>
    </history>
    <lessons>
      <ref>@!memory://team/lessons-learned</ref>
    </lessons>
  </project-memory>

  <workflow name="application_development">
    <description>多端应用开发标准流�?/description>
    <phase name="planning" owner="moxiaozhi" collaborators="moxiaomei,moxiaoma" duration="2">
      <deliverables>需求分�?技术架�?UI设计要求</deliverables>
    </phase>
    <phase name="design" owner="moxiaomei" collaborators="moxiaozhi,moxiaoma" duration="3">
      <deliverables>UI设计,交互原型,视觉规范</deliverables>
    </phase>
    <phase name="development" owner="moxiaoma,moxiaocang" collaborators="moxiaomei" duration="5">
      <deliverables>前端实现,后端开�?多端适配</deliverables>
    </phase>
    <triggers>
      <trigger event="project_start" condition="has_requirements" action="start_planning_phase"/>
      <trigger event="phase_complete" condition="deliverables_approved" action="start_next_phase"/>
    </triggers>
  </workflow>
</mjos>`;
}

/**
 * 生成工作流模�? */
function generateWorkflowTemplate(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mjos version="2.0" type="workflow" category="development-process">
  <metadata>
    <title>敏捷开发工作流</title>
    <team>魔剑工作�?/team>
    <project-type>agile-development</project-type>
    <collaboration-mode>iterative</collaboration-mode>
  </metadata>

  <workflow name="agile_development">
    <description>敏捷开发迭代流�?/description>
    <phase name="sprint_planning" owner="product-manager" collaborators="architect,developer" duration="1">
      <deliverables>Sprint目标,任务分解,工作量估�?/deliverables>
    </phase>
    <phase name="development_sprint" owner="developer" collaborators="designer,tester" duration="10">
      <deliverables>功能实现,单元测试,集成测试</deliverables>
    </phase>
    <phase name="sprint_review" owner="product-manager" collaborators="all" duration="1">
      <deliverables>演示成果,收集反馈,调整计划</deliverables>
    </phase>
    <triggers>
      <trigger event="sprint_start" condition="planning_complete" action="start_development"/>
      <trigger event="development_complete" condition="tests_passed" action="start_review"/>
      <trigger event="review_complete" condition="feedback_collected" action="start_next_sprint"/>
    </triggers>
  </workflow>
</mjos>`;
}

/**
 * 格式化验证结�? */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`Validation Result: ${result.valid ? 'VALID' : 'INVALID'}`);
  lines.push('');
  
  if (result.errors.length > 0) {
    lines.push('Errors:');
    for (const error of result.errors) {
      lines.push(`  [${error.severity.toUpperCase()}] ${error.code}: ${error.message}`);
      lines.push(`    Path: ${error.path}`);
    }
    lines.push('');
  }
  
  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      lines.push(`  [WARNING] ${warning.code}: ${warning.message}`);
      lines.push(`    Path: ${warning.path}`);
      if (warning.suggestion) {
        lines.push(`    Suggestion: ${warning.suggestion}`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * 提取MPML文档摘要
 */
export function extractDocumentSummary(document: MPMLDocument): {
  title: string;
  type: string;
  team: string;
  roleCount: number;
  hasWorkflow: boolean;
  hasMemory: boolean;
} {
  return {
    title: document.metadata.title,
    type: document.type,
    team: document.metadata.team,
    roleCount: document.teamConfig?.roles.length || 0,
    hasWorkflow: !!document.workflow,
    hasMemory: !!document.projectMemory
  };
}

/**
 * 合并MPML文档
 */
export function mergeMPMLDocuments(base: MPMLDocument, overlay: Partial<MPMLDocument>): MPMLDocument {
  const merged: MPMLDocument = {
    ...base,
    ...overlay,
    metadata: {
      ...base.metadata,
      ...overlay.metadata,
      updatedAt: new Date()
    }
  };
  
  // 合并团队配置
  if (overlay.teamConfig && base.teamConfig) {
    merged.teamConfig = {
      ...base.teamConfig,
      ...overlay.teamConfig,
      roles: [...(base.teamConfig.roles || []), ...(overlay.teamConfig.roles || [])],
      collaborationRules: [...(base.teamConfig.collaborationRules || []), ...(overlay.teamConfig.collaborationRules || [])]
    };
  }
  
  return merged;
}

/**
 * 转换为JSON格式
 */
export function mpmlToJSON(document: MPMLDocument): string {
  return JSON.stringify(document, null, 2);
}

/**
 * 从JSON格式转换
 */
export function jsonToMPML(json: string): MPMLDocument {
  const parsed = JSON.parse(json);
  
  // 转换日期字符�?  if (parsed.metadata?.createdAt) {
    parsed.metadata.createdAt = new Date(parsed.metadata.createdAt);
  }
  if (parsed.metadata?.updatedAt) {
    parsed.metadata.updatedAt = new Date(parsed.metadata.updatedAt);
  }
  
  return parsed as MPMLDocument;
}
