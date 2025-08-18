"""
Helios Game - 数据库操作工具类
提供对Supabase数据库的便捷访问接口
"""

import os
import json
from typing import Dict, List, Optional, Any
from supabase import create_client, Client
import yaml
from datetime import datetime
import uuid

class DatabaseManager:
    """Supabase数据库管理器"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        self._init_client()
    
    def _init_client(self):
        """初始化Supabase客户端"""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if url and key:
            self.supabase = create_client(url, key)
        else:
            print("Warning: Supabase credentials not found. Database operations will fail.")
    
    def is_connected(self) -> bool:
        """检查数据库连接状态"""
        if not self.supabase:
            return False
        
        try:
            # 尝试简单查询来测试连接
            result = self.supabase.table("characters").select("count", count="exact").limit(1).execute()
            return True
        except Exception as e:
            print(f"Database connection test failed: {e}")
            return False

    # =============================================
    # 角色管理
    # =============================================
    
    def get_character(self, character_id: str) -> Optional[Dict]:
        """获取角色信息（包含信念系统）"""
        if not self.supabase:
            return None
            
        try:
            result = self.supabase.from_("character_profiles").select("*").eq("id", character_id).single().execute()
            return result.data
        except Exception as e:
            print(f"Error fetching character {character_id}: {e}")
            return None
    
    def get_all_characters(self, is_player: Optional[bool] = None) -> List[Dict]:
        """获取所有角色"""
        if not self.supabase:
            return []
            
        try:
            query = self.supabase.from_("characters").select("*")
            if is_player is not None:
                query = query.eq("is_player", is_player)
            
            result = query.execute()
            return result.data
        except Exception as e:
            print(f"Error fetching characters: {e}")
            return []
    
    def create_character(self, name: str, role: str, core_motivation: str, 
                        is_player: bool = False, **kwargs) -> Optional[str]:
        """创建新角色"""
        if not self.supabase:
            return None
            
        try:
            character_data = {
                "name": name,
                "role": role,
                "core_motivation": core_motivation,
                "is_player": is_player,
                **kwargs
            }
            
            result = self.supabase.table("characters").insert(character_data).execute()
            return result.data[0]["id"] if result.data else None
        except Exception as e:
            print(f"Error creating character: {e}")
            return None

    # =============================================
    # 信念系统管理
    # =============================================
    
    def get_belief_system(self, character_id: str) -> Optional[Dict]:
        """获取角色的信念系统"""
        if not self.supabase:
            return None
            
        try:
            result = self.supabase.table("belief_systems").select("*").eq("character_id", character_id).single().execute()
            
            if result.data:
                # 解析YAML格式的信念数据
                belief_data = result.data.copy()
                belief_data["beliefs"] = yaml.safe_load(belief_data["belief_yaml"])
                return belief_data
            return None
        except Exception as e:
            print(f"Error fetching belief system for {character_id}: {e}")
            return None
    
    def update_belief_system(self, character_id: str, belief_yaml: str, 
                           confidence_score: float = 0.0) -> bool:
        """更新或创建角色的信念系统"""
        if not self.supabase:
            return False
            
        try:
            belief_data = {
                "character_id": character_id,
                "belief_yaml": belief_yaml,
                "confidence_score": confidence_score,
                "last_updated": datetime.utcnow().isoformat()
            }
            
            # 使用 upsert 来更新或插入
            result = self.supabase.table("belief_systems").upsert(
                belief_data, 
                on_conflict="character_id"
            ).execute()
            
            return len(result.data) > 0
        except Exception as e:
            print(f"Error updating belief system for {character_id}: {e}")
            return False

    # =============================================
    # 代理日志管理
    # =============================================
    
    def log_interaction(self, character_id: str, action_type: str, 
                       input_data: Dict, output_data: Dict,
                       scene_id: str = "harbor_tavern", 
                       session_id: Optional[str] = None,
                       belief_snapshot: Optional[str] = None) -> bool:
        """记录角色交互日志"""
        if not self.supabase:
            return False
            
        try:
            log_data = {
                "character_id": character_id,
                "scene_id": scene_id,
                "action_type": action_type,
                "input_data": input_data,
                "output_data": output_data,
                "session_id": session_id,
                "belief_snapshot": belief_snapshot
            }
            
            result = self.supabase.table("agent_logs").insert(log_data).execute()
            return len(result.data) > 0
        except Exception as e:
            print(f"Error logging interaction: {e}")
            return False
    
    def get_character_logs(self, character_id: str, limit: int = 50) -> List[Dict]:
        """获取角色的交互历史"""
        if not self.supabase:
            return []
            
        try:
            result = self.supabase.table("agent_logs").select("*").eq(
                "character_id", character_id
            ).order("timestamp", desc=True).limit(limit).execute()
            
            return result.data
        except Exception as e:
            print(f"Error fetching logs for {character_id}: {e}")
            return []
    
    def get_recent_logs(self, hours: int = 24, character_id: Optional[str] = None) -> List[Dict]:
        """获取最近的交互日志"""
        if not self.supabase:
            return []
            
        try:
            # 计算时间阈值
            from datetime import datetime, timedelta
            threshold = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
            
            query = self.supabase.table("agent_logs").select("*").gte("timestamp", threshold)
            
            if character_id:
                query = query.eq("character_id", character_id)
                
            result = query.order("timestamp", desc=True).execute()
            return result.data
        except Exception as e:
            print(f"Error fetching recent logs: {e}")
            return []

    # =============================================
    # 事件管理
    # =============================================
    
    def create_event(self, event_type: str, payload: Dict, 
                    trigger_character_id: Optional[str] = None,
                    scene_id: str = "harbor_tavern") -> bool:
        """创建新事件"""
        if not self.supabase:
            return False
            
        try:
            event_data = {
                "type": event_type,
                "payload": payload,
                "trigger_character_id": trigger_character_id,
                "scene_id": scene_id
            }
            
            result = self.supabase.table("events").insert(event_data).execute()
            return len(result.data) > 0
        except Exception as e:
            print(f"Error creating event: {e}")
            return False
    
    def get_pending_events(self, scene_id: Optional[str] = None) -> List[Dict]:
        """获取待处理的事件"""
        if not self.supabase:
            return []
            
        try:
            query = self.supabase.table("events").select("*").eq("status", "pending")
            
            if scene_id:
                query = query.eq("scene_id", scene_id)
                
            result = query.order("created_at", desc=False).execute()
            return result.data
        except Exception as e:
            print(f"Error fetching pending events: {e}")
            return []
    
    def mark_event_processed(self, event_id: str) -> bool:
        """标记事件为已处理"""
        if not self.supabase:
            return False
            
        try:
            result = self.supabase.table("events").update({
                "status": "processed",
                "processed_at": datetime.utcnow().isoformat()
            }).eq("id", event_id).execute()
            
            return len(result.data) > 0
        except Exception as e:
            print(f"Error marking event {event_id} as processed: {e}")
            return False

    # =============================================
    # 场景管理
    # =============================================
    
    def get_scene(self, scene_id: str) -> Optional[Dict]:
        """获取场景信息"""
        if not self.supabase:
            return None
            
        try:
            result = self.supabase.table("scenes").select("*").eq("id", scene_id).single().execute()
            return result.data
        except Exception as e:
            print(f"Error fetching scene {scene_id}: {e}")
            return None
    
    def get_scene_characters(self, scene_id: str) -> List[Dict]:
        """获取场景中的所有角色"""
        scene = self.get_scene(scene_id)
        if not scene or not scene.get("active_characters"):
            return []
            
        character_ids = scene["active_characters"]
        if not character_ids:
            return []
            
        try:
            result = self.supabase.table("characters").select("*").in_("id", character_ids).execute()
            return result.data
        except Exception as e:
            print(f"Error fetching scene characters: {e}")
            return []

    # =============================================
    # 工具方法
    # =============================================
    
    def execute_raw_sql(self, sql: str) -> Optional[Any]:
        """执行原始SQL查询 (谨慎使用)"""
        if not self.supabase:
            return None
            
        try:
            result = self.supabase.rpc("execute_sql", {"sql": sql}).execute()
            return result.data
        except Exception as e:
            print(f"Error executing raw SQL: {e}")
            return None
    
    def health_check(self) -> Dict[str, Any]:
        """数据库健康检查"""
        status = {
            "connected": self.is_connected(),
            "character_count": 0,
            "belief_systems_count": 0,
            "recent_logs_count": 0
        }
        
        if status["connected"]:
            try:
                # 统计角色数量
                result = self.supabase.table("characters").select("*", count="exact").execute()
                status["character_count"] = result.count
                
                # 统计信念系统数量
                result = self.supabase.table("belief_systems").select("*", count="exact").execute()
                status["belief_systems_count"] = result.count
                
                # 统计最近日志数量
                logs = self.get_recent_logs(hours=24)
                status["recent_logs_count"] = len(logs)
                
            except Exception as e:
                status["error"] = str(e)
        
        return status


# 全局数据库管理器实例
db = DatabaseManager()