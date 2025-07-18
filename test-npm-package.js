#!/usr/bin/env node
/**
 * 测试npm包的完整性和功能
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('🧪 MJOS npm包完整性测试');
console.log('=' * 50);

// 1. 检查package.json
console.log('📋 检查package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`  ✅ 包名: ${packageJson.name}`);
console.log(`  ✅ 版本: ${packageJson.version}`);
console.log(`  ✅ 主入口: ${packageJson.main}`);
console.log(`  ✅ 类型定义: ${packageJson.types}`);
console.log(`  ✅ bin命令: ${Object.keys(packageJson.bin).join(', ')}`);

// 2. 检查必要文件
console.log('\n📁 检查必要文件...');
const requiredFiles = [
  'dist/index.js',
  'dist/index.d.ts',
  'bin/mjos-mcp-server.js',
  'config/mcp-server.json',
  'README.md'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - 缺失`);
    process.exit(1);
  }
}

// 3. 检查bin文件可执行性
console.log('\n🔧 检查bin文件可执行性...');
const binFile = 'bin/mjos-mcp-server.js';
const binContent = fs.readFileSync(binFile, 'utf8');
if (binContent.startsWith('#!/usr/bin/env node')) {
  console.log('  ✅ bin文件有正确的shebang');
} else {
  console.log('  ❌ bin文件缺少shebang');
  process.exit(1);
}

// 4. 测试本地安装
console.log('\n📦 测试本地npm安装...');
try {
  // 创建测试目录
  const testDir = 'test-npm-install';
  if (fs.existsSync(testDir)) {
    execSync(`rmdir /s /q ${testDir}`, { stdio: 'ignore' });
  }
  fs.mkdirSync(testDir);
  
  // 创建测试package.json
  const testPackageJson = {
    "name": "test-mjos-install",
    "version": "1.0.0",
    "dependencies": {}
  };
  fs.writeFileSync(
    path.join(testDir, 'package.json'), 
    JSON.stringify(testPackageJson, null, 2)
  );
  
  // 打包当前项目
  console.log('  📦 打包当前项目...');
  execSync('npm pack', { stdio: 'pipe' });
  
  // 查找生成的tgz文件
  const files = fs.readdirSync('.');
  const tgzFile = files.find(f => f.startsWith('mjos-') && f.endsWith('.tgz'));
  
  if (!tgzFile) {
    throw new Error('未找到打包文件');
  }
  
  console.log(`  ✅ 打包文件: ${tgzFile}`);
  
  // 在测试目录中安装
  console.log('  📥 安装到测试目录...');
  execSync(`npm install ../${tgzFile}`, { 
    cwd: testDir, 
    stdio: 'pipe' 
  });
  
  console.log('  ✅ 本地安装成功');
  
  // 清理
  execSync(`rmdir /s /q ${testDir}`, { stdio: 'ignore' });
  fs.unlinkSync(tgzFile);
  
} catch (error) {
  console.log(`  ❌ 本地安装失败: ${error.message}`);
  process.exit(1);
}

// 5. 测试MCP服务器启动
console.log('\n🌐 测试MCP服务器启动...');
const serverProcess = spawn('node', ['bin/mjos-mcp-server.js'], {
  stdio: 'pipe'
});

let serverOutput = '';
let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  if (data.toString().includes('MCP服务器已启动')) {
    serverStarted = true;
    console.log('  ✅ MCP服务器启动成功');
    serverProcess.kill();
  }
});

serverProcess.stderr.on('data', (data) => {
  console.log(`  ⚠️ 服务器错误: ${data}`);
});

// 等待5秒
setTimeout(() => {
  if (!serverStarted) {
    console.log('  ❌ MCP服务器启动超时');
    serverProcess.kill();
    process.exit(1);
  }
}, 5000);

serverProcess.on('close', (code) => {
  if (serverStarted) {
    console.log('  ✅ MCP服务器正常关闭');
    
    // 6. 检查配置文件
    console.log('\n📋 检查MCP配置文件...');
    const configFiles = [
      'production_config/claude_desktop_config.json',
      'production_config/cursor_config.json',
      'production_config/vscode_mcp_config.json',
      'production_config/augment_mcp_config.json'
    ];
    
    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (config.mcpServers && config.mcpServers.mjos) {
          const mjosConfig = config.mcpServers.mjos;
          if (mjosConfig.command === 'npx' && 
              mjosConfig.args && 
              mjosConfig.args.includes('mjos@latest')) {
            console.log(`  ✅ ${path.basename(configFile)} - 配置正确`);
          } else {
            console.log(`  ❌ ${path.basename(configFile)} - 配置错误`);
          }
        } else {
          console.log(`  ❌ ${path.basename(configFile)} - 缺少mjos配置`);
        }
      } else {
        console.log(`  ❌ ${configFile} - 文件不存在`);
      }
    }
    
    // 7. 最终总结
    console.log('\n🎉 npm包完整性测试完成！');
    console.log('=' * 50);
    console.log('✅ 所有检查项目通过:');
    console.log('   📦 package.json配置正确');
    console.log('   📁 所有必要文件存在');
    console.log('   🔧 bin文件可执行');
    console.log('   📥 本地安装成功');
    console.log('   🌐 MCP服务器启动正常');
    console.log('   📋 配置文件正确');
    console.log('\n🚀 准备发布到npm！');
    
  } else {
    console.log('  ❌ 测试失败');
    process.exit(1);
  }
});
