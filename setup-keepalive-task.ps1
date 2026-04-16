# 设置 Supabase 每周自动保活任务
# 以管理员权限运行此脚本

# 设置输出编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase 自动保活任务设置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$keepAliveScript = "$scriptDir\keep-alive-supabase.ps1"

Write-Host "保活脚本路径：$keepAliveScript" -ForegroundColor Gray
Write-Host ""

# 检查保活脚本是否存在
if (!(Test-Path $keepAliveScript)) {
    Write-Host "✗ 保活脚本不存在：$keepAliveScript" -ForegroundColor Red
    Write-Host "请确保 keep-alive-supabase.ps1 在同一目录下" -ForegroundColor Yellow
    exit 1
}

# 检查 .env 文件是否存在
$envFile = "$scriptDir\.env"
if (!(Test-Path $envFile)) {
    Write-Host "✗ .env 文件不存在：$envFile" -ForegroundColor Red
    Write-Host "请先配置 .env 文件并设置 DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ 配置文件检查通过" -ForegroundColor Green
Write-Host ""

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (!$isAdmin) {
    Write-Host "✗ 请以管理员权限运行此脚本" -ForegroundColor Red
    Write-Host ""
    Write-Host "操作步骤：" -ForegroundColor Yellow
    Write-Host "1. 右键点击 PowerShell" -ForegroundColor Gray
    Write-Host "2. 选择'以管理员身份运行'" -ForegroundColor Gray
    Write-Host "3. 重新执行此脚本" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✓ 管理员权限已确认" -ForegroundColor Green
Write-Host ""

# 检查任务是否已存在
$taskName = "Supabase Weekly Keep-Alive"
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
    Write-Host ""
}

Write-Host "正在创建新的计划任务..." -ForegroundColor Cyan
Write-Host ""

# 创建任务操作
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$keepAliveScript`"" `
    -WorkingDirectory $scriptDir

# 创建触发器（每周一凌晨 3 点）
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 3am

# 创建主体（使用 SYSTEM 账户）
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# 创建设置
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -WakeToRun `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

# 注册任务
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "每周一凌晨 3 点自动执行 Supabase 数据库查询，保持项目活跃，防止被自动暂停" `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 自动保活任务创建成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "任务信息：" -ForegroundColor White
    Write-Host "  任务名称：$taskName" -ForegroundColor Gray
    Write-Host "  执行时间：每周一凌晨 3:00" -ForegroundColor Gray
    Write-Host "  执行脚本：$keepAliveScript" -ForegroundColor Gray
    Write-Host ""
    Write-Host "管理命令：" -ForegroundColor Yellow
    Write-Host "  查看状态：Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  手动运行：Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  查看历史：Get-ScheduledTaskInfo -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  禁用任务：Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  启用任务：Enable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  删除任务：Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Yellow
    Write-Host "  1. 手动测试运行：Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  2. 查看运行结果：Get-ScheduledTaskInfo -TaskName '$taskName'" -ForegroundColor Gray
    Write-Host "  3. 确认下次运行时间正确" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "✗ 创建任务失败：$_" -ForegroundColor Red
    Write-Host "请检查错误信息并重试" -ForegroundColor Yellow
    exit 1
}
