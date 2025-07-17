#!/usr/bin/env node

/**
 * MJOS MCP Server 安装脚本
 * 用于在其他电脑上安装和配置MJOS MCP服务器
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const MJOS_DIR = path.join(os.homedir(), '.mjos');
const MCP_SERVER_PATH = path.join(MJOS_DIR, 'mcp-server');

/**
 * 创建目录
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 创建目录: ${dirPath}`);
  }
}

/**
 * 复制文件
 */
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`✅ 复制文件: ${path.basename(dest)}`);
}

/**
 * 复制目录
 */
function copyDir(src, dest) {
  ensureDir(dest);
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

/**
 * 安装MJOS MCP服务器
 */
async function installMCPServer() {
  try {
    console.log('🚀 开始安装MJOS MCP服务器...\n');
    
    // 1. 创建安装目录
    console.log('📁 创建安装目录...');
    ensureDir(MJOS_DIR);
    ensureDir(MCP_SERVER_PATH);
    
    // 2. 复制必要文件
    console.log('\n📦 复制程序文件...');
    
    // 复制核心文件
    const filesToCopy = [
      'package.json',
      'bin/mjos-mcp-server.js',
      'config/mcp-server.json'
    ];
    
    for (const file of filesToCopy) {
      const src = path.join(process.cwd(), file);
      const dest = path.join(MCP_SERVER_PATH, file);
      
      if (fs.existsSync(src)) {
        ensureDir(path.dirname(dest));
        copyFile(src, dest);
      } else {
        console.warn(`⚠️  文件不存在: ${file}`);
      }
    }
    
    // 复制dist目录
    const distSrc = path.join(process.cwd(), 'dist');
    const distDest = path.join(MCP_SERVER_PATH, 'dist');
    
    if (fs.existsSync(distSrc)) {
      console.log('📦 复制编译文件...');
      copyDir(distSrc, distDest);
    } else {
      console.log('⚠️  dist目录不存在，正在编译...');
      execSync('npm run build', { cwd: process.cwd(), stdio: 'inherit' });
      copyDir(distSrc, distDest);
    }
    
    // 3. 安装依赖
    console.log('\n📦 安装依赖包...');
    execSync('npm install --production', { 
      cwd: MCP_SERVER_PATH, 
      stdio: 'inherit' 
    });
    
    // 4. 创建启动脚本
    console.log('\n🔧 创建启动脚本...');
    const startScript = `#!/usr/bin/env node
// MJOS MCP Server 启动脚本
require('${path.join(MCP_SERVER_PATH, 'bin/mjos-mcp-server.js')}');
`;
    
    const scriptPath = path.join(MJOS_DIR, 'mcp-server.js');
    fs.writeFileSync(scriptPath, startScript);
    
    // 在Windows上不需要chmod
    if (process.platform !== 'win32') {
      execSync(`chmod +x "${scriptPath}"`);
    }
    
    // 5. 生成配置示例
    console.log('\n📋 生成配置示例...');
    
    const configExamples = {
      'claude-desktop': {
        mcpServers: {
          mjos: {
            command: "node",
            args: [scriptPath],
            env: {
              MJOS_LOG_LEVEL: "info"
            }
          }
        }
      },
      'cursor': {
        mcpServers: {
          mjos: {
            command: "node",
            args: [scriptPath],
            env: {
              MJOS_LOG_LEVEL: "info"
            }
          }
        }
      }
    };
    
    // 保存配置示例
    for (const [client, config] of Object.entries(configExamples)) {
      const configPath = path.join(MJOS_DIR, `${client}-config.json`);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`✅ 生成${client}配置: ${configPath}`);
    }
    
    // 6. 显示安装完成信息
    console.log('\n🎉 MJOS MCP服务器安装完成！\n');
    
    console.log('📍 安装位置:');
    console.log(`   ${MCP_SERVER_PATH}\n`);
    
    console.log('🚀 启动服务器:');
    console.log(`   node "${scriptPath}"\n`);
    
    console.log('⚙️  配置AI客户端:');
    console.log('   Claude Desktop: 复制 claude-desktop-config.json 内容到配置文件');
    console.log('   Cursor: 复制 cursor-config.json 内容到 .cursor/mcp.json');
    console.log(`   配置文件位置: ${MJOS_DIR}\n`);
    
    console.log('✅ 安装成功！现在可以在任何地方使用MJOS MCP服务器了。');
    
  } catch (error) {
    console.error('❌ 安装失败:', error.message);
    process.exit(1);
  }
}

// 运行安装
if (require.main === module) {
  installMCPServer();
}

module.exports = { installMCPServer };
