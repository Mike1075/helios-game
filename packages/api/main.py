from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from typing import Optional

app = FastAPI(title="Helios Agent Core", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class ChatRequest(BaseModel):
    player_id: str
    npc_id: str
    message: str

class ChatResponse(BaseModel):
    npc_id: str
    npc_name: str
    message: str
    timestamp: str

# 临时NPC数据（后续将移到数据库）
NPCS = {
    "aix": {
        "id": "aix",
        "name": "艾克斯",
        "role": "数据分析师",
        "core_motivation": "通过数据发现真相",
        "personality": "理性、直接、略显冷淡但内心关怀他人",
        "catchphrase": "数据不会说谎，但人会。"
    },
    "lia": {
        "id": "lia", 
        "name": "莉亚",
        "role": "酒馆老板娘",
        "core_motivation": "维护酒馆的和谐氛围",
        "personality": "温和、善于倾听、有丰富的人生阅历",
        "catchphrase": "每个人心里都有故事。"
    },
    "karl": {
        "id": "karl",
        "name": "卡尔", 
        "role": "退役船长",
        "core_motivation": "寻找人生新的意义",
        "personality": "豪爽、经验丰富、有时固执己见",
        "catchphrase": "海上的规则和陆地不同。"
    }
}

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

@app.get("/api/npcs")
async def get_npcs():
    """获取所有NPC信息"""
    return {"npcs": list(NPCS.values())}

@app.post("/api/chat")
async def chat_with_npc(request: ChatRequest):
    """与NPC聊天的核心API"""
    
    # 检查NPC是否存在
    if request.npc_id not in NPCS:
        raise HTTPException(status_code=404, detail="NPC not found")
    
    npc = NPCS[request.npc_id]
    
    # 临时响应逻辑（后续将集成AI）
    responses = {
        "aix": [
            "有趣的观点。让我分析一下这个数据...",
            "根据我的计算，这种情况发生的概率是...",
            "数据显示，你的判断可能需要重新考虑。"
        ],
        "lia": [
            "我理解你的感受，这里很多客人都有类似的经历。",
            "要不要来杯热茶？有时候暖暖身子能让思路更清晰。",
            "每个人都在寻找属于自己的答案，不是吗？"
        ],
        "karl": [
            "年轻人，这让我想起了在海上的那些日子...",
            "经验告诉我，有时候最简单的方法就是最好的。",
            "在我看来，你需要的是行动，而不是更多的思考。"
        ]
    }
    
    # 简单的响应选择（后续将基于AI和信念系统）
    import random
    response_text = random.choice(responses[request.npc_id])
    
    # 返回响应
    from datetime import datetime
    return ChatResponse(
        npc_id=npc["id"],
        npc_name=npc["name"], 
        message=response_text,
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/echo")
async def chamber_of_echoes(player_id: str, event_description: str):
    """回响之室API - 生成主观归因"""
    # 临时实现，后续将集成AI
    return {
        "player_id": player_id,
        "reflection": "在意识的深处，你开始理解这一切的联系...",
        "insight": "也许，这正是你内心深处一直在寻找的答案。"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)