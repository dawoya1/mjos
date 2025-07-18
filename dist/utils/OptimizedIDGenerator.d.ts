/**
 * 优化的ID生成系统
 * Optimized ID Generation System
 */
export declare enum IDType {
    MEMORY = "mem",
    TASK = "task",
    PROJECT = "proj",
    KNOWLEDGE = "know",
    AGENT = "agent",
    WORKFLOW = "flow",
    SESSION = "sess",
    USER = "user"
}
export interface IDComponents {
    type: IDType;
    projectId?: string;
    timestamp: number;
    random: string;
}
export declare class OptimizedIDGenerator {
    private static instance;
    private projectRegistry;
    private constructor();
    static getInstance(): OptimizedIDGenerator;
    /**
     * 生成优化的ID
     * @param type ID类型
     * @param projectId 项目ID（可选）
     * @param customPrefix 自定义前缀（可选）
     */
    generateID(type: IDType, projectId?: string, customPrefix?: string): string;
    /**
     * 解析ID组件
     */
    parseID(id: string): IDComponents | null;
    /**
     * 生成项目专用ID
     */
    generateProjectID(projectName: string): string;
    /**
     * 为特定项目生成记忆ID
     */
    generateMemoryID(projectId: string, category?: string): string;
    /**
     * 为特定项目生成任务ID
     */
    generateTaskID(projectId: string, priority?: 'low' | 'medium' | 'high'): string;
    /**
     * 批量生成ID
     */
    generateBatchIDs(type: IDType, count: number, projectId?: string): string[];
    /**
     * 检查ID是否属于特定项目
     */
    belongsToProject(id: string, projectId: string): boolean;
    /**
     * 从ID中提取项目ID
     */
    extractProjectId(id: string): string | null;
    /**
     * 获取ID的创建时间
     */
    getCreationTime(id: string): Date | null;
    /**
     * 验证ID格式
     */
    validateID(id: string): boolean;
    /**
     * 生成查询模式
     */
    generateQueryPattern(type?: IDType, projectId?: string): RegExp;
    /**
     * 获取所有注册的项目
     */
    getRegisteredProjects(): string[];
    /**
     * 生成统计报告
     */
    generateStats(ids: string[]): {
        totalCount: number;
        byType: Record<string, number>;
        byProject: Record<string, number>;
        timeRange: {
            earliest: Date;
            latest: Date;
        } | null;
    };
    /**
     * 清理项目ID
     */
    private sanitizeProjectId;
    /**
     * 生成随机字符串
     */
    private generateRandomString;
    /**
     * 验证项目ID格式
     */
    private isValidProjectId;
    /**
     * 注册项目ID
     */
    private registerProject;
}
export default OptimizedIDGenerator;
//# sourceMappingURL=OptimizedIDGenerator.d.ts.map