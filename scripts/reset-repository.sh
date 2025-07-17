#!/bin/bash

# MJOS 仓库重置脚本
# 清空GitHub仓库所有分支，重新初始化，等待项目完整后再上传

echo "🔄 MJOS 仓库重置脚本"
echo "================================================"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在MJOS项目根目录运行此脚本"
    exit 1
fi

echo "📋 当前操作计划："
echo "1. 备份当前代码到本地"
echo "2. 删除现有Git历史"
echo "3. 重新初始化Git仓库"
echo "4. 配置远程仓库地址"
echo "5. 等待项目完整后手动推送"
echo ""

# 确认操作
read -p "⚠️  此操作将删除所有Git历史记录，是否继续？(y/N): " confirm
if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

# 1. 创建备份
echo "📦 创建代码备份..."
backup_dir="mjos-backup-$(date +%Y%m%d-%H%M%S)"

# 复制所有文件到备份目录（除了.git）
cp -r . "../$backup_dir"
rm -rf "../$backup_dir/.git"
rm -rf "../$backup_dir/node_modules"
rm -rf "../$backup_dir/dist"
rm -rf "../$backup_dir/coverage"

if [ -d "../$backup_dir" ]; then
    echo "✅ 备份已创建：../$backup_dir"
else
    echo "❌ 备份创建失败"
    exit 1
fi

# 2. 删除现有Git历史
echo "🗑️  删除现有Git历史..."
if [ -d ".git" ]; then
    rm -rf .git
    echo "✅ Git历史已删除"
fi

# 3. 重新初始化Git仓库
echo "🔄 重新初始化Git仓库..."
git init
git branch -M main

# 4. 配置远程仓库
echo "🔗 配置远程仓库地址..."
git remote add origin https://github.com/dawoya1/mjos.git

# 5. 创建初始提交（但不推送）
echo "📝 准备初始提交..."
git add .gitignore
git commit -m "Initial commit: Add .gitignore"

echo ""
echo "🎉 仓库重置完成！"
echo "================================================"
echo "📋 下一步操作："
echo "1. 继续完善项目代码和文档"
echo "2. 确保所有测试通过"
echo "3. 验证系统功能完整"
echo "4. 运行以下命令推送到GitHub："
echo "   git add ."
echo "   git commit -m 'feat: Complete MJOS v2.0.0 implementation'"
echo "   git push -u origin main"
echo ""
echo "💾 备份位置：../$backup_dir"
echo "🔗 远程仓库：https://github.com/dawoya1/mjos"
echo ""
echo "✨ 准备就绪，等待项目完整后推送！"
