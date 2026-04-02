# Supabase 数据库备份与恢复指南

## 📋 目录

- [快速开始](#快速开始)
- [自动备份](#自动备份)
- [手动备份](#手动备份)
- [数据恢复](#数据恢复)
- [故障排查](#故障排查)

---

## 🚀 快速开始

### 1. 安装 Supabase CLI

```powershell
npm install -g supabase
```

### 2. 登录 Supabase

```powershell
supabase login
```

### 3. 首次备份

```powershell
.\backup-supabase.ps1
```

---

## 🔄 自动备份

### 设置每日自动备份

以**管理员权限**运行 PowerShell，然后执行：

```powershell
.\setup-autobackup.ps1
```

这会创建一个每天凌晨 3 点自动运行的备份任务。

### 管理自动备份任务

```powershell
# 查看任务状态
Get-ScheduledTask -TaskName "Supabase Daily Backup"

# 手动运行一次备份
Start-ScheduledTask -TaskName "Supabase Daily Backup"

# 查看上次运行结果
Get-ScheduledTaskInfo -TaskName "Supabase Daily Backup"

# 禁用任务（不删除）
Disable-ScheduledTask -TaskName "Supabase Daily Backup"

# 启用任务
Enable-ScheduledTask -TaskName "Supabase Daily Backup"

# 删除任务
Unregister-ScheduledTask -TaskName "Supabase Daily Backup" -Confirm:$false
```

---

## 💾 手动备份

### 使用备份脚本

```powershell
# 默认备份到 C:\Backups\Supabase\
.\backup-supabase.ps1

# 指定备份目录
.\backup-supabase.ps1 -BackupDir "D:\MyBackups"
```

### 备份文件说明

- 备份文件会自动压缩为 `.zip` 格式
- 文件名格式：`calendar_backup_YYYYMMDD_HHMMSS.zip`
- 30 天前的旧备份会自动清理

---

## 🔄 数据恢复

### ⚠️ 警告

**恢复操作会覆盖当前数据库的所有数据！** 请确保：
- 已经创建了当前数据的备份
- 确认要恢复的备份文件是正确的
- 通知其他用户数据库将暂时不可用

### 使用恢复脚本

```powershell
.\restore-supabase.ps1 -BackupFile "C:\Backups\Supabase\calendar_backup_20260402_120000.zip"
```

### 恢复步骤

1. 找到要恢复的备份文件
2. 运行恢复脚本
3. 输入 `YES` 确认恢复
4. 等待恢复完成
5. 刷新网页查看数据

---

## 🛠️ 故障排查

### 问题 1：Supabase CLI 未安装

**错误信息**：`Supabase CLI 未安装`

**解决方法**：
```powershell
npm install -g supabase
```

### 问题 2：未登录 Supabase

**错误信息**：`未登录 Supabase`

**解决方法**：
```powershell
supabase login
```

### 问题 3：权限不足

**错误信息**：`请以管理员权限运行此脚本`

**解决方法**：
- 右键点击 PowerShell
- 选择"以管理员身份运行"
- 重新执行脚本

### 问题 4：备份文件找不到

**错误信息**：`备份文件不存在`

**解决方法**：
- 检查文件路径是否正确
- 使用绝对路径
- 确认备份文件确实存在于该位置

### 问题 5：恢复失败

**可能原因**：
- 数据库连接问题
- 备份文件损坏
- 权限不足

**解决方法**：
1. 检查网络连接
2. 尝试使用其他备份文件
3. 联系 Supabase 支持

---

## 📊 Supabase Dashboard 备份

### 查看自动备份

1. 登录 https://supabase.com/dashboard
2. 选择项目：`ehsfmciathifanermnoc`
3. 进入 **Database** → **Backups**
4. 查看所有自动备份

### 从 Dashboard 恢复

1. 进入 **Database** → **Backups**
2. 选择要恢复的备份
3. 点击 **Restore**
4. 确认恢复

### 启用时间点恢复（PITR）

PITR 可以恢复到任意时间点（精确到秒）：

1. 进入 **Database** → **Backups**
2. 点击 **Enable PITR**
3. 按照提示完成设置

---

## 📅 推荐的备份策略

### 日常备份
- ✅ 启用 Supabase 自动备份（Pro 套餐 7 天）
- ✅ 启用 PITR（时间点恢复）
- ✅ 设置每日自动备份脚本

### 每周备份
- 📅 每周一手动备份一次
- 💾 将备份文件同步到云存储（OneDrive/Google Drive）

### 重大操作前
- 🔧 修改数据结构前手动备份
- 📌 使用 Dashboard 的 "Create Restore Point" 功能

### 定期验证
- 🧪 每月测试一次恢复流程
- ✅ 确保备份文件可用

---

## 🔐 安全建议

### 备份文件安全
- 将备份文件保存在安全的位置
- 使用云存储进行异地备份
- 定期更新备份文件的访问权限

### 访问控制
- 不要分享 SERVICE_ROLE_KEY
- 定期更新 Supabase 访问令牌
- 使用最小权限原则

---

## 📞 获取帮助

### Supabase 文档
- 官方文档：https://supabase.com/docs
- 备份指南：https://supabase.com/docs/guides/platform/backups
- CLI 文档：https://supabase.com/docs/guides/cli

### 联系方式
- GitHub Issues: https://github.com/supabase/supabase/issues
- Discord: https://discord.supabase.com

---

## 📝 备份日志

查看备份历史记录：

```powershell
# 查看所有备份文件
Get-ChildItem "C:\Backups\Supabase" -Filter "*.zip" | Sort-Object LastWriteTime -Descending

# 查看任务执行历史
Get-ScheduledTaskInfo -TaskName "Supabase Daily Backup" | Select-Object LastRunTime, LastTaskResult
```

---

## 🎯 最佳实践总结

1. ✅ **多重备份**：自动备份 + 手动备份 + 云存储
2. ✅ **定期测试**：每月至少测试一次恢复
3. ✅ **版本管理**：备份文件保留 30 天以上
4. ✅ **监控告警**：设置备份失败的通知机制
5. ✅ **文档记录**：记录每次备份和恢复操作

---

**最后更新**: 2026-04-02  
**项目**: Dry ESS Calendar  
**数据库**: Supabase PostgreSQL
