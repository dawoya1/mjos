# MJOS 开发环境配置指南

> **最后更新时间**: 2025-07-17 09:15:45 UTC  
> **文档版本**: v2.0.0  
> **更新内容**: 创建完整的开发环境配置指南

## 📋 概述

本指南将帮助开发者快速搭建MJOS的本地开发环境，包括必要的工具安装、环境配置和开发流程设置。

## 🛠️ 系统要求

### 硬件要求
- **CPU**: 4核心以上，推荐8核心
- **内存**: 8GB以上，推荐16GB
- **存储**: 20GB可用空间，推荐SSD
- **网络**: 稳定的互联网连接

### 操作系统支持
- **Windows**: Windows 10/11 (推荐使用WSL2)
- **macOS**: macOS 10.15+
- **Linux**: Ubuntu 18.04+, CentOS 7+, Debian 10+

## 🔧 必需工具安装

### 1. Node.js 环境
```bash
# 使用nvm安装Node.js (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18.17.0
nvm use 18.17.0
nvm alias default 18.17.0

# 验证安装
node --version  # 应显示 v18.17.0+
npm --version   # 应显示 9.6.7+
```

### 2. Git 版本控制
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install git

# CentOS/RHEL
sudo yum install git

# macOS (使用Homebrew)
brew install git

# Windows
# 下载并安装 Git for Windows: https://git-scm.com/download/win

# 配置Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. 开发工具

#### Visual Studio Code (推荐)
```bash
# 下载并安装: https://code.visualstudio.com/

# 推荐扩展
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
```

#### 其他IDE选项
- **WebStorm**: JetBrains的专业IDE
- **Vim/Neovim**: 轻量级编辑器
- **Emacs**: 可扩展编辑器

### 4. 数据库工具 (可选)
```bash
# Redis (用于缓存)
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Windows
# 下载并安装: https://github.com/microsoftarchive/redis/releases

# PostgreSQL (用于持久化存储)
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# 下载并安装: https://www.postgresql.org/download/windows/
```

## 📦 项目设置

### 1. 克隆项目
```bash
# 克隆主仓库
git clone https://github.com/dawoya1/mjos.git
cd mjos

# 查看分支
git branch -a

# 切换到开发分支 (如果存在)
git checkout develop
```

### 2. 安装依赖
```bash
# 安装项目依赖
npm install

# 验证安装
npm list --depth=0
```

### 3. 环境配置
```bash
# 复制环境配置模板
cp .env.example .env

# 编辑环境变量
nano .env  # 或使用你喜欢的编辑器
```

#### 环境变量配置
```bash
# .env 文件内容示例
NODE_ENV=development
LOG_LEVEL=debug

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mjos_dev
DB_USER=mjos_user
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 安全配置
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key

# API配置
API_PORT=3000
API_HOST=localhost

# 监控配置
ENABLE_METRICS=true
METRICS_PORT=9090
```

### 4. 数据库初始化
```bash
# 创建数据库
createdb mjos_dev

# 运行数据库迁移 (如果有)
npm run db:migrate

# 填充测试数据 (可选)
npm run db:seed
```

## 🏃‍♂️ 开发流程

### 1. 启动开发服务器
```bash
# 启动开发模式
npm run dev

# 或者分别启动不同服务
npm run dev:api      # API服务器
npm run dev:cli      # CLI工具
npm run dev:web      # Web界面 (如果有)
```

### 2. 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- tests/memory.test.ts

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 3. 代码检查和格式化
```bash
# 运行ESLint检查
npm run lint

# 自动修复ESLint问题
npm run lint:fix

# 运行Prettier格式化
npm run format

# 检查TypeScript类型
npm run type-check
```

### 4. 构建项目
```bash
# 构建生产版本
npm run build

# 清理构建文件
npm run clean

# 构建并运行
npm run build && npm start
```

## 🔍 调试配置

### VS Code 调试配置
创建 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug MJOS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Chrome DevTools 调试
```bash
# 启动带调试的Node.js
node --inspect-brk=9229 dist/index.js

# 在Chrome中打开: chrome://inspect
```

## 🧪 测试环境

### 测试数据库设置
```bash
# 创建测试数据库
createdb mjos_test

# 设置测试环境变量
export NODE_ENV=test
export DB_NAME=mjos_test
```

### 测试配置
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 🔧 开发工具配置

### ESLint 配置
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': 'warn'
  }
};
```

### Prettier 配置
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript 配置
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@core/*": ["core/*"],
      "@memory/*": ["memory/*"],
      "@types/*": ["types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 🚀 性能优化

### 开发环境优化
```bash
# 使用更快的包管理器
npm install -g pnpm
pnpm install  # 替代 npm install

# 启用TypeScript增量编译
# 在 tsconfig.json 中添加:
# "incremental": true,
# "tsBuildInfoFile": ".tsbuildinfo"

# 使用SWC进行更快的编译 (可选)
npm install -D @swc/core @swc/jest
```

### 内存和CPU监控
```bash
# 监控Node.js进程
npm install -g clinic
clinic doctor -- node dist/index.js

# 内存使用分析
node --inspect --max-old-space-size=4096 dist/index.js
```

## 🔒 安全最佳实践

### 环境变量安全
```bash
# 永远不要提交 .env 文件
echo ".env" >> .gitignore

# 使用强密码和密钥
openssl rand -base64 32  # 生成随机密钥
```

### 依赖安全
```bash
# 定期检查安全漏洞
npm audit

# 自动修复已知漏洞
npm audit fix

# 使用Snyk进行深度安全扫描
npm install -g snyk
snyk test
```

## 📚 学习资源

### 官方文档
- [Node.js 文档](https://nodejs.org/docs/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Jest 测试框架](https://jestjs.io/docs/)

### 推荐阅读
- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Design Patterns](https://refactoring.guru/design-patterns)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🆘 故障排除

### 常见问题

#### 1. 端口占用
```bash
# 查找占用端口的进程
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 终止进程
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### 2. 依赖安装失败
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScript编译错误
```bash
# 清理TypeScript缓存
rm -rf dist .tsbuildinfo

# 重新编译
npm run build
```

---

**维护团队**: MJOS开发团队  
**更新频率**: 每月一次  
**技术支持**: dev@mjos.com
