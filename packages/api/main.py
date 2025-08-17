from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from typing import Optional
from vercel_ai.fireworks import Fireworks

# 使用 Vercel AI SDK (Fireworks provider, 兼容 OpenAI)
# 注意: 确保已经在 Vercel 项目中设置了 FIREWORKS_API_KEY 环境变量
fireworks_client = Fireworks()

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

@app.post("/api/chat")
async def chat_with_npc(request: ChatRequest):
    """与NPC聊天的核心API - 由真实AI驱动"""
    
    # 1. 检查NPC是否存在
    if request.npc_id not in NPCS:
        raise HTTPException(status_code=404, detail="NPC not found")
    
    npc = NPCS[request.npc_id]
    
    # 2. 构建符合角色人设的 System Prompt
    system_prompt = f"""
你是一个角色扮演AI。
你的名字是 {npc['name']}, 你是一个 {npc['role']}。
你的核心动机是：{npc['core_motivation']}。
你的性格是：{npc['personality']}。
你说过这样一句话："{npc['catchphrase']}"。

现在，一个玩家正在和你对话。请你严格以 {npc['name']} 的身份和口吻进行回应。
你的回答应该简短、自然，符合你的角色设定。不要暴露你是AI。
"""

    # 3. 调用 Vercel AI SDK (使用 gpt-4o 模型)
    try:
        chat_completion = fireworks_client.chat.completions.create(
            model="openai/gpt-4o", # 指定使用 GPT-4o 模型
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            max_tokens=100, # 限制回复长度
            temperature=0.7, # 增加一点创造性
        )
        ai_response_text = chat_completion.choices[0].message.content

    except Exception as e:
        print(f"AI 调用失败: {e}")
        raise HTTPException(status_code=500, detail="AI consciousness is currently unstable.")

    # 4. 返回AI生成的响应
    from datetime import datetime
    return {
        "npc_id": npc["id"],
        "npc_name": npc["name"],
        "message": ai_response_text,
        "timestamp": datetime.now().isoformat()
    }

# 移除不再需要的 /api/echo 和 /api/npcs 临时实现

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)