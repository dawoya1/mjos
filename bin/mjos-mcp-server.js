#!/usr/bin/env node

/**
 * MJOS MCP Server
 * 生产级MCP服务器入口点
 */

// 尝试从不同路径加载MJOS
let MJOS;
try {
  // 首先尝试从当前包加载
  MJOS = require('../dist/index.js').MJOS;
} catch (e1) {
  try {
    // 然后尝试从npm包加载
    MJOS = require('mjos').MJOS;
  } catch (e2) {
    console.error('❌ 无法加载MJOS模块:', e2.message);
    process.exit(1);
  }
}
const path = require('path');
const fs = require('fs');

// 配置文件路径
const CONFIG_PATHS = [
  path.join(process.cwd(), 'mjos.config.json'),
  path.join(process.cwd(), '.mjos', 'config.json'),
  path.join(__dirname, '..', 'config', 'mcp-server.json')
];

// 默认配置
const DEFAULT_CONFIG = {
  name: 'mjos-mcp-server',
  version: '2.0.0',
  description: 'MJOS MCP Server - AI团队协作系统',
  author: 'Magic Sword Studio',
  license: 'MIT',
  logLevel: process.env.MJOS_LOG_LEVEL || 'info',
  enabledFeatures: {
    memory: true,
    collaboration: true,
    context: true,
    reasoning: true,
    workflow: true,
    monitoring: true
  },
  server: {
    host: process.env.MJOS_HOST || 'localhost',
    port: parseInt(process.env.MJOS_PORT) || 3000,
    timeout: 30000
  }
};

/**
 * 加载配置文件
 */
function loadConfig() {
  // 尝试从配置文件加载
  for (const configPath of CONFIG_PATHS) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`📋 Loaded config from: ${configPath}`);
        return { ...DEFAULT_CONFIG, ...config };
      } catch (error) {
        console.warn(`⚠️  Failed to load config from ${configPath}:`, error.message);
      }
    }
  }
  
  console.log('📋 Using default configuration');
  return DEFAULT_CONFIG;
}

// 简化的MCP服务器实现（基于工作的示例）
class ProductionMJOSMCPServer {
  constructor(options = {}) {
    this.name = options.name || 'mjos-mcp-server';
    this.version = options.version || '2.0.0';
    this.mjos = new MJOS();
    this.tools = new Map();

    this.setupTools();
  }

  setupTools() {
    // 记忆存储工具
    this.tools.set('mjos_remember', {
      name: 'mjos_remember',
      description: '存储记忆到MJOS系统',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '要存储的内容' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签' },
          importance: { type: 'number', minimum: 0, maximum: 1, description: '重要性' }
        },
        required: ['content']
      },
      handler: async (args) => {
        if (!this.mjos || !this.mjos.running) {
          throw new Error('MJOS system is not running. Please wait for system initialization.');
        }
        return this.mjos.remember(args.content, args.tags || [], args.importance || 0.5);
      }
    });

    // 记忆检索工具
    this.tools.set('mjos_recall', {
      name: 'mjos_recall',
      description: '从MJOS系统检索记忆',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'object', description: '查询条件' }
        },
        required: ['query']
      },
      handler: async (args) => {
        if (!this.mjos || !this.mjos.running) {
          throw new Error('MJOS system is not running. Please wait for system initialization.');
        }
        return this.mjos.recall(args.query);
      }
    });

    // 任务创建工具
    this.tools.set('mjos_create_task', {
      name: 'mjos_create_task',
      description: '创建新任务',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '任务标题' },
          description: { type: 'string', description: '任务描述' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: '优先级' }
        },
        required: ['title', 'description']
      },
      handler: async (args) => {
        if (!this.mjos || !this.mjos.running) {
          throw new Error('MJOS system is not running. Please wait for system initialization.');
        }
        return this.mjos.createTask(args.title, args.description, args.priority || 'medium');
      }
    });

    // 任务分配工具
    this.tools.set('mjos_assign_task', {
      name: 'mjos_assign_task',
      description: '分配任务给团队成员',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: '任务ID' },
          assignee: { type: 'string', description: '分配给的成员' }
        },
        required: ['taskId', 'assignee']
      },
      handler: async (args) => {
        if (!this.mjos || !this.mjos.running) {
          throw new Error('MJOS system is not running. Please wait for system initialization.');
        }
        return this.mjos.assignTask(args.taskId, args.assignee);
      }
    });

    // 系统状态工具
    this.tools.set('mjos_get_status', {
      name: 'mjos_get_status',
      description: '获取MJOS系统状态',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        if (!this.mjos || !this.mjos.running) {
          throw new Error('MJOS system is not running. Please wait for system initialization.');
        }
        return this.mjos.getStatus();
      }
    });

    // 简化的性能指标工具
    this.tools.set('mjos_performance_metrics', {
      name: 'mjos_performance_metrics',
      description: '获取基本性能指标（内存使用、系统运行时间）',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        if (!this.mjos || !this.mjos.running) {
          throw new Error('MJOS system is not running. Please wait for system initialization.');
        }
        return this.mjos.getPerformanceMetrics();
      }
    });


  }

  async start() {
    try {
      // 启动MJOS系统
      await this.mjos.start();
      console.log('✅ MJOS系统已启动');

      // 显示MCP服务器信息
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
            command: "mjos-mcp-server",
            env: { MJOS_LOG_LEVEL: "info" }
          }
        }
      }, null, 2));

      console.log('\n🎯 Cursor:');
      console.log(JSON.stringify({
        mcpServers: {
          mjos: {
            command: "mjos-mcp-server",
            env: { MJOS_LOG_LEVEL: "info" }
          }
        }
      }, null, 2));

      console.log('\n🔄 或使用npx (如果全局安装有问题):');
      console.log(JSON.stringify({
        mcpServers: {
          mjos: {
            command: "npx",
            args: ["-y", "mjos@latest", "mjos-mcp-server"],
            env: { MJOS_LOG_LEVEL: "info" }
          }
        }
      }, null, 2));

      // 保持服务器运行
      console.log('\n🔄 服务器运行中... (按 Ctrl+C 停止)');

    } catch (error) {
      console.error('❌ MCP服务器启动失败:', error.message);
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

/**
 * 启动MCP服务器
 */
async function startMCPServer() {
  try {
    console.log('🚀 Starting MJOS MCP Server...\n');

    // 加载配置
    const config = loadConfig();

    // 创建MCP服务器
    const mcpServer = new ProductionMJOSMCPServer(config);

    // 启动服务器
    await mcpServer.start();

    // 优雅关闭处理
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down MJOS MCP Server...');
      await mcpServer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down MJOS MCP Server...');
      await mcpServer.stop();
      process.exit(0);
    });

    // 保持进程运行
    await new Promise(() => {}); // 永远等待

  } catch (error) {
    console.error('❌ Failed to start MJOS MCP Server:', error);
    process.exit(1);
  }
}

// 启动服务器
if (require.main === module) {
  startMCPServer();
}

module.exports = { startMCPServer, loadConfig };
