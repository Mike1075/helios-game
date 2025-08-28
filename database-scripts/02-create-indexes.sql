-- ========================================
-- 第2步：创建性能优化索引
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ========================================

-- 用户角色查询优化索引（最重要的索引）
CREATE INDEX idx_user_characters_active 
ON user_characters(user_id, is_active) 
WHERE is_active = true;

-- 角色特征查询索引
CREATE INDEX idx_belief_systems_character ON belief_systems(character_id);
CREATE INDEX idx_inner_drives_character ON inner_drives(character_id);
CREATE INDEX idx_outer_self_traits_character ON outer_self_traits(character_id);

-- 向量相似度搜索索引（用于AI检索）
CREATE INDEX ON belief_systems USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON inner_drives USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON outer_self_traits USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON collective_unconscious USING ivfflat (embedding vector_cosine_ops);
