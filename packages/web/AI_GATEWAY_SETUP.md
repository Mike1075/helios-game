# 🚀 Vercel AI Gateway 配置指南

## 问题诊断

如果看到以下日志，说明AI Gateway未配置：
```
🔍 Group chat AI Gateway check: {
  hasKey: false,
  keyLength: 0,
  configured: false,
  envValue: 'MISSING'
}
```

## 快速配置步骤

### 1. 获取 AI Gateway API Key
- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- 进入你的项目
- 找到 AI Gateway 设置
- 生成 API Key

### 2. 本地测试配置
```bash
# 在 packages/web 目录下
cp .env.local.example .env.local
```

编辑 `.env.local`:
```
AI_GATEWAY_API_KEY=your_actual_api_key_here
```

### 3. Vercel 生产环境配置
1. 进入 Vercel 项目设置
2. 找到 "Environment Variables"
3. 添加:
   - **Name**: `AI_GATEWAY_API_KEY`
   - **Value**: 你的实际API密钥

## 验证配置成功

配置成功后，日志会显示：
```
🔍 Group chat AI Gateway check: {
  hasKey: true,
  keyLength: 32,  // 或其他长度
  configured: true,
  envValue: 'EXISTS'
}
✅ AI Gateway response successful
```

## 关键词测试

修复后的关键词匹配支持：
- "你们晚上吃啥饭了" ✅
- "吃饭了吗" ✅  
- "你们吃什么" ✅
- "饿了" ✅

## 故障排除

如果仍有问题，检查：
1. API Key 是否正确复制（无额外空格）
2. 环境变量名称是否准确: `AI_GATEWAY_API_KEY`
3. Vercel 部署是否重新启动