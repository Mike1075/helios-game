# Helios 游戏项目整体设计方案

**项目名称**：Helios（赫利俄斯）- 意识探索沙盒游戏  
**项目定位**：哲学游戏 - "意识棱镜"宇宙中的主观体验沙盒  
**核心理念**：玩家通过独特的信念系统投入纯粹意识，创造高度主观的体验，共同构建不断演化的共享现实  

---

## 一、项目概述

### 1.1 项目愿景
Helios旨在创建一个"意识探索沙盒" - 一个"Prism of Consciousness"（意识棱镜）宇宙。项目的核心目标是让玩家体验到"我的思想创造了这个结果"的深刻"啊哈时刻"，通过信念驱动的行为、认知失调和自我反思的循环，实现个人信念系统的自然演化。

### 1.2 MVP目标："Prism Heart"
当前MVP版本"Prism Heart"是一个最小化世界，包含：
- **2个核心NPC**：林溪（调查者）、陈浩（酒馆老板）
- **1个简单场景**：月影酒馆
- **核心体验循环**：信念驱动行为 → 认知失调 → "回响之室"自省 → 信念演化

---

## 二、技术架构设计

### 2.1 架构决策 - 统一部署策略
**平台选择**：Vercel（统一部署平台）
- **前端**：Next.js (`packages/web`)
- **后端**：Python FastAPI on Vercel Serverless Functions (`packages/api`) 
- **数据库**：Supabase (PostgreSQL + pgvector)
- **记忆引擎**：Zep（对话历史管理）
- **AI网关**：Vercel AI Gateway（所有LLM调用的强制入口）
- **智能后端**：Supabase Edge Functions + Database Triggers

### 2.2 架构演进历程

#### v4.1 - 实时架构（无n8n）
经过性能对比测试，我们从复杂的n8n工作流引擎迁移到基于**Supabase Edge Functions**的轻量级实时系统：

**架构流程**：
```
玩家行为 → 数据库插入 → 触发器 → 边缘函数 → AI分析 → 实时更新
```

**关键优势**：
- **性能提升**：毫秒级响应（vs n8n的秒级）
- **成本优化**：使用廉价的Qwen模型 (`alibaba/qwen-2.5-14b-instruct`)
- **架构简化**：无需外部工作流引擎
- **全球部署**：通过Supabase实现边缘计算

#### v5.0 - 统一游戏状态管理（当前目标）
为解决数据库连接问题和角色管理混乱，设计了单点入口架构：

**核心设计原则**：
1. **单一数据源**：所有前端操作通过统一API
2. **角色层级**：核心NPC → 动态NPC → 系统角色
3. **统一认证**：前端永不直接访问Supabase
4. **事件驱动**：实时角色和状态同步

**架构流程**：
```
Frontend (page.tsx)
    ↓ 单一HTTP请求
Unified Game API (/api/game-state)  
    ↓ 内部服务调用
Game State Manager (supabase-admin)
    ↓ 认证的数据库访问
Supabase Database
```

### 2.3 实时订阅系统
前端订阅**世界切片**而非传统的请求-响应模式：

```typescript
// 场景事件和玩家状态订阅
const sceneChannel = supabase.channel(`scene_events:moonlight_tavern`)
const playerChannel = supabase.channel(`player_status:${playerId}`)
```

**订阅频道**：
- `scene_events:${sceneId}` - AI自主行为、环境变化
- `player_status:${playerId}` - 信念更新、认知失调触发
- `character_states:${characterId}` - AI角色内部状态变化

---

## 三、核心系统设计

### 3.1 信念系统（Belief System）

#### 信念DSL设计
采用YAML/JSON格式定义角色信念网络：
```yaml
worldview:
  - "世界充满未知的可能性"
  - "真相往往隐藏在表面之下" 
  - "每个人都有自己独特的人生故事"

selfview:
  - "我是一个好奇的探索者"
  - "我愿意面对未知和挑战"
  - "我的经历塑造了独特的我"

values: ["真实", "理解", "成长", "勇气"]
```

#### 信念编译器
Python脚本将信念文件转换为LLM系统提示词，确保角色行为与信念系统的一致性。

#### 信念演化追踪
通过`agent_logs`表记录认知失调事件，追踪信念系统的自然演化过程。

### 3.2 代理核心（Agent Core）

#### 主API：`/api/chat`
**输入**：`player_id`, `message`
**处理流程**：
1. 从Supabase加载信念系统
2. 从Zep检索对话历史
3. 通过Vercel AI Gateway调用LLM
4. 记录交互日志

**响应要求**：快速、信念一致的NPC响应

### 3.3 回响之室（Chamber of Echoes）

#### API端点：`/api/echo`
**输入**：`player_id`, `event_id`
**功能**：基于玩家信念系统生成主观的、第一人称的因果解释

**输出结构**：
```json
{
  "subjective_explanation": "基于玩家信念的第一人称主观解释",
  "supporting_memories": ["支持性记忆片段"],
  "belief_connection": "与核心信念的联系",
  "emotional_resonance": "情感体验描述",
  "wisdom_insight": "智慧洞察",
  "action_suggestions": ["行动建议"]
}
```

### 3.4 导演引擎（Director Engine）

#### 实现方式：数据库触发器 + 边缘函数
```sql
CREATE TRIGGER cognitive_dissonance_trigger
  AFTER INSERT ON agent_logs
  FOR EACH ROW EXECUTE FUNCTION detect_cognitive_dissonance();
```

**触发逻辑**：实时认知失调检测
**响应时间**：毫秒级（vs n8n的秒级）
**动作**：自动插入`player_events`表记录，触发回响之室

---

## 四、数据库架构

### 4.1 核心数据表

#### scene_events - 场景事件表
```sql
CREATE TABLE scene_events (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  player_name TEXT,
  internal_state JSONB,
  metadata JSONB
);
```

#### belief_systems - 信念系统表
```sql
CREATE TABLE belief_systems (
  id TEXT PRIMARY KEY,
  character_id TEXT UNIQUE NOT NULL,
  worldview TEXT[] NOT NULL,
  selfview TEXT[] NOT NULL,
  values TEXT[] NOT NULL,
  last_updated BIGINT NOT NULL,
  based_on_logs_count INTEGER DEFAULT 0,
  confidence_score REAL DEFAULT 0.3
);
```

#### character_states - 角色状态表
```sql
CREATE TABLE character_states (
  character_id TEXT PRIMARY KEY,
  energy REAL DEFAULT 50.0,
  focus REAL DEFAULT 50.0,
  curiosity REAL DEFAULT 50.0,
  boredom REAL DEFAULT 0.0,
  anxiety REAL DEFAULT 0.0,
  suspicion REAL DEFAULT 0.0,
  last_updated BIGINT NOT NULL,
  last_autonomous_action BIGINT DEFAULT 0
);
```

#### agent_logs - 代理日志表
```sql
CREATE TABLE agent_logs (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  content TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  metadata JSONB
);
```

### 4.2 实时触发器系统

#### 认知失调检测触发器
```sql
CREATE OR REPLACE FUNCTION detect_cognitive_dissonance()
RETURNS trigger AS $$
BEGIN
  -- 检测认知失调逻辑
  -- 如果检测到，插入player_events触发回响之室
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 五、开发工作流程

### 5.1 Zero-Trust开发模式
**开发流程**：
1. **同步**：`git checkout main && git pull origin main`
2. **分支**：`git checkout -b feature/your-name/your-feature`
3. **本地开发**：使用`npm run dev:web`或`npm run dev:api`
4. **推送**：`git push origin feature/your-name/your-feature`
5. **PR测试**：通过Vercel预览环境进行云端功能测试
6. **代码审查**：等待审批和合并

**关键约束**：
- 禁止直接推送到`main`分支
- 本地开发仅用于编码，完整功能测试在Vercel预览环境
- 外部API调用在本地会失败（预期行为）

### 5.2 环境变量管理

#### 必需的环境变量
**后端变量**（Python `os.environ.get()`）：
- `VERCEL_AI_GATEWAY_URL`：AI Gateway端点
- `VERCEL_AI_GATEWAY_API_KEY`：Gateway认证密钥
- `SUPABASE_URL`：数据库URL
- `SUPABASE_SERVICE_ROLE_KEY`：数据库服务密钥
- `ZEP_API_KEY`：记忆服务密钥

**前端变量**（Next.js `process.env.`）：
- `NEXT_PUBLIC_SUPABASE_URL`：公共数据库URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：公共数据库密钥

---

## 六、已完成功能模块

### 6.1 ✅ 基础架构
- [x] Vercel部署环境配置
- [x] Next.js前端框架搭建
- [x] Supabase数据库集成
- [x] 基础数据表结构创建
- [x] Git工作流程建立

### 6.2 ✅ 数据库系统
- [x] 完整的数据库Schema设计
- [x] 五大核心数据表实现
- [x] 数据库触发器系统框架
- [x] RLS（行级安全）策略配置
- [x] 匿名访问权限设置

### 6.3 ✅ 信念系统核心
- [x] 信念系统数据结构设计
- [x] 默认信念系统生成逻辑
- [x] 信念-行为一致性检查机制
- [x] 信念演化追踪框架

### 6.4 ✅ 角色系统
- [x] 核心NPC定义（林溪、陈浩）
- [x] 角色状态管理系统
- [x] 角色个性化行为模式
- [x] 动态角色创建机制

### 6.5 ✅ API架构
- [x] 统一游戏状态API设计（`/api/game-state`）
- [x] 回响之室API（`/api/echo`）
- [x] AI自主行为API（`/api/ai-behavior-check`）
- [x] 数据库诊断API（`/api/debug-supabase`）

### 6.6 ✅ 前端界面
- [x] 基础游戏UI布局
- [x] 对话输入系统
- [x] 实时消息显示
- [x] 角色状态展示
- [x] 错误处理和用户反馈

---

## 七、当前技术难题

### 7.1 🔴 关键阻塞问题：Supabase连接故障

#### 问题描述
自最近的代码更新以来，出现了持续性的数据库连接问题：
- **前端错误**：400/401 Bad Request/Unauthorized
- **症状**：无法写入任何数据到Supabase
- **影响范围**：所有数据库操作（读取、写入、实时订阅）

#### 诊断过程
我们进行了系统性的问题排查：

1. **环境变量验证** ✅
   - 确认所有环境变量在Vercel中正确配置
   - 验证API密钥的有效性和权限

2. **RLS策略调整** ✅
   - 创建匿名访问策略
   - 完全禁用RLS测试连接
   - 仍然出现400错误

3. **代码配置统一** ✅
   - 统一前后端环境变量命名
   - 添加构建时占位符避免构建错误
   - 修复所有API文件的环境变量配置

4. **架构对比分析** ✅
   - 通过git历史对比找到之前可工作的版本
   - 识别出环境变量使用方式的关键差异
   - 回滚到简化的配置方式

#### 当前状态
- **构建**：✅ 成功完成（已解决所有构建时错误）
- **部署**：✅ 正常部署到Vercel
- **数据库连接**：🔴 仍然失败（400错误持续）
- **数据写入**：🔴 完全无法写入
- **用户体验**：🔴 所有核心功能不可用

#### 技术债务影响
这个连接问题完全阻塞了以下核心功能：
- 玩家对话无法保存到数据库
- AI角色无法生成自主行为
- 信念系统无法更新和演化
- 回响之室无法访问历史数据
- 实时订阅系统无法工作

### 7.2 🟡 次要技术挑战

#### AI响应质量优化
- **现状**：基础的模板化响应系统
- **需求**：更智能、更符合角色个性的动态响应
- **技术方案**：优化prompt工程，引入更复杂的决策逻辑

#### 认知失调检测算法
- **现状**：简单的规则基础检测
- **需求**：更准确的认知冲突识别
- **技术方案**：机器学习模型或更复杂的语义分析

---

## 八、待开发功能

### 8.1 🟨 高优先级（MVP完成必需）

#### 数据库连接修复 🔴
**预计工期**：1-2周
**技术难度**：高
**阻塞影响**：完全阻塞所有功能

#### 完整的AI对话系统
**功能**：基于信念系统的智能NPC对话
**技术实现**：
- 完善prompt工程
- 集成Vercel AI Gateway
- 优化响应速度和质量

#### 回响之室深度体验
**功能**：沉浸式的自省和洞察生成
**技术实现**：
- 高质量的文本生成
- 个性化的洞察算法
- 情感共鸣度评估

#### 实时系统完善
**功能**：流畅的实时交互体验
**技术实现**：
- WebSocket连接优化
- 事件驱动的状态同步
- 延迟优化

### 8.2 🟩 中优先级（增强体验）

#### 角色关系系统
**功能**：NPC之间的动态关系网络
**预计工期**：2-3周

#### 场景扩展机制
**功能**：从单一酒馆扩展到多个场景
**预计工期**：3-4周

#### 高级信念演化算法
**功能**：更复杂的信念系统变化逻辑
**预计工期**：2-3周

### 8.3 🟦 低优先级（未来扩展）

#### 多玩家交互系统
#### 视觉界面美化  
#### 移动端适配
#### 数据分析仪表板

---

## 九、技术创新点

### 9.1 信念驱动的游戏机制
**创新性**：将哲学概念"信念系统"转化为可计算的游戏机制
**技术实现**：通过DSL定义信念，AI根据信念生成行为
**体验价值**：玩家体验到思想如何塑造现实

### 9.2 认知失调的游戏化
**创新性**：将心理学概念转化为游戏进展的驱动力
**技术实现**：实时检测玩家行为与信念的不一致性
**体验价值**：自然而深刻的个人成长体验

### 9.3 主观现实的技术实现
**创新性**：每个玩家体验独特的"主观现实"
**技术实现**：基于个人信念系统的动态内容生成
**体验价值**：真正个性化的游戏体验

### 9.4 边缘计算的实时AI
**创新性**：使用Supabase Edge Functions实现毫秒级AI响应
**技术实现**：数据库触发器直接调用AI服务
**体验价值**：接近即时的智能反馈

---

## 十、项目里程碑与时间线

### 10.1 已完成里程碑 ✅

#### 阶段一：基础架构（已完成）
- **时间**：项目启动 - 现在
- **成果**：完整的技术栈搭建、数据库设计、API架构

#### 阶段二：核心系统设计（已完成）
- **时间**：架构阶段后期 - 现在  
- **成果**：信念系统、角色系统、回响之室的完整设计

### 10.2 当前阶段 🔄

#### 阶段三：连接问题解决（进行中）
- **时间**：当前 - 预计2周内
- **目标**：彻底解决Supabase连接问题
- **关键任务**：数据库访问恢复、所有功能测试通过

### 10.3 未来里程碑 📅

#### 阶段四：MVP功能完善（计划中）
- **时间**：连接问题解决后 2-4周
- **目标**：完整的核心体验循环
- **关键任务**：AI对话质量、回响之室体验、实时交互

#### 阶段五：用户测试与优化（计划中）
- **时间**：MVP完成后 2-3周
- **目标**：用户体验验证和优化
- **关键任务**：用户测试、性能优化、bug修复

---

## 十一、风险评估与应对策略

### 11.1 🔴 高风险
**风险**：Supabase连接问题长期无法解决
**影响**：项目完全无法推进
**应对策略**：
- 考虑迁移到其他数据库服务（Firebase、PlanetScale）
- 寻求外部技术支持
- 重新设计数据层架构

### 11.2 🟡 中等风险
**风险**：AI响应质量不达预期
**影响**：用户体验降低
**应对策略**：
- 多模型测试对比
- 用户反馈驱动优化
- 逐步迭代改进

### 11.3 🟢 低风险
**风险**：性能优化需求
**影响**：用户体验略有影响
**应对策略**：常规性能优化措施

---

## 十二、项目总结与展望

### 12.1 技术成就
Helios项目在技术架构方面取得了显著成就：
- **完整的现代化技术栈**：Vercel + Next.js + Supabase + Edge Functions
- **创新的实时AI系统**：毫秒级响应的边缘计算架构
- **深思熟虑的数据设计**：支持复杂游戏逻辑的数据库架构
- **哲学概念的技术化**：将抽象的意识和信念概念转化为可操作的代码

### 12.2 设计创新
- **信念系统的游戏化**：首次将个人信念系统作为核心游戏机制
- **主观现实的技术实现**：每个玩家体验独特的个性化现实
- **认知失调驱动的进展**：心理学概念转化为游戏进展动力
- **回响之室的深度体验**：技术与哲学的深度融合

### 12.3 当前挑战
项目面临的主要挑战是技术实现层面的数据库连接问题，这是一个典型的工程难题而非设计问题。一旦解决，项目将能够快速推进到功能完善阶段。

### 12.4 未来展望
Helios项目代表了游戏设计的一个新方向 - 将深刻的哲学思考与现代技术相结合，创造真正有意义的互动体验。项目不仅仅是一个游戏，更是对意识、信念和现实本质的技术探索。

完成MVP后，Helios有潜力成为：
- **教育工具**：帮助人们理解信念如何塑造现实
- **自我探索平台**：提供深度内省和个人成长的空间  
- **哲学游戏的先驱**：开创新的游戏类别和体验模式
- **AI交互的创新范例**：展示AI如何参与深度的人文体验

---

**文档版本**：v1.0  
**最后更新**：2025年8月20日  
**项目状态**：MVP开发阶段，待解决关键技术问题  
**下一步行动**：解决Supabase连接问题，恢复核心功能