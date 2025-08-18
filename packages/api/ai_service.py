"""
Helios Game - AI服务接口
集成Vercel AI Gateway、Zep记忆系统等外部AI服务
"""

import os
import json
import requests
from typing import Dict, List, Optional, Any
import yaml
from datetime import datetime

class AIService:
    """AI服务管理器"""
    
    def __init__(self):
        # 阿里云百炼 Qwen API 配置
        self.qwen_api_key = os.getenv("QWEN_API_KEY")
        self.qwen_api_url = os.getenv("QWEN_API_URL")
        self.zep_api_key = os.getenv("ZEP_API_KEY")
        self.local_dev_mode = os.getenv("LOCAL_DEV_MODE", "true").lower() == "true"
    
    def is_available(self) -> bool:
        """检查AI服务是否可用"""
        if self.local_dev_mode:
            return False
        return bool(self.qwen_api_key and self.qwen_api_url)
    
    def call_llm(self, model: str, system_prompt: str, user_prompt: str, 
                 max_tokens: int = 2048, temperature: float = 0.7) -> Optional[str]:
        """调用LLM生成文本"""
        if not self.is_available():
            return self._mock_llm_response(system_prompt, user_prompt)
        
        try:
            headers = {
                "Authorization": f"Bearer {self.qwen_api_key}",
                "Content-Type": "application/json"
            }
            
            # 阿里云百炼API格式
            payload = {
                "model": "qwen-plus",  # 或 qwen-turbo, qwen-max
                "input": {
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ]
                },
                "parameters": {
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "top_p": 0.8
                }
            }
            
            response = requests.post(
                self.qwen_api_url, 
                headers=headers, 
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            # 阿里云百炼API响应格式
            if "output" in result and "text" in result["output"]:
                return result["output"]["text"]
            else:
                print(f"API响应格式异常: {result}")
                return self._mock_llm_response(system_prompt, user_prompt)
            
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return self._mock_llm_response(system_prompt, user_prompt)
    
    def _mock_llm_response(self, system_prompt: str, user_prompt: str) -> str:
        """模拟LLM响应（本地开发模式）"""
        # 根据system prompt的内容生成不同类型的模拟响应
        if "NPC" in system_prompt or "角色" in system_prompt:
            return self._mock_npc_response(user_prompt)
        elif "信念" in system_prompt or "belief" in system_prompt.lower():
            return self._mock_belief_analysis()
        elif "回响" in system_prompt or "echo" in system_prompt.lower():
            return self._mock_echo_response(user_prompt)
        else:
            return "这是一个模拟响应，用于本地开发测试。"
    
    def _mock_npc_response(self, user_message: str) -> str:
        """模拟NPC对话响应"""
        responses = [
            "这里是个繁忙的港口，总有新面孔出现。你看起来像是刚到这里的旅行者？",
            "酒馆里的消息传得很快，有什么你想了解的吗？",
            "这座城市有它自己的规矩，新来的人最好小心一些。",
            "我看过很多人来来去去，每个人都有自己的故事。",
            "港口的夜晚总是充满未知，你最好找个安全的地方过夜。"
        ]
        # 简单的响应选择逻辑
        import hashlib
        hash_value = int(hashlib.md5(user_message.encode()).hexdigest(), 16)
        return responses[hash_value % len(responses)]
    
    def _mock_belief_analysis(self) -> str:
        """模拟信念系统分析"""
        return """worldview:
  pragmatic_outlook:
    description: "基于行为分析，此角色表现出实用主义的世界观"
    weight: 0.7
  social_awareness:
    description: "对社交环境敏感，善于观察他人"
    weight: 0.6

selfview:
  cautious_explorer:
    description: "在探索中保持谨慎，不轻易冒险"
    weight: 0.8
  information_seeker:
    description: "倾向于通过询问获取信息"
    weight: 0.7

values:
  safety: 0.8
  knowledge: 0.7
  social_harmony: 0.6"""
    
    def _mock_echo_response(self, confusion_text: str) -> str:
        """模拟回响之室响应"""
        return f"根据你的困惑：'{confusion_text}'，从你的行为模式来看，这可能是因为你内心对安全和探索之间存在矛盾。你渴望了解这个世界，但同时担心未知的风险。这种谨慎的态度源于你过往的经历。"

    # =============================================
    # Zep 记忆服务
    # =============================================
    
    def get_conversation_memory(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """获取对话记忆"""
        if not self.zep_api_key or self.local_dev_mode:
            return self._mock_conversation_memory(session_id)
        
        try:
            # 这里应该调用真实的Zep API
            # 暂时返回模拟数据
            return self._mock_conversation_memory(session_id)
        except Exception as e:
            print(f"Zep记忆获取失败: {e}")
            return []
    
    def save_conversation_memory(self, session_id: str, user_message: str, 
                                ai_response: str, metadata: Optional[Dict] = None) -> bool:
        """保存对话记忆"""
        if not self.zep_api_key or self.local_dev_mode:
            return True  # 模拟成功
        
        try:
            # 这里应该调用真实的Zep API
            # 暂时返回成功
            return True
        except Exception as e:
            print(f"Zep记忆保存失败: {e}")
            return False
    
    def _mock_conversation_memory(self, session_id: str) -> List[Dict[str, Any]]:
        """模拟对话记忆"""
        return [
            {
                "timestamp": "2025-08-18T06:00:00Z",
                "user_message": "你好，我是新来的旅行者",
                "ai_response": "欢迎来到港口酒馆，这里总是欢迎新面孔。",
                "character": "艾尔文",
                "emotion": "友善"
            },
            {
                "timestamp": "2025-08-18T06:01:00Z", 
                "user_message": "这里安全吗？",
                "ai_response": "只要你遵守规矩，这里就是安全的。",
                "character": "艾尔文",
                "emotion": "严肃"
            }
        ]

    # =============================================
    # 专用AI功能
    # =============================================
    
    def generate_npc_response(self, npc_beliefs: str, conversation_history: List[Dict], 
                             user_message: str, scene_context: Dict[str, Any]) -> Dict[str, Any]:
        """生成NPC响应"""
        # 构建system prompt
        system_prompt = f"""你是一个游戏中的NPC角色，请根据以下信念系统和上下文信息进行回复：

信念系统：
{npc_beliefs}

场景信息：
{json.dumps(scene_context, ensure_ascii=False, indent=2)}

请以第一人称回复，保持角色一致性。回复应该包含：
1. 对话内容（自然、符合角色性格）
2. 当前情绪状态
3. 可能的行动或反应

回复格式要求：返回JSON格式，包含 message, emotion, action 字段。"""

        user_prompt = f"""对话历史：
{json.dumps(conversation_history[-5:], ensure_ascii=False, indent=2)}

玩家刚才说："{user_message}"

请以角色身份回复："""

        response_text = self.call_llm(
            model="anthropic/claude-sonnet-4",
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        if not response_text:
            return {
                "message": "抱歉，我现在有些心不在焉。",
                "emotion": "困惑",
                "action": "摇摇头"
            }
        
        try:
            # 尝试解析JSON响应
            response_data = json.loads(response_text)
            return response_data
        except json.JSONDecodeError:
            # 如果不是JSON，当作纯文本消息处理
            return {
                "message": response_text,
                "emotion": "中性",
                "action": None
            }
    
    def analyze_belief_system(self, character_logs: List[Dict[str, Any]]) -> str:
        """分析角色行为并生成信念系统"""
        if not character_logs:
            return "worldview: {}\nselfview: {}\nvalues: {}"
        
        system_prompt = """你是一个行为心理学专家，需要根据角色的行为日志分析其内在信念系统。

请分析提供的行为数据，生成YAML格式的信念系统，包含：
1. worldview: 世界观信念（对世界运作方式的认知）
2. selfview: 自我认知信念（对自己能力和身份的认知）  
3. values: 价值观权重（重要价值观及其权重0.0-1.0）

每个信念项应包含description（描述）和weight（权重0.0-1.0）。"""

        user_prompt = f"""请分析以下角色行为日志：

{json.dumps(character_logs, ensure_ascii=False, indent=2)}

根据这些行为模式，生成角色的信念系统YAML："""

        response = self.call_llm(
            model="anthropic/claude-sonnet-4",
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        return response or self._mock_belief_analysis()
    
    def generate_subjective_attribution(self, player_beliefs: str, confusion_text: str, 
                                      relevant_memories: List[Dict]) -> Dict[str, Any]:
        """生成主观因果归因（回响之室）"""
        system_prompt = f"""你是一个意识探索引导者，帮助玩家理解他们行为背后的信念驱动。

玩家的信念系统：
{player_beliefs}

请基于玩家的信念系统，为其困惑提供主观的、第一人称的因果归因。
这不是客观分析，而是从玩家信念角度的自我解释。

回复应该包含：
1. subjective_attribution: 主观因果解释（第一人称）
2. memory_evidence: 1-2个支持性"记忆证据"
3. belief_insight: 关于信念系统的洞察"""

        user_prompt = f"""玩家的困惑："{confusion_text}"

相关记忆：
{json.dumps(relevant_memories, ensure_ascii=False, indent=2)}

请生成JSON格式的主观归因："""

        response = self.call_llm(
            model="anthropic/claude-sonnet-4", 
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        try:
            return json.loads(response) if response else {}
        except json.JSONDecodeError:
            return {
                "subjective_attribution": response or self._mock_echo_response(confusion_text),
                "memory_evidence": ["记忆证据生成失败"],
                "belief_insight": "信念洞察生成失败"
            }


# 全局AI服务实例
ai_service = AIService()