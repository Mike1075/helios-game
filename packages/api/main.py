from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import os
import json
import random
from database import get_db
from belief_compiler import belief_compiler
from ai_service import ai_service
from image_service import image_service

app = FastAPI(title="Helios Agent Core", version="0.1.0")

class ChatRequest(BaseModel):
    session_id: str
    message: str

class LogsRequest(BaseModel):
    session_id: str

class EchoRequest(BaseModel):
    session_id: str
    message: str

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """核心对话端点 - MVP版本先实现基础功能"""
    try:
        db = get_db()
        
        # 记录用户消息
        await db.add_agent_log(
            character_id=None,  # 用户消息暂不关联角色
            session_id=request.session_id,
            speaker="user",
            text=request.message
        )
        
        # MVP v4.1阶段：从8个NPC中随机选择一个回应（本我之镜社会生态）
        npc_ids = [
            "11111111-1111-1111-1111-111111111111",  # 艾尔文 - 港口卫兵
            "22222222-2222-2222-2222-222222222222",  # 卡琳 - 流浪者
            "33333333-3333-3333-3333-333333333333",  # 瑟兰杜斯 - 学者祭司
            "44444444-4444-4444-4444-444444444444",  # 马库斯 - 酒馆老板
            "55555555-5555-5555-5555-555555555555",  # 莉莉安 - 港口商人
            "66666666-6666-6666-6666-666666666666",  # 托马斯 - 水手
            "77777777-7777-7777-7777-777777777777",  # 伊莎贝拉 - 神秘女子
            "88888888-8888-8888-8888-888888888888",  # 奥斯卡 - 港口医师
        ]
        
        chosen_npc_id = random.choice(npc_ids)
        npc_character = await db.get_character_by_id(chosen_npc_id)
        
        if not npc_character:
            raise HTTPException(status_code=500, detail="NPC data not found")
        
        # 获取会话历史以提供上下文
        conversation_history = await db.get_session_logs(request.session_id)
        
        # 使用AI服务生成回应
        ai_response = await ai_service.generate_npc_response(
            character_id=chosen_npc_id,
            user_message=request.message,
            conversation_history=conversation_history
        )
        
        # 如果AI响应为空，使用备用响应
        if not ai_response or ai_response.strip() == "":
            ai_response = f"*{npc_character['name']}若有所思地看着你*"
        
        # 记录AI回应
        await db.add_agent_log(
            character_id=chosen_npc_id,
            session_id=request.session_id,
            speaker="ai",
            text=ai_response,
            belief_snapshot=f"NPC: {npc_character['name']} ({npc_character['role']})"
        )
        
        return ai_response
        
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        return "抱歉，港口的声音太嘈杂了，我没有听清你说什么。"

@app.get("/api/logs")
async def logs_endpoint(session_id: str):
    """获取会话历史"""
    try:
        db = get_db()
        logs = await db.get_session_logs(session_id)
        return logs
    except Exception as e:
        print(f"Logs endpoint error: {e}")
        return []

@app.post("/api/echo")
async def echo_endpoint(request: EchoRequest):
    """回响之室 - 认知失调自省功能"""
    try:
        db = get_db()
        
        # 获取最近的会话记录，寻找可能的认知失调
        recent_logs = await db.get_session_logs(request.session_id)
        
        if len(recent_logs) < 2:
            return {
                "ok": False,
                "message": "需要更多对话历史才能进入回响之室"
            }
        
        # 查找最近与玩家互动的NPC
        last_ai_log = None
        for log in reversed(recent_logs):
            if log.get("speaker") == "ai" and log.get("character_id"):
                last_ai_log = log
                break
        
        if not last_ai_log:
            return {
                "ok": False,
                "message": "无法找到最近的NPC互动记录"
            }
        
        character_id = last_ai_log["character_id"]
        character = await db.get_character_by_id(character_id)
        belief_summary = belief_compiler.get_belief_summary(character_id)
        
        # 为对话历史添加角色名信息
        enriched_history = []
        for log in recent_logs:
            enriched_log = log.copy()
            if log.get("character_id") == character_id:
                enriched_log["character_name"] = character["name"]
            enriched_history.append(enriched_log)
        
        # 使用AI服务生成深度归因
        echo_result = await ai_service.generate_echo_attribution(
            character_id=character_id,
            conversation_history=enriched_history
        )
        
        attribution = echo_result["attribution"]
        
        return {
            "ok": True,
            "attribution": attribution,
            "belief_system": belief_summary,
            "character_name": character["name"],
            "trigger_type": "conversation_reflection"
        }
        
    except Exception as e:
        print(f"Echo endpoint error: {e}")
        return {
            "ok": False,
            "message": "回响之室暂时无法访问，请稍后再试。"
        }

@app.get("/api/scene-image")
async def get_scene_image(scene: str = "harbor_tavern", character_id: str = None):
    """获取场景图像"""
    try:
        # 获取角色信息（如果提供）
        character = None
        if character_id:
            db = get_db()
            character = await db.get_character_by_id(character_id)
        
        # 生成场景描述
        scene_descriptions = {
            "harbor_tavern": "古老的港口酒馆内部，木质桌椅，温暖的壁炉，各种旅人聚集",
            "harbor_port": "繁忙的港口码头，帆船停靠，商人和水手来往",
            "harbor_street": "石板铺成的港口街道，两旁是商店和旅馆"
        }
        
        scene_description = scene_descriptions.get(scene, scene_descriptions["harbor_tavern"])
        character_name = character['name'] if character else None
        
        # 生成图像
        image_url = await image_service.generate_scene_image(scene_description, character_name)
        
        if not image_url:
            # 使用备用图像
            image_url = image_service.get_fallback_image("tavern")
        
        return {
            "success": True,
            "image_url": image_url,
            "scene": scene,
            "character": character['name'] if character else None
        }
        
    except Exception as e:
        print(f"Scene image endpoint error: {e}")
        return {
            "success": False,
            "image_url": image_service.get_fallback_image("tavern"),
            "error": str(e)
        }

@app.get("/api/character-portrait/{character_id}")
async def get_character_portrait(character_id: str):
    """获取角色肖像"""
    try:
        db = get_db()
        character = await db.get_character_by_id(character_id)
        
        if not character:
            return {
                "success": False,
                "image_url": image_service.get_fallback_image("character"),
                "error": "Character not found"
            }
        
        # 生成角色肖像
        image_url = await image_service.generate_character_portrait(character)
        
        if not image_url:
            image_url = image_service.get_fallback_image("character")
        
        return {
            "success": True,
            "image_url": image_url,
            "character": character['name']
        }
        
    except Exception as e:
        print(f"Character portrait endpoint error: {e}")
        return {
            "success": False,
            "image_url": image_service.get_fallback_image("character"),
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)