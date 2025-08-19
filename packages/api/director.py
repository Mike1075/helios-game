#!/usr/bin/env python3
"""
Director Engine - 导演引擎
监控代理日志，检测认知失调，触发回响之室机会
"""
import os
import time
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
import requests
from datetime import datetime

# 环境变量
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://tlttpgocwitqgmukuteu.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdHRwZ29jd2l0cWdtdWt1dGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTAxNjIsImV4cCI6MjA3MTA4NjE2Mn0.tlKeYa3mBRsZdIW8qDRfUpIBKuCsr3m6GIfDyFki79g")
VERCEL_AI_GATEWAY_URL = os.environ.get("VERCEL_AI_GATEWAY_URL")
VERCEL_AI_GATEWAY_API_KEY = os.environ.get("VERCEL_AI_GATEWAY_API_KEY")

# 初始化Supabase客户端
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def call_llm(system_prompt: str, user_prompt: str, model_name: str = "deepseek-chat") -> str:
    """通过Vercel AI Gateway调用LLM"""
    if not VERCEL_AI_GATEWAY_URL or not VERCEL_AI_GATEWAY_API_KEY:
        # 本地开发fallback
        return "本地开发模式 - 无法访问AI Gateway"
    
    headers = {
        "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 1024,
        "temperature": 0.7
    }
    
    try:
        response = requests.post(f"{VERCEL_AI_GATEWAY_URL}/chat/completions", 
                               headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"LLM调用失败: {e}")
        return "AI分析暂时不可用"

def analyze_cognitive_dissonance(recent_logs: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """分析最近的交互日志，检测认知失调事件"""
    
    if len(recent_logs) < 2:
        return None
    
    # 构建分析上下文
    context_logs = []
    for log in recent_logs[-5:]:  # 分析最近5条记录
        context_logs.append({
            "timestamp": log.get("timestamp", 0),
            "player_id": log.get("player_id", ""),
            "character_id": log.get("character_id", ""),
            "action_type": log.get("action_type", ""),
            "input": log.get("input", ""),
            "output": log.get("output", ""),
            "belief_influenced": log.get("belief_influenced", False)
        })
    
    system_prompt = """你是Helios游戏的导演引擎，专门检测玩家行为中的认知失调现象。

认知失调的表现：
1. 玩家采取积极/友善的行动，但收到负面/冷淡的反馈
2. 玩家的期望与实际结果产生明显差距
3. 不同NPC对相同行为给出矛盾的反应
4. 玩家的行为与其之前表现出的价值观不一致

请分析以下交互日志，判断是否存在认知失调。如果存在，请返回JSON格式：
{
    "has_dissonance": true,
    "dissonance_type": "类型描述",
    "trigger_reason": "触发原因",
    "intensity": 1-10,
    "recommended_echo_focus": "回响之室应该重点分析的方面"
}

如果不存在认知失调，返回：{"has_dissonance": false}"""

    user_prompt = f"交互日志分析：\n{context_logs}"
    
    try:
        analysis_result = call_llm(system_prompt, user_prompt)
        # 尝试解析JSON响应
        import json
        if analysis_result.strip().startswith('{'):
            return json.loads(analysis_result)
        return None
    except Exception as e:
        print(f"认知失调分析失败: {e}")
        return None

def create_echo_event(player_id: str, dissonance_info: Dict[str, Any]) -> bool:
    """创建回响之室触发事件"""
    try:
        event_data = {
            "timestamp": time.time(),
            "player_id": player_id,
            "event_type": "cognitive_dissonance",
            "trigger_reason": dissonance_info.get("trigger_reason", "认知失调检测"),
            "intensity": dissonance_info.get("intensity", 5),
            "metadata": {
                "dissonance_type": dissonance_info.get("dissonance_type", "unknown"),
                "recommended_focus": dissonance_info.get("recommended_echo_focus", ""),
                "auto_generated": True
            }
        }
        
        result = supabase.table("events").insert(event_data).execute()
        print(f"✅ 成功创建认知失调事件: {result.data[0]['id']}")
        return True
        
    except Exception as e:
        print(f"❌ 创建回响事件失败: {e}")
        return False

def monitor_agent_logs(player_id: str = None) -> None:
    """监控代理日志，检测认知失调"""
    try:
        # 获取最近的日志记录
        query = supabase.table("agent_logs").select("*")
        
        if player_id:
            query = query.eq("player_id", player_id)
        
        # 获取最近10分钟的记录
        recent_timestamp = time.time() - 600  # 10分钟前
        logs_result = query.gt("timestamp", recent_timestamp).order("timestamp", desc=False).execute()
        
        if not logs_result.data:
            print("📝 暂无新的代理日志")
            return
        
        # 按玩家分组处理
        players_logs = {}
        for log in logs_result.data:
            pid = log["player_id"]
            if pid not in players_logs:
                players_logs[pid] = []
            players_logs[pid].append(log)
        
        # 分析每个玩家的日志
        for pid, logs in players_logs.items():
            print(f"🔍 分析玩家 {pid} 的 {len(logs)} 条日志...")
            
            dissonance_info = analyze_cognitive_dissonance(logs)
            if dissonance_info and dissonance_info.get("has_dissonance", False):
                print(f"⚡ 检测到认知失调: {dissonance_info['dissonance_type']}")
                print(f"   触发原因: {dissonance_info['trigger_reason']}")
                print(f"   强度等级: {dissonance_info['intensity']}/10")
                
                # 创建回响事件
                if create_echo_event(pid, dissonance_info):
                    print(f"🎭 已为玩家 {pid} 创建回响之室机会")
                else:
                    print(f"❌ 回响事件创建失败")
            else:
                print(f"✅ 玩家 {pid} 暂无明显认知失调")
        
    except Exception as e:
        print(f"❌ 监控日志失败: {e}")

def run_director_cycle():
    """运行一次导演引擎周期"""
    print(f"🎬 导演引擎开始工作 - {datetime.now()}")
    monitor_agent_logs()
    print("🎬 导演引擎周期完成\n")

if __name__ == "__main__":
    print("🎭 Helios 导演引擎启动中...")
    
    # 运行单次检测
    run_director_cycle()
    
    print("✅ 导演引擎任务完成")