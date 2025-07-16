/**
 * MJOS MCP Server Demo (JavaScript)
 * MJOS MCP服务器演示 - JavaScript版本
 */

const { MJOS } = require('../dist/index.js');

// 简化的MCP服务器实现
class SimpleMJOSMCPServer {
  constructor(options = {}) {
    this.name = options.name || 'mjos-mcp-server';
    this.version = options.version || '1.0.0';
    this.mjos = new MJOS();
    this.tools = new Map();
    
    this.setupTools();
  }

  setupTools() {
    // 记忆管理工具
    this.tools.set('mjos_remember', {
      name: 'mjos_remember',
      description: '存储记忆到MJOS系统',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '记忆内容' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签列表' },
          importance: { type: 'number', minimum: 0, maximum: 1, description: '重要性(0-1)' }
        },
        required: ['content']
      },
      handler: async (args) => {
        const { content, tags = [], importance = 0.5 } = args;
        const memoryId = this.mjos.remember(content, tags, importance);
        return {
          success: true,
          memoryId,
          message: `记忆已存储，ID: ${memoryId}`
        };
      }
    });

    this.tools.set('mjos_recall', {
      name: 'mjos_recall',
      description: '从MJOS系统检索记忆',
      inputSchema: {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' }, description: '搜索标签' },
          importance_min: { type: 'number', minimum: 0, maximum: 1, description: '最小重要性' },
          importance_max: { type: 'number', minimum: 0, maximum: 1, description: '最大重要性' },
          limit: { type: 'number', minimum: 1, maximum: 100, description: '结果限制' }
        }
      },
      handler: async (args) => {
        const query = {};
        if (args.tags) query.tags = args.tags;
        if (args.importance_min || args.importance_max) {
          query.importance = {
            min: args.importance_min || 0,
            max: args.importance_max || 1
          };
        }
        if (args.limit) query.limit = args.limit;

        const memories = this.mjos.recall(query);
        return {
          success: true,
          count: memories.length,
          memories: memories.map(m => ({
            id: m.id,
            content: m.content,
            tags: m.tags,
            importance: m.importance,
            timestamp: m.timestamp
          }))
        };
      }
    });

    this.tools.set('mjos_create_task', {
      name: 'mjos_create_task',
      description: '创建新任务',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '任务标题' },
          description: { type: 'string', description: '任务描述' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: '优先级' }
        },
        required: ['title', 'description']
      },
      handler: async (args) => {
        const { title, description, priority = 'medium' } = args;
        const taskId = this.mjos.createTask(title, description, priority);
        return {
          success: true,
          taskId,
          message: `任务已创建，ID: ${taskId}`
        };
      }
    });

    this.tools.set('mjos_assign_task', {
      name: 'mjos_assign_task',
      description: '分配任务给团队成员',
      inputSchema: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: '任务ID' },
          member_id: { type: 'string', enum: ['moxiaozhi', 'moxiaochuang', 'moxiaocang', 'moxiaoce'], description: '成员ID' }
        },
        required: ['task_id', 'member_id']
      },
      handler: async (args) => {
        const { task_id, member_id } = args;
        const success = this.mjos.assignTask(task_id, member_id);
        
        if (success) {
          const teamManager = this.mjos.getTeamManager();
          const member = teamManager.getMember(member_id);
          return {
            success: true,
            message: `任务已分配给 ${member.name}`
          };
        } else {
          return {
            success: false,
            message: '任务分配失败，请检查任务ID和成员ID'
          };
        }
      }
    });

    this.tools.set('mjos_get_status', {
      name: 'mjos_get_status',
      description: '获取MJOS系统状态',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async (args) => {
        const status = this.mjos.getStatus();
        return {
          success: true,
          status: {
            version: status.version,
            engine_running: status.engine.running,
            memory_count: status.memory.totalMemories,
            team_members: status.team.totalMembers,
            total_tasks: status.team.totalTasks,
            performance_status: status.performance.status
          }
        };
      }
    });

    this.tools.set('mjos_performance_metrics', {
      name: 'mjos_performance_metrics',
      description: '获取性能指标',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async (args) => {
        const metrics = this.mjos.getPerformanceMetrics();
        return {
          success: true,
          metrics: {
            memory_operations: metrics.operationCounts.memoryOperations,
            task_operations: metrics.operationCounts.taskOperations,
            context_operations: metrics.operationCounts.contextOperations,
            avg_memory_query_time: metrics.responseTimes.averageMemoryQuery,
            avg_task_creation_time: metrics.responseTimes.averageTaskCreation,
            memory_usage_percent: metrics.memoryUsage.percentage,
            system_uptime: metrics.systemUptime,
            total_errors: metrics.errorCounts.total
          }
        };
      }
    });
  }

  async start() {
    console.log(`🚀 启动 ${this.name} v${this.version}`);
    
    try {
      // 启动MJOS系统
      await this.mjos.start();
      console.log('✅ MJOS系统已启动');

      // 模拟MCP服务器运行
      console.log('🌐 MCP服务器已启动，等待客户端连接...');
      console.log('📋 可用工具:');
      
      for (const [name, tool] of this.tools) {
        console.log(`   - ${name}: ${tool.description}`);
      }

      console.log('\n💡 配置示例:');

      console.log('\n📱 Claude Desktop:');
      console.log(JSON.stringify({
        mcpServers: {
          mjos: {
            command: "node",
            args: [".mjos/examples/mcp-server-demo.js"],
            cwd: process.cwd(),
            env: {
              MJOS_LOG_LEVEL: "info"
            }
          }
        }
      }, null, 2));

      console.log('\n🎯 Cursor:');
      console.log(JSON.stringify({
        "mcp.servers": [
          {
            name: "mjos",
            command: "node",
            args: [".mjos/examples/mcp-server-demo.js"],
            cwd: process.cwd(),
            env: {
              MJOS_LOG_LEVEL: "info"
            }
          }
        ]
      }, null, 2));

      console.log('\n🚀 Augment:');
      console.log(JSON.stringify({
        mcpServers: {
          mjos: {
            command: "node",
            args: [".mjos/examples/mcp-server-demo.js"],
            cwd: process.cwd(),
            env: {
              MJOS_LOG_LEVEL: "info"
            }
          }
        }
      }, null, 2));

      // 演示工具调用
      await this.demonstrateTools();

      // 保持服务器运行
      console.log('\n🔄 服务器运行中... (按 Ctrl+C 停止)');
      
      // 优雅关闭处理
      process.on('SIGINT', async () => {
        console.log('\n🛑 收到停止信号，正在关闭服务器...');
        await this.stop();
        process.exit(0);
      });

      // 保持进程运行
      await new Promise(() => {}); // 永远等待

    } catch (error) {
      console.error('❌ MCP服务器启动失败:', error.message);
      throw error;
    }
  }

  async demonstrateTools() {
    console.log('\n🧪 演示工具功能:');

    try {
      // 演示记忆存储
      const rememberResult = await this.tools.get('mjos_remember').handler({
        content: 'MCP服务器演示记忆',
        tags: ['演示', 'MCP'],
        importance: 0.8
      });
      console.log('📝 记忆存储:', rememberResult.message);

      // 演示任务创建
      const taskResult = await this.tools.get('mjos_create_task').handler({
        title: 'MCP集成测试',
        description: '测试MCP服务器与AI客户端的集成',
        priority: 'high'
      });
      console.log('📋 任务创建:', taskResult.message);

      // 演示任务分配
      const assignResult = await this.tools.get('mjos_assign_task').handler({
        task_id: taskResult.taskId,
        member_id: 'moxiaozhi'
      });
      console.log('👤 任务分配:', assignResult.message);

      // 演示状态查询
      const statusResult = await this.tools.get('mjos_get_status').handler({});
      console.log('📊 系统状态:', `引擎运行: ${statusResult.status.engine_running}, 记忆数: ${statusResult.status.memory_count}, 任务数: ${statusResult.status.total_tasks}`);

    } catch (error) {
      console.error('❌ 工具演示失败:', error.message);
    }
  }

  async callTool(name, args) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`未知工具: ${name}`);
    }

    try {
      console.log(`🔧 调用工具: ${name}`, args);
      const result = await tool.handler(args);
      console.log(`✅ 工具结果:`, result);
      return result;
    } catch (error) {
      console.error(`❌ 工具调用失败: ${name}`, error.message);
      throw error;
    }
  }

  async stop() {
    console.log('🛑 停止MCP服务器...');
    
    try {
      await this.mjos.stop();
      console.log('✅ MJOS系统已停止');
      console.log('✅ MCP服务器已停止');
    } catch (error) {
      console.error('❌ 停止服务器时出错:', error.message);
    }
  }

  getTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }
}

// 主函数
async function main() {
  console.log('🌐 MJOS MCP Server Demo');
  console.log('======================\n');

  const server = new SimpleMJOSMCPServer({
    name: 'mjos-demo-server',
    version: '1.0.0'
  });

  try {
    await server.start();
  } catch (error) {
    console.error('💥 服务器启动失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimpleMJOSMCPServer };
