# Supabase 日历数据库备份脚本
# 使用方法：.\backup-supabase.ps1

param(
    [string]$ProjectRef = "ehsfmciathifanermnoc",
    [string]$BackupDir = "C:\Backups\Supabase"
)

# 设置输出编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase 数据库备份工具" -ForegroundColor Cyan
Write-Host "项目：$ProjectRef" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Supabase CLI 是否安装
try {
    $cliVersion = supabase --version
    Write-Host "✓ Supabase CLI 已安装：$cliVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI 未安装" -ForegroundColor Red
    Write-Host "请运行：npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# 检查是否登录
try {
    $whoami = supabase whoami 2>&1
    if ($whoami -match "not logged in") {
        Write-Host "✗ 未登录 Supabase" -ForegroundColor Red
        Write-Host "请运行：supabase login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ 已登录：$whoami" -ForegroundColor Green
} catch {
    Write-Host "✗ 检查登录状态失败" -ForegroundColor Red
    exit 1
}

# 创建备份目录
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "✓ 创建备份目录：$BackupDir" -ForegroundColor Green
}

# 生成备份文件名
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$BackupDir\calendar_backup_$date.sql"
$compressedFile = "$backupFile.zip"

Write-Host ""
Write-Host "开始备份数据库..." -ForegroundColor Cyan

# 执行备份
try {
    # 使用 db dump 命令
    $output = supabase db dump --db-url "postgresql://postgres:YOUR_DB_PASSWORD@db.$ProjectRef.supabase.co:5432/postgres" -f $backupFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 备份成功：$backupFile" -ForegroundColor Green
        
        # 压缩备份
        Write-Host "正在压缩备份文件..." -ForegroundColor Cyan
        Compress-Archive -Path $backupFile -DestinationPath $compressedFile -Force
        Remove-Item $backupFile
        
        Write-Host "✓ 压缩完成：$compressedFile" -ForegroundColor Green
        
        # 显示文件大小
        $fileSize = (Get-Item $compressedFile).Length / 1MB
        Write-Host "  文件大小：{0:N2} MB" -f $fileSize -ForegroundColor Gray
        
    } else {
        Write-Host "✗ 备份失败" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 备份过程出错：$_" -ForegroundColor Red
    exit 1
}

# 清理旧备份（保留最近 30 天）
Write-Host ""
Write-Host "清理 30 天前的旧备份..." -ForegroundColor Cyan
$cutoffDate = (Get-Date).AddDays(-30)
$deletedCount = 0

Get-ChildItem -Path $BackupDir -Filter "calendar_backup_*.zip" | 
    Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
    ForEach-Object {
        Remove-Item $_.FullName
        $deletedCount++
        Write-Host "  已删除：$($_.Name)" -ForegroundColor Gray
    }

if ($deletedCount -eq 0) {
    Write-Host "✓ 无需清理" -ForegroundColor Green
} else {
    Write-Host "✓ 已删除 $deletedCount 个旧备份" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "备份完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "备份文件位置：$compressedFile" -ForegroundColor White
Write-Host ""
Write-Host "提示：" -ForegroundColor Yellow
Write-Host "- 建议将备份文件同步到云存储（OneDrive/Google Drive）" -ForegroundColor Gray
Write-Host "- 可以使用任务计划程序设置每日自动备份" -ForegroundColor Gray
Write-Host "- 恢复命令：supabase db restore -f <备份文件> --project-ref $ProjectRef" -ForegroundColor Gray
Write-Host ""
