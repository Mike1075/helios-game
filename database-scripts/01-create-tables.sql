-- ========================================
-- 第1步：创建数据库表结构
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ========================================

-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 用户表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS characters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_template BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户角色关联表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS user_characters (
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

-- 信念系统表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS belief_systems (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    character_id VARCHAR(50) REFERENCES characters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 内驱力表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS inner_drives (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    character_id VARCHAR(50) REFERENCES characters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 外我特征表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS outer_self_traits (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    character_id VARCHAR(50) REFERENCES characters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 集体潜意识表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS collective_unconscious (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
