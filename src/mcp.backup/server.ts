#!/usr/bin/env node

/**
 * MJOS MCP Server Entry Point
 * MCP服务器启动入�? */

import { MJOSMCPServer } from './MJOSMCPServer.js';

async function main() {
  const server = new MJOSMCPServer({
    name: 'mjos-mcp-server',
    version: '1.0.0',
    description: 'MJOS (Magic Sword Studio Operating System) MCP Server - AI团队协作系统',
    author: 'Magic Sword Studio',
    license: 'MIT',
    logLevel: process.env.MJOS_LOG_LEVEL as any || 'info',
    enabledFeatures: {
      memory: process.env.MJOS_ENABLE_MEMORY !== 'false',
      collaboration: process.env.MJOS_ENABLE_COLLABORATION !== 'false',
      context: process.env.MJOS_ENABLE_CONTEXT !== 'false',
      reasoning: process.env.MJOS_ENABLE_REASONING !== 'false'
    }
  });

  // 处理进程信号
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('Failed to start MJOS MCP Server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
