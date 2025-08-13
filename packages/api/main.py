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
        # 根据Vercel AI Gateway文档配置认证头
        headers = {
            "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "User-Agent": "Helios/1.0"
        }
        
        # 如果使用Vercel AI Gateway，可能需要不同的认证方式
        if "vercel.com" in base_url or "api.vercel" in base_url:
            print("DEBUG: Using Vercel API authentication format")
            # Vercel API可能需要不同的头部格式
            headers.update({
                "X-Vercel-AI-Provider": "openai",
                "X-Vercel-AI-Model": request.model
            })

        # 将消息格式转换为标准OpenAI API格式
        openai_messages = [
            {"role": msg.role, "content": msg.content} 
            for msg in request.messages
        ]

        # 标准OpenAI API负载格式
        payload = {
            "model": request.model,
            "messages": openai_messages,
            "stream": True,
            "max_tokens": 2048,
            "temperature": 0.7
        }

        print(f"DEBUG: Calling Vercel AI Gateway")
        print(f"DEBUG: Model: {request.model}")
        print(f"DEBUG: Gateway URL: {VERCEL_AI_GATEWAY_URL}")
        print(f"DEBUG: API Key exists: {bool(VERCEL_AI_GATEWAY_API_KEY)}")
        print(f"DEBUG: Messages: {len(openai_messages)}")
        
        # 根据最新Vercel AI Gateway文档，尝试不同的端点
        if not VERCEL_AI_GATEWAY_URL:
            print("DEBUG: No VERCEL_AI_GATEWAY_URL, using default")
            # Vercel AI Gateway的默认端点
            base_url = "https://api.vercel.com/v1/ai/chat/completions"
        else:
            base_url = VERCEL_AI_GATEWAY_URL
        
        # 调用Vercel AI Gateway
        return StreamingResponse(
            stream_ai_gateway_response(headers, payload, base_url),
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
    本地开发环境的模拟流式响应 - 完全符合OpenAI/Vercel AI SDK格式
    """
    user_message = messages[-1].content if messages else "无消息"
    
    mock_response = f"你好！我是Helios AI助手，收到了你的消息：「{user_message}」\n\n当前使用模型：{model}\n这是模拟响应，用于测试流式输出功能。"

    print(f"DEBUG: Starting mock streaming response")
    
    # 按字符分割，更精确地模拟真实AI流式输出
    for i, char in enumerate(mock_response):
        chunk_data = {
            "id": f"chatcmpl-mock-{i}",
            "object": "chat.completion.chunk",
            "created": 1700000000,
            "model": model,
            "choices": [{
                "index": 0,
                "delta": {"content": char},
                "finish_reason": None
            }]
        }
        
        # 确保JSON格式正确且无多余字符
        json_str = json.dumps(chunk_data, ensure_ascii=False, separators=(',', ':'))
        yield f"data: {json_str}\n\n"
        await asyncio.sleep(0.02)  # 快速字符流式输出
    
    print(f"DEBUG: Sending final chunk")
    
    # 发送结束标志 - 严格按OpenAI格式
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
    
    json_str = json.dumps(final_chunk, ensure_ascii=False, separators=(',', ':'))
    yield f"data: {json_str}\n\n"
    yield "data: [DONE]\n\n"
    
    print(f"DEBUG: Mock streaming response completed")

async def stream_ai_gateway_response(headers: dict, payload: dict, base_url: str) -> AsyncGenerator[str, None]:
    """
    从Vercel AI Gateway获取流式响应
    """
    try:
        # 智能构建API URL，避免重复路径
        clean_base_url = base_url.rstrip('/')
        
        # 检查URL是否已经包含完整路径
        if '/chat/completions' in clean_base_url:
            api_url = clean_base_url  # 已经是完整端点
        elif clean_base_url.endswith('/v1/ai'):
            api_url = f"{clean_base_url}/chat/completions"
        elif clean_base_url.endswith('/v1'):
            api_url = f"{clean_base_url}/ai/chat/completions"  # Vercel AI Gateway路径
        elif clean_base_url.endswith('/ai'):
            api_url = f"{clean_base_url}/chat/completions"
        else:
            # 默认假设是基础域名，添加完整路径
            api_url = f"{clean_base_url}/v1/ai/chat/completions"
        
        print(f"DEBUG: Original base URL: {base_url}")
        print(f"DEBUG: Constructed API URL: {api_url}")
        print(f"DEBUG: Request headers: {dict(h for h in headers.items() if h[0] != 'Authorization')}")
        print(f"DEBUG: Payload model: {payload.get('model')}")
        
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
            stream=True,
            timeout=30
        )
        
        print(f"DEBUG: Response status: {response.status_code}")
        response.raise_for_status()

        # 处理流式响应
        for line in response.iter_lines(decode_unicode=True):
            if line:
                line_str = line.strip()
                print(f"DEBUG: Received line: {repr(line_str)}")
                
                if line_str.startswith('data: '):
                    data = line_str[6:]  # 移除 'data: ' 前缀
                    
                    if data.strip() == '[DONE]':
                        print("DEBUG: Received [DONE], ending stream")
                        yield "data: [DONE]\n\n"
                        break
                    
                    try:
                        # 验证JSON格式并重新序列化确保格式正确
                        parsed = json.loads(data)
                        
                        # 重新序列化确保格式一致
                        clean_json = json.dumps(parsed, ensure_ascii=False, separators=(',', ':'))
                        print(f"DEBUG: Valid JSON chunk, re-serialized")
                        yield f"data: {clean_json}\n\n"
                        
                    except json.JSONDecodeError as e:
                        print(f"DEBUG: Invalid JSON in response: {repr(data)}, error: {e}")
                        continue

    except Exception as e:
        print(f"DEBUG: Exception in stream_ai_gateway_response: {str(e)}")
        # 发送错误信息 - 使用正确的格式
        error_chunk = {
            "id": "error",
            "object": "chat.completion.chunk",
            "created": 1700000000,
            "model": payload.get("model", "unknown"),
            "choices": [{
                "index": 0,
                "delta": {"content": f"\n\n❌ 连接AI服务失败: {str(e)}"},
                "finish_reason": "stop"
            }]
        }
        
        # 确保错误响应也使用相同的JSON序列化格式
        error_json = json.dumps(error_chunk, ensure_ascii=False, separators=(',', ':'))
        yield f"data: {error_json}\n\n"
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