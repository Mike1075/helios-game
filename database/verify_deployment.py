#!/usr/bin/env python3
"""
验证数据库部署是否成功
"""

import os
from pathlib import Path
from dotenv import load_dotenv

def main():
    print("🔍 验证数据库部署状态...")
    
    env_path = Path(__file__).parent / ".env.local"
    load_dotenv(env_path)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        
        # 检查各个表
        tables_to_check = ['characters', 'belief_systems', 'agent_logs', 'events', 'scenes']
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select("*", count="exact").limit(1).execute()
                count = result.count if hasattr(result, 'count') else len(result.data)
                print(f"✅ {table}: {count} 条记录")
            except Exception as e:
                print(f"❌ {table}: {e}")
        
        # 特别检查角色数据
        try:
            characters = supabase.table("characters").select("name, role").execute()
            print(f"\n📊 角色列表:")
            for char in characters.data:
                print(f"   - {char['name']} ({char['role']})")
        except:
            pass
            
        # 检查场景数据
        try:
            scenes = supabase.table("scenes").select("name").execute()
            print(f"\n🏛️  场景列表:")
            for scene in scenes.data:
                print(f"   - {scene['name']}")
        except:
            pass
        
        print(f"\n🎉 数据库部署验证完成！")
        return True
        
    except Exception as e:
        print(f"❌ 验证失败: {e}")
        return False

if __name__ == "__main__":
    main()