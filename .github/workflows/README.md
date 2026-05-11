# GitHub Actions 保活指南

## 📋 概述

使用 GitHub Actions 自动执行数据库查询，防止 Supabase Free 项目被暂停。

**优势**：
- ✅ 完全自动化，无需本地运行
- ✅ 免费（GitHub Actions 每月 2000 分钟额度）
- ✅ 可靠（GitHub 保证执行）
- ✅ 无需开电脑

---

## 🚀 快速设置（5 步完成）

### 第 1 步：获取数据库连接字符串

1. 登录 Supabase Dashboard
2. 进入 **Database** → **Connection string**
3. 选择 **Direct connection**
4. 复制连接字符串：
   ```
   postgresql://postgres:YOUR_PASSWORD@db.ehsfmciathifanermnoc.supabase.co:5432/postgres
   ```

---

### 第 2 步：在 GitHub 添加 Secret

1. 打开 GitHub 仓库：https://github.com/ZachZhang0/dryess-calendar
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **"New repository secret"**
4. 添加以下 Secret：

**Name**: `SUPABASE_DB_URL`  
**Value**: `postgresql://postgres:你的密码@db.ehsfmciathifanermnoc.supabase.co:5432/postgres`

5. 点击 **"Add secret"**

⚠️ **重要**：
- 替换 `你的密码` 为实际数据库密码
- 如果密码包含特殊字符，需要 URL 编码：
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`
  - `#` → `%23`

---

### 第 3 步：推送工作流文件到 GitHub

```powershell
# 在本地执行
git add .github/workflows/supabase-keepalive.yml
git commit -m "ci: 添加 Supabase 自动保活 GitHub Action"
git push origin master
```

---

### 第 4 步：验证工作流

1. 打开 GitHub 仓库
2. 进入 **Actions** 标签
3. 找到 **"Supabase Keep-Alive"** 工作流
4. 确认它已启用（绿色勾选标记）

---

### 第 5 步：手动测试（可选）

1. 在 **Actions** 标签
2. 点击 **"Supabase Keep-Alive"** 工作流
3. 点击 **"Run workflow"** 按钮
4. 选择 **master** 分支
5. 点击 **"Run workflow"**
6. 等待执行完成（约 30 秒）
7. 查看日志确认成功

---

## 📊 工作流说明

### 执行时间

- **频率**：每 6 天执行一次
- **时间**：UTC 3:00（北京时间 11:00）
- **时区**：UTC（协调世界时）

### 执行内容

```yaml
1. 检出代码
2. 安装 Node.js
3. 安装 Supabase CLI
4. 执行数据库查询：SELECT NOW()
5. 记录执行结果
```

### 触发条件

- **自动触发**：每 6 天
- **手动触发**：随时可以在 Actions 页面点击 "Run workflow"

---

## 🔧 自定义配置

### 修改执行频率

编辑 `.github/workflows/supabase-keepalive.yml`：

```yaml
on:
  schedule:
    # 每 5 天执行一次（更安全）
    - cron: '0 2 */5 * *'
    
    # 或者每周一执行
    - cron: '0 2 * * 1'
    
    # 或者每天执行（最安全但没必要）
    - cron: '0 2 * * *'
```

**Cron 表达式说明**：
- `0 3 */6 * *` = 每 6 天的 3:00 UTC
- `0 2 * * 1` = 每周一的 2:00 UTC
- `0 2 * * *` = 每天 2:00 UTC

---

### 修改执行时间

```yaml
on:
  schedule:
    # UTC 时间 2:00 = 北京时间 10:00
    - cron: '0 2 */6 * *'
    
    # UTC 时间 15:00 = 北京时间 23:00
    - cron: '0 15 */6 * *'
```

**时区转换**：
- UTC 0:00 = 北京 8:00
- UTC 3:00 = 北京 11:00
- UTC 8:00 = 北京 16:00
- UTC 15:00 = 北京 23:00

---

### 添加通知功能

```yaml
jobs:
  keep-alive:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Supabase CLI
        run: npm install -g supabase
      
      - name: Keep Supabase Project Alive
        id: keepalive
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          supabase db execute --sql "SELECT NOW();" \
            --db-url "$SUPABASE_DB_URL"
          
          if [ $? -eq 0 ]; then
            echo "status=success" >> $GITHUB_OUTPUT
          else
            echo "status=failed" >> $GITHUB_OUTPUT
            exit 1
          fi
      
      - name: Notify on Failure
        if: failure()
        run: |
          echo "❌ Keep-Alive failed! Please check the logs."
          # 可以在这里添加邮件、Slack、Discord 等通知
```

---

## 📈 监控和日志

### 查看执行历史

1. GitHub 仓库 → **Actions** 标签
2. 点击 **"Supabase Keep-Alive"**
3. 查看所有执行记录

### 查看详细日志

1. 点击任意一次执行记录
2. 点击 **"keep-alive"** 任务
3. 展开日志查看详细信息

### 成功日志示例

```
=== Starting Supabase Keep-Alive ===
Executing database query...
✅ Database query executed successfully!
✅ Supabase project keep-alive completed!
✅ Next run will be in 6 days.
=== Keep-Alive Completed ===
```

### 失败日志示例

```
=== Starting Supabase Keep-Alive ===
Executing database query...
Error: Failed to connect to database
❌ Database query failed!
❌ Please check the database connection.
```

---

## 🔍 故障排查

### 问题 1：工作流不执行

**可能原因**：
- GitHub Actions 被禁用
- 仓库超过使用限额

**解决方案**：
1. Settings → Actions → 确认 "Allow all actions" 已启用
2. 检查 Actions 使用量：https://github.com/settings/billing

---

### 问题 2：执行失败 "Database connection failed"

**可能原因**：
- Secret 配置错误
- 数据库密码错误
- 数据库已暂停

**解决方案**：
1. 检查 Secret：Settings → Secrets → 确认 `SUPABASE_DB_URL` 正确
2. 测试连接字符串（本地）：
   ```powershell
   psql "你的连接字符串" -c "SELECT NOW();"
   ```
3. 检查 Supabase Dashboard 确认项目状态

---

### 问题 3：密码包含特殊字符

**问题**：密码中有 `@`、`:` 等字符导致解析错误

**解决方案**：URL 编码密码

```powershell
# 原始密码：My@Pass#123
# URL 编码后：My%40Pass%23123

# 连接字符串：
postgresql://postgres:My%40Pass%23123@db.ehsfmciathifanermnoc.supabase.co:5432/postgres
```

**URL 编码表**：
| 字符 | 编码 |
|------|------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `?` | `%3F` |
| `&` | `%26` |
| `=` | `%3D` |
| `%` | `%25`（先编码） |

---

## 💡 最佳实践

### 1. 定期检查

- 每周查看一次 Actions 执行记录
- 确认没有失败的任务
- 检查下次执行时间

### 2. 设置提醒

在日历中设置每月提醒：
- "检查 GitHub Actions 保活状态"
- "验证 Supabase 项目活跃度"

### 3. 备份配置

保存 Secret 配置到安全位置：
```
SUPABASE_DB_URL=postgresql://postgres:密码@db.xxx.supabase.co:5432/postgres
```

### 4. 监控使用量

GitHub Actions 免费额度：
- 公共仓库：无限
- 私有仓库：2000 分钟/月

保活脚本每次约 30 秒，每月约 150 分钟，完全够用！

---

## 📊 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **GitHub Actions** | 全自动、免费、可靠 | 需要 GitHub 账号 | ⭐⭐⭐⭐⭐ |
| **本地任务计划** | 完全控制 | 需要电脑开机 | ⭐⭐⭐ |
| **云函数** | 可靠 | 可能收费 | ⭐⭐⭐⭐ |

---

## 🎯 完整设置清单

完成后确认：
- [ ] 已获取数据库连接字符串
- [ ] 已在 GitHub 添加 `SUPABASE_DB_URL` Secret
- [ ] 已推送工作流文件到 GitHub
- [ ] 已在 Actions 页面看到工作流
- [ ] 已手动测试执行成功
- [ ] 知道如何查看执行日志
- [ ] 知道如何修改执行频率

---

## 📞 需要帮助？

### GitHub Actions 文档
- [工作流语法](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [定时任务](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule)
- [Secrets 管理](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)

### Supabase 文档
- [CLI 使用指南](https://supabase.com/docs/guides/cli)
- [数据库连接](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

**最后更新**: 2026-04-02  
**项目**: Dry ESS Calendar  
**状态**: ✅ GitHub Actions 已配置
