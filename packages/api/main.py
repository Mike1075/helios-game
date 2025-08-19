from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import time
from typing import Optional, Dict, Any

app = FastAPI(title="Helios Agent Core", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class ChatRequest(BaseModel):
    player_id: str
    message: str
    npc_id: Optional[str] = None
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
    memory_evidence: list
    timestamp: float

# 模拟的NPC数据（后续将从Supabase读取）
MOCK_NPCS = {
    "guard_alvin": {
        "name": "艾尔文",
        "role": "城卫兵",
        "core_motivation": "维护港口秩序，保护市民安全",
        "personality": "严谨、正直、略显刻板但内心善良"
    },
    "wanderer_karin": {
        "name": "卡琳",
        "role": "流浪者",
        "core_motivation": "在这个充满敌意的世界中生存下去",
        "personality": "警觉、机智、表面冷漠但渴望被理解"
    },
    "scholar_thane": {
        "name": "塞恩",
        "role": "学者",
        "core_motivation": "追寻古老的智慧与真理",
        "personality": "博学、好奇、有时过于沉迷于理论"
    }
}

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
        # 1. 验证NPC存在
        if request.npc_id not in MOCK_NPCS:
            # 如果没有指定NPC，选择默认的守卫
            request.npc_id = "guard_alvin"
        
        npc = MOCK_NPCS[request.npc_id]
        
        # 2. 模拟信念加载（后续从Supabase读取）
        belief_system = f"我是{npc['name']}，{npc['role']}。我的核心动机是{npc['core_motivation']}。我的性格特点：{npc['personality']}"
        
        # 3. 模拟记忆检索（后续从Zep读取）
        # 这里暂时用简单的上下文
        
        # 4. 模拟LLM调用（后续通过Vercel AI Gateway）
        # 根据NPC性格生成简单响应
        response_templates = {
            "guard_alvin": [
                f"*{npc['name']}严肃地看着你* 外乡人，在我的管辖区内要遵守规矩。你有什么事？",
                f"*{npc['name']}点了点头* 很好，这样的话我能理解。继续说吧。",
                f"*{npc['name']}皱起眉头* 这听起来不太对劲...你确定这样做是明智的吗？"
            ],
            "wanderer_karin": [
                f"*{npc['name']}警觉地看了你一眼* 又是一个想要什么的人...直说吧，别浪费时间。",
                f"*{npc['name']}冷笑一声* 有趣...不过我为什么要相信你？",
                f"*{npc['name']}稍微放松了警惕* 也许你和其他人不太一样..."
            ],
            "scholar_thane": [
                f"*{npc['name']}抬起头看向你* 啊，有人对知识感兴趣吗？请坐，我们可以谈谈。",
                f"*{npc['name']}若有所思* 这个问题很有深度...让我想想古籍中的记载...",
                f"*{npc['name']}兴奋地翻阅书籍* 你说得对！这正证实了我的理论！"
            ]
        }
        
        import random
        response_text = random.choice(response_templates.get(request.npc_id, ["*NPC看着你，等待回应*"]))
        
        # 5. 模拟日志记录（后续写入agent_logs表）
        log_entry = {
            "timestamp": time.time(),
            "character_id": request.npc_id,
            "scene_id": request.scene_id,
            "action_type": "dialogue",
            "input": request.message,
            "output": response_text,
            "player_id": request.player_id
        }
        
        # 这里可以添加到内存中的日志数组，后续存储到数据库
        print(f"[LOG] {json.dumps(log_entry, ensure_ascii=False)}")
        
        return ChatResponse(
            npc_id=request.npc_id,
            response=response_text,
            timestamp=time.time(),
            belief_influenced=False
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/api/echo", response_model=EchoResponse)
async def chamber_of_echoes(request: EchoRequest):
    """回响之室 - 生成主观因果解释"""
    try:
        # 模拟从数据库读取玩家信念系统和相关事件
        # 这里使用模拟数据
        
        mock_attributions = [
            "也许是因为我太过急躁了...总是想要快速得到结果，反而让对方感到了压迫感。",
            "我发现自己习惯性地不信任他人的动机，这种防御心态可能让我错过了真正的善意。",
            "回想起来，我似乎总是在证明自己是对的，而不是去理解别人的观点。",
            "我的内心深处可能害怕被拒绝，所以选择了先疏远别人...这样就不会受伤了。"
        ]
        
        mock_memories = [
            "记得小时候，我也曾经因为类似的行为被大人批评过...",
            "昨天在市场上，我用同样的方式对待商贩，结果也不太愉快。",
            "我想起了母亲常说的话：'急于求成往往适得其反'。"
        ]
        
        import random
        attribution = random.choice(mock_attributions)
        evidence = random.sample(mock_memories, min(2, len(mock_memories)))
        
        return EchoResponse(
            attribution=attribution,
            memory_evidence=evidence,
            timestamp=time.time()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Echo processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)