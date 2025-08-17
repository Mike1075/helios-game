from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import requests
from typing import List, Dict, Any, AsyncGenerator, Optional
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

# Vercel AI Gateway 环境变量 (官方验证配置)
VERCEL_AI_GATEWAY_URL = os.environ.get("VERCEL_AI_GATEWAY_URL", "https://ai-gateway.vercel.sh/v1")
VERCEL_AI_GATEWAY_API_KEY = os.environ.get("VERCEL_AI_GATEWAY_API_KEY", "EtMyP4WaMfdkxizkutRrJT1j")

print(f"DEBUG: AI Gateway URL = {VERCEL_AI_GATEWAY_URL}")
print(f"DEBUG: API Key = {VERCEL_AI_GATEWAY_API_KEY[:8]}...{VERCEL_AI_GATEWAY_API_KEY[-4:] if VERCEL_AI_GATEWAY_API_KEY else 'None'}")

def call_llm(model_name: str, system_prompt: str, user_prompt: str) -> str:
    """
    按照官方示例调用Vercel AI Gateway
    """
    headers = {
        "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 2048
    }

    response = requests.post(f"{VERCEL_AI_GATEWAY_URL}/chat/completions", headers=headers, json=payload)
    response.raise_for_status()  # Will raise an exception for HTTP error codes

    return response.json()["choices"][0]["message"]["content"]

def call_llm_streaming(model_name: str, messages: List[Dict]) -> AsyncGenerator[str, None]:
    """
    流式调用Vercel AI Gateway
    """
    headers = {
        "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_name,
        "messages": messages,
        "max_tokens": 2048,
        "stream": True
    }

    try:
        response = requests.post(
            f"{VERCEL_AI_GATEWAY_URL}/chat/completions", 
            headers=headers, 
            json=payload, 
            stream=True
        )
        response.raise_for_status()

        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                data = line[6:]
                if data.strip() == '[DONE]':
                    break
                try:
                    parsed = json.loads(data)
                    content = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if content:
                        yield f"data: {json.dumps({'content': content})}\n\n"
                except json.JSONDecodeError:
                    continue
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_msg = f"AI Gateway调用失败: {str(e)}"
        yield f"data: {json.dumps({'error': error_msg})}\n\n"
        yield "data: [DONE]\n\n"

def get_available_models() -> List[Dict]:
    """
    动态模型发现 - 获取所有可用模型
    """
    try:
        headers = {
            "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{VERCEL_AI_GATEWAY_URL}/models", headers=headers)
        response.raise_for_status()
        
        models_data = response.json()
        return models_data.get("data", [])
    except Exception as e:
        print(f"获取模型列表失败: {e}")
        return []

class Message(BaseModel):
    role: str
    content: str
    id: str = None

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "gpt-4o-mini"
    stream: bool = False

@app.get("/")
async def root():
    return {"message": "Helios Agent Core is running", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "helios-agent-core"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    AI聊天端点，支持流式和非流式调用
    """
    try:
        print(f"DEBUG: Model = {request.model}")
        print(f"DEBUG: Messages count = {len(request.messages)}")
        print(f"DEBUG: Stream = {request.stream}")
        print(f"DEBUG: AI Gateway URL = {VERCEL_AI_GATEWAY_URL}")
        print(f"DEBUG: API Key exists = {bool(VERCEL_AI_GATEWAY_API_KEY)}")
        
        if not VERCEL_AI_GATEWAY_URL or not VERCEL_AI_GATEWAY_API_KEY:
            # 本地开发环境 - 返回模拟响应
            if request.stream:
                return StreamingResponse(
                    mock_streaming_response(request.messages, request.model),
                    media_type="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "Access-Control-Allow-Origin": "*",
                    }
                )
            else:
                # 模拟非流式响应
                user_message = request.messages[-1].content if request.messages else "无消息"
                mock_content = f"你好！我是Helios AI助手，收到了你的消息：「{user_message}」\n\n当前使用模型：{request.model}\n这是模拟响应。"
                return {"content": mock_content}
        
        # 转换消息格式
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        if request.stream:
            # 流式响应
            return StreamingResponse(
                call_llm_streaming(request.model, messages),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive", 
                    "Access-Control-Allow-Origin": "*",
                }
            )
        else:
            # 非流式响应
            if len(messages) > 0 and messages[0]["role"] != "system":
                # 添加系统提示
                messages.insert(0, {"role": "system", "content": "You are a helpful assistant."})
            
            result = call_llm(
                model_name=request.model,
                system_prompt="You are a helpful assistant.",
                user_prompt=messages[-1]["content"] if messages else "Hello"
            )
            
            return {"content": result}

    except Exception as e:
        print(f"ERROR: {str(e)}")
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
async def list_available_models():
    """
    获取所有可用模型列表 - 动态从AI Gateway获取
    """
    try:
        if not VERCEL_AI_GATEWAY_URL or not VERCEL_AI_GATEWAY_API_KEY:
            # 本地开发环境返回默认模型
            return {
                "data": [
                    {"id": "gpt-4o-mini", "object": "model", "created": 1700000000, "owned_by": "openai"},
                    {"id": "gpt-4o", "object": "model", "created": 1700000000, "owned_by": "openai"},
                    {"id": "gpt-4", "object": "model", "created": 1700000000, "owned_by": "openai"},
                    {"id": "anthropic/claude-3-5-sonnet", "object": "model", "created": 1700000000, "owned_by": "anthropic"}
                ],
                "object": "list"
            }
        
        # 从AI Gateway动态获取模型列表
        models = get_available_models()
        print(f"DEBUG: 获取到 {len(models)} 个模型")
        
        return {
            "data": models,
            "object": "list",
            "total": len(models)
        }
    except Exception as e:
        print(f"ERROR: 获取模型列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")

@app.post("/api/test-model")
async def test_model_call(model_name: str = "anthropic/claude-3-5-sonnet"):
    """
    测试单个模型调用 - 用于验证模型名称
    """
    try:
        if not VERCEL_AI_GATEWAY_URL or not VERCEL_AI_GATEWAY_API_KEY:
            return {"error": "AI Gateway配置未找到", "model": model_name}
        
        result = call_llm(
            model_name=model_name,
            system_prompt="You are a helpful assistant.",
            user_prompt="Say hello in one sentence."
        )
        
        return {
            "model": model_name,
            "response": result,
            "status": "success"
        }
    except Exception as e:
        return {
            "model": model_name,
            "error": str(e),
            "status": "failed"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)