#!/usr/bin/env node

const { spawn } = require('child_process');

class MCPTester {
  constructor() {
    this.process = null;
    this.requestId = 1;
  }

  async startMCPServer() {
    console.log('🚀 启动远程MCP服务器...\n');
    
    this.process = spawn('npx', ['-y', 'mjos@2.1.14', 'mcp-server'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    // 等待服务器启动
    return new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        reject(new Error('MCP服务器启动超时'));
      }, 30000);

      this.process.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Server output:', data.toString());

        if (output.includes('MJOS MCP Server started successfully')) {
          clearTimeout(timeout);
          console.log('✅ MCP服务器启动成功\n');
          resolve();
        }
      });

      this.process.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        output += errorOutput;
        console.log('Server log:', errorOutput);

        if (errorOutput.includes('MJOS MCP Server started successfully')) {
          clearTimeout(timeout);
          console.log('✅ MCP服务器启动成功\n');
          resolve();
        }
      });

      this.process.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async sendMCPRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: method,
      params: params
    };

    console.log('📤 发送MCP请求:', JSON.stringify(request, null, 2));
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP请求超时'));
      }, 10000);

      let responseBuffer = '';

      const handleResponse = (data) => {
        responseBuffer += data.toString();
        const lines = responseBuffer.split('\n');
        
        for (const line of lines) {
          if (line.trim() && line.includes('"jsonrpc"')) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                clearTimeout(timeout);
                this.process.stdout.off('data', handleResponse);
                console.log('📥 收到MCP响应:', JSON.stringify(response, null, 2));
                resolve(response);
                return;
              }
            } catch (error) {
              // 忽略解析错误，继续等待
            }
          }
        }
      };

      this.process.stdout.on('data', handleResponse);
      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testMemoryTools() {
    try {
      console.log('🧠 测试MCP记忆工具...\n');

      // 1. 测试记忆存储工具
      console.log('1. 测试 mjos_remember 工具...');
      const rememberResponse = await this.sendMCPRequest('tools/call', {
        name: 'mjos_remember',
        arguments: {
          content: '这是一个MCP工具测试记忆',
          tags: ['test', 'mcp', 'tools']
        }
      });

      if (rememberResponse.error) {
        console.error('❌ mjos_remember 工具失败:', rememberResponse.error);
        return false;
      } else {
        console.log('✅ mjos_remember 工具成功\n');
      }

      // 2. 测试记忆查询工具
      console.log('2. 测试 mjos_recall 工具...');
      const recallResponse = await this.sendMCPRequest('tools/call', {
        name: 'mjos_recall',
        arguments: {
          tags: ['test'],
          limit: 10
        }
      });

      if (recallResponse.error) {
        console.error('❌ mjos_recall 工具失败:', recallResponse.error);
        return false;
      } else {
        console.log('✅ mjos_recall 工具成功\n');
      }

      // 3. 测试系统状态工具
      console.log('3. 测试 mjos_get_status 工具...');
      const statusResponse = await this.sendMCPRequest('tools/call', {
        name: 'mjos_get_status',
        arguments: {}
      });

      if (statusResponse.error) {
        console.error('❌ mjos_get_status 工具失败:', statusResponse.error);
        return false;
      } else {
        console.log('✅ mjos_get_status 工具成功\n');
      }

      return true;

    } catch (error) {
      console.error('❌ MCP工具测试失败:', error.message);
      return false;
    }
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      console.log('🛑 MCP服务器已停止');
    }
  }
}

async function main() {
  const tester = new MCPTester();
  
  try {
    await tester.startMCPServer();
    const success = await tester.testMemoryTools();
    
    if (success) {
      console.log('🎉 所有MCP工具测试通过！');
    } else {
      console.log('❌ MCP工具测试失败！');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  } finally {
    await tester.stop();
  }
}

main().catch(console.error);
