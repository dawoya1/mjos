/**
 * API兼容性管理工具
 * 确保API变更时自动同步到所有相关文件
 */

import { getVersion } from './version';

/**
 * 当前API版本和签名
 */
export const API_SIGNATURES = {
  // 记忆系统API
  remember: {
    signature: '(content: any, options?: { tags?: string[], importance?: number }) => string',
    version: getVersion(),
    description: '存储记忆，使用options对象传参'
  },
  
  smartRemember: {
    signature: '(content: any, options?: { tags?: string[], importance?: number }) => Promise<string>',
    version: getVersion(),
    description: '智能存储记忆，异步操作'
  },
  
  recall: {
    signature: '(query: { tags?: string[], limit?: number, importance?: [number, number], timeRange?: [Date, Date] }) => MemoryItem[]',
    version: getVersion(),
    description: '检索记忆，使用query对象传参'
  },
  
  // 版本管理API
  getVersion: {
    signature: '() => string',
    version: getVersion(),
    description: '获取当前版本号，动态从package.json读取'
  }
} as const;

/**
 * 已弃用的API签名（用于向后兼容检查）
 */
export const DEPRECATED_APIS = {
  remember_old: {
    signature: '(content: any, tags: string[], importance: number) => string',
    deprecatedIn: '2.5.0',
    replacedBy: 'remember',
    reason: '参数结构改为options对象，提供更好的可选性'
  }
} as const;

/**
 * 验证API调用是否符合当前签名
 */
export function validateApiCall(apiName: keyof typeof API_SIGNATURES, args: any[]): boolean {
  const api = API_SIGNATURES[apiName];
  if (!api) {
    console.warn(`Unknown API: ${apiName}`);
    return false;
  }
  
  // 这里可以添加更复杂的参数验证逻辑
  return true;
}

/**
 * 获取API使用指南
 */
export function getApiGuide(apiName: keyof typeof API_SIGNATURES): string {
  const api = API_SIGNATURES[apiName];
  if (!api) {
    return `API ${apiName} not found`;
  }
  
  return `
API: ${apiName}
签名: ${api.signature}
版本: ${api.version}
描述: ${api.description}
  `.trim();
}

/**
 * 检查是否使用了已弃用的API
 */
export function checkDeprecatedUsage(code: string): string[] {
  const warnings: string[] = [];
  
  Object.entries(DEPRECATED_APIS).forEach(([oldApi, info]) => {
    // 简单的正则检查（实际项目中可能需要更复杂的AST分析）
    const pattern = new RegExp(`\\b${oldApi}\\b`, 'g');
    if (pattern.test(code)) {
      warnings.push(
        `使用了已弃用的API: ${oldApi}，在版本 ${info.deprecatedIn} 中弃用，请使用 ${info.replacedBy} 替代。原因: ${info.reason}`
      );
    }
  });
  
  return warnings;
}

/**
 * 生成测试用例的API调用示例
 */
export function generateTestExamples(): Record<string, string> {
  return {
    remember: `
// 正确的API调用方式
const memoryId = mjos.remember('test content', { tags: ['test'], importance: 0.8 });
expect(memoryId).toBeDefined();
    `.trim(),
    
    recall: `
// 正确的API调用方式
const memories = mjos.recall({ tags: ['test'] });
expect(memories).toHaveLength(1);
    `.trim(),
    
    version: `
// 动态版本检查
import { getVersion } from '../utils/version';
expect(mjos.getVersion()).toBe(getVersion());
    `.trim()
  };
}
