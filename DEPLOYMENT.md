# Helios 部署指南

## 📋 部署前检查清单

### ✅ 已完成的准备工作
- [x] GitHub仓库: `Lawsquare/helios-game`
- [x] Supabase项目已配置
- [x] n8n工作流已部署
- [x] 所有凭证已收集

### ⚠️ 安全提醒
- GitHub Token已泄露，需要重新生成
- 所有敏感文件已添加到 `.gitignore`

## 🚀 Vercel 部署步骤

### 方法1: GitHub连接部署（推荐）

#### 1. 准备GitHub仓库
```bash
# 初始化Git仓库
git init

# 添加所有文件（敏感文件会被.gitignore忽略）
git add .

# 提交代码
git commit -m "Initial commit: Helios consciousness game"

# 连接到GitHub仓库
git remote add origin https://github.com/Lawsquare/helios-game.git

# 推送代码
git push -u origin main
```

#### 2. 连接Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择 `Lawsquare/helios-game` 仓库
5. 点击 "Deploy"

#### 3. 配置环境变量
在Vercel项目设置中添加以下环境变量：

```
SUPABASE_URL=https://remukeaazmezhksoawrf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbXVrZWFhem1lemhrc29hd3JmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIyMjUxMCwiZXhwIjoyMDcwNzk4NTEwfQ.4pVPosybxjMtZjWETAEbKPGTjXjBIpngwcFYaf7Y2Dk
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbXVrZWFhem1lemhrc29hd3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjI1MTAsImV4cCI6MjA3MDc5ODUxMH0.SbIAm5I_lW0S4YJtCE9I3k3F7nIG-ec-xnC0UuI2a70
VERCEL_AI_API_KEY=94TyvNQ1ziPqGCkLddgiYlo8
N8N_WEBHOOK_URL=https://n8n.aifunbox.com/webhook/58a6c8c7-52ff-4c2f-8809-101f1e16ed9a
```

### 方法2: Vercel CLI部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel

# 设置环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_ANON_KEY
vercel env add VERCEL_AI_API_KEY
vercel env add N8N_WEBHOOK_URL
```

## 🔧 部署后配置

### 1. 测试部署
- 访问部署后的URL
- 测试角色选择功能
- 测试聊天功能
- 检查n8n连接

### 2. 域名配置（可选）
- 在Vercel项目设置中添加自定义域名
- 配置DNS记录

### 3. 性能优化
- 启用Vercel Analytics
- 配置缓存策略
- 监控性能指标

## 🐛 故障排除

### 常见问题

#### 1. CORS错误
- 确保使用HTTPS域名访问
- 检查n8n的CORS设置

#### 2. 环境变量未生效
- 检查Vercel项目设置中的环境变量
- 重新部署项目

#### 3. n8n连接失败
- 确认工作流处于Active状态
- 检查webhook URL是否正确
- 测试网络连接

#### 4. Supabase连接问题
- 验证API密钥是否正确
- 检查数据库表是否已创建
- 确认向量扩展已启用

## 📊 监控和维护

### 1. 日志监控
- 查看Vercel部署日志
- 监控n8n执行日志
- 检查Supabase日志

### 2. 性能监控
- 使用Vercel Analytics
- 监控API响应时间
- 跟踪用户使用情况

### 3. 安全维护
- 定期轮换API密钥
- 监控异常访问
- 更新依赖包

## 🔄 更新部署

### 自动部署
- 推送代码到GitHub主分支
- Vercel自动触发重新部署

### 手动部署
```bash
# 使用Vercel CLI
vercel --prod
```

## 📞 支持联系

如遇到问题，请检查：
1. Vercel部署日志
2. 浏览器开发者工具控制台
3. n8n工作流执行历史
4. Supabase项目日志

---
最后更新: 2024年当前日期
