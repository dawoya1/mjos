#!/usr/bin/env node

/**
 * MJOS MCP Server Launcher
 * 独立的MCP服务器启动器，用于npx调用
 */

const { spawn } = require('child_process');
const path = require('path');

// 启动MCP服务器
function startMCPServer() {
  console.log('🚀 Starting MJOS MCP Server via npx...');
  
  // 使用npx运行mjos包中的mcp-server命令
  const proc = spawn('npx', ['-y', 'mjos@latest'], {
    stdio: ['inherit', 'pipe', 'inherit']
  });
  
  let output = '';
  
  proc.stdout.on('data', (data) => {
    const str = data.toString();
    output += str;
    
    // 如果看到帮助信息，说明CLI启动成功，现在启动MCP服务器
    if (str.includes('MJOS - 魔剑工作室操作系统')) {
      proc.kill();
      
      // 启动实际的MCP服务器
      const mcpProc = spawn('node', ['-e', `
        const { MJOS } = require('mjos');
        const { MCPServer } = require('@modelcontextprotocol/sdk/server/index.js');
        const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
        
        async function startServer() {
          const mjos = new MJOS();
          await mjos.start();
          
          const server = new MCPServer({
            name: 'mjos',
            version: '2.1.2'
          }, {
            capabilities: {
              tools: {}
            }
          });
          
          // 注册工具
          server.setRequestHandler('tools/list', async () => ({
            tools: [
              { name: 'mjos_remember', description: '存储记忆到MJOS系统' },
              { name: 'mjos_recall', description: '从MJOS系统检索记忆' },
              { name: 'mjos_create_task', description: '创建新任务' },
              { name: 'mjos_assign_task', description: '分配任务给团队成员' },
              { name: 'mjos_get_status', description: '获取MJOS系统状态' },
              { name: 'mjos_performance_metrics', description: '获取性能指标' }
            ]
          }));
          
          const transport = new StdioServerTransport();
          await server.connect(transport);
          
          console.error('✅ MJOS MCP Server started successfully');
        }
        
        startServer().catch(console.error);
      `], {
        stdio: 'inherit'
      });
      
      mcpProc.on('close', (code) => {
        process.exit(code);
      });
    }
  });
  
  proc.on('close', (code) => {
    if (code !== 0 && !output.includes('MJOS - 魔剑工作室操作系统')) {
      console.error('❌ Failed to start MJOS MCP Server');
      process.exit(code);
    }
  });
}

startMCPServer();
