"use strict";
/**
 * MJOS Web管理界面
 * MJOS Web Management Interface
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJOSWebInterface = void 0;
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const CompleteTeamProfiles_1 = require("../team/CompleteTeamProfiles");
const MoxiaoyiMemoryManager_1 = __importDefault(require("../team/MoxiaoyiMemoryManager"));
const LocalMJOSManager_1 = __importDefault(require("../management/LocalMJOSManager"));
class MJOSWebInterface {
    constructor(mjos, config = {}) {
        this.server = null;
        this.mjos = mjos;
        this.teamSystem = new CompleteTeamProfiles_1.CompleteTeamSystem();
        this.memoryManager = new MoxiaoyiMemoryManager_1.default(mjos);
        this.localManager = new LocalMJOSManager_1.default(mjos);
        this.config = {
            port: config.port || 3000,
            host: config.host || 'localhost',
            enableCORS: config.enableCORS !== false,
            staticPath: config.staticPath || path.join(__dirname, '../../web/static')
        };
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
    }
    /**
     * 设置中间件
     */
    setupMiddleware() {
        // JSON解析
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // CORS支持
        if (this.config.enableCORS) {
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
                if (req.method === 'OPTIONS') {
                    res.sendStatus(200);
                }
                else {
                    next();
                }
            });
        }
        // 静态文件服务
        this.app.use('/static', express_1.default.static(this.config.staticPath));
    }
    /**
     * 设置路由
     */
    setupRoutes() {
        // 主页
        this.app.get('/', (req, res) => {
            res.send(this.generateHomePage());
        });
        // API路由
        this.setupAPIRoutes();
        // 团队管理路由
        this.setupTeamRoutes();
        // 记忆管理路由
        this.setupMemoryRoutes();
        // 系统监控路由
        this.setupMonitoringRoutes();
    }
    /**
     * 设置API路由
     */
    setupAPIRoutes() {
        const apiRouter = express_1.default.Router();
        // 系统状态
        apiRouter.get('/status', (req, res) => {
            try {
                const status = this.mjos.getStatus();
                res.json({
                    success: true,
                    data: status,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // 系统重启
        apiRouter.post('/restart', async (req, res) => {
            try {
                await this.mjos.stop();
                await this.mjos.start();
                res.json({
                    success: true,
                    message: '系统重启成功'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.app.use('/api', apiRouter);
    }
    /**
     * 设置团队管理路由
     */
    setupTeamRoutes() {
        const teamRouter = express_1.default.Router();
        // 获取所有团队成员
        teamRouter.get('/members', (req, res) => {
            try {
                const members = this.teamSystem.getAllMembers();
                res.json({
                    success: true,
                    data: members.map(member => ({
                        id: member.id,
                        name: member.name,
                        role: member.role,
                        department: member.department,
                        level: member.level,
                        performance: member.performance,
                        triggers: member.triggers
                    }))
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // 获取单个成员详情
        teamRouter.get('/members/:id', (req, res) => {
            try {
                const member = this.teamSystem.getMemberById(req.params.id);
                if (!member) {
                    return res.status(404).json({
                        success: false,
                        error: '成员不存在'
                    });
                }
                res.json({
                    success: true,
                    data: member
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // 生成成员能力报告
        teamRouter.get('/members/:id/report', (req, res) => {
            try {
                const report = this.teamSystem.generateCapabilityReport(req.params.id);
                res.json({
                    success: true,
                    data: { report }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.app.use('/team', teamRouter);
    }
    /**
     * 设置记忆管理路由
     */
    setupMemoryRoutes() {
        const memoryRouter = express_1.default.Router();
        // 存储记忆
        memoryRouter.post('/store', async (req, res) => {
            try {
                const { content, tags, importance, projectId, category } = req.body;
                const memoryId = await this.memoryManager.storeMemory(content, {
                    tags,
                    importance,
                    projectId,
                    category,
                    source: 'web-interface'
                });
                res.json({
                    success: true,
                    data: { memoryId }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // 搜索记忆
        memoryRouter.post('/search', async (req, res) => {
            try {
                const memories = await this.memoryManager.recallMemories(req.body);
                res.json({
                    success: true,
                    data: memories
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // 生成会议纪要
        memoryRouter.post('/meeting-minutes', async (req, res) => {
            try {
                const minutes = await this.memoryManager.generateMeetingMinutes(req.body);
                res.json({
                    success: true,
                    data: minutes
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.app.use('/memory', memoryRouter);
    }
    /**
     * 设置监控路由
     */
    setupMonitoringRoutes() {
        const monitorRouter = express_1.default.Router();
        // 实时系统指标
        monitorRouter.get('/metrics', (req, res) => {
            try {
                const status = this.mjos.getStatus();
                const members = this.teamSystem.getAllMembers();
                const metrics = {
                    system: {
                        version: status.version,
                        uptime: status.engine.uptime,
                        running: status.running,
                        memoryUsage: status.performance.metrics.memoryUsage
                    },
                    team: {
                        totalMembers: members.length,
                        averagePerformance: members.reduce((sum, m) => {
                            const avg = (m.performance.productivity + m.performance.quality +
                                m.performance.innovation + m.performance.collaboration +
                                m.performance.learning) / 5;
                            return sum + avg;
                        }, 0) / members.length
                    },
                    memory: {
                        totalMemories: status.memory.totalMemories,
                        shortTermCount: status.memory.shortTermCount,
                        longTermCount: status.memory.longTermCount
                    }
                };
                res.json({
                    success: true,
                    data: metrics,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.app.use('/monitor', monitorRouter);
    }
    /**
     * 生成主页HTML
     */
    generateHomePage() {
        const status = this.mjos.getStatus();
        const members = this.teamSystem.getAllMembers();
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MJOS 管理界面</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .member { border: 1px solid #e0e0e0; padding: 15px; border-radius: 6px; margin-bottom: 10px; }
        .status-good { color: #4caf50; }
        .status-warning { color: #ff9800; }
        .btn { background: #2196f3; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #1976d2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 MJOS 管理界面</h1>
            <p>魔剑工作室操作系统 - 版本 ${status.version}</p>
            <p class="status-good">系统状态: ${status.running ? '✅ 正常运行' : '❌ 系统异常'}</p>
        </div>

        <div class="grid">
            <div class="card">
                <h2>📊 系统概览</h2>
                <p><strong>运行时间:</strong> ${Math.floor(status.engine.uptime / 3600)}小时</p>
                <p><strong>内存使用:</strong> ${status.performance.metrics.memoryUsage.percentage.toFixed(2)}%</p>
                <p><strong>总记忆数:</strong> ${status.memory.totalMemories}</p>
                <p><strong>团队成员:</strong> ${members.length}人</p>
            </div>

            <div class="card">
                <h2>👥 团队成员</h2>
                ${members.map(member => `
                    <div class="member">
                        <strong>${member.name}</strong> - ${member.role}<br>
                        <small>部门: ${member.department} | 级别: ${member.level}</small><br>
                        <small>性能: ${(member.performance.productivity * 100).toFixed(1)}%</small>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <h2>🛠️ 快捷操作</h2>
                <button class="btn" onclick="location.href='/api/status'">查看系统状态</button><br><br>
                <button class="btn" onclick="location.href='/team/members'">团队成员API</button><br><br>
                <button class="btn" onclick="location.href='/monitor/metrics'">监控指标</button><br><br>
                <button class="btn" onclick="restartSystem()">重启系统</button>
            </div>
        </div>
    </div>

    <script>
        function restartSystem() {
            if (confirm('确定要重启系统吗？')) {
                fetch('/api/restart', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.success ? '系统重启成功' : '重启失败: ' + data.error);
                        if (data.success) location.reload();
                    });
            }
        }
        
        // 每30秒刷新一次页面
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
    `;
    }
    /**
     * 启动Web服务器
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.config.port, this.config.host, () => {
                console.log(`🌐 MJOS Web界面已启动: http://${this.config.host}:${this.config.port}`);
                resolve();
            });
            this.server.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * 停止Web服务器
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 MJOS Web界面已停止');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
}
exports.MJOSWebInterface = MJOSWebInterface;
exports.default = MJOSWebInterface;
//# sourceMappingURL=MJOSWebInterface.js.map