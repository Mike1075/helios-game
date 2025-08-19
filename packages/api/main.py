from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import time
import asyncio
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
# Zep相关导入暂时注释，使用简单内存存储
# from zep_python import Memory, Message as ZepMessage, User, Session

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

# 暂时禁用Zep，使用简单的内存存储
# zep_client = None  # 稍后实现

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

# 简单的内存存储，替代Zep
conversation_store = {}

# 辅助函数
async def ensure_user_exists(user_id: str):
    """确保用户存在（简化版）"""
    # 简化实现，只是确保用户在我们的内存store中
    pass

async def get_conversation_history(session_id: str, limit: int = 10):
    """从内存获取对话历史"""
    try:
        if session_id in conversation_store:
            history = conversation_store[session_id][-limit:]
            return history
        return []
    except Exception as e:
        print(f"获取对话历史失败: {e}")
        return []

async def save_conversation_to_memory(session_id: str, user_message: str, assistant_message: str):
    """保存对话到内存"""
    try:
        if session_id not in conversation_store:
            conversation_store[session_id] = []
        
        conversation_store[session_id].extend([
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": assistant_message}
        ])
        
        # 保持最近20条记录
        if len(conversation_store[session_id]) > 20:
            conversation_store[session_id] = conversation_store[session_id][-20:]
            
    except Exception as e:
        print(f"保存对话失败: {e}")

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

async def generate_npc_dialogue(scene_id: str, player_id: Optional[str] = None):
    """生成NPC之间的自主对话"""
    try:
        # 1. 随机选择两个不同的NPC
        available_npcs = list(NPCS_CONFIG.keys())
        if len(available_npcs) < 2:
            return None
            
        import random
        speaker_id, listener_id = random.sample(available_npcs, 2)
        speaker = NPCS_CONFIG[speaker_id]
        listener = NPCS_CONFIG[listener_id]
        
        # 2. 获取最近的对话上下文（如果有player_id）
        recent_context = ""
        if player_id:
            try:
                recent_logs = supabase.table("agent_logs").select("input,output,character_id").eq("player_id", player_id).order("timestamp", desc=True).limit(5).execute()
                if recent_logs.data:
                    context_items = []
                    for log in recent_logs.data:
                        context_items.append(f"{log.get('character_id', '某人')}: {log.get('output', '')}")
                    recent_context = f"\n\n最近的酒馆话题：\n" + "\n".join(context_items[:3])
            except:
                pass
        
        # 3. 生成对话话题
        topic_prompts = [
            "谈论港口最近的变化",
            "分享各自的经历和见解", 
            "讨论酒馆里的其他客人",
            "聊聊最近听到的传闻",
            "谈论天气和港口生活",
            "讨论各自的工作和责任",
            "分享对这个世界的看法"
        ]
        
        selected_topic = random.choice(topic_prompts)
        
        # 4. 构建对话生成提示词
        dialogue_prompt = f"""
你正在港口酒馆中，需要生成两个NPC之间的自然对话。

说话者：{speaker['name']}（{speaker['role']}) - {speaker['core_motivation']}
听话者：{listener['name']}（{listener['role']}) - {listener['core_motivation']}

对话话题：{selected_topic}

{speaker['name']}的信念系统：
{speaker['belief_system']}

请生成{speaker['name']}对{listener['name']}说的一句话，要求：
1. 符合{speaker['name']}的性格和信念
2. 自然地开启{selected_topic}这个话题
3. 语言风格符合角色设定
4. 长度适中（1-2句话）
5. 可以包含动作描述（用*包围）

{recent_context}

只需要返回{speaker['name']}说的话，不要包含其他内容。
"""

        # 5. 生成第一轮对话
        speaker_message = await call_tongyi_llm(dialogue_prompt, f"请{speaker['name']}开始{selected_topic}的对话")
        
        # 6. 生成回应
        response_prompt = f"""
你是{listener['name']}（{listener['role']})，刚刚听到{speaker['name']}说："{speaker_message}"

{listener['name']}的信念系统：
{listener['belief_system']}

请作为{listener['name']}回应{speaker['name']}，要求：
1. 符合{listener['name']}的性格特点和价值观
2. 对{speaker['name']}的话题做出自然回应
3. 体现两个角色之间的关系动态
4. 长度适中（1-2句话）
5. 可以包含动作描述（用*包围）

只需要返回{listener['name']}的回应，不要包含其他内容。
"""

        listener_response = await call_tongyi_llm(response_prompt, speaker_message)
        
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
        
        # 2. 确保用户在Zep中存在
        await ensure_user_exists(request.player_id)
        
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
        dialogue_data = await generate_npc_dialogue(request.scene_id, request.player_id)
        
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