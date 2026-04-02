# 设置 Supabase 每日自动备份任务
# 以管理员权限运行此脚本

# 设置输出编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase 自动备份任务设置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = "$scriptDir\backup-supabase.ps1"

Write-Host "备份脚本路径：$backupScript" -ForegroundColor Gray
Write-Host ""

# 检查备份脚本是否存在
if (!(Test-Path $backupScript)) {
    Write-Host "✗ 备份脚本不存在：$backupScript" -ForegroundColor Red
    Write-Host "请确保 backup-supabase.ps1 在同一目录下" -ForegroundColor Yellow
    exit 1
}

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (!$isAdmin) {
    Write-Host "✗ 请以管理员权限运行此脚本" -ForegroundColor Red
    Write-Host "右键点击 PowerShell，选择'以管理员身份运行'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ 管理员权限已确认" -ForegroundColor Green
Write-Host ""

# 检查任务是否已存在
$taskName = "Supabase Daily Backup"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  检测到已存在的任务：$taskName" -ForegroundColor Yellow
    $overwrite = Read-Host "是否覆盖现有任务？(Y/N)"
    if ($overwrite -ne "Y" -and $overwrite -ne "y") {
        Write-Host "操作已取消" -ForegroundColor Yellow
        exit 0
    }
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✓ 已删除旧任务" -ForegroundColor Green
}

Write-Host ""
Write-Host "正在创建新的计划任务..." -ForegroundColor Cyan

# 创建任务操作
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`"" `
    -WorkingDirectory $scriptDir

# 创建触发器（每天凌晨 3 点）
$trigger = New-ScheduledTaskTrigger -Daily -At 3am

# 创建主体（使用 SYSTEM 账户）
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# 创建设置
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -WakeToRun

# 注册任务
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "每天凌晨 3 点自动备份 Supabase 日历数据库" `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 自动备份任务创建成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "任务名称：$taskName" -ForegroundColor White
    Write-Host "执行时间：每天凌晨 3:00" -ForegroundColor White
    Write-Host "备份脚本：$backupScript" -ForegroundColor White
    Write-Host ""
    Write-Host "管理命令：" -ForegroundColor Yellow
    Write-Host "- 查看任务状态：Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "- 手动运行任务：Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "- 禁用任务：Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "- 删除任务：Unregister-ScheduledTask -TaskName '$taskName' -Confirm:$false" -ForegroundColor Gray
    Write-Host ""
    Write-Host "提示：" -ForegroundColor Yellow
    Write-Host "- 备份文件保存在：C:\Backups\Supabase\" -ForegroundColor Gray
    Write-Host "- 旧备份（30 天前）会自动清理" -ForegroundColor Gray
    Write-Host "- 建议定期将备份文件同步到云存储" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "✗ 创建任务失败：$_" -ForegroundColor Red
    Write-Host "请检查错误信息并重试" -ForegroundColor Yellow
    exit 1
}
