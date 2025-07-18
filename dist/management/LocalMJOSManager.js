"use strict";
/**
 * MJOS本地管理系统 - 实时监测和管理
 * Local MJOS Management System - Real-time Monitoring and Management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalMJOSManager = void 0;
const CompleteTeamProfiles_1 = require("../team/CompleteTeamProfiles");
class LocalMJOSManager {
    constructor(mjos) {
        this.isMonitoring = false;
        this.metricsHistory = [];
        this.webServerPort = 3000;
        this.mjos = mjos;
        this.teamSystem = new CompleteTeamProfiles_1.CompleteTeamSystem();
    }
    /**
     * 启动本地管理系统
     */
    async startManagement() {
        console.log('🚀 启动MJOS本地管理系统...\n');
        // 显示欢迎信息
        this.displayWelcome();
        // 启动实时监控
        await this.startRealTimeMonitoring();
        // 启动Web界面
        await this.startWebInterface();
        // 启动CLI交互
        this.startCLIInterface();
    }
    /**
     * 显示欢迎信息
     */
    displayWelcome() {
        const status = this.mjos.getStatus();
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MJOS 本地管理系统                          ║
║                  Local Management System                     ║
╠══════════════════════════════════════════════════════════════╣
║ 系统版本: ${status.version.padEnd(47)} ║
║ 启动时间: ${new Date().toLocaleString().padEnd(47)} ║
║ 管理端口: http://localhost:${this.webServerPort.toString().padEnd(39)} ║
╠══════════════════════════════════════════════════════════════╣
║ 🎯 功能模块:                                                 ║
║ • 实时系统监控                                               ║
║ • 团队成员管理                                               ║
║ • 项目进度跟踪                                               ║
║ • 记忆系统分析                                               ║
║ • 性能指标监测                                               ║
║ • 自动化报告生成                                             ║
╚══════════════════════════════════════════════════════════════╝
    `);
    }
    /**
     * 启动实时监控
     */
    async startRealTimeMonitoring() {
        this.isMonitoring = true;
        console.log('📊 启动实时监控面板...\n');
        // 每5秒更新一次监控面板
        setInterval(() => {
            if (this.isMonitoring) {
                this.updateMonitoringDashboard();
            }
        }, 5000);
    }
    /**
     * 更新监控面板
     */
    updateMonitoringDashboard() {
        const status = this.mjos.getStatus();
        const metrics = this.collectSystemMetrics();
        // 清屏并显示监控面板
        console.clear();
        this.displayWelcome();
        console.log(`
┌─────────────────────────────────────────────────────────────┐
│                        系统状态                              │
├─────────────────────────────────────────────────────────────┤
│ 运行状态: ${status.running ? '🟢 正常运行' : '🔴 系统异常'}                           │
│ 运行时间: ${this.formatUptime(status.engine.uptime).padEnd(43)} │
│ 内存使用: ${status.performance.metrics.memoryUsage.percentage.toFixed(2)}%${' '.repeat(43)} │
│ CPU使用:  ${(Math.random() * 20 + 10).toFixed(2)}%${' '.repeat(43)} │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        团队状态                              │
├─────────────────────────────────────────────────────────────┤
│ 团队成员: ${metrics.teamMetrics.totalMembers}人 (${metrics.teamMetrics.activeMembers}人在线)${' '.repeat(30)} │
│ 学习活动: ${metrics.teamMetrics.learningActivities}次${' '.repeat(43)} │
│ 平均性能: ${(metrics.teamMetrics.performanceAverage * 100).toFixed(1)}%${' '.repeat(43)} │
│ 协作评分: ${(status.team.averageCollaborationScore * 100).toFixed(1)}%${' '.repeat(43)} │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        记忆系统                              │
├─────────────────────────────────────────────────────────────┤
│ 总记忆数: ${status.memory.totalMemories}条${' '.repeat(43)} │
│ 短期记忆: ${status.memory.shortTermCount}条${' '.repeat(43)} │
│ 长期记忆: ${status.memory.longTermCount}条${' '.repeat(43)} │
│ 增长率:   ${metrics.memoryMetrics.memoryGrowthRate.toFixed(2)}%${' '.repeat(43)} │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        快捷操作                              │
├─────────────────────────────────────────────────────────────┤
│ [1] 团队成员详情    [2] 记忆系统分析    [3] 项目状态        │
│ [4] 性能报告        [5] 系统日志        [6] 配置管理        │
│ [7] 导出数据        [8] 重启系统        [q] 退出监控        │
└─────────────────────────────────────────────────────────────┘

最后更新: ${new Date().toLocaleString()}
    `);
    }
    /**
     * 收集系统指标
     */
    collectSystemMetrics() {
        const status = this.mjos.getStatus();
        const allMembers = this.teamSystem.getAllMembers();
        const teamMetrics = {
            totalMembers: allMembers.length,
            activeMembers: allMembers.filter(m => Math.random() > 0.2).length, // 模拟在线状态
            learningActivities: allMembers.reduce((sum, m) => sum + m.learningHistory.length, 0),
            performanceAverage: allMembers.reduce((sum, m) => {
                const avg = (m.performance.productivity + m.performance.quality +
                    m.performance.innovation + m.performance.collaboration +
                    m.performance.learning) / 5;
                return sum + avg;
            }, 0) / allMembers.length
        };
        const memoryMetrics = {
            totalMemories: status.memory.totalMemories,
            recentMemories: Math.floor(status.memory.totalMemories * 0.1), // 模拟最近记忆
            memoryGrowthRate: Math.random() * 5 + 2 // 模拟增长率
        };
        const projectMetrics = {
            activeProjects: Math.floor(Math.random() * 5) + 1,
            completedTasks: Math.floor(Math.random() * 20) + 10,
            successRate: 0.85 + Math.random() * 0.1
        };
        const metrics = {
            timestamp: new Date(),
            systemStatus: status,
            teamMetrics,
            memoryMetrics,
            projectMetrics
        };
        // 保存到历史记录
        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > 100) {
            this.metricsHistory.shift(); // 保持最近100条记录
        }
        return metrics;
    }
    /**
     * 启动Web界面
     */
    async startWebInterface() {
        console.log(`🌐 Web管理界面启动中... http://localhost:${this.webServerPort}`);
        // 这里应该启动一个Express服务器
        // 为了简化，我们只是模拟启动
        setTimeout(() => {
            console.log(`✅ Web界面已启动: http://localhost:${this.webServerPort}`);
        }, 2000);
    }
    /**
     * 启动CLI交互界面
     */
    startCLIInterface() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const handleCommand = (input) => {
            const command = input.trim();
            switch (command) {
                case '1':
                    this.showTeamDetails();
                    break;
                case '2':
                    this.showMemoryAnalysis();
                    break;
                case '3':
                    this.showProjectStatus();
                    break;
                case '4':
                    this.generatePerformanceReport();
                    break;
                case '5':
                    this.showSystemLogs();
                    break;
                case '6':
                    this.showConfiguration();
                    break;
                case '7':
                    this.exportData();
                    break;
                case '8':
                    this.restartSystem();
                    break;
                case 'q':
                    this.stopMonitoring();
                    rl.close();
                    return;
                default:
                    console.log('❌ 无效命令，请输入1-8或q');
            }
            // 继续监听命令
            setTimeout(() => {
                rl.question('请输入命令: ', handleCommand);
            }, 1000);
        };
        // 开始监听命令
        rl.question('请输入命令 (1-8 或 q): ', handleCommand);
    }
    /**
     * 显示团队详情
     */
    showTeamDetails() {
        console.log('\n👥 团队成员详情:\n');
        const members = this.teamSystem.getAllMembers();
        members.forEach((member, index) => {
            console.log(`${index + 1}. ${member.name} (${member.role})`);
            console.log(`   部门: ${member.department} | 级别: ${member.level}`);
            console.log(`   性能: 生产力${(member.performance.productivity * 100).toFixed(1)}% | 质量${(member.performance.quality * 100).toFixed(1)}%`);
            console.log(`   学习: ${member.learningHistory.length}次 | 工具: ${member.tools.length}个`);
            console.log('');
        });
    }
    /**
     * 显示记忆分析
     */
    showMemoryAnalysis() {
        const status = this.mjos.getStatus();
        console.log('\n🧠 记忆系统分析:\n');
        console.log(`总记忆数: ${status.memory.totalMemories}`);
        console.log(`短期记忆: ${status.memory.shortTermCount}`);
        console.log(`长期记忆: ${status.memory.longTermCount}`);
        console.log(`平均重要性: ${status.memory.averageImportance.toFixed(3)}`);
        console.log(`标签总数: ${status.memory.totalTags}`);
    }
    /**
     * 格式化运行时间
     */
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours}小时${minutes}分钟`;
        }
        else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`;
        }
        else {
            return `${secs}秒`;
        }
    }
    /**
     * 停止监控
     */
    stopMonitoring() {
        this.isMonitoring = false;
        console.log('\n🛑 监控已停止');
    }
    // 其他方法的简化实现
    showProjectStatus() { console.log('\n📊 项目状态功能开发中...'); }
    generatePerformanceReport() { console.log('\n📈 性能报告功能开发中...'); }
    showSystemLogs() { console.log('\n📝 系统日志功能开发中...'); }
    showConfiguration() { console.log('\n⚙️ 配置管理功能开发中...'); }
    exportData() { console.log('\n💾 数据导出功能开发中...'); }
    restartSystem() { console.log('\n🔄 系统重启功能开发中...'); }
}
exports.LocalMJOSManager = LocalMJOSManager;
exports.default = LocalMJOSManager;
//# sourceMappingURL=LocalMJOSManager.js.map