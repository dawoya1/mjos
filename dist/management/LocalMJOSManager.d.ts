/**
 * MJOS本地管理系统 - 实时监测和管理
 * Local MJOS Management System - Real-time Monitoring and Management
 */
import { MJOS } from '../index';
export interface SystemMetrics {
    timestamp: Date;
    systemStatus: any;
    teamMetrics: {
        totalMembers: number;
        activeMembers: number;
        learningActivities: number;
        performanceAverage: number;
    };
    memoryMetrics: {
        totalMemories: number;
        recentMemories: number;
        memoryGrowthRate: number;
    };
    projectMetrics: {
        activeProjects: number;
        completedTasks: number;
        successRate: number;
    };
}
export declare class LocalMJOSManager {
    private mjos;
    private teamSystem;
    private isMonitoring;
    private metricsHistory;
    private webServerPort;
    constructor(mjos: MJOS);
    /**
     * 启动本地管理系统
     */
    startManagement(): Promise<void>;
    /**
     * 显示欢迎信息
     */
    private displayWelcome;
    /**
     * 启动实时监控
     */
    private startRealTimeMonitoring;
    /**
     * 更新监控面板
     */
    private updateMonitoringDashboard;
    /**
     * 收集系统指标
     */
    private collectSystemMetrics;
    /**
     * 启动Web界面
     */
    private startWebInterface;
    /**
     * 启动CLI交互界面
     */
    private startCLIInterface;
    /**
     * 显示团队详情
     */
    private showTeamDetails;
    /**
     * 显示记忆分析
     */
    private showMemoryAnalysis;
    /**
     * 格式化运行时间
     */
    private formatUptime;
    /**
     * 停止监控
     */
    private stopMonitoring;
    private showProjectStatus;
    private generatePerformanceReport;
    private showSystemLogs;
    private showConfiguration;
    private exportData;
    private restartSystem;
}
export default LocalMJOSManager;
//# sourceMappingURL=LocalMJOSManager.d.ts.map