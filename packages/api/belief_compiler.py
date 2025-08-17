"""
Helios信念系统编译器
将YAML信念文件转换为LLM系统提示
"""
import yaml
import os
from typing import Dict, Any, Optional

class BeliefCompiler:
    def __init__(self):
        self.beliefs_dir = os.path.join(os.path.dirname(__file__), "beliefs")
    
    def load_belief_file(self, character_id: str) -> Optional[Dict[str, Any]]:
        """根据character_id加载对应的信念文件（v4.1版本：支持8个NPC）"""
        # character_id到文件名的映射
        id_to_file = {
            "11111111-1111-1111-1111-111111111111": "elwin_guard.yaml",
            "22222222-2222-2222-2222-222222222222": "karin_wanderer.yaml",
            # v4.1 新增NPCs将采用动态信念发现，暂时返回None使用fallback
            "33333333-3333-3333-3333-333333333333": None,  # 瑟兰杜斯
            "44444444-4444-4444-4444-444444444444": None,  # 马库斯
            "55555555-5555-5555-5555-555555555555": None,  # 莉莉安
            "66666666-6666-6666-6666-666666666666": None,  # 托马斯
            "77777777-7777-7777-7777-777777777777": None,  # 伊莎贝拉
            "88888888-8888-8888-8888-888888888888": None,  # 奥斯卡
        }
        
        filename = id_to_file.get(character_id)
        if not filename:
            return None
        
        file_path = os.path.join(self.beliefs_dir, filename)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading belief file {filename}: {e}")
            return None
    
    def compile_system_prompt(self, character_id: str, conversation_context: str = "") -> str:
        """将信念系统编译为LLM系统提示"""
        belief_data = self.load_belief_file(character_id)
        if not belief_data:
            return self._get_fallback_prompt(character_id)
        
        char_info = belief_data.get("character_info", {})
        belief_system = belief_data.get("belief_system", {})
        interaction_patterns = belief_data.get("interaction_patterns", {})
        
        prompt = f"""# 角色设定
你是 {char_info.get('name', '未知角色')}，{char_info.get('role', '神秘人物')}。
核心动机：{char_info.get('core_motivation', '寻找自己的道路')}

# 信念系统
你的行为完全由以下信念系统驱动：

## 世界观信念
"""
        
        # 添加世界观信念
        worldview = belief_system.get("worldview", {})
        for belief_name, belief_data in worldview.items():
            strength = belief_data.get("strength", 0.5)
            description = belief_data.get("description", "")
            prompt += f"- **{belief_name}** (强度: {strength}): {description}\n"
        
        prompt += "\n## 自我认知信念\n"
        
        # 添加自我认知信念
        selfview = belief_system.get("selfview", {})
        for belief_name, belief_data in selfview.items():
            strength = belief_data.get("strength", 0.5)
            description = belief_data.get("description", "")
            prompt += f"- **{belief_name}** (强度: {strength}): {description}\n"
        
        prompt += "\n## 价值观信念\n"
        
        # 添加价值观信念
        values = belief_system.get("values", {})
        for belief_name, belief_data in values.items():
            strength = belief_data.get("strength", 0.5)
            description = belief_data.get("description", "")
            prompt += f"- **{belief_name}** (强度: {strength}): {description}\n"
        
        # 添加交互模式
        prompt += f"""
# 交互模式
- 问候风格：{interaction_patterns.get('greeting_style', '自然友善')}
- 冲突解决：{interaction_patterns.get('conflict_resolution', '寻求和谐')}
- 信息分享：{interaction_patterns.get('information_sharing', '开放透明')}
- 个人边界：{interaction_patterns.get('personal_boundaries', '适度保护')}

# 角色扮演指导
1. 严格按照上述信念系统行动和反应
2. 信念强度越高，坚持程度越强烈
3. 遇到冲突时，根据信念优先级做出选择
4. 保持角色的一致性和真实性
5. 用第一人称回应，仿佛你真的是这个角色

# 回应格式
用简洁自然的对话回应，体现角色的个性和信念。不要直接说出信念内容，而是通过行为和态度体现。

当前场景：港口酒馆内，各种旅人和本地人聚集的地方。
{conversation_context}
"""
        
        return prompt
    
    def _get_fallback_prompt(self, character_id: str) -> str:
        """当无法加载信念文件时的备用提示"""
        return f"""你是Helios世界中的一个角色（ID: {character_id}）。
你身处港口酒馆中，这里聚集着各种旅人和本地人。
请用简洁自然的方式回应对话，展现出独特的个性。
"""
    
    def get_belief_summary(self, character_id: str) -> Dict[str, str]:
        """获取信念系统的简要总结"""
        belief_data = self.load_belief_file(character_id)
        if not belief_data:
            return {"worldview": "未知", "selfview": "未知", "values": "未知"}
        
        belief_system = belief_data.get("belief_system", {})
        
        # 提取最强的信念作为总结
        worldview = belief_system.get("worldview", {})
        strongest_worldview = max(worldview.items(), 
                                 key=lambda x: x[1].get("strength", 0), 
                                 default=("未知", {"description": "未知"}))[1].get("description", "未知")
        
        selfview = belief_system.get("selfview", {})
        strongest_selfview = max(selfview.items(), 
                                key=lambda x: x[1].get("strength", 0), 
                                default=("未知", {"description": "未知"}))[1].get("description", "未知")
        
        values = belief_system.get("values", {})
        strongest_values = max(values.items(), 
                              key=lambda x: x[1].get("strength", 0), 
                              default=("未知", {"description": "未知"}))[1].get("description", "未知")
        
        return {
            "worldview": strongest_worldview[:50] + "..." if len(strongest_worldview) > 50 else strongest_worldview,
            "selfview": strongest_selfview[:50] + "..." if len(strongest_selfview) > 50 else strongest_selfview,
            "values": strongest_values[:50] + "..." if len(strongest_values) > 50 else strongest_values
        }

# 全局编译器实例
belief_compiler = BeliefCompiler()