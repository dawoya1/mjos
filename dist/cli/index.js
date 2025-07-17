#!/usr/bin/env node
"use strict";
/**
 * MJOS Command Line Interface
 * 魔剑工作室操作系统命令行界面
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJOSCli = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const index_1 = require("../index");
const index_2 = require("../core/index");
class MJOSCli {
    constructor() {
        this.program = new commander_1.Command();
        this.mjos = new index_1.MJOS();
        this.logger = new index_2.Logger('CLI');
        this.setupCommands();
    }
    setupCommands() {
        this.program
            .name('mjos')
            .description('MJOS - 魔剑工作室操作系统')
            .version(this.mjos.getVersion());
        // System commands
        this.program
            .command('status')
            .description('显示系统状态')
            .action(async () => {
            await this.showStatus();
        });
        this.program
            .command('start')
            .description('启动MJOS系统')
            .option('-p, --port <port>', '指定API服务器端口', '3000')
            .option('--no-api', '不启动API服务器')
            .action(async (options) => {
            await this.startSystem(options);
        });
        this.program
            .command('stop')
            .description('停止MJOS系统')
            .action(async () => {
            await this.stopSystem();
        });
        // Memory commands
        const memoryCmd = this.program
            .command('memory')
            .description('内存管理命令');
        memoryCmd
            .command('store <content>')
            .description('存储记忆')
            .option('-t, --tags <tags>', '标签 (逗号分隔)', '')
            .option('-i, --importance <importance>', '重要性 (0-1)', '0.5')
            .action(async (content, options) => {
            await this.storeMemory(content, options);
        });
        memoryCmd
            .command('query')
            .description('查询记忆')
            .option('-t, --tags <tags>', '标签过滤 (逗号分隔)', '')
            .option('-l, --limit <limit>', '结果数量限制', '10')
            .action(async (options) => {
            await this.queryMemory(options);
        });
        memoryCmd
            .command('stats')
            .description('显示记忆统计')
            .action(async () => {
            await this.showMemoryStats();
        });
        // Knowledge commands
        const knowledgeCmd = this.program
            .command('knowledge')
            .description('知识管理命令');
        knowledgeCmd
            .command('add')
            .description('添加知识')
            .action(async () => {
            await this.addKnowledge();
        });
        knowledgeCmd
            .command('search <query>')
            .description('搜索知识')
            .option('-d, --domain <domain>', '知识域')
            .option('-l, --limit <limit>', '结果数量限制', '10')
            .action(async (query, options) => {
            await this.searchKnowledge(query, options);
        });
        // Team commands
        const teamCmd = this.program
            .command('team')
            .description('团队管理命令');
        teamCmd
            .command('members')
            .description('显示团队成员')
            .action(async () => {
            await this.showTeamMembers();
        });
        teamCmd
            .command('tasks')
            .description('显示任务列表')
            .option('-s, --status <status>', '按状态过滤')
            .action(async (options) => {
            await this.showTasks(options);
        });
        teamCmd
            .command('create-task')
            .description('创建新任务')
            .action(async () => {
            await this.createTask();
        });
        // Agent commands
        const agentCmd = this.program
            .command('agent')
            .description('智能体管理命令');
        agentCmd
            .command('list')
            .description('列出所有智能体')
            .action(async () => {
            await this.listAgents();
        });
        agentCmd
            .command('create')
            .description('创建新智能体')
            .action(async () => {
            await this.createAgent();
        });
        // Workflow commands
        const workflowCmd = this.program
            .command('workflow')
            .description('工作流管理命令');
        workflowCmd
            .command('list')
            .description('列出工作流')
            .action(async () => {
            await this.listWorkflows();
        });
        workflowCmd
            .command('execute <workflowId>')
            .description('执行工作流')
            .action(async (workflowId) => {
            await this.executeWorkflow(workflowId);
        });
        // Interactive mode
        this.program
            .command('interactive')
            .alias('i')
            .description('进入交互模式')
            .action(async () => {
            await this.interactiveMode();
        });
    }
    async showStatus() {
        const spinner = (0, ora_1.default)('获取系统状态...').start();
        try {
            const status = this.mjos.getStatus();
            spinner.succeed('系统状态获取成功');
            console.log(chalk_1.default.cyan('\n=== MJOS 系统状态 ==='));
            console.log(chalk_1.default.green(`版本: ${status.version}`));
            console.log(chalk_1.default.green(`引擎状态: ${status.engine.running ? '运行中' : '已停止'}`));
            if (status.engine.uptime) {
                console.log(chalk_1.default.green(`运行时间: ${Math.floor(status.engine.uptime / 1000)}秒`));
            }
            console.log(chalk_1.default.cyan('\n--- 模块状态 ---'));
            console.log(`记忆系统: ${status.memory.totalMemories} 条记忆`);
            console.log(`知识图谱: ${status.knowledge.totalItems} 个知识项`);
            console.log(`上下文管理: ${status.context.totalSessions} 个会话`);
            console.log(`团队管理: ${status.team.totalMembers} 个成员, ${status.team.totalTasks} 个任务`);
            if (status.performance) {
                console.log(chalk_1.default.cyan('\n--- 性能指标 ---'));
                console.log(`内存使用: ${status.performance.memoryUsage?.percentage?.toFixed(1)}%`);
                console.log(`CPU使用: ${status.performance.cpuUsage?.total?.toFixed(1)}%`);
            }
        }
        catch (error) {
            spinner.fail('获取系统状态失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async startSystem(options) {
        const spinner = (0, ora_1.default)('启动MJOS系统...').start();
        try {
            await this.mjos.start();
            if (options.api !== false) {
                await this.mjos.startAPIServer({ port: parseInt(options.port) });
                spinner.succeed(`MJOS系统启动成功 (API服务器: http://localhost:${options.port})`);
            }
            else {
                spinner.succeed('MJOS系统启动成功');
            }
        }
        catch (error) {
            spinner.fail('系统启动失败');
            console.error(chalk_1.default.red('错误:'), error);
            process.exit(1);
        }
    }
    async stopSystem() {
        const spinner = (0, ora_1.default)('停止MJOS系统...').start();
        try {
            await this.mjos.stopAPIServer();
            await this.mjos.stop();
            spinner.succeed('MJOS系统已停止');
        }
        catch (error) {
            spinner.fail('系统停止失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async storeMemory(content, options) {
        const spinner = (0, ora_1.default)('存储记忆...').start();
        try {
            const tags = options.tags ? options.tags.split(',').map((t) => t.trim()) : [];
            const importance = parseFloat(options.importance);
            const memoryId = this.mjos.getMemorySystem().store(content, tags, importance);
            spinner.succeed(`记忆存储成功 (ID: ${memoryId})`);
        }
        catch (error) {
            spinner.fail('记忆存储失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async queryMemory(options) {
        const spinner = (0, ora_1.default)('查询记忆...').start();
        try {
            const query = {};
            if (options.tags) {
                query.tags = options.tags.split(',').map((t) => t.trim());
            }
            if (options.limit) {
                query.limit = parseInt(options.limit);
            }
            const results = this.mjos.getMemorySystem().query(query);
            spinner.succeed(`找到 ${results.length} 条记忆`);
            if (results.length > 0) {
                console.log(chalk_1.default.cyan('\n=== 查询结果 ==='));
                results.forEach((memory, index) => {
                    console.log(chalk_1.default.green(`${index + 1}. [${memory.id}]`));
                    console.log(`   内容: ${JSON.stringify(memory.content)}`);
                    console.log(`   标签: ${memory.tags.join(', ')}`);
                    console.log(`   重要性: ${memory.importance}`);
                    console.log(`   时间: ${memory.timestamp.toLocaleString()}`);
                    console.log('');
                });
            }
        }
        catch (error) {
            spinner.fail('记忆查询失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async showMemoryStats() {
        const spinner = (0, ora_1.default)('获取记忆统计...').start();
        try {
            const stats = this.mjos.getMemorySystem().getStats();
            spinner.succeed('记忆统计获取成功');
            console.log(chalk_1.default.cyan('\n=== 记忆系统统计 ==='));
            console.log(`总记忆数: ${stats.totalMemories}`);
            console.log(`短期记忆: ${stats.shortTermCount}`);
            console.log(`长期记忆: ${stats.longTermCount}`);
            console.log(`标签数: ${stats.totalTags}`);
            console.log(`平均重要性: ${stats.averageImportance.toFixed(3)}`);
            console.log(chalk_1.default.cyan('\n--- 按类型分布 ---'));
            Object.entries(stats.memoryTypes).forEach(([type, count]) => {
                console.log(`${type}: ${count}`);
            });
        }
        catch (error) {
            spinner.fail('获取记忆统计失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async addKnowledge() {
        try {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: '选择知识类型:',
                    choices: ['concept', 'fact', 'rule', 'pattern', 'procedure', 'experience']
                },
                {
                    type: 'input',
                    name: 'content',
                    message: '输入知识内容:',
                    validate: (input) => input.trim() !== '' || '内容不能为空'
                },
                {
                    type: 'input',
                    name: 'domain',
                    message: '知识域:',
                    default: 'general'
                },
                {
                    type: 'input',
                    name: 'tags',
                    message: '标签 (逗号分隔):',
                    default: ''
                },
                {
                    type: 'number',
                    name: 'confidence',
                    message: '置信度 (0-1):',
                    default: 0.8,
                    validate: (input) => (input >= 0 && input <= 1) || '置信度必须在0-1之间'
                },
                {
                    type: 'number',
                    name: 'importance',
                    message: '重要性 (0-1):',
                    default: 0.7,
                    validate: (input) => (input >= 0 && input <= 1) || '重要性必须在0-1之间'
                }
            ]);
            const spinner = (0, ora_1.default)('添加知识...').start();
            const knowledgeData = {
                type: answers.type,
                content: answers.content,
                metadata: {
                    source: 'cli',
                    confidence: answers.confidence,
                    importance: answers.importance,
                    tags: answers.tags ? answers.tags.split(',').map((t) => t.trim()) : [],
                    domain: answers.domain,
                    version: 1
                },
                relationships: []
            };
            const knowledgeId = this.mjos.getKnowledgeGraph().add(knowledgeData);
            spinner.succeed(`知识添加成功 (ID: ${knowledgeId})`);
        }
        catch (error) {
            console.error(chalk_1.default.red('添加知识失败:'), error);
        }
    }
    async searchKnowledge(query, options) {
        const spinner = (0, ora_1.default)('搜索知识...').start();
        try {
            const searchQuery = {
                content: query,
                limit: parseInt(options.limit) || 10
            };
            if (options.domain) {
                searchQuery.domain = options.domain;
            }
            const results = this.mjos.getKnowledgeGraph().query(searchQuery);
            spinner.succeed(`找到 ${results.length} 个知识项`);
            if (results.length > 0) {
                console.log(chalk_1.default.cyan('\n=== 搜索结果 ==='));
                results.forEach((knowledge, index) => {
                    console.log(chalk_1.default.green(`${index + 1}. [${knowledge.id}] ${knowledge.type}`));
                    console.log(`   内容: ${JSON.stringify(knowledge.content)}`);
                    console.log(`   域: ${knowledge.metadata.domain}`);
                    console.log(`   置信度: ${knowledge.metadata.confidence}`);
                    console.log(`   重要性: ${knowledge.metadata.importance}`);
                    console.log(`   标签: ${knowledge.metadata.tags.join(', ')}`);
                    console.log('');
                });
            }
        }
        catch (error) {
            spinner.fail('知识搜索失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async showTeamMembers() {
        const spinner = (0, ora_1.default)('获取团队成员...').start();
        try {
            const members = this.mjos.getTeamManager().getAllMembers();
            spinner.succeed(`团队共有 ${members.length} 个成员`);
            if (members.length > 0) {
                console.log(chalk_1.default.cyan('\n=== 团队成员 ==='));
                members.forEach((member, index) => {
                    console.log(chalk_1.default.green(`${index + 1}. ${member.name} (${member.id})`));
                    console.log(`   角色: ${member.role}`);
                    console.log(`   状态: ${member.status}`);
                    console.log(`   能力: ${member.capabilities.join(', ')}`);
                    console.log(`   专长: ${member.expertise.join(', ')}`);
                    console.log(`   任务完成: ${member.performance.tasksCompleted}`);
                    console.log(`   成功率: ${(member.performance.successRate * 100).toFixed(1)}%`);
                    console.log('');
                });
            }
        }
        catch (error) {
            spinner.fail('获取团队成员失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async showTasks(options) {
        const spinner = (0, ora_1.default)('获取任务列表...').start();
        try {
            let tasks = this.mjos.getTeamManager().getTasks();
            if (options.status) {
                tasks = tasks.filter((task) => task.status === options.status);
            }
            spinner.succeed(`找到 ${tasks.length} 个任务`);
            if (tasks.length > 0) {
                console.log(chalk_1.default.cyan('\n=== 任务列表 ==='));
                tasks.forEach((task, index) => {
                    console.log(chalk_1.default.green(`${index + 1}. ${task.title} (${task.id})`));
                    console.log(`   描述: ${task.description}`);
                    console.log(`   状态: ${task.status}`);
                    console.log(`   优先级: ${task.priority}`);
                    console.log(`   分配给: ${task.assignedTo || '未分配'}`);
                    console.log(`   创建时间: ${task.createdAt.toLocaleString()}`);
                    console.log('');
                });
            }
        }
        catch (error) {
            spinner.fail('获取任务列表失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async createTask() {
        try {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'title',
                    message: '任务标题:',
                    validate: (input) => input.trim() !== '' || '标题不能为空'
                },
                {
                    type: 'input',
                    name: 'description',
                    message: '任务描述:',
                    validate: (input) => input.trim() !== '' || '描述不能为空'
                },
                {
                    type: 'list',
                    name: 'priority',
                    message: '优先级:',
                    choices: ['low', 'medium', 'high', 'urgent'],
                    default: 'medium'
                }
            ]);
            const spinner = (0, ora_1.default)('创建任务...').start();
            const taskId = this.mjos.createTask(answers.title, answers.description);
            spinner.succeed(`任务创建成功 (ID: ${taskId})`);
        }
        catch (error) {
            console.error(chalk_1.default.red('创建任务失败:'), error);
        }
    }
    async listAgents() {
        const spinner = (0, ora_1.default)('获取智能体列表...').start();
        try {
            const stats = this.mjos.getAgentManager().getStats();
            spinner.succeed(`系统共有 ${stats.totalAgents} 个智能体`);
            console.log(chalk_1.default.cyan('\n=== 智能体统计 ==='));
            console.log(`总数: ${stats.totalAgents}`);
            console.log(`活跃: ${stats.activeAgents}`);
            console.log(`空闲: ${stats.idleAgents}`);
            console.log(`平均成功率: ${(stats.averageSuccessRate * 100).toFixed(1)}%`);
        }
        catch (error) {
            spinner.fail('获取智能体列表失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async createAgent() {
        try {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: '智能体名称:',
                    validate: (input) => input.trim() !== '' || '名称不能为空'
                },
                {
                    type: 'list',
                    name: 'type',
                    message: '智能体类型:',
                    choices: ['reactive', 'deliberative', 'hybrid', 'learning', 'collaborative']
                },
                {
                    type: 'checkbox',
                    name: 'capabilities',
                    message: '选择能力:',
                    choices: ['perception', 'reasoning', 'planning', 'execution', 'communication', 'learning']
                }
            ]);
            const spinner = (0, ora_1.default)('创建智能体...').start();
            const agentDefinition = {
                name: answers.name,
                type: answers.type,
                capabilities: answers.capabilities.map((cap) => ({
                    name: cap,
                    type: cap,
                    parameters: {},
                    constraints: {}
                })),
                configuration: {
                    maxConcurrentTasks: 5,
                    memoryLimit: 1000,
                    collaborationMode: 'collaboration',
                    preferences: {}
                }
            };
            const agentId = this.mjos.createAgent(agentDefinition);
            spinner.succeed(`智能体创建成功 (ID: ${agentId})`);
        }
        catch (error) {
            console.error(chalk_1.default.red('创建智能体失败:'), error);
        }
    }
    async listWorkflows() {
        const spinner = (0, ora_1.default)('获取工作流列表...').start();
        try {
            const stats = this.mjos.getWorkflowEngine().getStats();
            spinner.succeed('工作流统计获取成功');
            console.log(chalk_1.default.cyan('\n=== 工作流统计 ==='));
            console.log(`总工作流: ${stats.totalWorkflows}`);
            console.log(`总执行: ${stats.totalExecutions}`);
            console.log(`活跃执行: ${stats.activeExecutions}`);
            console.log(`完成执行: ${stats.completedExecutions}`);
            console.log(`失败执行: ${stats.failedExecutions}`);
        }
        catch (error) {
            spinner.fail('获取工作流列表失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async executeWorkflow(workflowId) {
        const spinner = (0, ora_1.default)(`执行工作流 ${workflowId}...`).start();
        try {
            const executionId = await this.mjos.executeWorkflow(workflowId);
            spinner.succeed(`工作流执行启动成功 (执行ID: ${executionId})`);
        }
        catch (error) {
            spinner.fail('工作流执行失败');
            console.error(chalk_1.default.red('错误:'), error);
        }
    }
    async interactiveMode() {
        console.log(chalk_1.default.cyan('\n=== MJOS 交互模式 ==='));
        console.log(chalk_1.default.yellow('输入 "help" 查看可用命令，输入 "exit" 退出'));
        while (true) {
            try {
                const { command } = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'command',
                        message: 'mjos>',
                        prefix: ''
                    }
                ]);
                if (command.trim() === 'exit') {
                    console.log(chalk_1.default.green('再见！'));
                    break;
                }
                if (command.trim() === 'help') {
                    this.showInteractiveHelp();
                    continue;
                }
                // Parse and execute command
                const args = command.trim().split(' ');
                if (args.length > 0) {
                    await this.executeInteractiveCommand(args);
                }
            }
            catch (error) {
                console.error(chalk_1.default.red('命令执行错误:'), error);
            }
        }
    }
    showInteractiveHelp() {
        console.log(chalk_1.default.cyan('\n=== 可用命令 ==='));
        console.log('status          - 显示系统状态');
        console.log('memory store    - 存储记忆');
        console.log('memory query    - 查询记忆');
        console.log('knowledge add   - 添加知识');
        console.log('knowledge search - 搜索知识');
        console.log('team members    - 显示团队成员');
        console.log('team tasks      - 显示任务');
        console.log('agent list      - 列出智能体');
        console.log('workflow list   - 列出工作流');
        console.log('help            - 显示此帮助');
        console.log('exit            - 退出交互模式');
    }
    async executeInteractiveCommand(args) {
        const [mainCmd, subCmd] = args;
        switch (mainCmd) {
            case 'status':
                await this.showStatus();
                break;
            case 'memory':
                if (subCmd === 'query') {
                    await this.queryMemory({});
                }
                else if (subCmd === 'store') {
                    console.log(chalk_1.default.yellow('请使用完整的 CLI 命令进行记忆存储'));
                }
                break;
            case 'team':
                if (subCmd === 'members') {
                    await this.showTeamMembers();
                }
                else if (subCmd === 'tasks') {
                    await this.showTasks({});
                }
                break;
            case 'agent':
                if (subCmd === 'list') {
                    await this.listAgents();
                }
                break;
            case 'workflow':
                if (subCmd === 'list') {
                    await this.listWorkflows();
                }
                break;
            default:
                console.log(chalk_1.default.red(`未知命令: ${mainCmd}`));
                console.log(chalk_1.default.yellow('输入 "help" 查看可用命令'));
        }
    }
    async run() {
        try {
            await this.program.parseAsync(process.argv);
        }
        catch (error) {
            console.error(chalk_1.default.red('CLI错误:'), error);
            process.exit(1);
        }
    }
}
exports.MJOSCli = MJOSCli;
// Export for programmatic use - already exported above
// CLI entry point
if (require.main === module) {
    const cli = new MJOSCli();
    cli.run();
}
//# sourceMappingURL=index.js.map