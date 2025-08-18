# Helios 项目部署后验证清单

基于你成功部署的 Supabase Edge Functions，这里是完整的系统验证清单。

## ✅ 已完成的部署

### 1. Supabase CLI 安装和配置
- [x] Windows 环境下 Supabase CLI 安装成功
- [x] 项目链接配置 (Project Ref: vfendokbefodfxwutgyc)
- [x] 认证和授权配置完成

### 2. 边缘函数部署
- [x] `belief-analyzer` 边缘函数部署成功
- [x] `ai-autonomous-behavior` 边缘函数部署成功
- [x] 函数在 Supabase 仪表板中可见

### 3. 环境变量配置
- [x] `VERCEL_AI_GATEWAY_URL` 已配置
- [x] `VERCEL_AI_GATEWAY_API_KEY` 已配置  
- [x] `SUPABASE_SERVICE_ROLE_KEY` 系统自动注入

### 4. 前端集成更新
- [x] supabase.ts 中添加了边缘函数调用封装
- [x] WorldEngine 更新为使用边缘函数
- [x] 实时订阅系统已配置

## 🔄 接下来需要验证的功能

### 1. 边缘函数调用测试
在 Vercel 预览环境中运行以下测试：

```bash
# 在 packages/web 目录下
npm run test:edge
```

**预期结果:**
- belief-analyzer 函数返回成功响应
- ai-autonomous-behavior 函数返回成功响应
- 数据库表访问正常
- 实时订阅连接成功

### 2. 核心游戏循环验证

#### 2.1 信念系统分析流程
- [ ] 玩家对话触发 agent_logs 记录
- [ ] belief-analyzer 函数自动分析玩家行为
- [ ] 信念系统更新到 belief_systems 表
- [ ] 认知失调检测触发 player_events 记录
- [ ] 前端收到实时事件，显示回响之室邀请

#### 2.2 AI 自主行为流程  
- [ ] AI 角色状态在 character_states 表中正常更新
- [ ] ai-autonomous-behavior 函数定期执行
- [ ] AI 生成的自主行为记录到 scene_events 表
- [ ] 前端实时接收 AI 行为事件并显示

#### 2.3 实时订阅系统
- [ ] 场景事件订阅 (`scene_events:moonlight_tavern`)
- [ ] 玩家状态订阅 (`player_status:player_id`)
- [ ] 角色状态订阅 (`character_states:all`)

### 3. 数据库触发器验证

创建数据库触发器来自动调用边缘函数：

```sql
-- 当插入新的 agent_logs 时，触发信念分析
CREATE OR REPLACE FUNCTION trigger_belief_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- 调用 belief-analyzer 边缘函数
  PERFORM supabase_function_call('belief-analyzer', 
    json_build_object(
      'player_id', NEW.character_id,
      'recent_logs_count', 5
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER belief_analysis_trigger
  AFTER INSERT ON agent_logs
  FOR EACH ROW
  WHEN (NEW.character_id = 'player')
  EXECUTE FUNCTION trigger_belief_analysis();
```

### 4. 性能基准测试

#### 4.1 响应时间验证
- [ ] belief-analyzer: < 3秒
- [ ] ai-autonomous-behavior: < 2秒
- [ ] 实时事件传播: < 500ms

#### 4.2 成本效益验证
- [ ] 使用 Qwen 2.5-14B 模型降低成本
- [ ] 边缘函数执行时间优化
- [ ] 数据库查询效率检查

## 🚀 部署到生产环境

### 1. GitHub Actions 工作流
确保以下环境变量在 Vercel 中正确配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `VERCEL_AI_GATEWAY_URL`
- `VERCEL_AI_GATEWAY_API_KEY`
- `ZEP_API_KEY`

### 2. 监控和日志
- [ ] Supabase 函数调用日志监控
- [ ] Vercel 部署状态检查
- [ ] 实时订阅连接状态监控

## 🎯 MVP 成功标准

1. **信念一致性**: NPC 行为与定义的信念系统保持一致
2. **"啊哈！"时刻**: 玩家在回响之室中体验到"我的想法创造了这个结果"的顿悟
3. **技术可行性**: 完整技术栈(Vercel + Supabase Edge Functions + Zep)平稳运行，具有实时性能

## 📞 问题排查

如果遇到问题，按以下顺序检查：

1. **边缘函数日志**: 在 Supabase 仪表板查看函数执行日志
2. **Vercel AI Gateway**: 检查 API 调用配额和响应状态
3. **数据库连接**: 验证 Supabase 数据库连接和权限
4. **实时订阅**: 检查 WebSocket 连接状态

## 🎉 部署成功指标

当以下所有条件都满足时，可以认为部署完全成功：

- [ ] 玩家可以与 NPC 进行对话
- [ ] AI 角色会自主执行行为
- [ ] 信念系统会根据玩家行为动态更新  
- [ ] 认知失调检测触发回响之室邀请
- [ ] 所有实时事件都能正确传播到前端
- [ ] 系统在 Vercel 生产环境中稳定运行