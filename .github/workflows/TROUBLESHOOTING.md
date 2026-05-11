# GitHub Actions 故障排查

## 🔍 当前问题

GitHub Actions 运行失败，显示 "Process completed with exit code 1"

## 📋 可能的原因

### 1. Secret 未设置或设置错误

**检查步骤**：
1. 打开：https://github.com/ZachZhang0/dryess-calendar/settings/secrets/actions
2. 确认有以下 Secret：
   - **Name**: `SUPABASE_DB_URL`
   - **Value**: `postgresql://postgres:FdYsFjUHXrjYXtOa@db.ehsfmciathifanermnoc.supabase.co:5432/postgres`

### 2. 密码包含特殊字符

当前密码：`FdYsFjUHXrjYXtOa`

检查是否有以下字符：
- `@` 需要编码为 `%40`
- `:` 需要编码为 `%3A`
- `/` 需要编码为 `%2F`
- `#` 需要编码为 `%23`
- `?` 需要编码为 `%3F`

当前密码看起来没有特殊字符，✅ 应该是安全的。

### 3. psql 命令不可用

GitHub Actions 的 Ubuntu 环境默认没有安装 psql。

**解决方案**：需要安装 PostgreSQL 客户端

## 🔧 修复方案

### 方案 A：安装 psql（推荐）

修改工作流，添加安装步骤：

```yaml
- name: Install PostgreSQL client
  run: |
    sudo apt-get update
    sudo apt-get install -y postgresql-client
```

### 方案 B：使用 curl 直接调用 Supabase API

不需要安装任何工具，直接使用 HTTP 请求

### 方案 C：使用 Supabase CLI（需要登录）

需要配置 Service Role Key

## 🎯 推荐修复

修改工作流文件，添加 PostgreSQL 客户端安装步骤。

## 📝 查看日志

要查看详细的错误信息：

1. 点击左侧的 **"keep-alive"**（红色叉号）
2. 展开日志输出
3. 查看具体的错误信息

可能的错误：
- `command not found: psql` - 需要安装
- `password authentication failed` - 密码错误
- `connection timed out` - 网络问题
- `SUPABASE_DB_URL is not set` - Secret 未设置
