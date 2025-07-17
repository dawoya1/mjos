#!/usr/bin/env ts-node

/**
 * MJOS Quick Fix Script
 * 快速修复脚本 - 解决最紧急的问题
 */

import { promises as fs } from 'fs';
import { join } from 'path';

async function quickFix() {
  console.log('🔧 Starting MJOS Quick Fix...\n');

  try {
    // 1. 修复Jest配置
    console.log('📝 Fixing Jest configuration...');
    await fixJestConfig();
    console.log('✅ Jest configuration fixed\n');

    // 2. 更新package.json脚本
    console.log('📦 Updating package.json scripts...');
    await updatePackageScripts();
    console.log('✅ Package scripts updated\n');

    // 3. 创建测试设置文件
    console.log('🧪 Creating test setup files...');
    await createTestSetup();
    console.log('✅ Test setup files created\n');

    // 4. 更新README
    console.log('📚 Updating README.md...');
    await updateReadme();
    console.log('✅ README.md updated\n');

    // 5. 创建基本的API文档
    console.log('📖 Creating API documentation...');
    await createApiDocs();
    console.log('✅ API documentation created\n');

    // 6. 创建贡献指南
    console.log('🤝 Creating contribution guide...');
    await createContributionGuide();
    console.log('✅ Contribution guide created\n');

    console.log('🎉 Quick fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm test');
    console.log('2. Run: npm run demo:complete');
    console.log('3. Review updated documentation');
    console.log('4. Check docs/COMPLETION-PLAN.md for full roadmap');

  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    process.exit(1);
  }
}

async function fixJestConfig() {
  const jestConfig = `module.exports = {
  // 预设配置
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 根目录
  rootDir: '.',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@memory/(.*)$': '<rootDir>/src/memory/$1',
    '^@team/(.*)$': '<rootDir>/src/team/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,js}',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // 转换配置
  transform: {
    '^.+\\\\.ts$': 'ts-jest'
  },
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // 超时设置
  testTimeout: 30000,
  
  // 详细输出
  verbose: true
};`;

  await fs.writeFile('jest.config.js', jestConfig);
}

async function updatePackageScripts() {
  const packagePath = 'package.json';
  const packageContent = await fs.readFile(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  // 更新scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest tests/integration.test.ts",
    "docs:generate": "typedoc src/index.ts --out docs/api",
    "docs:serve": "http-server docs -p 8080",
    "fix:quick": "ts-node scripts/quick-fix.ts",
    "health:check": "ts-node scripts/health-check.ts"
  };

  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
}

async function createTestSetup() {
  const setupContent = `/**
 * Jest Test Setup
 * 测试环境设置
 */

// 设置测试超时
jest.setTimeout(30000);

// 全局测试配置
global.console = {
  ...console,
  // 在测试中静默某些日志
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.MJOS_LOG_LEVEL = 'error';

// 全局测试工具
global.testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  randomString: () => Math.random().toString(36).substring(7),
  randomNumber: (min: number = 0, max: number = 100) => 
    Math.floor(Math.random() * (max - min + 1)) + min
};

// 测试前清理
beforeEach(() => {
  jest.clearAllMocks();
});

// 测试后清理
afterEach(() => {
  // 清理定时器
  jest.clearAllTimers();
});`;

  await fs.writeFile('tests/setup.ts', setupContent);

  // 创建测试工具
  const testUtilsContent = `/**
 * Test Utilities
 * 测试工具函数
 */

import { MJOS } from '../src/index';

export class TestHelper {
  private mjos?: MJOS;

  async createTestMJOS(): Promise<MJOS> {
    this.mjos = new MJOS();
    await this.mjos.start();
    return this.mjos;
  }

  async cleanup(): Promise<void> {
    if (this.mjos) {
      await this.mjos.stop();
      this.mjos = undefined;
    }
  }

  generateTestData(type: 'memory' | 'task' | 'agent') {
    switch (type) {
      case 'memory':
        return {
          content: \`Test memory \${Date.now()}\`,
          tags: ['test', 'automated'],
          importance: Math.random()
        };
      case 'task':
        return {
          title: \`Test task \${Date.now()}\`,
          description: 'Automated test task',
          priority: 'medium' as const
        };
      case 'agent':
        return {
          name: \`Test agent \${Date.now()}\`,
          type: 'reactive' as const,
          capabilities: [
            { name: 'test', type: 'cognitive' as const, parameters: {}, constraints: {} }
          ],
          configuration: {
            maxConcurrentTasks: 1,
            memoryLimit: 100,
            collaborationMode: 'collaboration' as const,
            preferences: {}
          }
        };
      default:
        throw new Error(\`Unknown test data type: \${type}\`);
    }
  }
}

export const testHelper = new TestHelper();`;

  await fs.writeFile('tests/utils.ts', testUtilsContent);
}

async function updateReadme() {
  // 备份原README
  try {
    await fs.copyFile('README.md', 'README-backup.md');
  } catch (error) {
    // 忽略备份错误
  }

  // 使用新的README
  try {
    await fs.copyFile('README-NEW.md', 'README.md');
    await fs.unlink('README-NEW.md');
  } catch (error) {
    console.warn('Warning: Could not update README.md');
  }
}

async function createApiDocs() {
  // 创建docs目录
  await fs.mkdir('docs/api', { recursive: true });

  // 创建API概览文档
  const apiOverview = `# MJOS API Documentation

## Overview

MJOS provides multiple interfaces for interaction:

1. **Programmatic API** - Direct TypeScript/JavaScript usage
2. **REST API** - HTTP endpoints for web integration
3. **CLI API** - Command-line interface
4. **SDK API** - Multi-language software development kits

## Core Modules

### Memory System
- \`store(content, tags, importance)\` - Store memory
- \`retrieve(id)\` - Retrieve memory by ID
- \`query(query)\` - Query memories
- \`getStats()\` - Get memory statistics

### Knowledge Graph
- \`add(knowledge)\` - Add knowledge item
- \`query(query)\` - Search knowledge
- \`getStats()\` - Get knowledge statistics

### Team Management
- \`createTask(title, description)\` - Create new task
- \`assignTask(taskId, memberId)\` - Assign task
- \`getTeamStats()\` - Get team statistics

### Agent Management
- \`createAgent(definition)\` - Create new agent
- \`assignTaskToAgent(taskId, agentId)\` - Assign task to agent
- \`getAgent(agentId)\` - Get agent information

## REST API Endpoints

### System
- \`GET /api/v1/status\` - System status
- \`GET /api/v1/health\` - Health check

### Memory
- \`POST /api/v1/memory/store\` - Store memory
- \`GET /api/v1/memory/:id\` - Get memory
- \`POST /api/v1/memory/query\` - Query memories

### Tasks
- \`POST /api/v1/team/tasks\` - Create task
- \`GET /api/v1/team/tasks\` - List tasks
- \`GET /api/v1/team/members\` - List team members

### Agents
- \`POST /api/v1/agents\` - Create agent
- \`GET /api/v1/agents/:id\` - Get agent
- \`POST /api/v1/agents/assign\` - Assign task to agent

## CLI Commands

### System
- \`mjos status\` - Show system status
- \`mjos start\` - Start MJOS system
- \`mjos stop\` - Stop MJOS system

### Memory
- \`mjos memory store <content>\` - Store memory
- \`mjos memory query\` - Query memories
- \`mjos memory stats\` - Memory statistics

### Team
- \`mjos team members\` - List team members
- \`mjos team tasks\` - List tasks
- \`mjos team create-task\` - Create new task

## SDK Usage

### TypeScript/JavaScript
\`\`\`typescript
import { MJOS } from 'mjos';
const mjos = new MJOS();
await mjos.start();
\`\`\`

### Python
\`\`\`python
from mjos_sdk import MJOSSDK
sdk = MJOSSDK()
\`\`\`

### Java
\`\`\`java
import com.mjos.MJOSSDK;
MJOSSDK sdk = new MJOSSDK();
\`\`\`

For detailed API reference, see the generated TypeDoc documentation.`;

  await fs.writeFile('docs/api/README.md', apiOverview);

  // 创建TypeDoc配置
  const typedocConfig = `{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api/generated",
  "theme": "default",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeExternals": true,
  "readme": "README.md",
  "name": "MJOS API Documentation",
  "tsconfig": "tsconfig.json"
}`;

  await fs.writeFile('typedoc.json', typedocConfig);
}

async function createContributionGuide() {
  const contributionGuide = `# Contributing to MJOS

Thank you for your interest in contributing to MJOS! This guide will help you get started.

## Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-org/mjos.git
   cd mjos
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run tests**
   \`\`\`bash
   npm test
   \`\`\`

4. **Start development**
   \`\`\`bash
   npm run dev
   \`\`\`

## Code Standards

### TypeScript
- Use strict TypeScript configuration
- Provide complete type definitions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing
- Write unit tests for all new features
- Maintain test coverage above 90%
- Use descriptive test names
- Test both success and error cases

### Documentation
- Update README.md for user-facing changes
- Add inline code comments for complex logic
- Update API documentation
- Provide usage examples

## Pull Request Process

1. **Create a feature branch**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

2. **Make your changes**
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation

3. **Test your changes**
   \`\`\`bash
   npm test
   npm run lint
   npm run build
   \`\`\`

4. **Submit pull request**
   - Provide clear description
   - Reference related issues
   - Include test results

## Issue Reporting

When reporting issues, please include:
- MJOS version
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## Code Review

All submissions require code review. We look for:
- Code quality and style
- Test coverage
- Documentation completeness
- Performance impact
- Security considerations

## Release Process

1. Version bump following semantic versioning
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm
5. Update documentation

## Getting Help

- Check existing issues and documentation
- Join our Discord community
- Email: dev@mjos.com

Thank you for contributing to MJOS!`;

  await fs.writeFile('CONTRIBUTING.md', contributionGuide);
}

// 运行快速修复
if (require.main === module) {
  quickFix().catch(console.error);
}

export { quickFix };
