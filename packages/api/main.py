from fastapi import FastAPI, HTTPException, Request
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

# 环境变量
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
    AI聊天端点，支持流式输出
    """
    try:
        # 如果在本地开发环境，返回模拟响应
        if not VERCEL_AI_GATEWAY_URL or not VERCEL_AI_GATEWAY_API_KEY:
            return StreamingResponse(
                mock_streaming_response(request.messages),
                media_type="text/plain"
            )
        
        # 构造请求到Vercel AI Gateway
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
            "stream": request.stream,
            "max_tokens": 2048,
            "temperature": 0.7
        }

        # 发送流式请求到AI Gateway
        if request.stream:
            return StreamingResponse(
                stream_ai_response(headers, payload),
                media_type="text/plain"
            )
        else:
            # 非流式响应
            response = requests.post(
                f"{VERCEL_AI_GATEWAY_URL}/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            return {
                "content": result["choices"][0]["message"]["content"],
                "role": "assistant"
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

async def mock_streaming_response(messages: List[Message]) -> AsyncGenerator[str, None]:
    """
    本地开发环境的模拟流式响应
    """
    mock_response = f"""你好！我是Helios AI助手。

当前状态：本地开发模式（模拟响应）

你刚才发送的消息数量：{len(messages)}
最后一条消息："{messages[-1].content if messages else '无'}"

这是一个流式输出的演示。在生产环境中，我将连接到真实的AI模型。

✨ Helios项目特性：
- 🔮 信念系统驱动的对话
- 🤖 NPC代理核心
- 🪞 回响之室自省
- 🎭 导演引擎

现在你看到的是逐字符的流式输出效果..."""

    # 模拟逐字符流式输出
    for char in mock_response:
        yield f"data: {json.dumps({'content': char})}\n\n"
        await asyncio.sleep(0.02)  # 模拟打字效果
    
    yield "data: [DONE]\n\n"

async def stream_ai_response(headers: dict, payload: dict) -> AsyncGenerator[str, None]:
    """
    从AI Gateway获取流式响应
    """
    try:
        response = requests.post(
            f"{VERCEL_AI_GATEWAY_URL}/v1/chat/completions",
            headers=headers,
            json=payload,
            stream=True
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data = line[6:]  # 移除 'data: ' 前缀
                    if data == '[DONE]':
                        yield "data: [DONE]\n\n"
                        break
                    
                    try:
                        json_data = json.loads(data)
                        if 'choices' in json_data and len(json_data['choices']) > 0:
                            delta = json_data['choices'][0].get('delta', {})
                            if 'content' in delta:
                                yield f"data: {json.dumps({'content': delta['content']})}\n\n"
                    except json.JSONDecodeError:
                        continue

    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

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