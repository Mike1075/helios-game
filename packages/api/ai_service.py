"""
Helios AI服务模块
严格遵循CLAUDE.md中的Vercel AI Gateway集成规范
"""
import os
import openai
from typing import Optional, Dict, Any
from belief_compiler import belief_compiler

class HeliosAI:
    def __init__(self):
        # 使用CLAUDE.md规定的环境变量
        api_key = os.getenv("AI_GATEWAY_API_KEY")
        if not api_key:
            print("Warning: AI_GATEWAY_API_KEY not found, AI features will be disabled")
            self.enabled = False
            return
        
        # 配置OpenAI客户端连接到Vercel AI Gateway
        self.client = openai.OpenAI(
            api_key=api_key,
            # Vercel AI Gateway会自动处理路由到正确的模型提供商
        )
        self.enabled = True
    
    async def generate_npc_response(self, 
                                  character_id: str, 
                                  user_message: str, 
                                  conversation_history: list = None) -> str:
        """生成NPC回应"""
        if not self.enabled:
            return self._get_fallback_response(character_id)
        
        try:
            # 编译信念系统为系统提示
            system_prompt = belief_compiler.compile_system_prompt(
                character_id, 
                self._format_conversation_context(conversation_history or [])
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
            
            # 添加最近的对话历史
            if conversation_history:
                for log in conversation_history[-6:]:  # 只保留最近6条记录
                    if log.get("speaker") == "user":
                        messages.insert(-1, {"role": "user", "content": log["text"]})
                    elif log.get("speaker") == "ai":
                        messages.insert(-1, {"role": "assistant", "content": log["text"]})
            
            # 调用LLM生成回应
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # 符合Vercel AI规范的模型命名
                messages=messages,
                max_tokens=150,
                temperature=0.8,
                stop=None
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"AI generation error: {e}")
            return self._get_fallback_response(character_id)
    
    async def generate_echo_attribution(self, 
                                       character_id: str, 
                                       conversation_history: list) -> Dict[str, Any]:
        """生成回响之室的主观归因"""
        if not self.enabled:
            return self._get_fallback_attribution(character_id)
        
        try:
            # 构建回响之室的特殊系统提示
            echo_prompt = f"""你是Helios世界中的意识探索引导者。
你的任务是帮助玩家理解他们的内在动机和信念如何影响了现实。

基于以下对话历史，生成一个主观的、内省的归因解释：
1. 从第一人称视角描述
2. 强调玩家的思想/期待如何"创造"了这个结果
3. 提供1-2个支持性的"记忆证据"
4. 风格：深刻、哲学性、略带神秘

对话历史：
{self._format_conversation_for_echo(conversation_history)}

请生成一个深入的自我反思，让玩家感受到"我的意识创造了这个现实"的顿悟。
"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": echo_prompt}],
                max_tokens=200,
                temperature=0.9
            )
            
            attribution = response.choices[0].message.content.strip()
            
            return {
                "attribution": attribution,
                "source": "ai_generated",
                "model": "gpt-4o-mini"
            }
            
        except Exception as e:
            print(f"Echo generation error: {e}")
            return self._get_fallback_attribution(character_id)
    
    def _format_conversation_context(self, conversation_history: list) -> str:
        """格式化对话上下文"""
        if not conversation_history:
            return "这是你们的第一次对话。"
        
        context = "最近的对话：\n"
        for log in conversation_history[-4:]:
            speaker = "玩家" if log.get("speaker") == "user" else "你"
            context += f"{speaker}: {log['text']}\n"
        
        return context
    
    def _format_conversation_for_echo(self, conversation_history: list) -> str:
        """为回响之室格式化对话历史"""
        formatted = ""
        for log in conversation_history[-8:]:  # 更多历史用于分析
            speaker = "我" if log.get("speaker") == "user" else log.get("character_name", "NPC")
            formatted += f"{speaker}: {log['text']}\n"
        return formatted
    
    def _get_fallback_response(self, character_id: str) -> str:
        """AI不可用时的备用回应"""
        fallback_responses = [
            "我需要时间思考你说的话...",
            "这是个有趣的观点，让我想想...",
            "你的话让我陷入了沉思。",
            "我感觉需要更多时间来理解你的意思。"
        ]
        import random
        return random.choice(fallback_responses)
    
    def _get_fallback_attribution(self, character_id: str) -> Dict[str, Any]:
        """AI不可用时的备用归因"""
        fallback_attributions = [
            "也许我的期待在某种程度上影响了这次对话的走向...",
            "回想起来，我的态度可能传达了某种潜在的信息...",
            "这次互动让我意识到，我的内心可能有着更深层的渴望..."
        ]
        import random
        return {
            "attribution": random.choice(fallback_attributions),
            "source": "fallback",
            "model": "template"
        }

# 全局AI服务实例
ai_service = HeliosAI()