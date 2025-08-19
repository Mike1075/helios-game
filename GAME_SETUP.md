# Helios Game - 快速启动指南

## 当前状态
✅ 基础游戏已完成，可以体验核心功能：
- 与3个不同性格的NPC对话
- 体验"回响之室"的主观归因功能
- 完整的前后端分离架构

## 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 启动后端API服务器
```bash
# 在第一个终端窗口
cd packages/api
python3 -m uvicorn main:app --reload --port 8000
```

### 3. 启动前端应用
```bash
# 在第二个终端窗口  
cd packages/web
npm run dev
```

### 4. 开始游戏
打开浏览器访问：http://localhost:3000

## 游戏功能

### 🏰 港口酒馆
- **艾尔文（城卫兵）**: 严谨正直，维护秩序
- **卡琳（流浪者）**: 警觉机智，保持戒备  
- **塞恩（学者）**: 博学好奇，追求真理

### 💬 对话系统
- 选择不同的NPC进行对话
- 每个NPC都有独特的性格和回应风格
- 系统会记录所有对话日志

### 🪞 回响之室
- 点击"进入回响之室"按钮
- 获得基于你行为的主观因果解释
- 体验"本我之镜"的核心理念

## 技术架构

### 前端 (packages/web)
- **框架**: Next.js 14 + React 18
- **样式**: Tailwind CSS
- **特性**: 实时聊天界面，API代理

### 后端 (packages/api)  
- **框架**: FastAPI + Python
- **API端点**: 
  - `POST /api/chat` - NPC对话
  - `POST /api/echo` - 回响之室
  - `GET /api/health` - 健康检查

### 开发模式
- **前端**: http://localhost:3000
- **后端**: http://127.0.0.1:8000
- **API代理**: 前端自动代理 `/api/*` 请求到后端

## 后续开发计划

- [ ] 集成Supabase数据库
- [ ] 实现信念观察者系统
- [ ] 添加Zep记忆引擎
- [ ] 接入Vercel AI Gateway
- [ ] 实现导演引擎（Supabase边缘函数）

## 注意事项

1. **本地开发**: 当前使用模拟数据，外部API调用会失败（正常现象）
2. **完整测试**: 需要通过GitHub PR在Vercel预览环境进行
3. **环境变量**: 敏感信息统一由Vercel云端管理

---

🎮 **开始你的意识探索之旅吧！**