# Supabase 项目保活脚本
# 每 7 天至少运行一次，防止项目被暂停
# 使用方法：.\keep-alive-supabase.ps1

# 设置输出编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase 项目保活检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 从 .env 文件读取配置
$envFile = "$scriptDir\.env"
if (Test-Path $envFile) {
    Write-Host "正在读取配置：$envFile" -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)\s*=\s*(.+)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # 移除引号
            $value = $value.Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "✗ 未找到 .env 文件：$envFile" -ForegroundColor Red
    Write-Host "请确保 .env 文件存在并包含 DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# 获取数据库连接字符串
$databaseUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "✗ 未找到 DATABASE_URL 配置" -ForegroundColor Red
    Write-Host "请在 .env 文件中设置 DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ 配置加载成功" -ForegroundColor Green
Write-Host ""

# 检查 psql 是否安装
Write-Host "检查数据库连接工具..." -ForegroundColor Cyan
try {
    $null = psql --version 2>&1
    Write-Host "✓ psql 已安装" -ForegroundColor Green
} catch {
    Write-Host "✗ psql 未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "请安装 PostgreSQL 客户端：" -ForegroundColor Yellow
    Write-Host "1. 安装 PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "2. 或者使用 Supabase CLI:" -ForegroundColor Gray
    Write-Host "   npm install -g supabase" -ForegroundColor Gray
    Write-Host "   然后使用命令：supabase db execute --sql 'SELECT NOW();'" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "正在执行数据库查询..." -ForegroundColor Cyan

try {
    # 执行保活查询
    $query = "SELECT NOW() as current_time, version() as postgres_version;"
    
    Write-Host "SQL: $query" -ForegroundColor Gray
    Write-Host ""
    
    # 使用 psql 执行查询
    $output = psql $databaseUrl -c $query 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ 数据库活动检查成功！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "查询结果：" -ForegroundColor White
        Write-Host $output -ForegroundColor Gray
        Write-Host ""
        Write-Host "项目保活成功！下次运行请在 7 天内。" -ForegroundColor Green
        Write-Host ""
        Write-Host "提示：" -ForegroundColor Yellow
        Write-Host "- 已记录数据库活动，Supabase 将认为项目活跃" -ForegroundColor Gray
        Write-Host "- 建议设置每周自动运行此脚本" -ForegroundColor Gray
        Write-Host "- 可以使用 Windows 任务计划程序" -ForegroundColor Gray
    } else {
        Write-Host "✗ 数据库查询失败" -ForegroundColor Red
        Write-Host ""
        Write-Host "错误信息：" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        Write-Host ""
        Write-Host "可能的原因：" -ForegroundColor Yellow
        Write-Host "1. 数据库连接字符串错误" -ForegroundColor Gray
        Write-Host "2. 数据库密码错误" -ForegroundColor Gray
        Write-Host "3. 网络连接问题" -ForegroundColor Gray
        Write-Host "4. 数据库已暂停" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "✗ 保活过程出错：$_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "保活完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
