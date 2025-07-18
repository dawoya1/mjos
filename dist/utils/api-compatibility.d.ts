/**
 * API兼容性管理工具
 * 确保API变更时自动同步到所有相关文件
 */
/**
 * 当前API版本和签名
 */
export declare const API_SIGNATURES: {
    readonly remember: {
        readonly signature: "(content: any, options?: { tags?: string[], importance?: number }) => string";
        readonly version: string;
        readonly description: "存储记忆，使用options对象传参";
    };
    readonly smartRemember: {
        readonly signature: "(content: any, options?: { tags?: string[], importance?: number }) => Promise<string>";
        readonly version: string;
        readonly description: "智能存储记忆，异步操作";
    };
    readonly recall: {
        readonly signature: "(query: { tags?: string[], limit?: number, importance?: [number, number], timeRange?: [Date, Date] }) => MemoryItem[]";
        readonly version: string;
        readonly description: "检索记忆，使用query对象传参";
    };
    readonly getVersion: {
        readonly signature: "() => string";
        readonly version: string;
        readonly description: "获取当前版本号，动态从package.json读取";
    };
};
/**
 * 已弃用的API签名（用于向后兼容检查）
 */
export declare const DEPRECATED_APIS: {
    readonly remember_old: {
        readonly signature: "(content: any, tags: string[], importance: number) => string";
        readonly deprecatedIn: "2.5.0";
        readonly replacedBy: "remember";
        readonly reason: "参数结构改为options对象，提供更好的可选性";
    };
};
/**
 * 验证API调用是否符合当前签名
 */
export declare function validateApiCall(apiName: keyof typeof API_SIGNATURES, args: any[]): boolean;
/**
 * 获取API使用指南
 */
export declare function getApiGuide(apiName: keyof typeof API_SIGNATURES): string;
/**
 * 检查是否使用了已弃用的API
 */
export declare function checkDeprecatedUsage(code: string): string[];
/**
 * 生成测试用例的API调用示例
 */
export declare function generateTestExamples(): Record<string, string>;
//# sourceMappingURL=api-compatibility.d.ts.map