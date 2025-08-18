# packages/api/main.py (AI Gateway 版)
import os
import yaml
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

# --- 初始化 FastAPI 應用 ---
app = FastAPI()

# --- 允許前端在本地開發時能訪問後端 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # 允許來自前端的請求
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 從環境變數中讀取 AI Gateway 的機密資訊 ---
# 在本地開發時，這些值會是空的 (None)，這是正常的
AI_GATEWAY_URL = os.environ.get("VERCEL_AI_GATEWAY_URL")
AI_GATEWAY_API_KEY = os.environ.get("VERCEL_AI_GATEWAY_API_KEY")

# --- 定義前端傳來的資料結構 ---
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    character_id: str

# --- 輔助函數：用來讀取 YAML 檔案 ---
def load_yaml(file_path: str) -> Dict[str, Any]:
    full_path = os.path.join(os.path.dirname(__file__), file_path)
    with open(full_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

# --- 根路由 ---
@app.get("/")
def read_root():
    return {"message": "Helios Game API", "status": "running"}

# --- 創建 API 的入口：/api/chat ---
@app.post("/api/chat")
async def chat(request: ChatRequest):
    # 如果在本地開發，由於沒有 API 金鑰，我們直接回傳一個測試訊息
    if not AI_GATEWAY_API_KEY:
        print("警告：未找到 VERCEL_AI_GATEWAY_API_KEY。返回本地測試訊息。")
        return {"reply": f"本地測試模式：已收到您對 {request.character_id} 的訊息。"}

    # --- 以下是在 Vercel 雲端環境中運行的正式邏輯 ---
    try:
        npc_beliefs = load_yaml(f"beliefs/{request.character_id}.yaml")

        system_prompt = f"""你正在扮演遊戲角色 {npc_beliefs['name']}。
        你的個人信念系統如下，請完全基於此來思考和回應。
        --- 信念系統開始 ---
        {yaml.dump(npc_beliefs, allow_unicode=True)}
        --- 信念系統結束 ---
        你的回應必須是一個單純的字串，不要包含任何 JSON 格式。
        """
        
        # 準備發送到 AI Gateway 的請求 body
        gateway_payload = {
            "model": "claude-3-haiku-20240307",
            "system": system_prompt,
            "messages": [msg.dict() for msg in request.messages]
        }
        
        # 準備請求 headers
        gateway_headers = {
            "Authorization": f"Bearer {AI_GATEWAY_API_KEY}",
            "Content-Type": "application/json"
        }

        # 透過 HTTP POST 請求呼叫 AI Gateway
        response = requests.post(
            f"{AI_GATEWAY_URL}/v1/chat/completions",
            headers=gateway_headers,
            json=gateway_payload
        )
        
        response.raise_for_status() # 如果請求失敗 (例如 4xx 或 5xx 錯誤)，會在這裡拋出異常
        
        ai_reply = response.json()['choices'][0]['message']['content']
        
        return {"reply": ai_reply}

    except Exception as e:
        print(f"錯誤：呼叫 AI Gateway 時發生問題 - {e}")
        # 在雲端出錯時，也回傳一個明確的錯誤訊息
        return {"reply": f"抱歉，我的大腦在連接 AI Gateway 時出現了問題：{e}"}