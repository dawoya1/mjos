#!/usr/bin/env node

/**
 * 测试MJOS MCP Server的JSON通信
 * 验证stdout只输出JSON，stderr输出日志
 */

const { spawn } = require('child_process');

// 启动MCP服务器
const server = spawn('npx', ['-y', 'mjos@2.1.8', 'mcp-server'], {
  stdio: ['pipe', 'pipe', 'pipe']
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

// 处理stdout - 应该只有JSON响应
let stdoutBuffer = '';
server.stdout.on('data', (data) => {
  stdoutBuffer += data.toString();
  console.log('📥 STDOUT (JSON):', data.toString().trim());
  
  // 尝试解析JSON
  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop(); // 保留不完整的行
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('✅ 成功解析JSON响应:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.error('❌ JSON解析失败:', e.message);
        console.error('原始数据:', line);
      }
    }
  });
});

// 处理stderr - 应该只有日志
server.stderr.on('data', (data) => {
  console.log('📋 STDERR (日志):', data.toString().trim());
});

// 等待服务器启动
setTimeout(() => {
  console.log('\n🚀 开始测试JSON通信...\n');
  
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
  }, 2000);
  
  // 3. 关闭测试
  setTimeout(() => {
    console.log('\n✅ JSON通信测试完成，关闭服务器...');
    server.kill();
    process.exit(0);
  }, 5000);
  
}, 3000);

// 错误处理
server.on('error', (error) => {
  console.error('❌ 服务器错误:', error);
});

server.on('exit', (code) => {
  console.log(`🛑 服务器退出，代码: ${code}`);
});
