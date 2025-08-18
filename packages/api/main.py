# packages/api/main.py (AI Gateway 版)
import os
import yaml
import requests
import json
import random
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# --- 初始化 FastAPI 应用 ---
app = FastAPI()

# --- 允许前端在本地开发时能访问后端 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # 允许来自前端的请求
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 从环境变量中读取 AI Gateway 的机密信息 ---
# 在本地开发时，这些值会是空的 (None)，这是正常的
AI_GATEWAY_URL = os.environ.get("AI_GATEWAY_URL") or os.environ.get("VERCEL_AI_GATEWAY_URL")
AI_GATEWAY_API_KEY = os.environ.get("AI_GATEWAY_API_KEY") or os.environ.get("VERCEL_AI_GATEWAY_API_KEY")

# --- 定义前端传来的数据结构 ---
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    character_id: str

class NPCDialogueRequest(BaseModel):
    speaker_id: str
    target_id: str
    message: str

class DissonanceCheckRequest(BaseModel):
    player_id: str
    conversation_history: List[Message]

class EchoRoomRequest(BaseModel):
    player_id: str
    event_id: str

# --- 辅助函数：用来读取 YAML 文件 ---
def load_yaml(file_path: str) -> Dict[str, Any]:
    full_path = os.path.join(os.path.dirname(__file__), file_path)
    with open(full_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

# --- 辅助函数：调用 AI Gateway ---
def call_ai_gateway(system_prompt: str, user_message: str, model: str = "openai/gpt-4o") -> str:
    if not AI_GATEWAY_API_KEY:
        return f"本地测试模式：AI回复模拟 - {user_message[:50]}..."
    
    try:
        gateway_payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        }
        
        gateway_headers = {
            "Authorization": f"Bearer {AI_GATEWAY_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            f"{AI_GATEWAY_URL}/chat/completions",
            headers=gateway_headers,
            json=gateway_payload
        )
        
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    
    except Exception as e:
        return f"AI调用错误：{e}"

# --- 根路由 ---
@app.get("/")
def read_root():
    return {"message": "Helios Game API", "status": "running"}

# --- 创建 API 的入口：/api/chat ---
@app.post("/api/chat")
async def chat(request: ChatRequest):
    # 如果在本地开发，由于没有 API 金钥，我们直接回传一个测试消息
    if not AI_GATEWAY_API_KEY:
        print("警告：未找到 VERCEL_AI_GATEWAY_API_KEY。返回本地测试消息。")
        return {"reply": f"本地测试模式：已收到您对 {request.character_id} 的消息。"}

    # --- 以下是在 Vercel 云端环境中运行的正式逻辑 ---
    try:
        npc_beliefs = load_yaml(f"beliefs/{request.character_id}.yaml")

        system_prompt = f"""你正在扮演游戏角色 {npc_beliefs['name']}。
        你的个人信念系统如下，请完全基于此来思考和回应。
        --- 信念系统开始 ---
        {yaml.dump(npc_beliefs, allow_unicode=True)}
        --- 信念系统结束 ---
        你的回应必须是一个单纯的字符串，不要包含任何 JSON 格式。
        """
        
        # 准备发送到 AI Gateway 的请求 body
        gateway_payload = {
            "model": "openai/gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                *[msg.dict() for msg in request.messages]
            ]
        }
        
        # 准备请求 headers
        gateway_headers = {
            "Authorization": f"Bearer {AI_GATEWAY_API_KEY}",
            "Content-Type": "application/json"
        }

        # 透过 HTTP POST 请求呼叫 AI Gateway
        response = requests.post(
            f"{AI_GATEWAY_URL}/chat/completions",
            headers=gateway_headers,
            json=gateway_payload
        )
        
        response.raise_for_status() # 如果请求失败 (例如 4xx 或 5xx 错误)，会在这里抛出异常
        
        ai_reply = response.json()['choices'][0]['message']['content']
        
        return {"reply": ai_reply}

    except Exception as e:
        print(f"错误：呼叫 AI Gateway 时发生问题 - {e}")
        # 在云端出错时，也回传一个明确的错误消息
        return {"reply": f"抱歉，我的大脑在连接 AI Gateway 时出现了问题：{e}"}

# --- NPC间对话API ---
@app.post("/api/npc-dialogue")
async def npc_dialogue(request: NPCDialogueRequest):
    try:
        # 加载说话者和目标NPC的信念系统
        speaker_beliefs = load_yaml(f"beliefs/{request.speaker_id}.yaml")
        target_beliefs = load_yaml(f"beliefs/{request.target_id}.yaml")
        
        # 构建系统提示
        system_prompt = f"""你正在扮演 {speaker_beliefs['name']}，现在要与 {target_beliefs['name']} 对话。
        
        你的信念系统：
        {yaml.dump(speaker_beliefs, allow_unicode=True)}
        
        对方 {target_beliefs['name']} 的已知特征：
        - 职业：{target_beliefs.get('profession', '未知')}
        - 核心驱动：{target_beliefs.get('core_drive', '未知')}
        
        请基于你的信念系统来回应这条消息。考虑对方的背景，但始终保持你自己的观点和语言风格。
        """
        
        ai_reply = call_ai_gateway(system_prompt, request.message)
        
        # 记录对话日志 (简化版本)
        dialogue_log = {
            "timestamp": datetime.now().isoformat(),
            "speaker": request.speaker_id,
            "target": request.target_id,
            "message": request.message,
            "response": ai_reply
        }
        
        return {"reply": ai_reply, "dialogue_logged": True}
        
    except Exception as e:
        return {"reply": f"NPC对话系统错误：{e}"}

# --- 认知失调检测API ---
@app.post("/api/check-dissonance")
async def check_cognitive_dissonance(request: DissonanceCheckRequest):
    try:
        # 分析对话历史寻找认知失调模式
        conversation_text = "\n".join([f"{msg.role}: {msg.content}" for msg in request.conversation_history])
        
        analysis_prompt = """作为认知心理学家，分析以下对话，寻找认知失调的迹象：

认知失调的标志包括：
1. 矛盾的陈述或行为
2. 价值观与行动不一致
3. 新信息与既有信念冲突
4. 情绪反应与逻辑推理不符

请分析对话并回答：是否检测到认知失调？(是/否)
如果是，请简要说明原因。

对话内容：
{conversation_text}

回复格式：
检测结果：是/否
原因：[如果检测到，说明具体原因]
"""
        
        analysis_result = call_ai_gateway(analysis_prompt, conversation_text)
        
        # 简化的检测逻辑
        dissonance_detected = "是" in analysis_result or "检测到" in analysis_result
        
        if dissonance_detected:
            # 触发回响之室事件
            event_id = f"dissonance_{request.player_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            return {
                "dissonance_detected": True,
                "analysis": analysis_result,
                "event_id": event_id,
                "echo_room_triggered": True
            }
        else:
            return {
                "dissonance_detected": False,
                "analysis": analysis_result
            }
            
    except Exception as e:
        return {"error": f"认知失调检测错误：{e}"}

# --- 回响之室API ---
@app.post("/api/echo")
async def echo_room(request: EchoRoomRequest):
    try:
        # 构建回响之室的提示
        echo_prompt = f"""你是回响之室的声音，一个能够解读玩家内心认知失调的神秘存在。

玩家ID：{request.player_id}
事件ID：{request.event_id}

请基于玩家最近的经历，生成一个深刻的、第一人称的内心独白，帮助玩家理解他们的认知失调。

回响之室的特点：
- 使用诗意的、哲学性的语言
- 提供主观的因果解释
- 包含1-2个"记忆证据"事件
- 帮助玩家理解其信念系统的矛盾

请生成一个深入人心的回响之室体验。
"""
        
        echo_response = call_ai_gateway(echo_prompt, f"为玩家 {request.player_id} 创建回响之室体验")
        
        return {
            "echo": echo_response,
            "timestamp": datetime.now().isoformat(),
            "player_id": request.player_id,
            "event_id": request.event_id
        }
        
    except Exception as e:
        return {"error": f"回响之室错误：{e}"}

# --- 获取所有可用NPC ---
@app.get("/api/npcs")
async def get_npcs():
    try:
        npcs = []
        beliefs_dir = os.path.join(os.path.dirname(__file__), "beliefs")
        
        for filename in os.listdir(beliefs_dir):
            if filename.endswith('.yaml'):
                npc_data = load_yaml(f"beliefs/{filename}")
                npcs.append({
                    "id": npc_data.get('character_id', filename.replace('.yaml', '')),
                    "name": npc_data.get('name', 'Unknown'),
                    "profession": npc_data.get('profession', 'Unknown'),
                    "description": npc_data.get('description', 'No description available')
                })
        
        return {"npcs": npcs}
        
    except Exception as e:
        return {"error": f"获取NPC列表错误：{e}"}

# --- 健康检查API ---
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "helios-game-api",
        "features": ["chat", "npc-dialogue", "cognitive-dissonance", "echo-room"],
        "timestamp": datetime.now().isoformat()
    }