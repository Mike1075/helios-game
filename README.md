# Helios 意识游戏

基于赛斯资料的意识转化文本游戏，通过n8n工作流实现复杂的意识处理机制。

## 项目结构

```
helios n8n/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # 交互逻辑
├── config.js           # 配置文件
├── 元宇宙mvp v0.2.json  # n8n工作流配置
└── README.md           # 使用说明
```

## 快速开始

### 1. 配置数据库

首先在Supabase中执行以下SQL创建必要的表：

```sql
-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色表
CREATE TABLE characters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_template BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户角色关联表
CREATE TABLE user_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_id VARCHAR(50) REFERENCES characters(id),
    is_active BOOLEAN DEFAULT TRUE,
    current_context TEXT,
    memory_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, character_id)
);

-- 信念系统表
CREATE TABLE belief_systems (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    character_id VARCHAR(50) REFERENCES characters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 内驱力表
CREATE TABLE inner_drives (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    character_id VARCHAR(50) REFERENCES characters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 外我特征表
CREATE TABLE outer_self_traits (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    character_id VARCHAR(50) REFERENCES characters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 集体潜意识表
CREATE TABLE collective_unconscious (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建向量索引
CREATE INDEX ON belief_systems USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON inner_drives USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON outer_self_traits USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON collective_unconscious USING ivfflat (embedding vector_cosine_ops);
```

### 2. 插入预设数据

执行提供的INSERT语句插入角色和相关数据（见项目文档中的完整SQL）。

### 3. 配置n8n工作流

1. 导入 `元宇宙mvp v0.2.json` 到您的n8n实例
2. 修改工作流中的表名：
   - "获取信念" → `belief_systems`
   - "获取内驱力" → `inner_drives`
   - "获取集体潜意识" → `collective_unconscious`
   - "获取外我"系列 → `outer_self_traits`

### 4. 配置前端

修改 `config.js` 中的webhook URL：

```javascript
// 替换为您的n8n实例地址
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/afc32e56-6565-4a21-9ae1-1040889911cc';
```

### 5. 启动应用

直接在浏览器中打开 `index.html` 即可使用。

## 功能特性

### 角色系统
- **内向学生**: 敏感自卑，渴望认同
- **上进青年**: 努力焦虑，追求成功  
- **孤独艺术家**: 创造力强，理想主义
- **焦虑家长**: 保护欲强，充满担忧

### 意识转化流程
1. **玩家输入** - 纯粹的意图表达
2. **信念系统** - 根据角色信念过滤意图
3. **内驱力** - 为意图注入行动能量
4. **集体潜意识** - 提供现实约束
5. **外我行为** - 最终的行动表现
6. **头脑解释** - 对发生事件的理性化
7. **外我反应** - 身心感受的描述

## 使用说明

1. **选择角色**: 首次访问时选择一个预设角色
2. **输入意图**: 在聊天框中输入您的想法或意图（不是具体指令）
3. **观察转化**: AI会通过复杂的意识结构处理您的输入
4. **体验结果**: 查看最终的行动和感受描述

## 技术架构

- **前端**: HTML + CSS + JavaScript (原生)
- **后端**: n8n工作流
- **数据库**: Supabase (PostgreSQL + pgvector)
- **AI模型**: Qwen-3-235b (通过Vercel AI Gateway)
- **向量检索**: Cohere embeddings

## 故障排除

### 常见问题

1. **无法连接n8n**: 检查config.js中的webhook URL是否正确
2. **向量检索失败**: 确保已启用pgvector扩展并创建了索引
3. **角色数据为空**: 确保已执行所有INSERT语句插入预设数据

### 调试模式

在config.js中设置 `debugMode: true` 可以在浏览器控制台查看详细日志。

## 项目理念

本项目基于赛斯资料中的意识运作模型，核心理念是"信念创造实相"。AI不是简单的命令执行器，而是一个意识转化器，将无形的意图通过复杂的内在结构转化为有形的行动和体验。

每个角色都有独特的信念系统、内驱力和外我特征，这些要素共同决定了意图如何被转化为最终的现实体验。
