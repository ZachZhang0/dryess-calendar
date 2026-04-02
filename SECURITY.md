# 🔐 安全指南 - 敏感信息管理

## ⚠️ 重要警告

### 已经发现的问题

❌ **问题**：`src/lib/supabase.ts` 文件中曾经硬编码了 Supabase 密钥

✅ **已修复**：现在使用环境变量管理密钥

---

## 📋 敏感信息清单

### 🔑 密钥类型和风险

| 密钥名称 | 用途 | 风险等级 | 能否暴露 |
|---------|------|---------|---------|
| **Anon/Public Key** | 客户端访问数据库 | 🟡 中等 | ✅ 可以（受 RLS 保护） |
| **Service Role Key** | 服务器端管理操作 | 🔴 极高 | ❌ 绝对不能 |
| **Database URL** | 直接数据库连接 | 🔴 高 | ❌ 绝对不能 |
| **Database Password** | 数据库密码 | 🔴 极高 | ❌ 绝对不能 |

### 🛡️ 当前项目中的密钥

#### 1. Supabase Anon Key (已暴露)
```
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**风险评估**：
- ✅ 这是 **anon/public key**，设计为在客户端使用
- ✅ 受 Supabase RLS (Row Level Security) 保护
- ✅ 只能执行允许的数据库操作
- ⚠️ 仍然建议定期轮换密钥

**建议措施**：
1. 在 Supabase Dashboard 启用 RLS
2. 为 `calendar_data` 表设置访问策略
3. 定期（每 3-6 个月）轮换密钥

#### 2. Service Role Key (未使用)
⚠️ **警告**：如果需要使用 Service Role Key，绝对不能提交到 Git！

---

## 🔒 最佳实践

### ✅ 应该做的

1. **使用环境变量**
   ```bash
   # .env 文件（不提交到 Git）
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

2. **启用 Row Level Security (RLS)**
   ```sql
   -- 在 Supabase SQL Editor 中执行
   ALTER TABLE calendar_data ENABLE ROW LEVEL SECURITY;
   
   -- 允许匿名读取（如果需要公开访问）
   CREATE POLICY "Public Read Access" ON calendar_data
     FOR SELECT USING (true);
   
   -- 允许匿名写入（如果需要公开编辑）
   CREATE POLICY "Public Write Access" ON calendar_data
     FOR ALL USING (true);
   ```

3. **定期轮换密钥**
   - 每 3-6 个月更换一次
   - 在 Supabase Dashboard → Settings → API
   - 点击 "Regenerate" 生成新密钥

4. **备份密钥到安全位置**
   - 使用密码管理器（1Password、Bitwarden）
   - 加密的云存储
   - 不要明文保存在代码中

### ❌ 不应该做的

1. ❌ 不要将 `.env` 文件提交到 Git
2. ❌ 不要在代码中硬编码 Service Role Key
3. ❌ 不要在公开场合（如 GitHub Issues、论坛）分享密钥
4. ❌ 不要使用截图分享包含密钥的页面

---

## 🚨 如果密钥泄露了怎么办？

### 情况 1：Anon/Public Key 泄露

**风险等级**：🟡 中等

**应对措施**：
1. 检查 RLS 策略是否正确配置
2. 查看 Supabase Logs 是否有异常访问
3. 如有必要，轮换密钥（在 Dashboard 重新生成）

### 情况 2：Service Role Key 泄露

**风险等级**：🔴 极高

**立即行动**：
1. ⚠️ **立即**在 Supabase Dashboard 重新生成密钥
2. 检查数据库是否有异常操作
3. 审计所有数据变更日志
4. 通知相关人员

### 情况 3：数据库密码泄露

**风险等级**：🔴 高

**立即行动**：
1. ⚠️ **立即**修改数据库密码
2. 在 Supabase Dashboard → Settings → Database
3. 检查是否有未授权访问
4. 审计数据库操作日志

---

## 📁 项目中的敏感文件

### ✅ 已正确配置的文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `.env` | ✅ 已忽略 | 包含实际密钥，不提交 |
| `.env.example` | ✅ 可提交 | 模板文件，不含真实密钥 |
| `.gitignore` | ✅ 已配置 | 忽略 `.env` 文件 |

### 📝 `.gitignore` 配置

```
# Environment
.env
.env.local
.env.*.local
```

✅ 已正确配置，`.env` 文件不会被提交

---

## 🔍 检查清单

### 部署前检查

- [ ] 确认 `.env` 文件没有被提交
- [ ] 确认 RLS 策略已启用
- [ ] 确认没有 Service Role Key 在代码中
- [ ] 确认备份脚本中的密码已替换

### 定期检查（每月）

- [ ] 检查 Supabase Logs 是否有异常
- [ ] 审查 RLS 策略是否合理
- [ ] 检查 `.gitignore` 配置是否完整
- [ ] 确认团队成员了解安全规范

---

## 🛠️ 安全工具推荐

### 1. 密钥检测工具

**GitGuardian**
- 自动检测提交中的密钥
- 免费开源项目可用
- https://www.gitguardian.com/

**TruffleHog**
- 本地扫描密钥
- ```bash
  npm install -g trufflehog
  trufflehog git file://.
  ```

### 2. 密码管理器

- **1Password** - 团队共享安全
- **Bitwarden** - 开源免费
- **LastPass** - 企业级

### 3. 环境变量管理

**Doppler**
- 集中管理环境变量
- 团队共享和权限控制
- https://www.doppler.com/

---

## 📞 需要帮助？

### Supabase 安全文档
- RLS 指南：https://supabase.com/docs/guides/auth/row-level-security
- 密钥管理：https://supabase.com/docs/guides/api/api-keys
- 安全最佳实践：https://supabase.com/docs/guides/platform/security

### 报告安全问题
如果发现安全漏洞，请通过以下方式报告：
- GitHub Issues: https://github.com/supabase/supabase/issues
- 安全邮件：security@supabase.com

---

**最后更新**: 2026-04-02  
**项目**: Dry ESS Calendar  
**状态**: ✅ 已修复密钥硬编码问题
