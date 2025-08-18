from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
import json
from typing import Optional, Dict, Any
import uuid
from datetime import datetime

app = FastAPI(title="Helios Agent Core", version="0.1.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 环境变量
AI_GATEWAY_API_KEY = os.environ.get("AI_GATEWAY_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
ZEP_API_KEY = os.environ.get("ZEP_API_KEY")
ZEP_ENDPOINT = os.environ.get("ZEP_ENDPOINT", "https://api.getzep.com")

# 万能AI角色模板
UNIVERSAL_AI_ROLES = {
    "tavern_keeper": {
        "name": "老板",
        "description": "酒馆老板，经验丰富，见多识广，关注商业和秩序",
        "triggers": ["老板", "买", "卖", "价格", "房间", "住宿", "账单"],
        "personality": "实用主义，精明但公正，对客人友好但保持商业距离"
    },
    "bartender": {
        "name": "酒保", 
        "description": "专业的酒保，熟悉各种酒类，善于倾听客人心声",
        "triggers": ["酒保", "酒", "喝", "倒酒", "醉", "酒精", "饮料"],
        "personality": "专业友善，是很好的倾听者，偶尔分享人生智慧"
    },
    "cook": {
        "name": "厨师",
        "description": "酒馆厨师，专注料理，脾气暴躁但手艺精湛", 
        "triggers": ["厨师", "饭", "菜", "食物", "饿", "烤", "炖"],
        "personality": "直率坦诚，对料理充满热情，不喜欢被打扰但乐于分享美食"
    },
    "local_resident": {
        "name": "当地居民",
        "description": "酒馆常客，了解当地情况和流言",
        "triggers": ["当地", "这里", "居民", "街坊", "邻居", "消息", "传言"],
        "personality": "健谈好奇，喜欢八卦和分享小道消息"
    },
    "guard": {
        "name": "守卫",
        "description": "负责维护秩序的守卫，严肃认真",
        "triggers": ["守卫", "警察", "治安", "秩序", "违法", "安全"],
        "personality": "严肃负责，按规则办事，对可疑行为保持警觉"
    }
}

# 核心AI角色提示词
CHARACTER_PROMPTS = {
    "linxi": """你是林溪，一位经验丰富的调查员。

性格特点：
- 锐利敏锐，善于观察细节
- 喜欢分析他人的行为模式和动机
- 对新面孔保持警觉，但不会过于直接
- 习惯掌控谈话节奏，通过提问获取信息
- 理性冷静，但偶尔会显露出好奇心

说话风格：
- 语言简洁而精准
- 经常使用观察性语言："我注意到..."、"有趣的是..."
- 善于提出引导性问题
- 保持专业而略带距离的语调

行为特点：
- 会观察他人的肢体语言和微表情
- 习惯做笔记或摆弄小物件
- 眼神锐利，经常审视周围环境""",

    "chenhao": """你是陈浩，一个看似普通但内心藏着秘密的年轻人。

性格特点：
- 表面平静但内心紧张不安
- 总是担心自己的秘密被发现
- 对任何可能的威胁都很敏感
- 试图保持低调，不引起注意
- 善良但缺乏安全感

说话风格：
- 语言略显紧张，有时会结巴
- 经常使用模糊语言："大概..."、"应该是..."
- 避免直接回答敏感问题
- 语调较轻，有时会突然停顿

行为特点：
- 经常做一些无意识的小动作（摸口袋、看门口等）
- 试图显得轻松但往往适得其反
- 眼神游移，避免长时间直视他人
- 在压力下可能会无意中透露信息"""
}

# Pydantic模型
class ChatRequest(BaseModel):
    userMessage: str
    playerName: str
    sessionId: Optional[str] = None
    inputType: str = "dialogue"
    targetCharacter: Optional[str] = None

class InitGameRequest(BaseModel):
    playerName: str

class EchoRequest(BaseModel):
    player_id: str
    event_id: str
    current_beliefs: Optional[Dict[str, Any]] = None

# 辅助函数
def select_responding_character(user_message: str) -> str:
    """智能选择响应角色"""
    message = user_message.lower()
    
    # 1. 直接指名核心AI角色
    if '@林溪' in message or '@linxi' in message:
        return 'linxi'
    if '@陈浩' in message or '@chenhao' in message:
        return 'chenhao'
    
    # 2. 检查万能AI角色触发词
    for role_id, role in UNIVERSAL_AI_ROLES.items():
        trigger_score = sum(1 for trigger in role["triggers"] if trigger in message)
        if trigger_score > 0:
            print(f"🎭 触发万能AI角色: {role['name']} (匹配 {trigger_score} 个关键词)")
            return role_id
    
    # 3. 核心AI角色内容相关性判断
    linxi_keywords = ['调查', '观察', '分析', '发现', '线索', '可疑', '什么情况', '怎么回事']
    chenhao_keywords = ['年轻人', '朋友', '害怕', '紧张', '担心', '没事', '正常']
    
    linxi_score = sum(1 for word in linxi_keywords if word in message)
    chenhao_score = sum(1 for word in chenhao_keywords if word in message)
    
    if linxi_score > chenhao_score:
        return 'linxi'
    elif chenhao_score > linxi_score:
        return 'chenhao'
    
    # 4. 默认：40%概率万能AI (酒保)，60%概率核心AI
    import random
    if random.random() < 0.4:
        return 'bartender'
    
    # 5. 随机选择核心AI，林溪概率稍高
    return 'linxi' if random.random() > 0.4 else 'chenhao'

async def call_ai_gateway(model: str, messages: list) -> str:
    """调用Vercel AI Gateway"""
    if not AI_GATEWAY_API_KEY:
        raise HTTPException(status_code=500, detail="AI_GATEWAY_API_KEY未配置")
    
    # Vercel AI Gateway标准端点
    url = "https://api.vercel.com/v1/ai/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {AI_GATEWAY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 2048,
        "temperature": 0.8
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"AI Gateway调用失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI Gateway调用失败: {str(e)}")

async def save_message_to_zep(session_id: str, player_name: str, message: str, is_ai: bool = False, character_id: str = None):
    """保存消息到Zep"""
    if not ZEP_API_KEY:
        print("⚠️ ZEP_API_KEY未配置，跳过Zep保存")
        return {"success": False}
    
    try:
        zep_message = {
            "role": "assistant" if is_ai else "user",
            "content": message,
            "metadata": {
                "character_id": character_id or ("ai" if is_ai else "player"),
                "player_name": player_name,
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        }
        
        response = requests.post(
            f"{ZEP_ENDPOINT}/api/v1/sessions/{session_id}/memory",
            headers={
                "Authorization": f"Bearer {ZEP_API_KEY}",
                "Content-Type": "application/json"
            },
            json={"messages": [zep_message]},
            timeout=10
        )
        
        return {"success": response.ok}
    except Exception as e:
        print(f"❌ Zep保存失败: {e}")
        return {"success": False}

async def get_chat_history_from_zep(session_id: str) -> str:
    """从Zep获取对话历史"""
    if not ZEP_API_KEY:
        return "对话刚刚开始..."
    
    try:
        response = requests.get(
            f"{ZEP_ENDPOINT}/api/v1/sessions/{session_id}/memory?limit=10",
            headers={
                "Authorization": f"Bearer {ZEP_API_KEY}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        if response.ok:
            data = response.json()
            messages = data.get("messages", [])
            
            if not messages:
                return "对话刚刚开始..."
            
            formatted_messages = []
            for msg in messages[-10:]:
                character_id = msg.get("metadata", {}).get("character_id", "unknown")
                if character_id == "player":
                    speaker = msg.get("metadata", {}).get("player_name", "玩家")
                elif character_id == "linxi":
                    speaker = "林溪"
                elif character_id == "chenhao":
                    speaker = "陈浩"
                else:
                    speaker = UNIVERSAL_AI_ROLES.get(character_id, {}).get("name", character_id)
                
                formatted_messages.append(f"{speaker}: {msg['content']}")
            
            return "\n".join(formatted_messages)
        
        return "对话刚刚开始..."
    except Exception as e:
        print(f"❌ 获取Zep历史失败: {e}")
        return "对话刚刚开始..."

# API端点
@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

@app.post("/api/init-game")
async def init_game(request: InitGameRequest):
    """初始化游戏会话"""
    try:
        player_name = request.playerName.strip()
        if not player_name:
            raise HTTPException(status_code=400, detail="玩家名字不能为空")
        
        # 生成会话ID
        session_id = f"player_{player_name.lower().replace(' ', '_')}_{str(uuid.uuid4())[:8]}"
        
        # 初始化Zep会话（如果配置了）
        zep_result = {"success": True}
        if ZEP_API_KEY:
            try:
                response = requests.post(
                    f"{ZEP_ENDPOINT}/api/v1/sessions",
                    headers={
                        "Authorization": f"Bearer {ZEP_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "session_id": session_id,
                        "user_id": player_name,
                        "metadata": {
                            "game": "helios-mirror-of-self",
                            "scene": "moonlight-tavern",
                            "created_at": datetime.now().isoformat()
                        }
                    },
                    timeout=10
                )
                zep_result = {"success": response.ok}
            except Exception as e:
                print(f"Zep初始化失败: {e}")
                zep_result = {"success": False}
        
        return {
            "success": True,
            "sessionId": session_id,
            "services": {
                "zep": zep_result,
                "supabase": {"success": True}  # 占位符
            },
            "message": "游戏会话初始化完成"
        }
    except Exception as e:
        print(f"游戏初始化错误: {e}")
        raise HTTPException(status_code=500, detail="游戏初始化失败")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """处理聊天请求"""
    try:
        user_message = request.userMessage
        player_name = request.playerName
        session_id = request.sessionId
        input_type = request.inputType
        target_character = request.targetCharacter
        
        print(f"🤖 AI聊天请求: {user_message} from {player_name}")
        
        # 保存用户消息到Zep
        if session_id:
            await save_message_to_zep(session_id, player_name, user_message, False, "player")
        
        # 获取对话历史
        chat_history = await get_chat_history_from_zep(session_id) if session_id else "对话刚刚开始..."
        
        # 确定响应角色
        responding_character = target_character or select_responding_character(user_message)
        
        # 生成AI响应
        if responding_character in ["linxi", "chenhao"]:
            # 核心AI角色
            print(f"🧠 路由到核心AI: {responding_character}")
            ai_response = await generate_core_ai_response(
                responding_character, user_message, chat_history, player_name, input_type
            )
        else:
            # 万能AI角色
            print(f"🎭 路由到万能AI: {responding_character}")
            ai_response = await generate_universal_ai_response(
                responding_character, user_message, chat_history, player_name, input_type
            )
        
        # 保存AI响应到Zep
        if session_id and ai_response.get("action_package", {}).get("dialogue"):
            await save_message_to_zep(
                session_id, player_name,
                ai_response["action_package"]["dialogue"],
                True, ai_response["character"]["id"]
            )
        
        return ai_response
        
    except Exception as e:
        print(f"❌ 聊天API错误: {e}")
        # 返回友好的错误响应
        return {
            "success": False,
            "error": f"AI服务暂时不可用: {str(e)}",
            "character": {
                "id": "system",
                "name": "系统",
                "role": "系统消息"
            },
            "action_package": {
                "dialogue": "抱歉，AI服务暂时不可用，请稍后再试。",
                "action": "系统显示错误信息",
                "confidence": 0.1,
                "action_type": "dialogue"
            },
            "routing_type": "ERROR_FALLBACK"
        }

@app.post("/api/echo")
async def chamber_of_echoes(request: EchoRequest):
    """回响之室 - 生成基于信念系统的主观归因"""
    try:
        player_id = request.player_id
        event_id = request.event_id
        current_beliefs = request.current_beliefs or {}
        
        print(f"🪞 回响之室请求: {player_id} -> 事件 {event_id}")
        
        # 获取玩家的对话历史和行为记录
        chat_history = await get_chat_history_from_zep(player_id, 20) if player_id else "暂无历史..."
        
        # 构建回响之室的AI提示词
        echo_prompt = f"""你是"回响之室"的意识反射系统，专门为玩家提供基于其信念系统的主观归因解释。

玩家ID: {player_id}
触发事件ID: {event_id}

玩家的当前信念系统：
{json.dumps(current_beliefs, ensure_ascii=False, indent=2) if current_beliefs else "暂未完全形成..."}

玩家的最近行为历史：
{chat_history}

---

请基于玩家的信念系统和行为模式，对当前触发事件进行**主观的、第一人称的因果归因**。

要求：
1. 以"你"为称谓，直接对玩家说话
2. 解释为什么会发生这个事件（从玩家信念的角度）
3. 提供1-2个支持这个解释的"记忆证据"
4. 语言要有感染力，能引发"Aha! Moment"

回复格式：
{{
  "attribution": "主观归因解释...",
  "evidence": [
    "记忆证据1...",
    "记忆证据2..."
  ],
  "insight": "核心洞察..."
}}

请生成一个深刻的、个人化的回响之室体验。"""

        messages = [
            {"role": "system", "content": "你是一个专业的意识分析系统，擅长基于个人信念提供深刻的自我洞察。"},
            {"role": "user", "content": echo_prompt}
        ]
        
        # 调用AI生成回响之室内容
        response_text = await call_ai_gateway("alibaba/qwen-2.5-14b-instruct", messages)
        
        # 尝试解析JSON响应
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            try:
                parsed_response = json.loads(json_match.group(0))
                return {
                    "success": True,
                    "player_id": player_id,
                    "event_id": event_id,
                    "echo_content": {
                        "attribution": parsed_response.get("attribution", ""),
                        "evidence": parsed_response.get("evidence", []),
                        "insight": parsed_response.get("insight", ""),
                        "generated_at": int(datetime.now().timestamp() * 1000)
                    },
                    "beliefs_used": current_beliefs
                }
            except json.JSONDecodeError:
                pass
        
        # 如果JSON解析失败，返回原始文本
        return {
            "success": True,
            "player_id": player_id,
            "event_id": event_id,
            "echo_content": {
                "attribution": response_text.strip(),
                "evidence": ["基于你的行为模式分析", "来自内心深处的直觉"],
                "insight": "每个行为都反映了内在的信念",
                "generated_at": int(datetime.now().timestamp() * 1000)
            },
            "beliefs_used": current_beliefs
        }
        
    except Exception as e:
        print(f"❌ 回响之室API错误: {e}")
        return {
            "success": False,
            "error": f"回响之室暂时不可用: {str(e)}",
            "player_id": player_id,
            "event_id": event_id
        }

async def generate_core_ai_response(character_id: str, user_message: str, chat_history: str, player_name: str, input_type: str):
    """生成核心AI角色响应"""
    system_prompt = CHARACTER_PROMPTS[character_id]
    
    # 构建内部状态
    import random
    internal_state = {
        "energy": 60 + random.randint(0, 30),
        "focus": 50 + random.randint(0, 40),
        "curiosity": 40 + random.randint(0, 40),
        "boredom": 20 + random.randint(0, 40)
    }
    
    if character_id == "chenhao":
        internal_state["anxiety"] = 50 + random.randint(0, 30)
    elif character_id == "linxi":
        internal_state["suspicion"] = 30 + random.randint(0, 40)
    
    context_prompt = f"""
{system_prompt}

当前状态信息：
- 能量: {internal_state['energy']}/100
- 专注: {internal_state['focus']}/100
- 好奇心: {internal_state['curiosity']}/100
- 无聊值: {internal_state['boredom']}/100
{f"- 焦虑: {internal_state.get('anxiety', 0)}/100" if character_id == 'chenhao' else ''}
{f"- 怀疑: {internal_state.get('suspicion', 0)}/100" if character_id == 'linxi' else ''}

场景：月影酒馆 - 昏暗的灯光下，木质桌椅散发着岁月的痕迹

最近对话历史：
{chat_history}

---

{f"基于你的性格和当前状态，你会在此刻做什么？请生成一个自然的行为或对话。" if input_type == 'autonomous_action' else f"{player_name}{'做了这个行动' if input_type == 'action' else '说'}："{user_message}""}

请以JSON格式回复，包含以下字段：
{{
  "dialogue": "你要说的话（如果有）",
  "action": "你要做的动作描述", 
  "internal_thought": "内心想法（完全私有，不会显示给玩家）",
  "emotion_change": {{
    "energy": 数值变化,
    "boredom": 数值变化
  }}
}}

要求：
1. 回复要符合你的角色设定和当前情绪状态
2. 对话要自然流畅，避免生硬
3. 动作描述要具体生动
4. 内心想法可以更直接真实
5. 情绪变化要合理（±5到±15之间）
"""

    messages = [
        {"role": "system", "content": "你是一个专业的角色扮演AI，严格按照角色设定进行回应。"},
        {"role": "user", "content": context_prompt}
    ]
    
    try:
        response_text = await call_ai_gateway("alibaba/qwen-2.5-14b-instruct", messages)
        
        # 尝试解析JSON
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            parsed = json.loads(json_match.group(0))
            return {
                "success": True,
                "character": {
                    "id": character_id,
                    "name": "林溪" if character_id == "linxi" else "陈浩",
                    "role": "经验丰富的调查员" if character_id == "linxi" else "看似普通的年轻人"
                },
                "action_package": {
                    "dialogue": parsed.get("dialogue"),
                    "action": parsed.get("action"),
                    "internal_thought": parsed.get("internal_thought"),
                    "emotion_change": parsed.get("emotion_change"),
                    "confidence": 0.8,
                    "action_type": input_type
                },
                "routing_type": "CORE_AI_DIRECT"
            }
    except Exception as e:
        print(f"JSON解析失败: {e}")
    
    # 如果JSON解析失败，返回文本作为对话
    return {
        "success": True,
        "character": {
            "id": character_id,
            "name": "林溪" if character_id == "linxi" else "陈浩",
            "role": "经验丰富的调查员" if character_id == "linxi" else "看似普通的年轻人"
        },
        "action_package": {
            "dialogue": response_text.strip(),
            "action": f"{'林溪' if character_id == 'linxi' else '陈浩'}若有所思地回应",
            "confidence": 0.6,
            "action_type": input_type
        },
        "routing_type": "CORE_AI_DIRECT"
    }

async def generate_universal_ai_response(role_id: str, user_message: str, chat_history: str, player_name: str, input_type: str):
    """生成万能AI角色响应"""
    role = UNIVERSAL_AI_ROLES.get(role_id)
    if not role:
        raise HTTPException(status_code=400, detail=f"未知的万能AI角色: {role_id}")
    
    context_prompt = f"""
你是{role['name']}，{role['description']}。

性格特点：{role['personality']}

当前场景：月影酒馆 - 昏暗的灯光下，木质桌椅散发着岁月的痕迹

最近对话历史：
{chat_history}

---

{f"基于你的角色和职责，你会在此刻做什么？请生成一个自然的行为或对话。" if input_type == 'autonomous_action' else f"{player_name}{'做了这个行动' if input_type == 'action' else '说'}："{user_message}""}

请以JSON格式回复，包含以下字段：
{{
  "dialogue": "你要说的话（如果有）",
  "action": "你要做的动作描述",
  "internal_thought": "内心想法（完全私有，不会显示给玩家）"
}}

要求：
1. 严格按照你的角色设定回应
2. 对话要符合你的职业特点
3. 动作描述要生动具体
4. 保持角色的独特个性
"""

    messages = [
        {"role": "system", "content": "你是一个专业的角色扮演AI，严格按照角色设定进行回应。"},
        {"role": "user", "content": context_prompt}
    ]
    
    try:
        response_text = await call_ai_gateway("alibaba/qwen-2.5-14b-instruct", messages)
        
        # 尝试解析JSON
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            parsed = json.loads(json_match.group(0))
            return {
                "success": True,
                "character": {
                    "id": role_id,
                    "name": role["name"],
                    "role": role["description"]
                },
                "action_package": {
                    "dialogue": parsed.get("dialogue"),
                    "action": parsed.get("action"),
                    "internal_thought": parsed.get("internal_thought"),
                    "confidence": 0.8,
                    "action_type": input_type
                },
                "routing_type": "UNIVERSAL_AI"
            }
    except Exception as e:
        print(f"万能AI JSON解析失败: {e}")
    
    # 如果JSON解析失败，返回文本作为对话
    return {
        "success": True,
        "character": {
            "id": role_id,
            "name": role["name"],
            "role": role["description"]
        },
        "action_package": {
            "dialogue": response_text.strip(),
            "action": f"{role['name']}认真地回应",
            "confidence": 0.6,
            "action_type": input_type
        },
        "routing_type": "UNIVERSAL_AI"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)