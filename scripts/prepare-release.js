#!/usr/bin/env node

/**
 * MJOS发布准备脚本
 * 自动化准备GitHub和npm发布
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 执行命令并显示输出
 */
function runCommand(command, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description}完成`);
  } catch (error) {
    console.error(`❌ ${description}失败:`, error.message);
    process.exit(1);
  }
}

/**
 * 检查文件是否存在
 */
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}缺失: ${filePath}`);
    return false;
  }
}

/**
 * 准备发布
 */
async function prepareRelease() {
  console.log('🚀 开始准备MJOS发布...\n');
  
  // 1. 检查必要文件
  console.log('📋 检查必要文件...');
  const requiredFiles = [
    { path: 'package.json', desc: 'Package配置' },
    { path: 'README.md', desc: 'README文档' },
    { path: 'LICENSE', desc: '许可证文件' },
    { path: 'tsconfig.json', desc: 'TypeScript配置' },
    { path: '.gitignore', desc: 'Git忽略文件' },
    { path: '.npmignore', desc: 'npm忽略文件' }
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.error('\n❌ 缺少必要文件，请先完善项目结构');
    process.exit(1);
  }
  
  // 2. 清理和构建
  runCommand('npm run clean', '清理构建目录');
  runCommand('npm run build', '构建项目');
  
  // 3. 运行测试
  runCommand('npm test', '运行测试');
  
  // 4. 代码质量检查
  runCommand('npm run lint', '代码质量检查');
  runCommand('npm run type-check', 'TypeScript类型检查');
  
  // 5. 检查包内容
  console.log('\n📦 检查包内容...');
  try {
    const packResult = execSync('npm pack --dry-run', { encoding: 'utf8' });
    console.log('包将包含以下文件:');
    console.log(packResult);
  } catch (error) {
    console.warn('⚠️  无法预览包内容:', error.message);
  }
  
  // 6. 检查Git状态
  console.log('\n📋 检查Git状态...');
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      console.log('⚠️  有未提交的更改:');
      console.log(gitStatus);
      console.log('建议先提交所有更改再发布');
    } else {
      console.log('✅ Git工作目录干净');
    }
  } catch (error) {
    console.warn('⚠️  无法检查Git状态:', error.message);
  }
  
  // 7. 显示发布信息
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log('\n🎉 发布准备完成！');
  console.log('\n📋 项目信息:');
  console.log(`   名称: ${packageJson.name}`);
  console.log(`   版本: ${packageJson.version}`);
  console.log(`   描述: ${packageJson.description}`);
  console.log(`   作者: ${packageJson.author}`);
  console.log(`   许可证: ${packageJson.license}`);
  
  console.log('\n🚀 发布步骤:');
  console.log('\n📱 GitHub发布:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Release v' + packageJson.version + '"');
  console.log('   3. git tag v' + packageJson.version);
  console.log('   4. git push origin main');
  console.log('   5. git push origin v' + packageJson.version);
  
  console.log('\n📦 npm发布:');
  console.log('   1. npm login');
  console.log('   2. npm publish');
  
  console.log('\n💡 提示:');
  console.log('   - 确保已登录npm账户');
  console.log('   - 确保包名在npm上可用');
  console.log('   - 建议先发布到npm测试环境');
  console.log('   - 发布后无法撤销，请谨慎操作');
  
  console.log('\n✅ 准备工作完成，可以开始发布了！');
}

// 运行准备脚本
if (require.main === module) {
  prepareRelease().catch(console.error);
}

module.exports = { prepareRelease };
