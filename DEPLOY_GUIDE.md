# GitHub Pages 部署指南

## 当前状态

- ✅ 代码已推送到 master 分支
- ❌ gh-pages 分支推送失败（网络问题）

## 手动部署步骤

请在 PowerShell 或命令行终端中，依次执行以下命令：

### 方法 1：使用 subtree push（推荐）

```bash
# 1. 确保在项目目录
cd "C:\Users\·\Desktop\Trae Projects\10 Calendar\V2"

# 2. 重新构建（如果需要）
npm run build

# 3. 推送到 gh-pages 分支
git subtree push --prefix dist origin gh-pages
```

### 方法 2：如果方法 1 失败，使用 git push

```bash
# 1. 切换到 gh-pages 分支
git fetch origin gh-pages
git checkout gh-pages

# 2. 更新 dist 文件夹
git checkout master -- dist

# 3. 复制 dist 内容到根目录
# （手动复制 dist 文件夹中的所有文件到项目根目录）

# 4. 提交并推送
git add -A
git commit -m "Update GitHub Pages"
git push origin gh-pages

# 5. 切回 master 分支
git checkout master
```

### 方法 3：使用部署脚本

双击运行以下任一脚本：

- `deploy-fix.bat` (Windows 批处理)
- `deploy.ps1` (PowerShell)

## 验证部署

1. 访问：https://zachzhang0.github.io/dryess-calendar/
2. 按 `Ctrl + Shift + Delete` 清除浏览器缓存
3. 刷新页面

## 如果还是 404

1. 检查 GitHub Pages 设置：
   - 访问 https://github.com/ZachZhang0/dryess-calendar/settings/pages
   - 确认 Source 是 "Deploy from a branch"
   - 确认 Branch 是 "gh-pages"
   - 确认 Folder 是 "/ (root)"

2. 等待 2-3 分钟，GitHub 需要时间更新

3. 检查 gh-pages 分支是否有文件：
   - 访问 https://github.com/ZachZhang0/dryess-calendar/tree/gh-pages
   - 应该看到 index.html 和 assets 文件夹

## 测试数据保存

1. 打开网站后登录（dryess / critical666）
2. 修改一些数据
3. 点击"保存"按钮
4. 查看浏览器控制台（F12）应该有日志：
   - `Saving data to Supabase...`
   - `Data saved successfully`
5. 刷新页面，数据应该保留

## 联系

如果部署后仍有问题，请提供：
- 浏览器控制台的完整错误信息
- GitHub Pages 设置的截图
- gh-pages 分支的文件列表
