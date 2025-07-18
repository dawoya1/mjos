"use strict";
/**
 * 优化的ID生成系统
 * Optimized ID Generation System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedIDGenerator = exports.IDType = void 0;
var IDType;
(function (IDType) {
    IDType["MEMORY"] = "mem";
    IDType["TASK"] = "task";
    IDType["PROJECT"] = "proj";
    IDType["KNOWLEDGE"] = "know";
    IDType["AGENT"] = "agent";
    IDType["WORKFLOW"] = "flow";
    IDType["SESSION"] = "sess";
    IDType["USER"] = "user";
})(IDType || (exports.IDType = IDType = {}));
class OptimizedIDGenerator {
    constructor() {
        this.projectRegistry = new Map();
    }
    static getInstance() {
        if (!OptimizedIDGenerator.instance) {
            OptimizedIDGenerator.instance = new OptimizedIDGenerator();
        }
        return OptimizedIDGenerator.instance;
    }
    /**
     * 生成优化的ID
     * @param type ID类型
     * @param projectId 项目ID（可选）
     * @param customPrefix 自定义前缀（可选）
     */
    generateID(type, projectId, customPrefix) {
        const timestamp = Date.now();
        const random = this.generateRandomString(9);
        let id = `${type}_`;
        // 添加项目ID
        if (projectId) {
            const sanitizedProjectId = this.sanitizeProjectId(projectId);
            id += `${sanitizedProjectId}_`;
            // 注册项目ID
            this.registerProject(sanitizedProjectId);
        }
        // 添加自定义前缀
        if (customPrefix) {
            id += `${customPrefix}_`;
        }
        // 添加时间戳和随机字符串
        id += `${timestamp}_${random}`;
        return id;
    }
    /**
     * 解析ID组件
     */
    parseID(id) {
        const parts = id.split('_');
        if (parts.length < 3)
            return null;
        const type = parts[0];
        const timestamp = parseInt(parts[parts.length - 2]);
        const random = parts[parts.length - 1];
        // 检查是否有项目ID
        let projectId;
        if (parts.length > 3) {
            // 可能包含项目ID，需要进一步解析
            const potentialProjectId = parts[1];
            if (this.isValidProjectId(potentialProjectId)) {
                projectId = potentialProjectId;
            }
        }
        return {
            type,
            projectId,
            timestamp,
            random
        };
    }
    /**
     * 生成项目专用ID
     */
    generateProjectID(projectName) {
        const sanitized = this.sanitizeProjectId(projectName);
        const timestamp = Date.now();
        const random = this.generateRandomString(6);
        const projectId = `${sanitized}_${timestamp}_${random}`;
        this.registerProject(projectId);
        return projectId;
    }
    /**
     * 为特定项目生成记忆ID
     */
    generateMemoryID(projectId, category) {
        let id = this.generateID(IDType.MEMORY, projectId);
        if (category) {
            // 在随机字符串前插入分类
            const parts = id.split('_');
            const random = parts.pop();
            const timestamp = parts.pop();
            parts.push(category, timestamp, random);
            id = parts.join('_');
        }
        return id;
    }
    /**
     * 为特定项目生成任务ID
     */
    generateTaskID(projectId, priority) {
        const priorityPrefix = priority ? priority.charAt(0) : '';
        return this.generateID(IDType.TASK, projectId, priorityPrefix);
    }
    /**
     * 批量生成ID
     */
    generateBatchIDs(type, count, projectId) {
        const ids = [];
        const baseTimestamp = Date.now();
        for (let i = 0; i < count; i++) {
            const timestamp = baseTimestamp + i; // 确保时间戳唯一
            const random = this.generateRandomString(9);
            let id = `${type}_`;
            if (projectId) {
                id += `${this.sanitizeProjectId(projectId)}_`;
            }
            id += `${timestamp}_${random}`;
            ids.push(id);
        }
        return ids;
    }
    /**
     * 检查ID是否属于特定项目
     */
    belongsToProject(id, projectId) {
        const components = this.parseID(id);
        return components?.projectId === projectId;
    }
    /**
     * 从ID中提取项目ID
     */
    extractProjectId(id) {
        const components = this.parseID(id);
        return components?.projectId || null;
    }
    /**
     * 获取ID的创建时间
     */
    getCreationTime(id) {
        const components = this.parseID(id);
        return components ? new Date(components.timestamp) : null;
    }
    /**
     * 验证ID格式
     */
    validateID(id) {
        const components = this.parseID(id);
        if (!components)
            return false;
        // 检查类型是否有效
        if (!Object.values(IDType).includes(components.type))
            return false;
        // 检查时间戳是否合理
        const now = Date.now();
        if (components.timestamp > now || components.timestamp < (now - 365 * 24 * 60 * 60 * 1000)) {
            return false; // 时间戳不能是未来时间或超过一年前
        }
        // 检查随机字符串格式
        if (!/^[a-z0-9]{9}$/.test(components.random))
            return false;
        return true;
    }
    /**
     * 生成查询模式
     */
    generateQueryPattern(type, projectId) {
        let pattern = '';
        if (type) {
            pattern += `${type}_`;
        }
        else {
            pattern += `(${Object.values(IDType).join('|')})_`;
        }
        if (projectId) {
            pattern += `${this.sanitizeProjectId(projectId)}_`;
        }
        pattern += `\\d+_[a-z0-9]{9}`;
        return new RegExp(pattern);
    }
    /**
     * 获取所有注册的项目
     */
    getRegisteredProjects() {
        return Array.from(this.projectRegistry.keys());
    }
    /**
     * 生成统计报告
     */
    generateStats(ids) {
        const stats = {
            totalCount: ids.length,
            byType: {},
            byProject: {},
            timeRange: null
        };
        let earliestTime = Number.MAX_SAFE_INTEGER;
        let latestTime = 0;
        ids.forEach(id => {
            const components = this.parseID(id);
            if (!components)
                return;
            // 统计类型
            stats.byType[components.type] = (stats.byType[components.type] || 0) + 1;
            // 统计项目
            if (components.projectId) {
                stats.byProject[components.projectId] = (stats.byProject[components.projectId] || 0) + 1;
            }
            // 统计时间范围
            if (components.timestamp < earliestTime) {
                earliestTime = components.timestamp;
            }
            if (components.timestamp > latestTime) {
                latestTime = components.timestamp;
            }
        });
        if (earliestTime !== Number.MAX_SAFE_INTEGER) {
            stats.timeRange = {
                earliest: new Date(earliestTime),
                latest: new Date(latestTime)
            };
        }
        return stats;
    }
    /**
     * 清理项目ID
     */
    sanitizeProjectId(projectId) {
        return projectId
            .toLowerCase()
            .replace(/[^a-z0-9\-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 20); // 限制长度
    }
    /**
     * 生成随机字符串
     */
    generateRandomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * 验证项目ID格式
     */
    isValidProjectId(projectId) {
        return /^[a-z0-9\-]{1,20}$/.test(projectId);
    }
    /**
     * 注册项目ID
     */
    registerProject(projectId) {
        if (!this.projectRegistry.has(projectId)) {
            this.projectRegistry.set(projectId, new Date().toISOString());
        }
    }
}
exports.OptimizedIDGenerator = OptimizedIDGenerator;
exports.default = OptimizedIDGenerator;
//# sourceMappingURL=OptimizedIDGenerator.js.map