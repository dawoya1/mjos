#!/usr/bin/env node

/**
 * MJOS Command Line Interface
 * 魔剑工作室操作系统命令行界面
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { MJOS } from '../index';
import { Logger } from '../core/index';

export class MJOSCli {
  private program: Command;
  private mjos: MJOS;
  private logger: Logger;

  constructor() {
    this.program = new Command();
    this.mjos = new MJOS();
    this.logger = new Logger('CLI');
    
    this.setupCommands();
  }

  private setupCommands(): void {
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

    // MCP Server command
    this.program
      .command('mjos-mcp-server')
      .description('启动MCP服务器')
      .action(async () => {
        await this.startMCPServer();
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

  private async showStatus(): Promise<void> {
    const spinner = ora('获取系统状态...').start();
    
    try {
      const status = this.mjos.getStatus();
      spinner.succeed('系统状态获取成功');

      console.log(chalk.cyan('\n=== MJOS 系统状态 ==='));
      console.log(chalk.green(`版本: ${status.version}`));
      console.log(chalk.green(`引擎状态: ${status.engine.running ? '运行中' : '已停止'}`));
      
      if (status.engine.uptime) {
        console.log(chalk.green(`运行时间: ${Math.floor(status.engine.uptime / 1000)}秒`));
      }

      console.log(chalk.cyan('\n--- 模块状态 ---'));
      console.log(`记忆系统: ${status.memory.totalMemories} 条记忆`);
      console.log(`知识图谱: ${status.knowledge.totalItems} 个知识项`);
      console.log(`上下文管理: ${status.context.totalSessions} 个会话`);
      console.log(`团队管理: ${status.team.totalMembers} 个成员, ${status.team.totalTasks} 个任务`);
      
      if (status.performance) {
        console.log(chalk.cyan('\n--- 性能指标 ---'));
        console.log(`内存使用: ${status.performance.memoryUsage?.percentage?.toFixed(1)}%`);
        console.log(`CPU使用: ${status.performance.cpuUsage?.total?.toFixed(1)}%`);
      }

    } catch (error) {
      spinner.fail('获取系统状态失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async startSystem(options: any): Promise<void> {
    const spinner = ora('启动MJOS系统...').start();
    
    try {
      await this.mjos.start();
      
      if (options.api !== false) {
        await this.mjos.startAPIServer({ port: parseInt(options.port) });
        spinner.succeed(`MJOS系统启动成功 (API服务器: http://localhost:${options.port})`);
      } else {
        spinner.succeed('MJOS系统启动成功');
      }

    } catch (error) {
      spinner.fail('系统启动失败');
      console.error(chalk.red('错误:'), error);
      process.exit(1);
    }
  }

  private async stopSystem(): Promise<void> {
    const spinner = ora('停止MJOS系统...').start();
    
    try {
      await this.mjos.stopAPIServer();
      await this.mjos.stop();
      spinner.succeed('MJOS系统已停止');
    } catch (error) {
      spinner.fail('系统停止失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async storeMemory(content: string, options: any): Promise<void> {
    const spinner = ora('存储记忆...').start();
    
    try {
      const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
      const importance = parseFloat(options.importance);
      
      const memoryId = this.mjos.getMemorySystem().store(content, tags, importance);
      spinner.succeed(`记忆存储成功 (ID: ${memoryId})`);
    } catch (error) {
      spinner.fail('记忆存储失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async queryMemory(options: any): Promise<void> {
    const spinner = ora('查询记忆...').start();
    
    try {
      const query: any = {};
      
      if (options.tags) {
        query.tags = options.tags.split(',').map((t: string) => t.trim());
      }
      
      if (options.limit) {
        query.limit = parseInt(options.limit);
      }
      
      const results = this.mjos.getMemorySystem().query(query);
      spinner.succeed(`找到 ${results.length} 条记忆`);
      
      if (results.length > 0) {
        console.log(chalk.cyan('\n=== 查询结果 ==='));
        results.forEach((memory, index) => {
          console.log(chalk.green(`${index + 1}. [${memory.id}]`));
          console.log(`   内容: ${JSON.stringify(memory.content)}`);
          console.log(`   标签: ${memory.tags ? memory.tags.join(', ') : '无'}`);
          console.log(`   重要性: ${memory.importance}`);
          console.log(`   时间: ${memory.timestamp.toLocaleString()}`);
          console.log('');
        });
      }
    } catch (error) {
      spinner.fail('记忆查询失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async showMemoryStats(): Promise<void> {
    const spinner = ora('获取记忆统计...').start();
    
    try {
      const stats = this.mjos.getMemorySystem().getStats();
      spinner.succeed('记忆统计获取成功');
      
      console.log(chalk.cyan('\n=== 记忆系统统计 ==='));
      console.log(`总记忆数: ${stats.totalMemories}`);
      console.log(`短期记忆: ${stats.shortTermCount}`);
      console.log(`长期记忆: ${stats.longTermCount}`);
      console.log(`标签数: ${stats.totalTags}`);
      console.log(`平均重要性: ${stats.averageImportance.toFixed(3)}`);
      
      console.log(chalk.cyan('\n--- 按类型分布 ---'));
      Object.entries(stats.memoryTypes).forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
      });
    } catch (error) {
      spinner.fail('获取记忆统计失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async addKnowledge(): Promise<void> {
    try {
      const answers = await inquirer.prompt([
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

      const spinner = ora('添加知识...').start();
      
      const knowledgeData = {
        type: answers.type,
        content: answers.content,
        metadata: {
          source: 'cli',
          confidence: answers.confidence,
          importance: answers.importance,
          tags: answers.tags ? answers.tags.split(',').map((t: string) => t.trim()) : [],
          domain: answers.domain,
          version: 1
        },
        relationships: []
      };

      const knowledgeId = this.mjos.getKnowledgeGraph().add(knowledgeData);
      spinner.succeed(`知识添加成功 (ID: ${knowledgeId})`);
    } catch (error) {
      console.error(chalk.red('添加知识失败:'), error);
    }
  }

  private async searchKnowledge(query: string, options: any): Promise<void> {
    const spinner = ora('搜索知识...').start();
    
    try {
      const searchQuery: any = {
        content: query,
        limit: parseInt(options.limit) || 10
      };
      
      if (options.domain) {
        searchQuery.domain = options.domain;
      }
      
      const results = this.mjos.getKnowledgeGraph().query(searchQuery);
      spinner.succeed(`找到 ${results.length} 个知识项`);
      
      if (results.length > 0) {
        console.log(chalk.cyan('\n=== 搜索结果 ==='));
        results.forEach((knowledge, index) => {
          console.log(chalk.green(`${index + 1}. [${knowledge.id}] ${knowledge.type}`));
          console.log(`   内容: ${JSON.stringify(knowledge.content)}`);
          console.log(`   域: ${knowledge.metadata.domain}`);
          console.log(`   置信度: ${knowledge.metadata.confidence}`);
          console.log(`   重要性: ${knowledge.metadata.importance}`);
          console.log(`   标签: ${knowledge.metadata.tags.join(', ')}`);
          console.log('');
        });
      }
    } catch (error) {
      spinner.fail('知识搜索失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async showTeamMembers(): Promise<void> {
    const spinner = ora('获取团队成员...').start();
    
    try {
      const members = this.mjos.getTeamManager().getAllMembers();
      spinner.succeed(`团队共有 ${members.length} 个成员`);
      
      if (members.length > 0) {
        console.log(chalk.cyan('\n=== 团队成员 ==='));
        members.forEach((member, index) => {
          console.log(chalk.green(`${index + 1}. ${member.name} (${member.id})`));
          console.log(`   角色: ${member.role}`);
          console.log(`   状态: ${member.status}`);
          console.log(`   能力: ${member.capabilities.join(', ')}`);
          console.log(`   专长: ${member.expertise.join(', ')}`);
          console.log(`   任务完成: ${member.performance.tasksCompleted}`);
          console.log(`   成功率: ${(member.performance.successRate * 100).toFixed(1)}%`);
          console.log('');
        });
      }
    } catch (error) {
      spinner.fail('获取团队成员失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async showTasks(options: any): Promise<void> {
    const spinner = ora('获取任务列表...').start();
    
    try {
      let tasks = this.mjos.getTeamManager().getTasks();
      
      if (options.status) {
        tasks = tasks.filter((task: any) => task.status === options.status);
      }
      
      spinner.succeed(`找到 ${tasks.length} 个任务`);
      
      if (tasks.length > 0) {
        console.log(chalk.cyan('\n=== 任务列表 ==='));
        tasks.forEach((task: any, index: number) => {
          console.log(chalk.green(`${index + 1}. ${task.title} (${task.id})`));
          console.log(`   描述: ${task.description}`);
          console.log(`   状态: ${task.status}`);
          console.log(`   优先级: ${task.priority}`);
          console.log(`   分配给: ${task.assignedTo || '未分配'}`);
          console.log(`   创建时间: ${task.createdAt.toLocaleString()}`);
          console.log('');
        });
      }
    } catch (error) {
      spinner.fail('获取任务列表失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async createTask(): Promise<void> {
    try {
      const answers = await inquirer.prompt([
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

      const spinner = ora('创建任务...').start();
      
      const taskId = this.mjos.createTask(answers.title, answers.description);
      spinner.succeed(`任务创建成功 (ID: ${taskId})`);
    } catch (error) {
      console.error(chalk.red('创建任务失败:'), error);
    }
  }

  private async listAgents(): Promise<void> {
    const spinner = ora('获取智能体列表...').start();
    
    try {
      const stats = this.mjos.getAgentManager().getStats();
      spinner.succeed(`系统共有 ${stats.totalAgents} 个智能体`);
      
      console.log(chalk.cyan('\n=== 智能体统计 ==='));
      console.log(`总数: ${stats.totalAgents}`);
      console.log(`活跃: ${stats.activeAgents}`);
      console.log(`空闲: ${stats.idleAgents}`);
      console.log(`平均成功率: ${(stats.averageSuccessRate * 100).toFixed(1)}%`);
    } catch (error) {
      spinner.fail('获取智能体列表失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async createAgent(): Promise<void> {
    try {
      const answers = await inquirer.prompt([
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

      const spinner = ora('创建智能体...').start();
      
      const agentDefinition = {
        name: answers.name,
        type: answers.type,
        capabilities: answers.capabilities.map((cap: string) => ({
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
    } catch (error) {
      console.error(chalk.red('创建智能体失败:'), error);
    }
  }

  private async listWorkflows(): Promise<void> {
    const spinner = ora('获取工作流列表...').start();
    
    try {
      const stats = this.mjos.getWorkflowEngine().getStats();
      spinner.succeed('工作流统计获取成功');
      
      console.log(chalk.cyan('\n=== 工作流统计 ==='));
      console.log(`总工作流: ${stats.totalWorkflows}`);
      console.log(`总执行: ${stats.totalExecutions}`);
      console.log(`活跃执行: ${stats.activeExecutions}`);
      console.log(`完成执行: ${stats.completedExecutions}`);
      console.log(`失败执行: ${stats.failedExecutions}`);
    } catch (error) {
      spinner.fail('获取工作流列表失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async executeWorkflow(workflowId: string): Promise<void> {
    const spinner = ora(`执行工作流 ${workflowId}...`).start();
    
    try {
      const executionId = await this.mjos.executeWorkflow(workflowId);
      spinner.succeed(`工作流执行启动成功 (执行ID: ${executionId})`);
    } catch (error) {
      spinner.fail('工作流执行失败');
      console.error(chalk.red('错误:'), error);
    }
  }

  private async interactiveMode(): Promise<void> {
    console.log(chalk.cyan('\n=== MJOS 交互模式 ==='));
    console.log(chalk.yellow('输入 "help" 查看可用命令，输入 "exit" 退出'));
    
    while (true) {
      try {
        const { command } = await inquirer.prompt([
          {
            type: 'input',
            name: 'command',
            message: 'mjos>',
            prefix: ''
          }
        ]);

        if (command.trim() === 'exit') {
          console.log(chalk.green('再见！'));
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
      } catch (error) {
        console.error(chalk.red('命令执行错误:'), error);
      }
    }
  }

  private async startMCPServer(): Promise<void> {
    try {
      // 使用官方MCP SDK创建服务器
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
      const { z } = await import('zod');

      // 创建MCP服务器
      const mcpServer = new McpServer({
        name: 'mjos',
        version: '2.1.6'
      });

      // 重定向所有console输出到stderr，确保stdout纯净
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;
      const originalConsoleDebug = console.debug;

      // 重定向所有console输出到stderr
      console.log = (...args) => process.stderr.write(args.join(' ') + '\n');
      console.error = (...args) => process.stderr.write(args.join(' ') + '\n');
      console.warn = (...args) => process.stderr.write(args.join(' ') + '\n');
      console.info = (...args) => process.stderr.write(args.join(' ') + '\n');
      console.debug = (...args) => process.stderr.write(args.join(' ') + '\n');

      // 设置环境变量以减少日志输出
      process.env.MJOS_LOG_LEVEL = 'error';

      // 启动MJOS系统（所有日志会输出到stderr）
      await this.mjos.start();

      // 注册MJOS工具
      mcpServer.registerTool(
        'mjos_remember',
        {
          title: '存储记忆到MJOS系统',
          description: '存储记忆到MJOS系统',
          inputSchema: {
            content: z.string().describe('要记忆的内容'),
            tags: z.array(z.string()).optional().describe('标签'),
            importance: z.number().min(0).max(1).optional().describe('重要性')
          }
        },
        async ({ content, tags, importance, projectId, category }: {
          content: string;
          tags?: string[] | undefined;
          importance?: number | undefined;
          projectId?: string | undefined;
          category?: string | undefined;
        }) => {
          try {
            // 使用莫小忆的智能记忆管理
            const MoxiaoyiMemoryManager = require('../team/MoxiaoyiMemoryManager').default;
            const memoryManager = new MoxiaoyiMemoryManager(this.mjos);

            const memoryId = await memoryManager.storeMemory(content, {
              tags,
              importance,
              projectId,
              category: category as any,
              source: 'mcp-tool'
            });

            return {
              content: [{
                type: 'text',
                text: `✅ 莫小忆已智能存储记忆\n记忆ID: ${memoryId}\n已自动提取标签和评估重要性`
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `❌ 存储失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      mcpServer.registerTool(
        'mjos_recall',
        {
          title: '从MJOS系统检索记忆',
          description: '从MJOS系统检索记忆',
          inputSchema: {
            query: z.string().optional().describe('查询内容'),
            tags: z.array(z.string()).optional().describe('标签过滤'),
            limit: z.number().optional().describe('结果数量限制')
          }
        },
        async ({ query, tags, limit }: { query?: string | undefined; tags?: string[] | undefined; limit?: number | undefined }) => {
          try {
            const searchQuery: any = {};
            if (query) searchQuery.content = query;
            if (tags && tags.length > 0) searchQuery.tags = tags;
            if (limit) searchQuery.limit = limit;

            const memories = this.mjos.recall(searchQuery);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(memories, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `检索失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      // 莫小忆专用MCP工具
      mcpServer.registerTool(
        'moxiaoyi_generate_meeting_minutes',
        {
          title: '莫小忆生成会议纪要',
          description: '莫小忆生成会议纪要',
          inputSchema: {
            title: z.string().describe('会议标题'),
            participants: z.array(z.string()).describe('参会人员'),
            discussions: z.array(z.string()).describe('讨论内容'),
            decisions: z.array(z.string()).optional().describe('决策事项'),
            actionItems: z.array(z.object({
              task: z.string(),
              assignee: z.string(),
              deadline: z.string()
            })).optional().describe('行动项')
          }
        },
        async ({ title, participants, discussions, decisions, actionItems }: any) => {
          try {
            const MoxiaoyiMemoryManager = require('../team/MoxiaoyiMemoryManager').default;
            const memoryManager = new MoxiaoyiMemoryManager(this.mjos);

            const minutes = await memoryManager.generateMeetingMinutes({
              title,
              participants,
              discussions,
              decisions: decisions || [],
              actionItems: (actionItems || []).map((item: any) => ({
                ...item,
                deadline: new Date(item.deadline)
              }))
            });

            return {
              content: [{
                type: 'text',
                text: `✅ 莫小忆已生成会议纪要\n\n📋 会议: ${minutes.title}\n👥 参会: ${minutes.participants.join(', ')}\n📝 总结: ${minutes.summary}\n🎯 行动项: ${minutes.actionItems.length}个`
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `❌ 生成会议纪要失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      mcpServer.registerTool(
        'moxiaoyi_smart_search',
        {
          title: '莫小忆智能记忆搜索',
          description: '莫小忆智能记忆搜索',
          inputSchema: {
            content: z.string().optional().describe('搜索内容'),
            tags: z.array(z.string()).optional().describe('标签过滤'),
            projectId: z.string().optional().describe('项目ID'),
            category: z.string().optional().describe('记忆分类'),
            limit: z.number().optional().describe('结果限制')
          }
        },
        async ({ content, tags, projectId, category, limit }: any) => {
          try {
            const MoxiaoyiMemoryManager = require('../team/MoxiaoyiMemoryManager').default;
            const memoryManager = new MoxiaoyiMemoryManager(this.mjos);

            const memories = await memoryManager.recallMemories({
              content,
              tags,
              projectId,
              category,
              limit: limit || 10
            });

            const results = memories.map((memory: any) =>
              `📝 ${memory.category} | ⭐${memory.importance.toFixed(2)} | 🏷️${memory.tags.join(', ')}\n${memory.content.substring(0, 200)}...`
            ).join('\n\n');

            return {
              content: [{
                type: 'text',
                text: `🧠 莫小忆智能搜索结果 (${memories.length}条):\n\n${results}`
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `❌ 智能搜索失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      mcpServer.registerTool(
        'mjos_create_task',
        {
          title: '创建新任务',
          description: '创建新任务',
          inputSchema: {
            title: z.string().describe('任务标题'),
            description: z.string().optional().describe('任务描述'),
            priority: z.enum(['low', 'medium', 'high']).optional().describe('优先级')
          }
        },
        async ({ title, description, priority }: { title: string; description?: string | undefined; priority?: 'low' | 'medium' | 'high' | undefined }) => {
          try {
            const task = await (this.mjos as any).team.createTask({
              title,
              description: description || '',
              priority: priority || 'medium',
              status: 'pending',
              createdAt: new Date()
            });
            return {
              content: [{
                type: 'text',
                text: `任务已创建，ID: ${task.id}`
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `创建失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      mcpServer.registerTool(
        'mjos_assign_task',
        {
          title: '分配任务给团队成员',
          description: '分配任务给团队成员',
          inputSchema: {
            taskId: z.string().describe('任务ID'),
            memberId: z.string().describe('成员ID')
          }
        },
        async ({ taskId, memberId }: { taskId: string; memberId: string }) => {
          try {
            await (this.mjos as any).team.assignTask(taskId, memberId);
            return {
              content: [{
                type: 'text',
                text: `任务 ${taskId} 已分配给成员 ${memberId}`
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `分配失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      mcpServer.registerTool(
        'mjos_get_status',
        {
          title: '获取MJOS系统状态',
          description: '获取MJOS系统状态',
          inputSchema: {}
        },
        async () => {
          try {
            const status = await this.mjos.getStatus();
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(status, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `获取状态失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      mcpServer.registerTool(
        'mjos_performance_metrics',
        {
          title: '获取性能指标',
          description: '获取性能指标',
          inputSchema: {}
        },
        async () => {
          try {
            const metrics = await (this.mjos as any).performance.getMetrics();
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(metrics, null, 2)
              }]
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `获取指标失败: ${error instanceof Error ? error.message : String(error)}`
              }],
              isError: true
            };
          }
        }
      );

      // 创建stdio传输并连接
      const transport = new StdioServerTransport();
      await mcpServer.connect(transport);

      // 输出启动成功信息到stderr（不影响MCP通信）
      process.stderr.write('✅ MJOS MCP Server started successfully\n');
      process.stderr.write('📋 Available tools: mjos_remember, mjos_recall, mjos_create_task, mjos_assign_task, mjos_get_status, mjos_performance_metrics\n');

      // 保持进程运行
      process.on('SIGINT', () => {
        process.stderr.write('🛑 MJOS MCP Server shutting down...\n');
        process.exit(0);
      });

    } catch (error) {
      process.stderr.write(`❌ Failed to start MCP Server: ${error}\n`);
      process.exit(1);
    }
  }

  private showInteractiveHelp(): void {
    console.log(chalk.cyan('\n=== 可用命令 ==='));
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

  private async executeInteractiveCommand(args: string[]): Promise<void> {
    const [mainCmd, subCmd] = args;

    switch (mainCmd) {
    case 'status':
      await this.showStatus();
      break;
    case 'memory':
      if (subCmd === 'query') {
        await this.queryMemory({});
      } else if (subCmd === 'store') {
        console.log(chalk.yellow('请使用完整的 CLI 命令进行记忆存储'));
      }
      break;
    case 'team':
      if (subCmd === 'members') {
        await this.showTeamMembers();
      } else if (subCmd === 'tasks') {
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
      console.log(chalk.red(`未知命令: ${mainCmd}`));
      console.log(chalk.yellow('输入 "help" 查看可用命令'));
    }
  }

  async run(): Promise<void> {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      console.error(chalk.red('CLI错误:'), error);
      process.exit(1);
    }
  }
}

// Export for programmatic use - already exported above

// CLI entry point
if (require.main === module) {
  const cli = new MJOSCli();
  cli.run();
}
