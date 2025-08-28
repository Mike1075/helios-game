-- ========================================
-- 第4步：创建用户管理函数
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ========================================

-- 创建新用户函数
CREATE OR REPLACE FUNCTION create_user(
    p_username VARCHAR(50),
    p_email VARCHAR(100) DEFAULT NULL
) RETURNS TABLE(user_id UUID, username VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO users (username, email)
    VALUES (p_username, p_email)
    RETURNING id, users.username;
END;
$$ LANGUAGE plpgsql;

-- 绑定用户角色函数（支持角色切换）
CREATE OR REPLACE FUNCTION bind_user_character(
    p_user_id UUID,
    p_character_id VARCHAR(50)
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
    -- 第一步：将该用户的所有角色设为非激活
    UPDATE user_characters 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- 第二步：激活新角色（如果已存在则更新，否则创建）
    INSERT INTO user_characters (user_id, character_id, is_active)
    VALUES (p_user_id, p_character_id, true)
    ON CONFLICT (user_id, character_id) 
    DO UPDATE SET 
        is_active = true, 
        updated_at = NOW();
    
    RETURN QUERY SELECT true, '角色绑定成功'::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 获取用户当前角色函数
CREATE OR REPLACE FUNCTION get_user_current_character(
    p_user_id UUID
) RETURNS TABLE(
    user_id UUID, 
    character_id VARCHAR(50), 
    character_name VARCHAR(100),
    character_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.user_id,
        uc.character_id,
        c.name,
        c.description
    FROM user_characters uc
    JOIN characters c ON uc.character_id = c.id
    WHERE uc.user_id = p_user_id AND uc.is_active = true;
END;
$$ LANGUAGE plpgsql;
