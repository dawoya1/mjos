#!/usr/bin/env node
/**
 * MJOS npm发布准备脚本
 * 自动化npm发布流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 准备MJOS npm发布...');
console.log('=' * 50);

// 1. 检查环境
console.log('🔍 检查发布环境...');

try {
    // 检查npm登录状态
    const npmUser = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(`  ✅ npm用户: ${npmUser}`);
} catch (error) {
    console.log('  ❌ 请先登录npm: npm login');
    process.exit(1);
}

// 检查git状态
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
        console.log('  ⚠️ 有未提交的更改，建议先提交');
    } else {
        console.log('  ✅ git工作区干净');
    }
} catch (error) {
    console.log('  ⚠️ git状态检查失败');
}

// 2. 构建项目
console.log('\n🔨 构建项目...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('  ✅ 项目构建成功');
} catch (error) {
    console.log('  ❌ 项目构建失败');
    process.exit(1);
}

// 3. 运行测试
console.log('\n🧪 运行测试...');
try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('  ✅ 所有测试通过');
} catch (error) {
    console.log('  ❌ 测试失败');
    process.exit(1);
}

// 4. 检查MCP服务器
console.log('\n🌐 检查MCP服务器...');
const mcpServerPath = path.join(__dirname, '..', 'bin', 'mjos-mcp-server.js');
if (fs.existsSync(mcpServerPath)) {
    console.log('  ✅ MCP服务器文件存在');
    
    // 检查文件是否可执行
    try {
        const stats = fs.statSync(mcpServerPath);
        console.log('  ✅ MCP服务器文件可访问');
    } catch (error) {
        console.log('  ❌ MCP服务器文件访问失败');
        process.exit(1);
    }
} else {
    console.log('  ❌ MCP服务器文件不存在');
    process.exit(1);
}

// 5. 验证package.json
console.log('\n📋 验证package.json...');
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 检查必要字段
const requiredFields = ['name', 'version', 'description', 'main', 'bin'];
for (const field of requiredFields) {
    if (!packageJson[field]) {
        console.log(`  ❌ package.json缺少字段: ${field}`);
        process.exit(1);
    }
}

console.log(`  ✅ 包名: ${packageJson.name}`);
console.log(`  ✅ 版本: ${packageJson.version}`);
console.log(`  ✅ 主入口: ${packageJson.main}`);
console.log(`  ✅ 可执行文件: ${Object.keys(packageJson.bin).join(', ')}`);

// 6. 检查文件完整性
console.log('\n📁 检查发布文件...');
const filesToCheck = [
    'dist/index.js',
    'dist/index.d.ts',
    'bin/mjos-mcp-server.js',
    'config/mcp-server.json',
    'README.md',
    'CHANGELOG.md'
];

for (const file of filesToCheck) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ⚠️ ${file} (可选文件不存在)`);
    }
}

// 7. 生成发布信息
console.log('\n📊 生成发布信息...');
const releaseInfo = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    timestamp: new Date().toISOString(),
    features: [
        'MCP协议支持',
        'Claude Desktop集成',
        'Cursor集成',
        'VS Code集成',
        'Augment集成',
        'npx一键安装',
        '智能协作系统',
        '记忆管理',
        '任务管理',
        '性能监控'
    ],
    installation: {
        global: `npm install -g ${packageJson.name}`,
        npx: `npx ${packageJson.name} mjos-mcp-server`,
        local: `npm install ${packageJson.name}`
    },
    mcpConfiguration: {
        claudeDesktop: {
            command: 'npx',
            args: ['-y', `${packageJson.name}@latest`, 'mjos-mcp-server']
        },
        cursor: {
            command: 'npx',
            args: ['-y', `${packageJson.name}@latest`, 'mjos-mcp-server']
        }
    }
};

// 保存发布信息
const releaseInfoPath = path.join(__dirname, '..', 'release-info.json');
fs.writeFileSync(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));
console.log(`  ✅ 发布信息已保存: release-info.json`);

// 8. 显示发布命令
console.log('\n🎯 准备完成！可以执行发布:');
console.log('=' * 50);
console.log('📦 发布到npm:');
console.log(`   npm publish`);
console.log('');
console.log('🏷️ 创建git标签:');
console.log(`   git tag v${packageJson.version}`);
console.log(`   git push origin v${packageJson.version}`);
console.log('');
console.log('🧪 测试npx安装:');
console.log(`   npx ${packageJson.name}@latest mjos-mcp-server`);
console.log('');
console.log('📋 MCP配置示例:');
console.log(JSON.stringify(releaseInfo.mcpConfiguration.claudeDesktop, null, 2));

console.log('\n✅ npm发布准备完成！');
