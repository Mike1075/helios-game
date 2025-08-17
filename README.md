# Helios Game - 赫利俄斯

> 一个意识探索与演化的沙盒 - "意识的棱镜"

## 项目简介

"赫利俄斯"不是一个传统的游戏，而是一个**意识探索与演化的沙盒**。玩家投入的是纯粹的**意识之光**，这束光透过他们内心独特的**信念系统（棱镜）**，折射出独一无二的个人体验。

### MVP目标 - "棱镜之心"

创建一个包含**2个核心NPC**和**1个简单场景**的微型世界，让玩家体验完整的核心循环：
**基于信念的行动** → **认知失调** → **回响之室自省** → **信念演化**

## 技术架构

- **统一平台**: Vercel
- **前端**: Next.js (`packages/web`)
- **后端**: Python FastAPI (`packages/api`)
- **数据库**: Supabase (PostgreSQL + pgvector)
- **记忆引擎**: Zep
- **工作流引擎**: n8n
- **AI网关**: Vercel AI Gateway

## 快速开始

### 环境要求

- Node.js v20.x+
- Python 3.11+
- Git

### 开发环境设置

1. **克隆仓库**
   ```bash
   git clone https://github.com/Mike1075/helios-game.git
   cd helios-game
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **本地开发** (零信任模式 - 无需API密钥)
   ```bash
   # 前端开发 (UI调试)
   npm run dev:web
   
   # 后端开发 (API逻辑，需要先安装 pip install uvicorn fastapi)
   npm run dev:api
   ```

**⚠️ 重要**: 本地开发时，外部API调用会失败(正常现象)。完整功能测试请通过GitHub PR的Vercel预览环境进行。

### 项目结构

```
helios-game/
├── packages/
│   ├── web/          # Next.js 前端应用
│   │   ├── src/app/  # App Router 页面
│   │   └── src/components/
│   └── api/          # FastAPI 后端
│       ├── main.py   # API 入口
│       └── requirements.txt
├── docs/             # 项目文档
├── CLAUDE.md         # Claude Code 开发指南
├── package.json      # 根 package.json
└── vercel.json       # Vercel 部署配置
```

## 核心系统组件

### 1. 信念系统 (Belief System)
- Belief DSL: 结构化定义角色信念网络
- Belief Compiler: 将信念编译为LLM系统提示词
- 演化机制: 记录认知失调事件

### 2. 代理核心 (Agent Core)
- API端点: `/api/chat`
- 信念加载、记忆检索、LLM调用、日志记录

### 3. 回响之室 (Chamber of Echoes)
- API端点: `/api/echo`
- 生成主观的、第一人称因果解释

### 4. 导演引擎 (Director Engine)
- n8n工作流监听认知失调事件
- 自动触发"回响之室"机会

## 开发协作流程

### 零信任本地开发工作流

我们采用"零信任本地开发"模式：
- **本地**: 编写代码、UI开发、离线逻辑测试
- **云端**: 通过GitHub PR在Vercel预览环境进行完整功能测试

### 分支规范
- `feature/[姓名]/[功能描述]`
- `fix/[姓名]/[修复描述]`

### 完整开发周期
1. **同步主干**: `git checkout main && git pull origin main`
2. **创建分支**: `git checkout -b feature/your-name/your-feature`
3. **本地编码**: 使用 `npm run dev:web` 或 `npm run dev:api` 进行本地开发
4. **推送代码**: `git push origin feature/your-name/your-feature`
5. **创建PR**: 在GitHub创建Pull Request到main分支
6. **云端测试**: 使用Vercel自动生成的预览环境链接进行完整测试
7. **代码审查**: 等待团队审查和合并

## 环境变量

所有敏感信息通过Vercel云端统一管理，**仅在预览环境和生产环境可用**：

**后端专用** (Python `os.environ.get()`):
- `VERCEL_AI_GATEWAY_URL`: AI网关端点
- `VERCEL_AI_GATEWAY_API_KEY`: API认证密钥
- `SUPABASE_URL`: 数据库URL
- `SUPABASE_SERVICE_KEY`: 数据库服务密钥
- `ZEP_API_KEY`: 记忆服务密钥

**前端专用** (Next.js `process.env.`):
- `NEXT_PUBLIC_SUPABASE_URL`: 公开数据库URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 公开数据库密钥

## MVP成功标准

1. **信念一致性**: NPC行为与其信念系统高度一致
2. **"Aha!"时刻**: 玩家在"回响之室"中产生"原来是我的想法导致了这一切"的感悟
3. **技术可行性**: 整个技术栈协同工作顺畅

## 贡献

请阅读 [项目协作开发说明书v1.2](./docs/Helios项目协作开发说明书1.2.md) 了解详细的开发规范和流程。

## 项目文档

- [MVP需求文档 PRD](./docs/Helios项目MVP说明书PRD1.0.md)
- [协作开发说明书v1.2](./docs/Helios项目协作开发说明书1.2.md)
- [Claude Code 开发指南](./CLAUDE.md)

## 许可证

本项目为私有项目，仅供团队内部开发使用。

---

**让我们一起，用代码和AI，为这个世界注入第一缕意识之光。**

*Mike - Helios项目负责人*

# Test redeploy