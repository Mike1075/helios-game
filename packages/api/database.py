"""
Helios数据库连接模块
严格遵循CLAUDE.md中的环境变量规范
"""
import os
from supabase import create_client, Client
from typing import Optional, Dict, Any, List
import json
from datetime import datetime

class HeliosDB:
    def __init__(self):
        # 使用CLAUDE.md中规定的环境变量名称
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY")
        
        self.client: Client = create_client(supabase_url, supabase_key)
    
    async def get_character_by_id(self, character_id: str) -> Optional[Dict]:
        """获取角色信息"""
        try:
            result = self.client.table("characters").select("*").eq("id", character_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching character {character_id}: {e}")
            return None
    
    async def get_session_logs(self, session_id: str) -> List[Dict]:
        """获取会话历史"""
        try:
            result = self.client.table("agent_logs").select("*").eq("session_id", session_id).order("ts", desc=False).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching session logs {session_id}: {e}")
            return []
    
    async def add_agent_log(self, 
                           character_id: str,
                           session_id: str, 
                           speaker: str, 
                           text: str,
                           scene_id: str = "harbor_tavern",
                           action_type: str = "dialogue",
                           input_context: Dict = None,
                           output_context: Dict = None,
                           belief_snapshot: str = None) -> bool:
        """添加代理日志"""
        try:
            data = {
                "character_id": character_id,
                "session_id": session_id,
                "scene_id": scene_id,
                "action_type": action_type,
                "speaker": speaker,
                "text": text,
                "input_context": input_context or {},
                "output_context": output_context or {},
                "belief_snapshot": belief_snapshot
            }
            
            result = self.client.table("agent_logs").insert(data).execute()
            return len(result.data) > 0
        except Exception as e:
            print(f"Error adding agent log: {e}")
            return False
    
    async def get_belief_system(self, character_id: str) -> Optional[Dict]:
        """获取角色信念系统"""
        try:
            result = self.client.table("belief_systems").select("*").eq("character_id", character_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching belief system for {character_id}: {e}")
            return None
    
    async def get_recent_events(self, character_id: str, limit: int = 5) -> List[Dict]:
        """获取最近的事件"""
        try:
            result = self.client.table("events").select("*").eq("character_id", character_id).order("ts", desc=True).limit(limit).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching recent events for {character_id}: {e}")
            return []

# 全局数据库实例
db_instance: Optional[HeliosDB] = None

def get_db() -> HeliosDB:
    """获取数据库实例（单例模式）"""
    global db_instance
    if db_instance is None:
        db_instance = HeliosDB()
    return db_instance