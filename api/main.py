from http.server import BaseHTTPRequestHandler
import json
import os
import requests
import uuid
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# 环境变量
AI_GATEWAY_API_KEY = os.environ.get("AI_GATEWAY_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
ZEP_API_KEY = os.environ.get("ZEP_API_KEY")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 设置CORS头
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # 解析请求路径
            path = self.path
            
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            if content_length > 0:
                try:
                    data = json.loads(post_data.decode('utf-8'))
                except json.JSONDecodeError:
                    data = {}
            else:
                data = {}
            
            # 路由处理
            if path.startswith('/api/chat'):
                response = self.handle_chat(data)
            elif path.startswith('/api/init-game'):
                response = self.handle_init_game(data)
            else:
                response = {"error": "Not found", "path": path}
            
            # 发送响应
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {"error": str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        # 处理预检请求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        # 处理GET请求
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "message": "Helios Agent Core API",
            "version": "0.1.0",
            "endpoints": ["/api/chat", "/api/init-game"]
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def handle_chat(self, data):
        """处理聊天请求"""
        try:
            user_message = data.get('userMessage', '')
            player_name = data.get('playerName', '')
            session_id = data.get('sessionId', '')
            input_type = data.get('inputType', 'dialogue')
            
            if not user_message or not player_name or not session_id:
                return {"error": "Missing required fields", "success": False}
            
            # 智能角色路由
            character_info = self.route_to_character(user_message)
            
            # 构建AI提示词
            system_prompt = self.build_character_prompt(character_info)
            
            # 调用Vercel AI Gateway
            ai_response = self.call_ai_gateway("gemini-1.5-flash", system_prompt, user_message)
            
            # 解析AI响应为结构化格式
            action_package = self.parse_ai_response(ai_response)
            
            return {
                "success": True,
                "character": character_info,
                "action_package": action_package,
                "routing_type": "intelligent"
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def handle_init_game(self, data):
        """处理游戏初始化请求"""
        try:
            player_name = data.get('playerName', '')
            
            if not player_name:
                return {"error": "Player name is required", "success": False}
            
            # 生成会话ID
            session_id = str(uuid.uuid4())
            
            return {
                "success": True,
                "sessionId": session_id,
                "message": f"Game initialized for {player_name}"
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def route_to_character(self, user_message):
        """智能角色路由"""
        message_lower = user_message.lower()
        
        # 核心AI角色检测
        if any(keyword in message_lower for keyword in ['林溪', 'linxi', '@林溪']):
            return {"id": "linxi", "name": "林溪", "type": "core_ai"}
        elif any(keyword in message_lower for keyword in ['陈浩', 'chenhao', '@陈浩']):
            return {"id": "chenhao", "name": "陈浩", "type": "core_ai"}
        
        # 万能AI角色检测
        elif any(keyword in message_lower for keyword in ['老板', '酒馆老板', '店主']):
            return {"id": "tavern_keeper", "name": "酒馆老板", "type": "universal_ai"}
        elif any(keyword in message_lower for keyword in ['酒保', '调酒师', '酒']):
            return {"id": "bartender", "name": "酒保", "type": "universal_ai"}
        elif any(keyword in message_lower for keyword in ['厨师', '做饭', '食物', '菜']):
            return {"id": "cook", "name": "厨师", "type": "universal_ai"}
        elif any(keyword in message_lower for keyword in ['守卫', '保安', '安全']):
            return {"id": "guard", "name": "守卫", "type": "universal_ai"}
        else:
            return {"id": "local_resident", "name": "当地居民", "type": "universal_ai"}
    
    def build_character_prompt(self, character_info):
        """构建角色提示词"""
        if character_info["id"] == "linxi":
            return '''你是林溪，一位经验丰富的调查员。你眼神锐利，善于观察细节，总是在分析每个人的行为模式。
            
性格特点：
- 敏锐观察，善于推理
- 直接但不失礼貌
- 对人性有深刻理解
- 略显冷静和理性

请用第一人称回应，保持角色一致性。'''
            
        elif character_info["id"] == "chenhao":
            return '''你是陈浩，一个看似普通的年轻人，但内心藏着不为人知的秘密。你容易紧张，试图保持低调。
            
性格特点：
- 内向谨慎，不愿透露太多
- 容易紧张，但努力掩饰
- 有些神秘感
- 善良但缺乏安全感

请用第一人称回应，保持角色一致性。'''
            
        else:
            # 万能AI角色
            role_prompts = {
                "tavern_keeper": "你是月影酒馆的老板，经验丰富，见多识广，对顾客友善但精明。",
                "bartender": "你是酒馆的酒保，善于调酒，了解各种酒类，喜欢与客人聊天。",
                "cook": "你是酒馆的厨师，对食物充满热情，总是乐于介绍招牌菜。",
                "guard": "你是负责维护秩序的守卫，警觉谨慎，确保酒馆安全。",
                "local_resident": "你是当地居民，熟悉周围环境，乐于助人但保持适度距离。"
            }
            
            base_prompt = role_prompts.get(character_info["id"], role_prompts["local_resident"])
            return f'''{base_prompt}

你在月影酒馆中，这是一个昏暗温馨的酒馆。请用第一人称自然回应，保持角色特点。'''
    
    def call_ai_gateway(self, model, system_prompt, user_message):
        """调用Vercel AI Gateway"""
        try:
            url = "https://api.vercel.com/v1/ai/chat/completions"
            headers = {
                "Authorization": f"Bearer {AI_GATEWAY_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 2048,
                "temperature": 0.8
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            return f"AI响应错误: {str(e)}"
    
    def parse_ai_response(self, ai_response):
        """解析AI响应为结构化格式"""
        # 简单解析，实际项目中可能需要更复杂的解析逻辑
        return {
            "dialogue": ai_response.strip(),
            "action": None,
            "internal_thought": None
        }