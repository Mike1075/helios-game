#!/usr/bin/env python3
"""
简单测试Supabase数据库连接
"""
import os
from supabase import create_client, Client

# 使用Supabase MCP提供的环境变量
SUPABASE_URL = "https://tlttpgocwitqgmukuteu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdHRwZ29jd2l0cWdtdWt1dGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTAxNjIsImV4cCI6MjA3MTA4NjE2Mn0.tlKeYa3mBRsZdIW8qDRfUpIBKuCsr3m6GIfDyFki79g"

def test_db_connection():
    try:
        # 创建Supabase客户端
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # 测试读取characters表
        print("📋 测试读取characters表...")
        result = supabase.table("characters").select("*").execute()
        print(f"✅ 成功读取 {len(result.data)} 个角色:")
        for char in result.data:
            print(f"  - {char['name']} ({char['role']})")
        
        # 测试插入agent_logs
        print("\n📝 测试插入agent_logs...")
        test_log = {
            "timestamp": 1723965600.0,
            "player_id": "test_player_123",
            "character_id": "guard_alvin",
            "scene_id": "tavern",
            "action_type": "dialogue",
            "input": "你好",
            "output": "我是艾尔文，港口的守卫。有什么可以帮助你的吗？",
            "session_id": "test_session_123",
            "belief_influenced": True
        }
        
        insert_result = supabase.table("agent_logs").insert(test_log).execute()
        print(f"✅ 成功插入日志记录: {insert_result.data[0]['id']}")
        
        # 测试读取刚插入的记录
        print("\n🔍 测试读取agent_logs...")
        logs_result = supabase.table("agent_logs").select("*").eq("player_id", "test_player_123").execute()
        print(f"✅ 成功读取 {len(logs_result.data)} 条日志记录")
        
        # 测试echo_logs
        print("\n🪞 测试插入echo_logs...")
        test_echo = {
            "timestamp": 1723965600.0,
            "player_id": "test_player_123",
            "event_type": "echo_chamber",
            "attribution": "我感受到了内心深处的某种联系...",
            "evidence": ["与守卫的对话体现了我对权威的态度", "我的回应方式反映了我的性格特征"]
        }
        
        echo_result = supabase.table("echo_logs").insert(test_echo).execute()
        print(f"✅ 成功插入回响记录: {echo_result.data[0]['id']}")
        
        print("\n🎉 所有数据库操作测试成功！")
        
    except Exception as e:
        print(f"❌ 数据库连接测试失败: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("开始测试Supabase数据库连接...\n")
    success = test_db_connection()
    print(f"\n测试结果: {'成功' if success else '失败'}")