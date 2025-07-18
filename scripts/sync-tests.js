#!/usr/bin/env node

/**
 * 测试同步工具
 * 自动检查和更新测试文件中的API调用
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 需要同步的API模式
const API_PATTERNS = {
  // 版本号模式
  version: {
    pattern: /expect\([^)]+\.getVersion\(\)\)\.toBe\(['"`][\d.]+['"`]\)/g,
    replacement: "expect($1.getVersion()).toBe(getVersion())",
    imports: "import { getVersion } from '../utils/version';"
  },
  
  // remember API模式
  remember: {
    pattern: /\.remember\([^,]+,\s*\[[^\]]*\],\s*[\d.]+\)/g,
    replacement: ".remember($1, { tags: $2, importance: $3 })",
    description: "remember API参数结构更新"
  }
};

/**
 * 扫描测试文件
 */
function scanTestFiles() {
  const testFiles = [
    ...glob.sync('tests/**/*.test.js'),
    ...glob.sync('src/**/*.test.ts'),
    ...glob.sync('src/**/__tests__/**/*.ts')
  ];
  
  console.log(`🔍 找到 ${testFiles.length} 个测试文件`);
  return testFiles;
}

/**
 * 检查文件是否需要更新
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 检查硬编码版本号
  const versionMatches = content.match(/['"`]2\.\d+\.\d+['"`]/g);
  if (versionMatches) {
    issues.push({
      type: 'hardcoded_version',
      matches: versionMatches,
      line: '检测到硬编码版本号'
    });
  }
  
  // 检查旧的remember API
  const rememberMatches = content.match(/\.remember\([^,]+,\s*\[[^\]]*\],\s*[\d.]+\)/g);
  if (rememberMatches) {
    issues.push({
      type: 'old_remember_api',
      matches: rememberMatches,
      line: '检测到旧的remember API调用'
    });
  }
  
  return issues;
}

/**
 * 修复文件
 */
function fixFile(filePath, issues) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  issues.forEach(issue => {
    switch (issue.type) {
      case 'hardcoded_version':
        // 添加版本导入
        if (!content.includes('getVersion')) {
          const isTypeScript = filePath.endsWith('.ts');
          const importLine = isTypeScript 
            ? "import { getVersion } from '../utils/version';"
            : "const { getVersion } = require('../dist/utils/version.js');";
          
          // 在第一个import/require后添加
          const lines = content.split('\n');
          let insertIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('import') || lines[i].includes('require')) {
              insertIndex = i + 1;
            }
          }
          lines.splice(insertIndex, 0, importLine);
          content = lines.join('\n');
        }
        
        // 替换硬编码版本
        content = content.replace(
          /expect\(([^)]+\.getVersion\(\))\)\.toBe\(['"`][\d.]+['"`]\)/g,
          'expect($1).toBe(getVersion())'
        );
        modified = true;
        break;
        
      case 'old_remember_api':
        // 这个需要更复杂的解析，暂时跳过自动修复
        console.warn(`⚠️  ${filePath}: 检测到旧的remember API，需要手动修复`);
        break;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ 已修复: ${filePath}`);
  }
  
  return modified;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始同步测试文件...');
  
  const testFiles = scanTestFiles();
  let totalIssues = 0;
  let fixedFiles = 0;
  
  testFiles.forEach(filePath => {
    const issues = checkFile(filePath);
    if (issues.length > 0) {
      console.log(`\n📁 ${filePath}:`);
      issues.forEach(issue => {
        console.log(`  - ${issue.line}: ${issue.matches.length} 处`);
        totalIssues += issue.matches.length;
      });
      
      if (fixFile(filePath, issues)) {
        fixedFiles++;
      }
    }
  });
  
  console.log(`\n📊 同步完成:`);
  console.log(`  - 扫描文件: ${testFiles.length}`);
  console.log(`  - 发现问题: ${totalIssues}`);
  console.log(`  - 修复文件: ${fixedFiles}`);
  
  if (totalIssues > fixedFiles) {
    console.log(`\n⚠️  还有 ${totalIssues - fixedFiles} 个问题需要手动修复`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { scanTestFiles, checkFile, fixFile };
