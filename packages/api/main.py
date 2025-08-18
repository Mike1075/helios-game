from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# 加载环境变量 (指定完整路径)
from pathlib import Path
env_path = Path(__file__).parent.parent.parent / ".env.local"
load_dotenv(env_path)
print(f"加载环境变量文件: {env_path}")

# 导入Supabase客户端
try:
    from supabase import create_client, Client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
    print(f"Supabase配置: URL={bool(supabase_url)}, Key={bool(supabase_key)}")
except ImportError:
    supabase = None
    print("Supabase导入失败")

app = FastAPI(title="Helios Agent Core", version="0.1.0")

# 添加CORS中间件以支持前端调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    # 检查环境变量是否配置
    config_status = {
        "qwen_api": bool(os.getenv("QWEN_API_KEY")),
        "supabase": bool(os.getenv("SUPABASE_URL")),
        "zep": bool(os.getenv("ZEP_API_KEY")),
        "local_dev_mode": os.getenv("LOCAL_DEV_MODE", "true").lower() == "true"
    }
    
    return {
        "status": "healthy", 
        "service": "helios-agent-core",
        "config": config_status
    }

@app.get("/api/test-env")
async def test_environment():
    """测试环境变量和API连接"""
    results = {}
    
    # 测试Qwen API
    qwen_api_key = os.getenv("QWEN_API_KEY")
    qwen_api_url = os.getenv("QWEN_API_URL")
    if qwen_api_key and qwen_api_url:
        results["qwen_api"] = {"configured": True, "url": qwen_api_url}
    else:
        results["qwen_api"] = {"configured": False, "message": "Missing Qwen API key or URL"}
    
    # 测试Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    if supabase_url and supabase_key:
        results["supabase"] = {"configured": True, "url": supabase_url}
    else:
        results["supabase"] = {"configured": False, "message": "Missing URL or service key"}
    
    # 测试Zep
    zep_key = os.getenv("ZEP_API_KEY")
    if zep_key:
        results["zep"] = {"configured": True}
    else:
        results["zep"] = {"configured": False, "message": "Missing API key"}
    
    return results

@app.get("/api/database/health")
async def database_health():
    """数据库健康检查"""
    if not supabase:
        return {
            "connected": False,
            "message": "Supabase配置缺失",
            "character_count": 0,
            "belief_systems_count": 0,
            "recent_logs_count": 0
        }
    
    try:
        # 测试数据库连接
        result = supabase.table("characters").select("id", count="exact").limit(1).execute()
        
        # 获取统计信息
        character_count = result.count if hasattr(result, 'count') else 0
        
        return {
            "connected": True,
            "message": "数据库连接成功",
            "character_count": character_count,
            "belief_systems_count": 0,  # TODO: 实现统计
            "recent_logs_count": 0       # TODO: 实现统计
        }
    except Exception as e:
        return {
            "connected": False,
            "message": f"数据库连接失败: {str(e)}",
            "character_count": 0,
            "belief_systems_count": 0,
            "recent_logs_count": 0
        }

@app.get("/api/database/characters")
async def get_characters():
    """获取所有角色列表"""
    if not supabase:
        return {
            "characters": [],
            "count": 0,
            "message": "Supabase配置缺失"
        }
    
    try:
        result = supabase.table("characters").select("*").execute()
        return {
            "characters": result.data,
            "count": len(result.data),
            "message": "角色列表获取成功"
        }
    except Exception as e:
        return {
            "characters": [],
            "count": 0,
            "message": f"获取角色列表失败: {str(e)}"
        }

@app.get("/api/database/characters/{character_id}")
async def get_character(character_id: str):
    """获取特定角色的完整信息"""
    raise HTTPException(status_code=503, detail="数据库功能尚未启用，请先配置API密钥")

@app.get("/api/database/logs/{character_id}")
async def get_character_logs(character_id: str, limit: int = 20):
    """获取角色的交互历史"""
    return {
        "character_id": character_id,
        "logs": [],
        "count": 0,
        "message": "数据库功能尚未启用，请先配置API密钥"
    }

@app.get("/api/database/scene/{scene_id}")
async def get_scene_info(scene_id: str):
    """获取场景信息和角色"""
    return {
        "scene": None,
        "characters": [],
        "character_count": 0,
        "message": "数据库功能尚未启用，请先配置API密钥"
    }

# =============================================
# 核心游戏API端点
# =============================================

# AI服务直接集成
import uuid
import json
import requests
from typing import Dict, List, Optional, Any

class AIService:
    """AI服务管理器"""
    
    def __init__(self):
        self.qwen_api_key = os.getenv("QWEN_API_KEY")
        self.qwen_api_url = os.getenv("QWEN_API_URL")
        self.local_dev_mode = os.getenv("LOCAL_DEV_MODE", "true").lower() == "true"
    
    def is_available(self) -> bool:
        """检查AI服务是否可用"""
        if self.local_dev_mode:
            return False
        return bool(self.qwen_api_key and self.qwen_api_url)
    
    def call_llm(self, model: str, system_prompt: str, user_prompt: str, 
                 max_tokens: int = 2048, temperature: float = 0.8) -> Optional[str]:
        """调用LLM生成文本"""
        if not self.is_available():
            return None
        
        try:
            headers = {
                "Authorization": f"Bearer {self.qwen_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "qwen-plus",
                "input": {
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ]
                },
                "parameters": {
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "top_p": 0.8
                }
            }
            
            response = requests.post(
                self.qwen_api_url, 
                headers=headers, 
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            if "output" in result and "text" in result["output"]:
                return result["output"]["text"]
            else:
                print(f"API响应格式异常: {result}")
                return None
                
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return None
    
    def generate_npc_response(self, npc_beliefs: str, conversation_history: List[Dict], 
                             user_message: str, scene_context: Dict[str, Any]) -> Dict[str, Any]:
        """生成NPC响应"""
        system_prompt = f"""你是一个游戏中的NPC角色，请根据以下信念系统和上下文信息进行回复：

信念系统：
{npc_beliefs}

场景信息：
{json.dumps(scene_context, ensure_ascii=False, indent=2)}

请以第一人称回复，保持角色一致性。回复应该包含：
1. 对话内容（自然、符合角色性格）
2. 当前情绪状态
3. 可能的行动或反应

回复格式要求：返回JSON格式，包含 message, emotion, action 字段。"""

        user_prompt = f"""玩家刚才说："{user_message}"

请以角色身份回复："""

        response_text = self.call_llm(
            model="qwen-plus",
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        if not response_text:
            return {
                "message": "抱歉，我现在有些心不在焉。",
                "emotion": "困惑",
                "action": "摇摇头"
            }
        
        try:
            # 尝试解析JSON响应
            response_data = json.loads(response_text)
            return response_data
        except json.JSONDecodeError:
            # 如果不是JSON，当作纯文本消息处理
            return {
                "message": response_text.strip(),
                "emotion": "中性",
                "action": None
            }
    
    def get_conversation_memory(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """获取对话记忆（简化实现）"""
        # 这里应该连接Zep或其他记忆服务，暂时返回空列表
        return []
    
    def save_conversation_memory(self, session_id: str, user_message: str, 
                                ai_response: str, metadata: Optional[Dict] = None) -> bool:
        """保存对话记忆（简化实现）"""
        # 这里应该保存到Zep或其他记忆服务，暂时返回成功
        return True

# 创建AI服务实例
ai_service = AIService()
print(f"✅ AI服务初始化完成，可用状态: {ai_service.is_available()}")

@app.post("/api/chat")
async def chat_with_npc(request: dict):
    """
    核心对话API - 玩家与NPC交互
    
    流程：
    1. 验证玩家和场景
    2. 选择目标NPC（如果未指定）
    3. 加载NPC信念系统
    4. 获取对话历史
    5. 生成NPC响应
    6. 记录交互日志
    7. 返回响应
    """
    try:
        # 生成会话ID（如果未提供）
        session_id = request.get("session_id") or f"session_{uuid.uuid4().hex[:8]}"
        
        # 优先使用真实AI服务，失败时回退到模拟模式
        if ai_service and ai_service.is_available():
            return await _handle_chat_real_mode(request, session_id)
        else:
            return await _handle_chat_mock_mode(request, session_id)
        
    except Exception as e:
        return {
            "success": False,
            "message": f"聊天处理出错: {str(e)}",
            "session_id": request.get("session_id", "unknown")
        }

async def _handle_chat_real_mode(request: dict, session_id: str) -> dict:
    """处理真实AI模式下的聊天"""
    try:
        message = request.get("message", "")
        player_id = request.get("player_id", "unknown_player")
        scene_id = request.get("scene_id", "harbor_tavern")
        
        # 选择NPC（简化逻辑，后续可以改进）
        if supabase:
            # 从数据库获取活跃NPC
            result = supabase.table("characters").select("*").eq("is_active", True).limit(1).execute()
            if result.data:
                selected_npc = result.data[0]
                npc_id = selected_npc["id"]
                npc_name = selected_npc["name"]
                npc_role = selected_npc["role"]
                
                # 获取NPC信念系统
                belief_result = supabase.table("belief_systems").select("*").eq("character_id", npc_id).execute()
                npc_beliefs = belief_result.data[0]["belief_yaml"] if belief_result.data else ""
            else:
                # 回退到模拟数据
                return await _handle_chat_mock_mode(request, session_id)
        else:
            # 回退到模拟数据
            return await _handle_chat_mock_mode(request, session_id)
        
        # 获取对话历史
        conversation_history = ai_service.get_conversation_memory(session_id)
        
        # 场景上下文
        scene_context = {
            "scene_id": scene_id,
            "scene_name": "港口酒馆",
            "atmosphere": "热闹、嘈杂",
            "time": "傍晚"
        }
        
        # 生成NPC响应
        npc_response = ai_service.generate_npc_response(
            npc_beliefs=npc_beliefs,
            conversation_history=conversation_history,
            user_message=message,
            scene_context=scene_context
        )
        
        # 保存对话记忆
        ai_service.save_conversation_memory(
            session_id=session_id,
            user_message=message,
            ai_response=npc_response.get("message", ""),
            metadata={"npc_name": npc_name, "scene_id": scene_id}
        )
        
        # 记录到数据库
        if supabase:
            try:
                supabase.table("agent_logs").insert({
                    "character_id": npc_id,
                    "scene_id": scene_id,
                    "action_type": "chat_response",
                    "input_data": {"user_message": message},
                    "output_data": npc_response,
                    "session_id": session_id
                }).execute()
            except Exception as e:
                print(f"数据库记录失败: {e}")
        
        return {
            "success": True,
            "message": f"与{npc_name}对话成功",
            "npc_response": {
                "npc_id": npc_id,
                "npc_name": npc_name,
                "message": npc_response.get("message", "我现在有些心不在焉..."),
                "emotion": npc_response.get("emotion", "中性"),
                "action": npc_response.get("action"),
                "internal_thought": f"作为{npc_role}，我需要保持角色一致性"
            },
            "scene_update": {"activity_level": "moderate"},
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"真实AI模式处理失败: {e}")
        # 回退到模拟模式
        return await _handle_chat_mock_mode(request, session_id)

async def _handle_chat_mock_mode(request: dict, session_id: str) -> dict:
    """处理模拟模式下的聊天"""
    # 模拟NPC选择
    mock_npcs = [
        {"id": "npc_guard", "name": "艾尔文", "role": "城市卫兵"},
        {"id": "npc_thief", "name": "卡琳", "role": "流浪盗贼"},
        {"id": "npc_innkeeper", "name": "塞拉斯", "role": "酒馆老板"},
        {"id": "npc_healer", "name": "玛丽安", "role": "治疗师"}
    ]
    
    message = request.get("message", "")
    
    # 选择NPC（简单的轮询）
    npc_index = len(message) % len(mock_npcs)
    selected_npc = mock_npcs[npc_index]
    
    # 生成简单的模拟响应
    mock_responses = [
        "这里是个繁忙的港口，总有新面孔出现。你看起来像是刚到这里的旅行者？",
        "酒馆里的消息传得很快，有什么你想了解的吗？",
        "这座城市有它自己的规矩，新来的人最好小心一些。",
        "我看过很多人来来去去，每个人都有自己的故事。",
        "港口的夜晚总是充满未知，你最好找个安全的地方过夜。"
    ]
    
    response_index = len(message) % len(mock_responses)
    mock_response = mock_responses[response_index]
    
    npc_response = {
        "npc_id": selected_npc["id"],
        "npc_name": selected_npc["name"],
        "message": mock_response,
        "emotion": "友善",
        "action": "点头示意",
        "internal_thought": f"作为{selected_npc['role']}，我应该保持角色一致性"
    }
    
    return {
        "success": True,
        "message": "聊天成功（模拟模式）",
        "npc_response": npc_response,
        "scene_update": {"activity_level": "moderate"},
        "session_id": session_id
    }

@app.post("/api/echo")
async def chamber_of_echoes(request: dict):
    """
    回响之室API - 主观因果归因
    
    流程：
    1. 加载玩家信念系统
    2. 分析相关记忆
    3. 生成主观归因
    4. 返回洞察
    """
    try:
        # 优先使用真实AI服务
        if ai_service and ai_service.is_available():
            return await _handle_echo_real_mode(request)
        else:
            return await _handle_echo_mock_mode(request)
        
    except Exception as e:
        return {
            "success": False,
            "message": f"回响之室处理出错: {str(e)}"
        }

async def _handle_echo_real_mode(request: dict) -> dict:
    """处理真实AI模式下的回响之室"""
    try:
        player_id = request.get("player_id", "unknown_player")
        confusion_text = request.get("confusion_text", "")
        session_id = request.get("session_id", "")
        
        # 获取玩家信念系统（暂时使用默认）
        player_beliefs = """
worldview:
  exploration_vs_safety:
    description: "对探索未知和保持安全之间存在内在张力"
    weight: 0.8
  social_learning:
    description: "倾向于通过与他人交流来学习和理解世界"
    weight: 0.7

selfview:
  curious_newcomer:
    description: "将自己视为初来乍到但充满好奇的探索者"
    weight: 0.8
  
values:
  understanding: 0.9
  safety: 0.7
  connection: 0.6
"""
        
        # 获取相关记忆
        relevant_memories = ai_service.get_conversation_memory(session_id)
        
        # 生成主观归因
        attribution_result = ai_service.generate_subjective_attribution(
            player_beliefs=player_beliefs,
            confusion_text=confusion_text,
            relevant_memories=relevant_memories
        )
        
        return {
            "success": True,
            "message": "回响之室分析完成",
            "subjective_attribution": attribution_result.get("subjective_attribution", ""),
            "memory_evidence": attribution_result.get("memory_evidence", []),
            "belief_insight": attribution_result.get("belief_insight", "")
        }
        
    except Exception as e:
        print(f"真实AI模式回响之室处理失败: {e}")
        return await _handle_echo_mock_mode(request)

async def _handle_echo_mock_mode(request: dict) -> dict:
    """处理模拟模式下的回响之室"""
    confusion_text = request.get("confusion_text", "")
    
    mock_attribution = f"根据你的困惑：'{confusion_text}'，从你的行为模式来看，这可能是因为你内心对安全和探索之间存在矛盾。你渴望了解这个世界，但同时担心未知的风险。这种谨慎的态度源于你过往的经历。"
    
    mock_evidence = [
        "你之前在面对陌生人时总是先观察再行动",
        "你倾向于通过询问来获取信息而不是直接行动"
    ]
    
    return {
        "success": True,
        "message": "回响之室分析完成（模拟模式）",
        "subjective_attribution": mock_attribution,
        "memory_evidence": mock_evidence,
        "belief_insight": "你的谨慎态度反映了对安全的重视，这是一种明智的生存策略。"
    }

@app.get("/api/scene/{scene_id}/status")
async def get_scene_status(scene_id: str):
    """获取场景当前状态"""
    mock_scene = {
        "scene_id": scene_id,
        "name": "港口酒馆" if scene_id == "harbor_tavern" else "未知场景",
        "description": "一个充满各种旅行者和当地人的热闹酒馆",
        "active_npcs": [
            {"id": "npc_guard", "name": "艾尔文", "status": "巡逻中"},
            {"id": "npc_innkeeper", "name": "塞拉斯", "status": "忙碌中"},
            {"id": "npc_healer", "name": "玛丽安", "status": "休息中"}
        ],
        "atmosphere": {
            "crowd_level": "moderate",
            "noise_level": "high", 
            "lighting": "warm"
        },
        "available_actions": ["chat", "observe", "order_drink", "rest"]
    }
    
    return {
        "success": True,
        "scene": mock_scene,
        "message": "场景状态获取成功（模拟模式）"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)