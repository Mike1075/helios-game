# 🚀 赫利俄斯港口酒馆 - Supabase集成设置指南

## 📋 **概述**

本项目已成功集成Supabase作为数据存储后端，实现了：
- ✅ 聊天历史持久化存储
- ✅ 玩家信念系统管理
- ✅ NPC角色数据管理
- ✅ 事件日志记录

## 🛠️ **环境要求**

- Node.js 18+ 
- npm 或 yarn
- 本地部署的Supabase实例
- 网络连接（用于DeepSeek API调用）

## 📦 **安装步骤**

### 1. 安装依赖
```bash
cd web
npm install
```

### 2. 配置环境变量
复制 `env.example` 为 `.env.local`：
```bash
cp env.example .env.local
```

编辑 `.env.local` 文件，填入实际配置：
```env
# Supabase配置（本地部署）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# DeepSeek API配置
DEEPSEEK_API_KEY=your_actual_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

### 3. 初始化Supabase数据库
在Supabase Dashboard的SQL Editor中运行 `supabase-init.sql` 脚本。

## 🗄️ **数据库结构**

### characters表
- `id`: 角色唯一标识
- `name`: 角色名称
- `role`: 角色职业
- `core_motivation`: 核心动机
- `beliefs`: 信念系统（JSON）
- `is_player`: 是否为玩家角色

### belief_systems表
- `id`: 信念系统ID
- `character_id`: 关联的角色ID
- `worldview`: 世界观
- `selfview`: 自我认知
- `values`: 价值观数组
- `rules`: 行为准则数组

### agent_logs表
- `id`: 日志ID
- `character_id`: 角色ID
- `scene_id`: 场景ID
- `action_type`: 行为类型
- `input`: 输入内容
- `output`: 输出内容
- `belief_snapshot`: 信念快照

### events表
- `id`: 事件ID
- `event_type`: 事件类型
- `character_id`: 角色ID
- `scene_id`: 场景ID
- `description`: 事件描述
- `metadata`: 元数据

## 🚀 **启动方式**

### 方式1：自动启动脚本（推荐）
```bash
# Windows
auto-start.bat

# 或双击 auto-start.bat 文件
```

### 方式2：手动启动
```bash
cd web
npm run dev
```

## 🔍 **功能测试**

### 1. 基础聊天功能
- 访问 `http://localhost:3000`
- 创建角色或使用现有角色
- 与NPC进行对话

### 2. 信念系统
- 点击"信念系统"按钮
- 查看和编辑玩家信念
- 测试信念更新功能

### 3. 数据持久化验证
- 在Supabase Dashboard中查看 `agent_logs` 表
- 确认每次对话都被记录
- 检查 `characters` 表中的玩家角色

## 🐛 **常见问题**

### Q: 端口3000被占用
**A:** 运行 `auto-start.bat` 脚本会自动释放端口

### Q: Supabase连接失败
**A:** 检查：
- Supabase服务是否运行
- 环境变量配置是否正确
- 网络连接是否正常

### Q: 信念系统无法加载
**A:** 检查：
- 数据库表是否创建成功
- 玩家角色是否在Supabase中存在
- 浏览器控制台是否有错误信息

## 📚 **技术架构**

```
前端 (Next.js + React)
    ↓
API路由 (/api/chat, /api/player-beliefs)
    ↓
Supabase客户端 (@supabase/supabase-js)
    ↓
本地Supabase实例 (PostgreSQL)
```

## 🔮 **下一步计划**

1. **信念观察者系统** - 基于历史数据自动分析玩家信念变化
2. **回响之室** - 展示信念冲突和证据
3. **动态信念调整** - AI驱动的信念系统演化
4. **多场景支持** - 扩展游戏场景和角色

## 📞 **技术支持**

如遇到问题，请：
1. 检查浏览器控制台错误信息
2. 查看终端输出日志
3. 确认Supabase服务状态
4. 验证环境变量配置

---

🎉 **恭喜！你已经成功搭建了赫利俄斯港口酒馆的完整技术栈！**
