# Vercel Serverless Function for Helios Game API
import os
import yaml
import requests
import json
from datetime import datetime

# --- 从环境变量中读取 AI Gateway 的机密信息 ---
AI_GATEWAY_URL = os.environ.get("AI_GATEWAY_URL") or os.environ.get("VERCEL_AI_GATEWAY_URL")
AI_GATEWAY_API_KEY = os.environ.get("AI_GATEWAY_API_KEY") or os.environ.get("VERCEL_AI_GATEWAY_API_KEY")

# --- 辅助函数：用来读取 YAML 文件 ---
def load_yaml(file_path: str):
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

# --- 业务逻辑函数 ---
def handle_chat(data):
    try:
        character_id = data.get('character_id', 'bartender')
        messages = data.get('messages', [])
        
        if not AI_GATEWAY_API_KEY:
            return {"reply": f"本地测试模式：已收到您对 {character_id} 的消息。"}
        
        # 加载NPC信念系统
        npc_beliefs = load_yaml(f"beliefs/{character_id}.yaml")
        
        system_prompt = f"""你正在扮演游戏角色 {npc_beliefs['name']}。
你的个人信念系统如下，请完全基于此来思考和回应。
--- 信念系统开始 ---
{yaml.dump(npc_beliefs, allow_unicode=True)}
--- 信念系统结束 ---
你的回应必须是一个单纯的字符串，不要包含任何 JSON 格式。
"""
        
        # 获取最后一条用户消息
        last_message = messages[-1]['content'] if messages else "你好"
        ai_reply = call_ai_gateway(system_prompt, last_message)
        
        return {"reply": ai_reply}
        
    except Exception as e:
        return {"reply": f"抱歉，我的大脑在连接时出现了问题：{e}"}

def handle_npc_dialogue(data):
    try:
        speaker_id = data.get('speaker_id')
        target_id = data.get('target_id')
        message = data.get('message')
        
        speaker_beliefs = load_yaml(f"beliefs/{speaker_id}.yaml")
        target_beliefs = load_yaml(f"beliefs/{target_id}.yaml")
        
        system_prompt = f"""你正在扮演 {speaker_beliefs['name']}，现在要与 {target_beliefs['name']} 对话。
        
你的信念系统：
{yaml.dump(speaker_beliefs, allow_unicode=True)}

对方 {target_beliefs['name']} 的已知特征：
- 职业：{target_beliefs.get('profession', '未知')}
- 核心驱动：{target_beliefs.get('core_drive', '未知')}

请基于你的信念系统来回应这条消息。考虑对方的背景，但始终保持你自己的观点和语言风格。
"""
        
        ai_reply = call_ai_gateway(system_prompt, message)
        return {"reply": ai_reply, "dialogue_logged": True}
        
    except Exception as e:
        return {"reply": f"NPC对话系统错误：{e}"}

def handle_dissonance_check(data):
    try:
        player_id = data.get('player_id', 'player_001')
        conversation_history = data.get('conversation_history', [])
        
        conversation_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history])
        
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
        dissonance_detected = "是" in analysis_result or "检测到" in analysis_result
        
        if dissonance_detected:
            event_id = f"dissonance_{player_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
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

def handle_echo_room(data):
    try:
        player_id = data.get('player_id', 'player_001')
        event_id = data.get('event_id', 'sample_event')
        
        echo_prompt = f"""你是回响之室的声音，一个能够解读玩家内心认知失调的神秘存在。

玩家ID：{player_id}
事件ID：{event_id}

请基于玩家最近的经历，生成一个深刻的、第一人称的内心独白，帮助玩家理解他们的认知失调。

回响之室的特点：
- 使用诗意的、哲学性的语言
- 提供主观的因果解释
- 包含1-2个"记忆证据"事件
- 帮助玩家理解其信念系统的矛盾

请生成一个深入人心的回响之室体验。
"""
        
        echo_response = call_ai_gateway(echo_prompt, f"为玩家 {player_id} 创建回响之室体验")
        
        return {
            "echo": echo_response,
            "timestamp": datetime.now().isoformat(),
            "player_id": player_id,
            "event_id": event_id
        }
        
    except Exception as e:
        return {"error": f"回响之室错误：{e}"}

# --- Vercel Serverless Function Entry Point ---
def handler(request):
    # 设置 CORS 头
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # 处理 OPTIONS 预检请求
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # 处理 GET 请求
    if request.method == 'GET':
        response = {
            "message": "Helios Game API",
            "status": "running",
            "endpoints": ["/api/chat", "/api/npc-dialogue", "/api/check-dissonance", "/api/echo"]
        }
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response)
        }
    
    # 处理 POST 请求
    if request.method == 'POST':
        try:
            # 解析请求体
            if hasattr(request, 'json') and request.json:
                data = request.json
            else:
                data = json.loads(request.body or '{}')
            
            # 从 URL 路径确定端点
            path = getattr(request, 'path', '') or getattr(request, 'url', '')
            
            # 路由到不同的处理函数
            if '/chat' in path or path == '/':
                response = handle_chat(data)
            elif '/npc-dialogue' in path:
                response = handle_npc_dialogue(data)
            elif '/check-dissonance' in path:
                response = handle_dissonance_check(data)
            elif '/echo' in path:
                response = handle_echo_room(data)
            else:
                response = {"error": "Endpoint not found"}
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response)
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({"error": str(e)})
            }
    
    # 不支持的方法
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({"error": "Method not allowed"})
    }