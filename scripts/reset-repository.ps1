# MJOS 仓库重置脚本
# 清空GitHub仓库所有分支，重新初始化，等待项目完整后再上传

Write-Host "🔄 MJOS 仓库重置脚本" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误：请在MJOS项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

Write-Host "📋 当前操作计划：" -ForegroundColor Yellow
Write-Host "1. 备份当前代码到本地" -ForegroundColor White
Write-Host "2. 删除现有Git历史" -ForegroundColor White
Write-Host "3. 重新初始化Git仓库" -ForegroundColor White
Write-Host "4. 配置远程仓库地址" -ForegroundColor White
Write-Host "5. 等待项目完整后手动推送" -ForegroundColor White
Write-Host ""

# 确认操作
$confirm = Read-Host "⚠️  此操作将删除所有Git历史记录，是否继续？(y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ 操作已取消" -ForegroundColor Red
    exit 0
}

try {
    # 1. 创建备份
    Write-Host "📦 创建代码备份..." -ForegroundColor Green
    $backupDir = "mjos-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    # 复制所有文件到备份目录（除了.git）
    robocopy . "..\$backupDir" /E /XD .git node_modules dist coverage /XF *.log
    
    if (Test-Path "..\$backupDir") {
        Write-Host "✅ 备份已创建：..\$backupDir" -ForegroundColor Green
    } else {
        Write-Host "❌ 备份创建失败" -ForegroundColor Red
        exit 1
    }

    # 2. 删除现有Git历史
    Write-Host "🗑️  删除现有Git历史..." -ForegroundColor Yellow
    if (Test-Path ".git") {
        Remove-Item -Recurse -Force ".git"
        Write-Host "✅ Git历史已删除" -ForegroundColor Green
    }

    # 3. 重新初始化Git仓库
    Write-Host "🔄 重新初始化Git仓库..." -ForegroundColor Green
    git init
    git branch -M main

    # 4. 配置远程仓库
    Write-Host "🔗 配置远程仓库地址..." -ForegroundColor Green
    git remote add origin https://github.com/dawoya1/mjos.git

    # 5. 创建初始提交（但不推送）
    Write-Host "📝 准备初始提交..." -ForegroundColor Green
    git add .gitignore
    git commit -m "Initial commit: Add .gitignore"

    Write-Host ""
    Write-Host "🎉 仓库重置完成！" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "📋 下一步操作：" -ForegroundColor Yellow
    Write-Host "1. 继续完善项目代码和文档" -ForegroundColor White
    Write-Host "2. 确保所有测试通过" -ForegroundColor White
    Write-Host "3. 验证系统功能完整" -ForegroundColor White
    Write-Host "4. 运行以下命令推送到GitHub：" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Cyan
    Write-Host "   git commit -m 'feat: Complete MJOS v2.0.0 implementation'" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💾 备份位置：..\$backupDir" -ForegroundColor Green
    Write-Host "🔗 远程仓库：https://github.com/dawoya1/mjos" -ForegroundColor Green

} catch {
    Write-Host "❌ 操作失败：$($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ 准备就绪，等待项目完整后推送！" -ForegroundColor Magenta
