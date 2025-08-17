"""
Helios图像生成服务
集成 https://mjtest-seven.vercel.app API
"""
import httpx
import os
from typing import Optional, Dict, Any
import json

class ImageGenerationService:
    def __init__(self):
        self.base_url = "https://mjtest-seven.vercel.app"
        
    async def generate_scene_image(self, scene_description: str, character_name: str = None) -> Optional[str]:
        """
        为场景生成图像
        
        Args:
            scene_description: 场景描述
            character_name: 角色名称（可选）
            
        Returns:
            图像URL或None
        """
        try:
            # 构建提示词
            prompt = self._build_scene_prompt(scene_description, character_name)
            
            # 调用图像生成API
            response = await self._call_image_api(prompt)
            
            if response and response.get('success'):
                return response.get('image_url')
            else:
                print(f"Image generation failed: {response}")
                return None
                
        except Exception as e:
            print(f"Error generating scene image: {e}")
            return None
    
    async def generate_character_portrait(self, character_data: Dict[str, Any]) -> Optional[str]:
        """
        生成角色肖像
        
        Args:
            character_data: 角色数据，包含name, role, motivation等
            
        Returns:
            图像URL或None
        """
        try:
            character_name = character_data.get('name', '未知角色')
            character_role = character_data.get('role', '神秘人物')
            motivation = character_data.get('core_motivation', '寻找自己的道路')
            
            # 构建角色肖像提示词
            prompt = f"""
港口城市中的{character_role} {character_name}，
{motivation}，
站在古老的港口酒馆前，
温暖的黄昏光线，
幻想艺术风格，
高质量，细节丰富
"""
            
            response = await self._call_image_api(prompt.strip())
            
            if response and response.get('success'):
                return response.get('image_url')
            else:
                return None
                
        except Exception as e:
            print(f"Error generating character portrait: {e}")
            return None
    
    def _build_scene_prompt(self, scene_description: str, character_name: str = None) -> str:
        """构建场景图像提示词"""
        base_prompt = f"""
{scene_description}，
古老神秘的港口城市，
温暖的魔法光芒，
幻想艺术风格，
高质量画面
"""
        
        if character_name:
            base_prompt += f"，{character_name}在场景中"
        
        return base_prompt.strip()
    
    async def _call_image_api(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        调用图像生成API
        
        Args:
            prompt: 图像生成提示词
            
        Returns:
            API响应或None
        """
        try:
            # 根据API文档调整请求格式
            payload = {
                "prompt": prompt,
                "model": "midjourney",  # 假设的参数
                "quality": "high"
            }
            
            # 发送请求到图像生成服务
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Image API returned status {response.status_code}: {response.text}")
                    return None
                    
        except httpx.RequestError as e:
            print(f"Error calling image API: {e}")
            return None
    
    def get_fallback_image(self, scene_type: str = "tavern") -> str:
        """获取备用图像URL"""
        fallback_images = {
            "tavern": "https://placeholder.com/600x400/8B4513/FFFFFF?text=Harbor+Tavern",
            "port": "https://placeholder.com/600x400/4682B4/FFFFFF?text=Harbor+Port", 
            "character": "https://placeholder.com/300x400/696969/FFFFFF?text=Character"
        }
        
        return fallback_images.get(scene_type, fallback_images["tavern"])

# 全局图像服务实例
image_service = ImageGenerationService()