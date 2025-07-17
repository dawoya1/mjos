#!/usr/bin/env node

/**
 * 创建MJOS MCP服务器便携版本
 * 生成一个可以在任何电脑上运行的独立包
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const OUTPUT_DIR = path.join(process.cwd(), 'portable');
const PACKAGE_NAME = 'mjos-mcp-server-portable';

/**
 * 创建便携版本
 */
async function createPortable() {
  try {
    console.log('📦 创建MJOS MCP服务器便携版本...\n');
    
    // 1. 清理并创建输出目录
    if (fs.existsSync(OUTPUT_DIR)) {
      fs.rmSync(OUTPUT_DIR, { recursive: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    const portableDir = path.join(OUTPUT_DIR, PACKAGE_NAME);
    fs.mkdirSync(portableDir);
    
    // 2. 确保项目已编译
    console.log('🔨 编译项目...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 3. 复制必要文件
    console.log('📁 复制文件...');
    
    const filesToCopy = [
      'package.json',
      'bin',
      'config',
      'dist',
      'README.md'
    ];
    
    for (const item of filesToCopy) {
      const src = path.join(process.cwd(), item);
      const dest = path.join(portableDir, item);
      
      if (fs.existsSync(src)) {
        if (fs.statSync(src).isDirectory()) {
          copyDir(src, dest);
        } else {
          fs.copyFileSync(src, dest);
        }
        console.log(`✅ 复制: ${item}`);
      }
    }
    
    // 4. 创建简化的package.json
    const originalPackage = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
    const portablePackage = {
      name: PACKAGE_NAME,
      version: originalPackage.version,
      description: originalPackage.description + ' (Portable Version)',
      main: 'bin/mjos-mcp-server.js',
      bin: {
        'mjos-mcp-server': './bin/mjos-mcp-server.js'
      },
      dependencies: originalPackage.dependencies,
      engines: originalPackage.engines
    };
    
    fs.writeFileSync(
      path.join(portableDir, 'package.json'),
      JSON.stringify(portablePackage, null, 2)
    );
    
    // 5. 创建安装和使用说明
    const readme = `# MJOS MCP Server (便携版)

## 🚀 快速开始

### 1. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 2. 启动服务器
\`\`\`bash
node bin/mjos-mcp-server.js
\`\`\`

### 3. 配置AI客户端

#### Claude Desktop
在 \`claude_desktop_config.json\` 中添加：
\`\`\`json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": ["path/to/${PACKAGE_NAME}/bin/mjos-mcp-server.js"],
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
\`\`\`

#### Cursor
在 \`.cursor/mcp.json\` 中添加：
\`\`\`json
{
  "mcpServers": {
    "mjos": {
      "command": "node",
      "args": ["path/to/${PACKAGE_NAME}/bin/mjos-mcp-server.js"],
      "env": {
        "MJOS_LOG_LEVEL": "info"
      }
    }
  }
}
\`\`\`

## 📋 可用工具

- \`mjos_remember\` - 存储记忆到MJOS系统
- \`mjos_recall\` - 从MJOS系统检索记忆
- \`mjos_create_task\` - 创建新任务
- \`mjos_assign_task\` - 分配任务给团队成员
- \`mjos_get_status\` - 获取MJOS系统状态
- \`mjos_performance_metrics\` - 获取性能指标

## 🔧 配置

编辑 \`config/mcp-server.json\` 来自定义服务器配置。

## 📞 支持

如有问题，请访问：https://github.com/dawoya1/mjos
`;
    
    fs.writeFileSync(path.join(portableDir, 'README.md'), readme);
    
    // 6. 创建启动脚本
    const startScript = `@echo off
echo 🚀 启动MJOS MCP服务器...
node bin/mjos-mcp-server.js
pause
`;
    
    fs.writeFileSync(path.join(portableDir, 'start.bat'), startScript);
    
    const startShScript = `#!/bin/bash
echo "🚀 启动MJOS MCP服务器..."
node bin/mjos-mcp-server.js
`;
    
    fs.writeFileSync(path.join(portableDir, 'start.sh'), startShScript);
    
    // 7. 创建压缩包
    console.log('📦 创建压缩包...');
    
    const output = fs.createWriteStream(path.join(OUTPUT_DIR, `${PACKAGE_NAME}.zip`));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`\n🎉 便携版本创建完成！`);
      console.log(`📍 位置: ${path.join(OUTPUT_DIR, `${PACKAGE_NAME}.zip`)}`);
      console.log(`📦 大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      console.log(`\n📋 使用方法:`);
      console.log(`1. 解压 ${PACKAGE_NAME}.zip`);
      console.log(`2. 进入解压目录`);
      console.log(`3. 运行 npm install`);
      console.log(`4. 运行 node bin/mjos-mcp-server.js`);
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    archive.directory(portableDir, PACKAGE_NAME);
    archive.finalize();
    
  } catch (error) {
    console.error('❌ 创建便携版本失败:', error.message);
    process.exit(1);
  }
}

/**
 * 复制目录
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 运行创建便携版本
if (require.main === module) {
  createPortable();
}

module.exports = { createPortable };
