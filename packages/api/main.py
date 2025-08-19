from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import time
import asyncio
import requests
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
# Zep记忆引擎 - 使用HTTP API

# 加载环境变量
load_dotenv()

app = FastAPI(title="Helios Agent Core", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务客户端
tongyi_client = OpenAI(
    api_key=os.getenv("TONGYI_API_KEY"),
    base_url=os.getenv("TONGYI_URL")
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Zep API 配置
ZEP_API_KEY = os.getenv("ZEP_API_KEY")
ZEP_API_URL = os.getenv("ZEP_API_URL")

# 数据模型
class ChatRequest(BaseModel):
    player_id: str
    message: str
    npc_id: Optional[str] = "auto"  # 默认为auto，自动选择NPC
    scene_id: str = "tavern"

class EchoRequest(BaseModel):
    player_id: str
    event_id: str

class ChatResponse(BaseModel):
    npc_id: str
    response: str
    timestamp: float
    belief_influenced: bool = False

class EchoResponse(BaseModel):
    attribution: str
    memory_evidence: List[str]
    timestamp: float

class NPCDialogueRequest(BaseModel):
    scene_id: str = "tavern"
    player_id: Optional[str] = None  # 用于获取上下文

class NPCDialogueResponse(BaseModel):
    npc_speaker: str
    npc_listener: str
    message: str
    response: str
    timestamp: float

# NPC配置数据
NPCS_CONFIG = {
    "guard_alvin": {
        "name": "艾尔文",
        "role": "城卫兵", 
        "core_motivation": "维护港口秩序，保护市民安全",
        "personality": "严谨、正直、略显刻板但内心善良",
        "belief_system": """
        worldview:
          - 秩序是社会安定的基础
          - 法律面前人人平等
          - 外来者需要格外关注
        selfview:
          - 我有责任保护这里的民众
          - 我的职责就是我的荣誉
          - 我必须公正执法
        values:
          - 正义高于个人感情
          - 职责比生命更重要
          - 秩序胜过混乱
        """
    },
    "wanderer_karin": {
        "name": "卡琳",
        "role": "流浪者",
        "core_motivation": "在这个充满敌意的世界中生存下去",
        "personality": "警觉、机智、表面冷漠但渴望被理解",
        "belief_system": """
        worldview:
          - 世界对弱者充满恶意
          - 只能依靠自己才能生存
          - 信任别人就是自寻死路
        selfview:
          - 我必须时刻保持警惕
          - 我没有朋友，只有利益
          - 我是个无家可归的流浪者
        values:
          - 生存高于一切
          - 自由胜过安全
          - 独立比依赖更可靠
        """
    },
    "scholar_thane": {
        "name": "塞恩", 
        "role": "学者",
        "core_motivation": "追寻古老的智慧与真理",
        "personality": "博学、好奇、有时过于沉迷于理论",
        "belief_system": """
        worldview:
          - 知识是世界上最宝贵的财富
          - 真理往往隐藏在古老的文献中
          - 理解过去能预测未来
        selfview:
          - 我是智慧的追求者
          - 我有义务传播知识
          - 我常常沉浸在思考中
        values:
          - 智慧比财富更重要
          - 真理胜过方便的谎言
          - 学习是终生的使命
        """
    }
}

# Zep API 辅助函数
async def ensure_user_exists(user_id: str):
    """确保Zep中存在用户"""
    if not ZEP_API_KEY or not ZEP_API_URL:
        print("Zep API配置缺失，跳过用户创建")
        return
    
    try:
        # Zep Cloud API 使用 Api-Key 认证格式（当密钥以 z_ 开头时）
        headers = {
            "Authorization": f"Api-Key {ZEP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        user_data = {
            "user_id": user_id,
            "email": f"{user_id}@helios.game",
            "first_name": f"Player_{user_id[:8]}",
            "last_name": "Helios"
        }
        
        response = requests.post(
            f"{ZEP_API_URL}/api/v2/users",
            headers=headers,
            json=user_data,
            timeout=10
        )
        
        if response.status_code in [200, 201, 409]:  # 409表示用户已存在
            print(f"Zep用户 {user_id} 已确保存在")
        else:
            print(f"创建Zep用户失败: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"确保Zep用户存在失败: {e}")

async def get_conversation_history(session_id: str, limit: int = 10):
    """从Zep获取对话历史"""
    if not ZEP_API_KEY or not ZEP_API_URL:
        print("Zep API配置缺失，返回空历史")
        return []
        
    try:
        # Zep Cloud API 使用 Api-Key 认证格式
        headers = {
            "Authorization": f"Api-Key {ZEP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{ZEP_API_URL}/api/v2/threads/{session_id}/messages",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            messages = []
            
            # 解析Zep返回的消息格式
            if "messages" in data:
                for msg in data["messages"][-limit:]:  # 获取最近的消息
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            print(f"从Zep获取到 {len(messages)} 条历史消息")
            return messages
        else:
            print(f"获取Zep对话历史失败: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"获取Zep对话历史失败: {e}")
        return []

async def ensure_thread_exists(thread_id: str, user_id: str):
    """确保Zep中存在会话线程"""
    if not ZEP_API_KEY or not ZEP_API_URL:
        return
        
    try:
        # Zep Cloud API 使用 Api-Key 认证格式
        headers = {
            "Authorization": f"Api-Key {ZEP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        thread_data = {
            "thread_id": thread_id,
            "user_id": user_id
        }
        
        response = requests.post(
            f"{ZEP_API_URL}/api/v2/threads",
            headers=headers,
            json=thread_data,
            timeout=10
        )
        
        if response.status_code in [200, 201, 409]:
            print(f"Zep线程 {thread_id} 已确保存在")
        else:
            print(f"创建Zep线程失败: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"确保Zep线程存在失败: {e}")

async def save_conversation_to_memory(session_id: str, user_message: str, assistant_message: str):
    """保存对话到Zep"""
    if not ZEP_API_KEY or not ZEP_API_URL:
        print("Zep API配置缺失，跳过保存")
        return
        
    try:
        # Zep Cloud API 使用 Api-Key 认证格式
        headers = {
            "Authorization": f"Api-Key {ZEP_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # 构建消息数据
        messages = [
            {
                "role": "user",
                "content": user_message
            },
            {
                "role": "assistant", 
                "content": assistant_message
            }
        ]
        
        message_data = {
            "thread_id": session_id,
            "messages": messages
        }
        
        response = requests.post(
            f"{ZEP_API_URL}/api/v2/threads/{session_id}/messages",
            headers=headers,
            json=message_data,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            print(f"成功保存对话到Zep线程 {session_id}")
        else:
            print(f"保存到Zep失败: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"保存对话到Zep失败: {e}")

async def save_to_supabase(table: str, data: Dict):
    """保存数据到Supabase"""
    try:
        result = supabase.table(table).insert(data).execute()
        return result.data
    except Exception as e:
        print(f"保存到Supabase失败: {e}")
        return None

async def call_tongyi_llm(system_prompt: str, user_message: str, model: str = "qwen-plus"):
    """调用通义千问LLM"""
    try:
        response = tongyi_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=1000,
            temperature=0.8
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"调用通义千问失败: {e}")
        # 返回fallback响应
        return f"*系统繁忙，请稍后再试* (错误: {str(e)})"

async def select_responding_npc(user_message: str, available_npcs: list) -> str:
    """基于用户消息内容智能选择最合适的NPC来响应"""
    try:
        # 构建NPC选择提示词
        npc_descriptions = []
        for npc_id, npc_data in available_npcs:
            npc_descriptions.append(f"- {npc_id}: {npc_data['name']}({npc_data['role']}) - {npc_data['core_motivation']}")
        
        selection_prompt = f"""
你是一个智能对话路由器，负责分析用户消息并选择最合适的NPC来响应。

可选的NPC角色：
{chr(10).join(npc_descriptions)}

用户消息："{user_message}"

请基于以下原则选择最合适的NPC：
1. 消息内容与NPC的角色职责最相关
2. NPC的性格特点最适合回应这类话题
3. NPC的核心动机与消息主题最匹配

请只返回NPC的ID（如：guard_alvin），不要包含其他内容。
"""
        
        selected_npc = await call_tongyi_llm(selection_prompt, user_message)
        selected_npc = selected_npc.strip()
        
        # 验证选择是否有效
        valid_npc_ids = [npc_id for npc_id, _ in available_npcs]
        if selected_npc in valid_npc_ids:
            return selected_npc
        else:
            # 如果AI返回无效选择，默认选择第一个NPC
            print(f"AI选择了无效的NPC: {selected_npc}，使用默认选择")
            return valid_npc_ids[0]
            
    except Exception as e:
        print(f"NPC选择失败: {e}")
        # 出错时返回第一个可用的NPC
        return available_npcs[0][0]

async def generate_npc_dialogue(scene_id: str, player_id: Optional[str] = None, continue_conversation: bool = False):
    """生成NPC之间的自主对话"""
    try:
        # 1. 获取最近的NPC对话历史
        recent_npc_dialogue = []
        current_topic = ""
        current_speakers = None
        
        try:
            # 获取最近的NPC对话记录
            recent_logs = supabase.table("agent_logs").select("*").eq("action_type", "npc_dialogue").order("timestamp", desc=True).limit(10).execute()
            if recent_logs.data:
                recent_npc_dialogue = recent_logs.data
                
                # 如果要继续对话，使用最近的对话者
                if continue_conversation and len(recent_npc_dialogue) >= 2:
                    last_speaker = recent_npc_dialogue[0].get('character_id')
                    second_last_speaker = recent_npc_dialogue[1].get('character_id')
                    
                    if last_speaker and second_last_speaker and last_speaker != second_last_speaker:
                        # 继续使用相同的对话者，但交换角色
                        current_speakers = (second_last_speaker, last_speaker)
                        
                        # 分析最近对话的主题
                        recent_messages = [log.get('output', '') for log in recent_npc_dialogue[:3]]
                        current_topic = f"继续刚才关于：{recent_messages[0][:20]}... 的话题"
        except Exception as e:
            print(f"获取NPC对话历史失败: {e}")
        
        # 2. 选择对话者
        if not current_speakers:
            # 如果没有继续对话，随机选择两个NPC
            available_npcs = list(NPCS_CONFIG.keys())
            if len(available_npcs) < 2:
                return None
                
            import random
            speaker_id, listener_id = random.sample(available_npcs, 2)
        else:
            speaker_id, listener_id = current_speakers
            
        speaker = NPCS_CONFIG[speaker_id]
        listener = NPCS_CONFIG[listener_id]
        
        # 3. 构建对话上下文
        dialogue_context = ""
        if recent_npc_dialogue:
            recent_exchanges = []
            for log in recent_npc_dialogue[:4]:  # 获取最近4轮对话
                char_name = NPCS_CONFIG.get(log.get('character_id', ''), {}).get('name', '某人')
                recent_exchanges.append(f"{char_name}: {log.get('output', '')}")
            dialogue_context = f"\n\n最近的对话内容：\n" + "\n".join(recent_exchanges)
        
        # 4. 确定话题
        if not current_topic:
            if recent_npc_dialogue:
                # 基于最近的对话生成相关话题
                recent_content = " ".join([log.get('output', '') for log in recent_npc_dialogue[:2]])
                current_topic = "延续刚才的话题并深入讨论"
            else:
                # 新话题
                topic_prompts = [
                    "港口最近发生的奇怪事件",
                    "古老传说中的神秘力量", 
                    "这座城市隐藏的秘密",
                    "流传在酒馆中的神秘故事",
                    "外来者带来的不寻常消息",
                    "港口深处的未解之谜"
                ]
                import random
                current_topic = random.choice(topic_prompts)
        
        # 5. 生成连贯的对话
        dialogue_prompt = f"""
你需要生成港口酒馆中两个NPC的连贯对话。

角色设定：
- 说话者：{speaker['name']}（{speaker['role']}) - 性格：{speaker['personality']}
- 听话者：{listener['name']}（{listener['role']}) - 性格：{listener['personality']}

当前话题：{current_topic}

{dialogue_context}

要求：
1. 如果有对话历史，请延续之前的话题，让对话更加深入
2. {speaker['name']}应该基于之前的内容提出新的观点或问题
3. {listener['name']}需要给出有建设性的回应，推进话题发展
4. 保持角色性格一致性
5. 让对话自然深入，避免重复

请生成格式：
说话者：[{speaker['name']}的话]
听话者：[{listener['name']}的回应]
"""

        # 6. 生成对话
        full_dialogue = await call_tongyi_llm(dialogue_prompt, f"围绕{current_topic}生成深入的对话")
        
        # 7. 解析对话内容
        lines = full_dialogue.strip().split('\n')
        speaker_message = ""
        listener_response = ""
        
        for line in lines:
            if line.startswith('说话者：') or line.startswith(speaker['name']):
                speaker_message = line.split('：', 1)[1] if '：' in line else line
            elif line.startswith('听话者：') or line.startswith(listener['name']):
                listener_response = line.split('：', 1)[1] if '：' in line else line
        
        # 如果解析失败，生成基于上下文的默认消息
        if not speaker_message:
            if recent_npc_dialogue:
                speaker_message = f"*{speaker['name']}继续刚才的话题* 我还想补充一点..."
            else:
                speaker_message = f"*{speaker['name']}看向{listener['name']}* 关于{current_topic}，你怎么看？"
        if not listener_response:
            if recent_npc_dialogue:
                listener_response = f"*{listener['name']}若有所思* 确实，这让我想到..."
            else:
                listener_response = f"*{listener['name']}思考了一下* 这个话题很值得深入讨论..."
        
        return {
            "speaker_id": speaker_id,
            "listener_id": listener_id,
            "speaker_name": speaker['name'],
            "listener_name": listener['name'],
            "message": speaker_message,
            "response": listener_response,
            "timestamp": time.time()
        }
        
    except Exception as e:
        print(f"生成NPC对话失败: {e}")
        return None

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_npc(request: ChatRequest):
    """Agent Core - 处理玩家与NPC的对话"""
    try:
        # 1. 如果没有指定NPC或指定了auto，则自动选择
        if not request.npc_id or request.npc_id == "auto":
            available_npcs = [(npc_id, npc_data) for npc_id, npc_data in NPCS_CONFIG.items()]
            selected_npc_id = await select_responding_npc(request.message, available_npcs)
            request.npc_id = selected_npc_id
            print(f"🎯 AI选择了NPC: {selected_npc_id}")
        
        # 2. 验证NPC存在
        if request.npc_id not in NPCS_CONFIG:
            request.npc_id = "guard_alvin"
        
        npc = NPCS_CONFIG[request.npc_id]
        session_id = f"{request.player_id}_{request.npc_id}"
        
        # 2. 确保用户和线程在Zep中存在
        await ensure_user_exists(request.player_id)
        await ensure_thread_exists(session_id, request.player_id)
        
        # 3. 获取对话历史
        conversation_history = await get_conversation_history(session_id)
        
        # 4. 构建系统提示词
        system_prompt = f"""
你是{npc['name']}，{npc['role']}。你的核心动机是：{npc['core_motivation']}
你的性格特点：{npc['personality']}

你的信念系统：
{npc['belief_system']}

请严格按照你的信念系统和性格特点来回应。保持角色一致性，使用第一人称，并在回应中体现你的动机和价值观。

场景：港口酒馆，这里聚集着各色人物。

回应格式：直接的角色对话，可以包含动作描述（用*包围）。
"""
        
        # 5. 构建上下文消息
        context_messages = ""
        if conversation_history:
            context_messages = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history[-5:]])
            system_prompt += f"\n\n最近的对话历史：\n{context_messages}"
        
        # 6. 调用LLM生成响应
        response_text = await call_tongyi_llm(system_prompt, request.message)
        
        # 7. 保存对话到内存
        await save_conversation_to_memory(session_id, request.message, response_text)
        
        # 8. 记录到数据库
        log_entry = {
            "timestamp": time.time(),
            "player_id": request.player_id,
            "character_id": request.npc_id,
            "scene_id": request.scene_id,
            "action_type": "dialogue",
            "input": request.message,
            "output": response_text,
            "session_id": session_id,
            "belief_influenced": True
        }
        
        # 尝试保存到Supabase
        await save_to_supabase("agent_logs", log_entry)
        
        return ChatResponse(
            npc_id=request.npc_id,
            response=response_text,
            timestamp=time.time(),
            belief_influenced=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/api/echo", response_model=EchoResponse)
async def chamber_of_echoes(request: EchoRequest):
    """回响之室 - 生成主观因果解释"""
    try:
        # 1. 从数据库获取玩家的行为日志
        player_logs = supabase.table("agent_logs").select("*").eq("player_id", request.player_id).order("timestamp", desc=True).limit(10).execute()
        
        # 2. 构建用于分析的提示词
        system_prompt = """
你是一个深度心理分析师，专门帮助人们理解自己的行为模式和内在动机。

请基于用户最近的行为和对话，生成一段第一人称的、深刻的自我反思。这个反思应该：
1. 揭示用户行为背后可能的心理动机
2. 帮助用户看到自己的行为模式
3. 提供富有洞察力的因果解释
4. 语调要温和、理解性，避免批判

同时，请提供2-3个支撑这个分析的"记忆片段"或"行为证据"。

回应格式：
{
  "attribution": "第一人称的深度自我反思...",
  "evidence": ["支撑证据1", "支撑证据2", "支撑证据3"]
}
"""
        
        # 3. 准备用户数据
        if player_logs.data:
            recent_interactions = []
            for log in player_logs.data:
                recent_interactions.append(f"与{log.get('character_id', '未知角色')}的对话: {log.get('input', '')} -> {log.get('output', '')}")
            
            user_context = f"用户最近的行为记录：\n" + "\n".join(recent_interactions)
        else:
            user_context = "用户还没有足够的互动记录，请基于一般的心理模式提供深度反思。"
        
        # 4. 调用LLM生成回响之室内容
        response_text = await call_tongyi_llm(system_prompt, user_context)
        
        try:
            # 尝试解析JSON格式的响应
            import json
            parsed_response = json.loads(response_text)
            attribution = parsed_response.get("attribution", response_text)
            evidence = parsed_response.get("evidence", [])
        except:
            # 如果不是JSON格式，使用原始文本
            attribution = response_text
            evidence = [
                "你在与他人交流时表现出的某些模式...", 
                "你对不同情况的反应方式...",
                "你内心深处的某些倾向..."
            ]
        
        # 5. 记录回响之室的使用
        echo_log = {
            "timestamp": time.time(),
            "player_id": request.player_id,
            "event_type": "echo_chamber",
            "attribution": attribution,
            "evidence": evidence
        }
        
        await save_to_supabase("echo_logs", echo_log)
        
        return EchoResponse(
            attribution=attribution,
            memory_evidence=evidence,
            timestamp=time.time()
        )
        
    except Exception as e:
        # 提供fallback响应
        fallback_attribution = "在这个镜子般的时刻，我感受到了自己内心深处的某些东西...也许我需要更多的互动来真正理解自己。"
        fallback_evidence = [
            "我注意到自己在面对未知时的第一反应...",
            "我发现自己与他人互动的方式反映了某些内在的模式...",
            "我意识到自己的选择背后可能有更深层的动机..."
        ]
        
        return EchoResponse(
            attribution=fallback_attribution,
            memory_evidence=fallback_evidence,
            timestamp=time.time()
        )

@app.post("/api/npc-dialogue", response_model=NPCDialogueResponse)
async def generate_npc_to_npc_dialogue(request: NPCDialogueRequest):
    """生成NPC之间的自主对话"""
    try:
        # 检查是否有最近的NPC对话来判断是否继续对话
        recent_npc_logs = supabase.table("agent_logs").select("timestamp").eq("action_type", "npc_dialogue").order("timestamp", desc=True).limit(1).execute()
        
        continue_conversation = False
        if recent_npc_logs.data:
            # 如果最近5分钟内有NPC对话，则继续对话
            last_npc_time = recent_npc_logs.data[0]['timestamp']
            current_time = time.time()
            if current_time - last_npc_time < 300:  # 5分钟内
                continue_conversation = True
        
        dialogue_data = await generate_npc_dialogue(request.scene_id, request.player_id, continue_conversation)
        
        if not dialogue_data:
            raise HTTPException(status_code=500, detail="Failed to generate NPC dialogue")
        
        # 记录NPC对话到数据库
        npc_log_speaker = {
            "timestamp": dialogue_data["timestamp"],
            "player_id": request.player_id or "system",
            "character_id": dialogue_data["speaker_id"],
            "scene_id": request.scene_id,
            "action_type": "npc_dialogue",
            "input": f"与{dialogue_data['listener_name']}的对话",
            "output": dialogue_data["message"],
            "session_id": f"npc_{dialogue_data['speaker_id']}_{dialogue_data['listener_id']}",
            "belief_influenced": True
        }
        
        npc_log_listener = {
            "timestamp": dialogue_data["timestamp"] + 0.1,
            "player_id": request.player_id or "system", 
            "character_id": dialogue_data["listener_id"],
            "scene_id": request.scene_id,
            "action_type": "npc_dialogue",
            "input": dialogue_data["message"],
            "output": dialogue_data["response"],
            "session_id": f"npc_{dialogue_data['speaker_id']}_{dialogue_data['listener_id']}",
            "belief_influenced": True
        }
        
        # 保存双方对话记录
        await save_to_supabase("agent_logs", npc_log_speaker)
        await save_to_supabase("agent_logs", npc_log_listener)
        
        return NPCDialogueResponse(
            npc_speaker=dialogue_data["speaker_id"],
            npc_listener=dialogue_data["listener_id"],
            message=dialogue_data["message"],
            response=dialogue_data["response"],
            timestamp=dialogue_data["timestamp"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NPC dialogue generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)