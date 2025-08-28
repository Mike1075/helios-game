-- ========================================
-- 第5步：测试用例和验证
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ========================================

-- 测试1：创建测试用户
SELECT * FROM create_user('test_user_1', 'test1@example.com');
SELECT * FROM create_user('test_user_2', 'test2@example.com');
SELECT * FROM create_user('test_user_3', 'test3@example.com');

-- 注意：记录上面返回的user_id，替换下面的UUID

-- 测试2：绑定角色（请替换为实际的UUID）
-- SELECT * FROM bind_user_character('替换为实际UUID'::UUID, 'introverted_student');
-- SELECT * FROM bind_user_character('替换为实际UUID'::UUID, 'ambitious_youth');
-- SELECT * FROM bind_user_character('替换为实际UUID'::UUID, 'lonely_artist');

-- 测试3：验证绑定结果（请替换为实际的UUID）
-- SELECT * FROM get_user_current_character('替换为实际UUID'::UUID);

-- 测试4：角色切换测试（请替换为实际的UUID）
-- SELECT * FROM bind_user_character('替换为实际UUID'::UUID, 'anxious_parent');
-- SELECT * FROM get_user_current_character('替换为实际UUID'::UUID);

-- ========================================
-- 数据验证查询
-- ========================================

-- 查看所有用户及其当前角色
SELECT 
    u.username,
    u.email,
    c.name as character_name,
    uc.is_active,
    uc.created_at
FROM users u
LEFT JOIN user_characters uc ON u.id = uc.user_id AND uc.is_active = true
LEFT JOIN characters c ON uc.character_id = c.id
ORDER BY u.created_at;

-- 统计每个角色的用户数量
SELECT 
    c.name as character_name,
    COUNT(uc.user_id) as active_users
FROM characters c
LEFT JOIN user_characters uc ON c.id = uc.character_id AND uc.is_active = true
GROUP BY c.id, c.name
ORDER BY active_users DESC;

-- 检查是否有用户有多个激活角色（不应该存在）
SELECT user_id, COUNT(*) as active_count
FROM user_characters 
WHERE is_active = true
GROUP BY user_id
HAVING COUNT(*) > 1;
