from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import requests
from typing import List, Dict, Any, AsyncGenerator
import asyncio
from pydantic import BaseModel

app = FastAPI(title="Helios Agent Core", version="0.1.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel环境变量 (由Mike在Vercel云端配置)
VERCEL_AI_GATEWAY_URL = os.environ.get("VERCEL_AI_GATEWAY_URL")
VERCEL_AI_GATEWAY_API_KEY = os.environ.get("VERCEL_AI_GATEWAY_API_KEY")

class Message(BaseModel):
    role: str
    content: str
    id: str = None

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "gpt-4o-mini"
    stream: bool = True

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    AI聊天端点，直接调用Vercel AI Gateway，支持流式输出
    """
    try:
        # 检查环境变量并添加调试信息
        print(f"DEBUG: VERCEL_AI_GATEWAY_URL = {VERCEL_AI_GATEWAY_URL}")
        print(f"DEBUG: VERCEL_AI_GATEWAY_API_KEY exists = {bool(VERCEL_AI_GATEWAY_API_KEY)}")
        print(f"DEBUG: Request model = {request.model}")
        print(f"DEBUG: Messages count = {len(request.messages)}")
        
        if not VERCEL_AI_GATEWAY_URL or not VERCEL_AI_GATEWAY_API_KEY:
            print("DEBUG: Using mock response (local development)")
            # 本地开发环境 - 返回模拟响应
            return StreamingResponse(
                mock_streaming_response(request.messages, request.model),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                }
            )
        
        # 生产环境 - 调用Vercel AI Gateway
        headers = {
            "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
            "Content-Type": "application/json"
        }

        # 将消息格式转换为OpenAI API格式
        openai_messages = [
            {"role": msg.role, "content": msg.content} 
            for msg in request.messages
        ]

        payload = {
            "model": request.model,
            "messages": openai_messages,
            "stream": True,  # 强制使用流式输出
            "max_tokens": 2048,
            "temperature": 0.7
        }

        print(f"DEBUG: Calling AI Gateway with model {request.model}")
        print(f"DEBUG: Payload: {json.dumps(payload, indent=2)}")
        
        # 调用Vercel AI Gateway
        return StreamingResponse(
            stream_ai_gateway_response(headers, payload),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache", 
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

async def mock_streaming_response(messages: List[Message], model: str = "gpt-4o-mini") -> AsyncGenerator[str, None]:
    """
    本地开发环境的模拟流式响应 - 符合Vercel AI SDK格式
    """
    user_message = messages[-1].content if messages else "无消息"
    
    mock_response = f"你好！我是Helios AI助手，收到了你的消息：「{user_message}」\n\n当前使用模型：{model}\n这是模拟响应，用于测试流式输出功能。"

    # 使用简化的流式格式，兼容Vercel AI SDK
    words = mock_response.split()
    for i, word in enumerate(words):
        content = word + (" " if i < len(words) - 1 else "")
        # 使用标准的OpenAI API格式
        chunk_data = {
            "id": f"chatcmpl-mock-{i}",
            "object": "chat.completion.chunk",
            "created": 1700000000,
            "model": model,
            "choices": [{
                "index": 0,
                "delta": {"content": content},
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(chunk_data)}\n\n"
        await asyncio.sleep(0.1)  # 更慢的速度便于观察
    
    # 发送结束标志
    final_chunk = {
        "id": "chatcmpl-mock-final",
        "object": "chat.completion.chunk", 
        "created": 1700000000,
        "model": model,
        "choices": [{
            "index": 0,
            "delta": {},
            "finish_reason": "stop"
        }]
    }
    yield f"data: {json.dumps(final_chunk)}\n\n"
    yield "data: [DONE]\n\n"

async def stream_ai_gateway_response(headers: dict, payload: dict) -> AsyncGenerator[str, None]:
    """
    从Vercel AI Gateway获取流式响应
    """
    try:
        # 调用Vercel AI Gateway - 使用标准OpenAI兼容端点
        api_url = f"{VERCEL_AI_GATEWAY_URL}/v1/chat/completions" if VERCEL_AI_GATEWAY_URL.endswith('/v1') else f"{VERCEL_AI_GATEWAY_URL}/v1/chat/completions"
        if VERCEL_AI_GATEWAY_URL.endswith('/chat/completions'):
            api_url = VERCEL_AI_GATEWAY_URL
        else:
            api_url = f"{VERCEL_AI_GATEWAY_URL}/chat/completions"
        
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
            stream=True
        )
        response.raise_for_status()

        # 处理流式响应
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data = line[6:]  # 移除 'data: ' 前缀
                    if data.strip() == '[DONE]':
                        yield "data: [DONE]\n\n"
                        break
                    
                    try:
                        # 直接转发AI Gateway的响应
                        json.loads(data)  # 验证JSON格式
                        yield f"data: {data}\n\n"
                    except json.JSONDecodeError:
                        continue

    except Exception as e:
        # 发送错误信息
        error_chunk = {
            "choices": [{
                "delta": {"content": f"\n\n❌ 连接AI服务失败: {str(e)}"},
                "index": 0,
                "finish_reason": "stop"
            }]
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield "data: [DONE]\n\n"

@app.get("/api/models")
async def get_available_models():
    """
    获取可用模型列表
    """
    # 读取本地模型配置文件
    try:
        import json
        models_file = "../../docs/available-models.json"
        with open(models_file, 'r', encoding='utf-8') as f:
            models = json.load(f)
        return models
    except FileNotFoundError:
        return {
            "openai": {
                "gpt-4o-mini": {
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "description": "Fast and cost-effective OpenAI model",
                    "streaming": True
                }
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)