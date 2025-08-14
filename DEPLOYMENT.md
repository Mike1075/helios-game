# Vercel部署说明

## 环境变量配置

在Vercel Dashboard中设置以下环境变量：

### 必需环境变量

```bash
VERCEL_AI_GATEWAY_API_KEY=EtMyP4WaMfdkxizkutRrJT1j
```

**注意：** 不要在代码中硬编码API key！

## 部署步骤

### 1. 准备代码
确保所有代码已提交到Git仓库：

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Vercel Dashboard配置
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 导入你的GitHub仓库
4. 配置项目设置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `packages/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. 环境变量设置
在项目设置中添加环境变量：
- 进入 Settings → Environment Variables
- 添加变量：
  - **Name**: `VERCEL_AI_GATEWAY_API_KEY`
  - **Value**: `EtMyP4WaMfdkxizkutRrJT1j`
  - **Environments**: Production, Preview, Development

### 4. 部署验证
部署完成后验证功能：
- ✅ 聊天界面加载
- ✅ 模型选择器工作
- ✅ AI对话正常响应
- ✅ 流式输出显示
- ✅ Markdown渲染正确

## 支持的功能

### AI模型支持 (11种)
- anthropic/claude-sonnet-4
- openai/gpt-5-nano
- openai/gpt-5
- openai/gpt-5-mini (默认)
- google/gemini-2.5-pro
- google/gemini-2.5-flash
- openai/gpt-4o
- xai/grok-4
- alibaba/qwen-3-235b
- deepseek/deepseek-r1
- deepseek/deepseek-v3

### 界面特性
- ✅ 现代化渐变UI设计
- ✅ 响应式布局
- ✅ 实时流式对话
- ✅ Markdown富文本支持
- ✅ 代码语法高亮
- ✅ 自动滚动到底部

### 技术架构
- **前端**: Next.js 14 + React
- **AI SDK**: Vercel AI SDK 5
- **样式**: 内联样式 + CSS-in-JS
- **富文本**: react-markdown + remark-gfm
- **部署**: Vercel Edge Functions

## 故障排除

### 常见问题

**1. API Key错误**
```
Error: AI Gateway API key not configured
```
**解决方案**: 检查Vercel环境变量设置

**2. 模型调用失败**
```
Error: Failed to generate response
```
**解决方案**: 检查模型名称是否正确，查看Vercel Function Logs

**3. 流式输出异常**
**解决方案**: 确保使用Edge Runtime，检查网络连接

### 日志查看
在Vercel Dashboard中查看：
- Functions → View Function Logs
- 查找错误信息和API调用日志

## 环境差异

| 环境 | API Key环境变量 | 部署方式 |
|------|----------------|----------|
| 本地开发 | `AI_GATEWAY_API_KEY` | `npm run dev` |
| Vercel生产 | `VERCEL_AI_GATEWAY_API_KEY` | 自动部署 |

代码会自动检测并使用正确的环境变量。

## 性能优化

1. **Edge Functions**: 使用Vercel Edge Runtime提升响应速度
2. **流式传输**: 实时显示AI响应，提升用户体验  
3. **组件优化**: 使用React Hooks避免不必要的重渲染
4. **缓存策略**: Next.js自动静态优化

部署完成后，你将获得一个功能完整的AI聊天应用！🚀