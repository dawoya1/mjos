#!/usr/bin/env node

/**
 * 测试MJOS MCP Server的简单脚本
 * 通过stdin/stdout与MCP服务器通信
 */

const { spawn } = require('child_process');

// 启动MCP服务器
const server = spawn('npx', ['mjos@2.1.7', 'mcp-server'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let requestId = 1;

// 发送MCP请求的辅助函数
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  
  console.log('📤 发送请求:', JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + '\n');
}

// 处理服务器响应
let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // 处理完整的JSON行
  const lines = buffer.split('\n');
  buffer = lines.pop(); // 保留不完整的行
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('📥 收到响应:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('📥 收到数据:', line);
      }
    }
  });
});

// 等待服务器启动
setTimeout(() => {
  console.log('\n🚀 开始测试MJOS MCP Server...\n');
  
  // 1. 初始化
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {}
    },
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });
  
  // 2. 获取工具列表
  setTimeout(() => {
    sendRequest('tools/list');
  }, 1000);
  
  // 3. 测试记忆存储
  setTimeout(() => {
    sendRequest('tools/call', {
      name: 'mjos_remember',
      arguments: {
        content: '这是一个测试记忆',
        tags: ['test', 'demo'],
        importance: 0.8
      }
    });
  }, 2000);
  
  // 4. 测试记忆检索
  setTimeout(() => {
    sendRequest('tools/call', {
      name: 'mjos_recall',
      arguments: {
        query: '测试',
        limit: 5
      }
    });
  }, 3000);
  
  // 5. 测试状态获取
  setTimeout(() => {
    sendRequest('tools/call', {
      name: 'mjos_get_status',
      arguments: {}
    });
  }, 4000);
  
  // 6. 关闭测试
  setTimeout(() => {
    console.log('\n✅ 测试完成，关闭服务器...');
    server.kill();
    process.exit(0);
  }, 6000);
  
}, 3000);

// 错误处理
server.on('error', (error) => {
  console.error('❌ 服务器错误:', error);
});

server.on('exit', (code) => {
  console.log(`🛑 服务器退出，代码: ${code}`);
});
