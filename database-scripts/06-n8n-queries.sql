-- ========================================
-- 第6步：n8n工作流查询语句
-- 复制到 n8n 的 Supabase 节点中使用
-- ========================================

-- ========================================
-- 主查询：获取用户当前角色
-- 在n8n的第一个Supabase节点中使用
-- ========================================

SELECT uc.character_id 
FROM user_characters uc 
WHERE uc.user_id = '{{ $json.body.user_id }}'::UUID
AND uc.is_active = true;

-- ========================================
-- 角色特征查询（在向量检索节点中使用）
-- ========================================

-- 查询信念系统
SELECT content, embedding FROM belief_systems 
WHERE character_id = '{{ $node["获取当前角色"].json.character_id }}';

-- 查询内驱力
SELECT content, embedding FROM inner_drives 
WHERE character_id = '{{ $node["获取当前角色"].json.character_id }}';

-- 查询外我特征
SELECT content, embedding FROM outer_self_traits 
WHERE character_id = '{{ $node["获取当前角色"].json.character_id }}';

-- 查询集体潜意识（不需要character_id）
SELECT content, embedding FROM collective_unconscious;

-- ========================================
-- 前端发送给n8n的数据格式
-- ========================================

/*
JSON格式：
{
  "message": "我今天感觉很焦虑，不知道该怎么办",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-08-26T10:30:00.000Z"
}

注意：不需要发送character_id，n8n会通过user_id自动查询
*/

-- ========================================
-- n8n节点配置建议
-- ========================================

/*
节点1: "获取当前角色"
- 类型: Supabase
- 操作: Execute SQL
- SQL: 使用上面的"获取用户当前角色"查询

节点2: "获取信念系统"  
- 类型: Vector Store Supabase
- 表名: belief_systems
- 过滤条件: character_id = {{ $node["获取当前角色"].json.character_id }}

节点3: "获取内驱力"
- 类型: Vector Store Supabase  
- 表名: inner_drives
- 过滤条件: character_id = {{ $node["获取当前角色"].json.character_id }}

节点4: "获取外我特征"
- 类型: Vector Store Supabase
- 表名: outer_self_traits  
- 过滤条件: character_id = {{ $node["获取当前角色"].json.character_id }}

节点5: "获取集体潜意识"
- 类型: Vector Store Supabase
- 表名: collective_unconscious
- 过滤条件: 无（查询所有）
*/
