# Supabase 保活脚本使用指南

## 📋 目录

- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [手动运行](#手动运行)
- [自动任务设置](#自动任务设置)
- [故障排查](#故障排查)

---

## 🚀 快速开始

### 前提条件

1. ✅ 已恢复 Supabase 数据库
2. ✅ 已安装 PostgreSQL 客户端（psql）或 Supabase CLI
3. ✅ 有数据库连接字符串

### 3 步设置

```powershell
# 1. 配置 .env 文件（设置 DATABASE_URL）
# 2. 测试运行保活脚本
.\keep-alive-supabase.ps1

# 3. 设置自动任务（需要管理员权限）
# 右键 PowerShell → 以管理员身份运行
.\setup-keepalive-task.ps1
```

---

## ⚙️ 配置说明

### .env 文件配置

编辑 `.env` 文件，设置以下变量：

```ini
# Supabase 基本配置
VITE_SUPABASE_URL=https://你的项目引用.supabase.co
VITE_SUPABASE_ANON_KEY=你的 anon key

# 🔑 数据库连接字符串（必需！）
# 获取方式：
# 1. 登录 Supabase Dashboard
# 2. 进入 Database → Connection string
# 3. 选择 "Direct connection" 模式
# 4. 复制连接字符串，替换密码部分
DATABASE_URL=postgresql://postgres:你的数据库密码@db.你的项目引用.supabase.co:5432/postgres
```

### 获取 DATABASE_URL 步骤

1. **登录 Supabase Dashboard**
   - https://supabase.com/dashboard

2. **进入数据库设置**
   - 左侧菜单：**Database**
   - 点击 **"Connect"** 按钮

3. **选择连接模式**
   - 选择 **"Direct connection"**（直接连接）
   - 格式：`postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

4. **替换密码**
   - 将 `[YOUR-PASSWORD]` 替换为你的实际数据库密码
   - 如果密码包含特殊字符，需要 URL 编码：
     - `@` → `%40`
     - `:` → `%3A`
     - `/` → `%2F`
     - `#` → `%23`

5. **复制到 .env 文件**
   ```ini
   DATABASE_URL=postgresql://postgres:你的密码@db.你的项目引用.supabase.co:5432/postgres
   ```

---

## 🖐️ 手动运行

### 测试保活脚本

```powershell
# 在项目根目录执行
.\keep-alive-supabase.ps1
```

### 预期输出

```
========================================
Supabase 项目保活检查
========================================

正在读取配置：C:\项目路径\.env
✓ 配置加载成功

检查数据库连接工具...
✓ psql 已安装

正在执行数据库查询...
SQL: SELECT NOW() as current_time, version() as postgres_version;

========================================
✓ 数据库活动检查成功！
========================================

查询结果：
       current_time       |    postgres_version    
-------------------------+--------------------------
 2026-04-02 15:30:45+00  | PostgreSQL 15.1 ...

项目保活成功！下次运行请在 7 天内。

提示：
- 已记录数据库活动，Supabase 将认为项目活跃
- 建议设置每周自动运行此脚本
- 可以使用 Windows 任务计划程序

========================================
保活完成！
========================================
```

---

## 🤖 自动任务设置

### 一键设置（推荐）

**以管理员权限运行 PowerShell**，然后执行：

```powershell
.\setup-keepalive-task.ps1
```

这会创建：
- **任务名称**：`Supabase Weekly Keep-Alive`
- **执行时间**：每周一凌晨 3:00
- **自动运行**：保活脚本

### 手动设置

如果自动设置失败，可以手动创建：

1. **打开任务计划程序**
   - Win + R → 输入 `taskschd.msc` → 回车

2. **创建基本任务**
   - 右侧：**创建基本任务**
   - 名称：`Supabase Weekly Keep-Alive`
   - 触发器：**每周**
   - 开始时间：`凌晨 3:00`
   - 操作：**启动程序**
   - 程序：`powershell.exe`
   - 参数：`-NoProfile -ExecutionPolicy Bypass -File "C:\完整路径\keep-alive-supabase.ps1"`
   - 起始于：`C:\完整路径\`

3. **设置高级选项**
   - 双击创建的任务
   - **常规** 标签：
     - ✅ 使用最高权限运行
     - ✅ 不管用户是否登录都要运行
   - **条件** 标签：
     - ✅ 只有在计算机使用交流电源时才启动此任务（可选）
   - **设置** 标签：
     - ✅ 如果任务运行时间超过以下时间，则停止该任务：`1 小时`
     - ✅ 如果失败，每隔以下时间重新启动：`5 分钟`
     - ✅ 尝试重新启动次数：`3`

---

## 📊 任务管理

### 查看任务状态

```powershell
# 查看任务基本信息
Get-ScheduledTask -TaskName "Supabase Weekly Keep-Alive"

# 查看上次运行结果
Get-ScheduledTaskInfo -TaskName "Supabase Weekly Keep-Alive"

# 查看完整信息（格式化输出）
Get-ScheduledTaskInfo -TaskName "Supabase Weekly Keep-Alive" | 
  Select-Object TaskName, LastRunTime, LastTaskResult, NextRunTime | 
  Format-List
```

### 手动运行任务

```powershell
# 立即运行一次
Start-ScheduledTask -TaskName "Supabase Weekly Keep-Alive"

# 等待 10 秒后查看结果
Start-Sleep -Seconds 10
Get-ScheduledTaskInfo -TaskName "Supabase Weekly Keep-Alive"
```

### 禁用/启用任务

```powershell
# 禁用任务（不删除）
Disable-ScheduledTask -TaskName "Supabase Weekly Keep-Alive"

# 启用任务
Enable-ScheduledTask -TaskName "Supabase Weekly Keep-Alive"
```

### 删除任务

```powershell
# 删除任务
Unregister-ScheduledTask -TaskName "Supabase Weekly Keep-Alive" -Confirm:$false
```

---

## 🔍 故障排查

### 问题 1：psql 未安装

**错误信息**：`✗ psql 未安装`

**解决方案 A**：安装 PostgreSQL

1. 访问：https://www.postgresql.org/download/windows/
2. 下载并安装 PostgreSQL
3. 将 psql 添加到 PATH：
   ```powershell
   $env:Path += ";C:\Program Files\PostgreSQL\15\bin"
   ```

**解决方案 B**：使用 Supabase CLI

```powershell
# 安装 Supabase CLI
npm install -g supabase

# 修改 keep-alive-supabase.ps1
# 将 psql 命令替换为：
supabase db execute --sql "SELECT NOW();" --project-ref 你的项目引用
```

---

### 问题 2：DATABASE_URL 未找到

**错误信息**：`✗ 未找到 DATABASE_URL 配置`

**解决方案**：

1. 检查 `.env` 文件是否存在
2. 确认 `DATABASE_URL=` 行没有被注释（没有 `#` 开头）
3. 确认格式正确：
   ```ini
   DATABASE_URL=postgresql://postgres:密码@db.xxx.supabase.co:5432/postgres
   ```

---

### 问题 3：数据库连接失败

**错误信息**：`✗ 数据库查询失败`

**可能原因**：

1. **密码错误**
   - 在 Supabase Dashboard 重置密码
   - Database → Settings → Reset Database Password

2. **连接字符串错误**
   - 检查项目引用是否正确
   - 检查端口是否为 5432

3. **数据库已暂停**
   - 登录 Dashboard 检查项目状态
   - 如果暂停，需要先恢复

4. **网络问题**
   - 检查网络连接
   - 尝试 ping 数据库地址

---

### 问题 4：任务计划程序无法运行

**错误信息**：`0x8004131F` 或其他错误代码

**解决方案**：

1. **以管理员权限运行设置脚本**
   ```powershell
   # 右键 PowerShell → 以管理员身份运行
   .\setup-keepalive-task.ps1
   ```

2. **检查任务历史**
   - 打开任务计划程序
   - 找到任务
   - 查看"历史记录"标签

3. **手动测试运行**
   ```powershell
   Start-ScheduledTask -TaskName "Supabase Weekly Keep-Alive"
   Get-ScheduledTaskInfo -TaskName "Supabase Weekly Keep-Alive"
   ```

---

## 📅 维护建议

### 每周检查

```powershell
# 每周一检查任务执行情况
Get-ScheduledTaskInfo -TaskName "Supabase Weekly Keep-Alive" | 
  Select-Object TaskName, LastRunTime, LastTaskResult, NextRunTime
```

### 每月测试

```powershell
# 手动运行一次，确保脚本正常工作
.\keep-alive-supabase.ps1
```

### 每季度审查

- [ ] 检查 .env 文件中的密码是否需要更新
- [ ] 确认数据库连接正常
- [ ] 查看 Supabase Dashboard 确认项目活跃
- [ ] 检查任务计划程序是否正常运行

---

## 🎯 最佳实践

### 1. 备份配置

```powershell
# 备份 .env 文件到安全位置
Copy-Item .env .env.backup
```

### 2. 监控日志

```powershell
# 查看任务执行历史
Get-WinEvent -FilterHashtable @{
  LogName='Microsoft-Windows-TaskScheduler'
  Id=100,102,200,201
} | Where-Object {$_.Message -like "*Supabase*"} | 
  Select-Object -First 20 TimeCreated, Message
```

### 3. 设置提醒

在 Outlook 或日历中设置提醒：
- **频率**：每月一次
- **内容**：检查 Supabase 保活任务状态

---

## 📞 需要帮助？

### 相关文档

- [Supabase 连接指南](https://supabase.com/docs/guides/platform/connecting-from-nodejs)
- [psql 文档](https://www.postgresql.org/docs/current/app-psql.html)
- [Windows 任务计划程序](https://docs.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page)

### 检查清单

设置完成后，确认：
- [ ] `.env` 文件配置正确
- [ ] 手动运行脚本成功
- [ ] 自动任务已创建
- [ ] 下次运行时间正确
- [ ] 知道如何查看执行历史

---

**最后更新**: 2026-04-02  
**项目**: Dry ESS Calendar  
**状态**: ✅ 已配置自动保活
