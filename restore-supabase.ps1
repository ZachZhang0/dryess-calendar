# Supabase 日历数据库恢复脚本
# 使用方法：.\restore-supabase.ps1 -BackupFile "C:\Backups\Supabase\calendar_backup_20260402_120000.zip"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    
    [string]$ProjectRef = "ehsfmciathifanermnoc"
)

# 设置输出编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase 数据库恢复工具" -ForegroundColor Cyan
Write-Host "项目：$ProjectRef" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查备份文件是否存在
if (!(Test-Path $BackupFile)) {
    Write-Host "✗ 备份文件不存在：$BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 找到备份文件：$BackupFile" -ForegroundColor Green

# 如果是 zip 文件，先解压
$tempSqlFile = ""
if ($BackupFile.EndsWith(".zip")) {
    Write-Host "正在解压备份文件..." -ForegroundColor Cyan
    $tempDir = [System.IO.Path]::GetTempPath()
    $tempSqlFile = "$tempDir\supabase_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    Expand-Archive -Path $BackupFile -DestinationPath $tempDir -Force
    $sqlFiles = Get-ChildItem -Path $tempDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    if ($sqlFiles.Count -gt 0) {
        $tempSqlFile = $sqlFiles[0].FullName
        Write-Host "✓ 解压完成：$tempSqlFile" -ForegroundColor Green
    } else {
        Write-Host "✗ 未在压缩包中找到 SQL 文件" -ForegroundColor Red
        exit 1
    }
} else {
    $tempSqlFile = $BackupFile
}

Write-Host ""
Write-Host "⚠️  警告：恢复操作将覆盖当前数据库的所有数据！" -ForegroundColor Yellow
Write-Host ""
Write-Host "备份文件：$BackupFile" -ForegroundColor White
Write-Host "项目：$ProjectRef" -ForegroundColor White
Write-Host ""

# 确认恢复
$confirmation = Read-Host "确定要恢复数据库吗？输入 'YES' 继续"
if ($confirmation -ne "YES") {
    Write-Host "恢复已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "开始恢复数据库..." -ForegroundColor Cyan

# 检查 Supabase CLI
try {
    $null = supabase --version
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
} catch {
    Write-Host "✗ 检查登录状态失败" -ForegroundColor Red
    exit 1
}

# 执行恢复
try {
    Write-Host "正在连接到 Supabase..." -ForegroundColor Cyan
    
    # 使用 db restore 命令
    $output = supabase db restore -f $tempSqlFile --project-ref $ProjectRef 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ 数据库恢复成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "恢复完成！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "提示：" -ForegroundColor Yellow
        Write-Host "- 请刷新网页查看恢复的数据" -ForegroundColor Gray
        Write-Host "- 如果遇到问题，可以联系 Supabase 支持" -ForegroundColor Gray
    } else {
        Write-Host "✗ 恢复失败" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ 恢复过程出错：$_" -ForegroundColor Red
    exit 1
} finally {
    # 清理临时文件
    if ($BackupFile.EndsWith(".zip") -and (Test-Path $tempSqlFile)) {
        Write-Host "正在清理临时文件..." -ForegroundColor Cyan
        Remove-Item $tempSqlFile -Force
    }
}

Write-Host ""
