from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import time
import random
from typing import Dict, List, Optional

app = FastAPI(title="Helios Agent Core", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该更具体
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    player_id: str
    message: str
    target_npc: Optional[str] = None

class ChatResponse(BaseModel):
    npc_id: str
    npc_name: str
    response: str
    timestamp: float
    belief_triggered: Optional[str] = None

# NPC信念系统数据（后续将移至Supabase）
NPC_BELIEFS = {
    "elara": {
        "name": "埃拉拉",
        "role": "酒馆老板娘",
        "core_motivation": "帮助他人找到内心的光明",
        "worldview": [
            "每个人都有内在的光芒，只是有时被遮蔽",
            "困难是成长的机会，而非惩罚",
            "同理心是连接灵魂的桥梁"
        ],
        "selfview": [
            "我是一个引导者，帮助迷失的灵魂",
            "我的智慧来自倾听他人的故事",
            "我有责任创造安全的表达空间"
        ],
        "values": [
            "温暖胜过冷漠",
            "理解比批判更重要",
            "每个故事都值得被听见"
        ],
        "response_patterns": [
            "你的话让我想起了{感受}...",
            "每个人都有自己的{品质}，有时只是需要时间去发现。",
            "这个世界比我们看到的要{复杂性}，不是吗？",
            "在我看来，你正在经历一个{成长阶段}的过程。"
        ]
    },
    "marcus": {
        "name": "马库斯", 
        "role": "哲学家诗人",
        "core_motivation": "质疑现实的本质",
        "worldview": [
            "现实可能只是我们信念的投射",
            "每个选择都揭示了内心的真相",
            "质疑是通往智慧的唯一道路"
        ],
        "selfview": [
            "我是思想的探索者，不满足于表面",
            "我的使命是激发他人的深度思考",
            "我通过挑战来表达关爱"
        ],
        "values": [
            "真理高于舒适",
            "深度思考胜过浅层接受",
            "勇气是面对内心阴影的钥匙"
        ],
        "response_patterns": [
            "有趣的观点。但你有没有想过，{反思点}？",
            "我们看到的{现象}，究竟是客观存在，还是我们内心的镜像？",
            "你的{行为}揭示了你内心真正相信的东西。",
            "这让我思考，{哲学问题}..."
        ]
    }
}

def call_llm_mock(system_prompt: str, user_prompt: str) -> str:
    """
    模拟LLM调用 - 在本地开发时使用
    在生产环境中，这将调用Vercel AI Gateway
    """
    # 在真实环境中，这里会调用实际的AI服务
    # 现在使用基于信念系统的智能模拟响应
    
    # 简单的模拟逻辑，基于关键词和信念系统
    user_lower = user_prompt.lower()
    
    if "elara" in system_prompt.lower():
        responses = [
            "你的话触动了我内心深处的共鸣。每个人都在寻找属于自己的光芒。",
            "我在你的眼中看到了故事，那些未曾说出的经历塑造了今天的你。",
            "这个世界有时会让人感到迷茫，但请记住，黑暗只是为了让光更加珍贵。",
            "你的话语让我想起了很多年前的自己，那时我也在寻找人生的意义。"
        ]
    else:  # marcus
        responses = [
            "你说的话让我思考一个问题：我们是在选择现实，还是现实在选择我们？",
            "有趣。你是否意识到，你刚才的表达反映了你对世界本质的某种假设？",
            "我听到了你的话，但更重要的是，你听到了自己内心的声音吗？",
            "这引发了一个哲学命题：我们的感知是现实的镜子，还是现实是感知的产物？"
        ]
    
    return random.choice(responses)

def compile_belief_to_prompt(npc_id: str) -> str:
    """将NPC信念系统编译为LLM系统提示词"""
    beliefs = NPC_BELIEFS.get(npc_id)
    if not beliefs:
        return "你是一个友善的NPC"
    
    prompt = f"""你是{beliefs['name']}，{beliefs['role']}。

## 核心动机
{beliefs['core_motivation']}

## 世界观信念
{chr(10).join(f"- {belief}" for belief in beliefs['worldview'])}

## 自我认知
{chr(10).join(f"- {belief}" for belief in beliefs['selfview'])}

## 价值观
{chr(10).join(f"- {belief}" for belief in beliefs['values'])}

请以符合这个信念系统的方式回应玩家。你的回应应该：
1. 体现你的核心动机和价值观
2. 反映你对世界的理解
3. 保持角色的一致性
4. 用中文回应，语言风格符合角色设定

回应时要自然、有深度，避免机械化的表达。"""

    return prompt

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_npc(request: ChatRequest):
    """
    核心聊天API - 玩家与NPC对话
    """
    try:
        # 1. 确定响应的NPC（如果没有指定，随机选择）
        if request.target_npc and request.target_npc in NPC_BELIEFS:
            responding_npc = request.target_npc
        else:
            responding_npc = random.choice(list(NPC_BELIEFS.keys()))
        
        # 2. 加载NPC信念系统
        npc_beliefs = NPC_BELIEFS[responding_npc]
        
        # 3. 编译信念为系统提示词
        system_prompt = compile_belief_to_prompt(responding_npc)
        
        # 4. 调用LLM（在本地开发时使用模拟）
        try:
            # 在生产环境中，这里会调用Vercel AI Gateway
            VERCEL_AI_GATEWAY_URL = os.environ.get("VERCEL_AI_GATEWAY_URL")
            VERCEL_AI_GATEWAY_API_KEY = os.environ.get("VERCEL_AI_GATEWAY_API_KEY")
            
            if VERCEL_AI_GATEWAY_URL and VERCEL_AI_GATEWAY_API_KEY:
                # 真实的AI调用（生产环境）
                import requests
                
                headers = {
                    "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": "gpt-4",  # 或其他指定模型
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": request.message}
                    ],
                    "max_tokens": 2048,
                    "temperature": 0.8
                }
                
                response = requests.post(
                    f"{VERCEL_AI_GATEWAY_URL}/chat/completions", 
                    headers=headers, 
                    json=payload,
                    timeout=30
                )
                response.raise_for_status()
                
                ai_response = response.json()["choices"][0]["message"]["content"]
            else:
                # 本地开发模拟
                ai_response = call_llm_mock(system_prompt, request.message)
            
        except Exception as e:
            # 如果AI调用失败，使用智能fallback
            print(f"AI调用失败，使用fallback: {e}")
            ai_response = call_llm_mock(system_prompt, request.message)
        
        # 5. 记录交互日志（后续将写入Supabase agent_logs表）
        log_entry = {
            "timestamp": time.time(),
            "player_id": request.player_id,
            "npc_id": responding_npc,
            "player_message": request.message,
            "npc_response": ai_response,
            "belief_system_used": responding_npc
        }
        
        # TODO: 写入Supabase agent_logs表
        print(f"[LOG] {json.dumps(log_entry, ensure_ascii=False)}")
        
        # 6. 返回响应
        return ChatResponse(
            npc_id=responding_npc,
            npc_name=npc_beliefs["name"],
            response=ai_response,
            timestamp=time.time(),
            belief_triggered=npc_beliefs["core_motivation"]
        )
        
    except Exception as e:
        print(f"聊天API错误: {e}")
        raise HTTPException(status_code=500, detail=f"聊天处理失败: {str(e)}")

@app.post("/api/echo")
async def chamber_of_echoes(player_id: str, event_description: str):
    """
    回响之室API - 生成主观的因果归因
    """
    # TODO: 实现回响之室逻辑
    return {
        "message": "回响之室功能正在开发中...",
        "player_id": player_id,
        "event": event_description
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)