"""
Helios Game - Pydantic数据模型
定义API请求和响应的数据结构
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

# =============================================
# 请求模型
# =============================================

class ChatRequest(BaseModel):
    """聊天请求模型"""
    player_id: str = Field(..., description="玩家角色ID")
    message: str = Field(..., description="玩家输入的消息", min_length=1)
    session_id: Optional[str] = Field(None, description="会话ID，用于对话上下文")
    scene_id: str = Field(default="harbor_tavern", description="当前场景ID")
    target_npc_id: Optional[str] = Field(None, description="目标NPC ID，如果不指定则由系统选择")

class EchoRequest(BaseModel):
    """回响之室请求模型"""
    player_id: str = Field(..., description="玩家角色ID")
    event_id: Optional[str] = Field(None, description="触发事件ID")
    confusion_text: str = Field(..., description="玩家困惑的描述", min_length=1)
    context: Optional[Dict[str, Any]] = Field(None, description="额外上下文信息")

class ActionRequest(BaseModel):
    """行动请求模型"""
    player_id: str = Field(..., description="玩家角色ID")
    action_type: str = Field(..., description="行动类型: 'move', 'observe', 'interact'等")
    action_data: Dict[str, Any] = Field(..., description="行动数据")
    scene_id: str = Field(default="harbor_tavern", description="当前场景ID")

# =============================================
# 响应模型
# =============================================

class NPCResponse(BaseModel):
    """NPC响应模型"""
    npc_id: str = Field(..., description="响应的NPC ID")
    npc_name: str = Field(..., description="NPC名称")
    message: str = Field(..., description="NPC回复内容")
    emotion: Optional[str] = Field(None, description="NPC当前情绪")
    action: Optional[str] = Field(None, description="NPC采取的行动")
    internal_thought: Optional[str] = Field(None, description="NPC内心想法（调试用）")

class ChatResponse(BaseModel):
    """聊天响应模型"""
    success: bool = Field(..., description="请求是否成功")
    message: str = Field(..., description="系统消息或错误信息")
    npc_response: Optional[NPCResponse] = Field(None, description="NPC响应")
    scene_update: Optional[Dict[str, Any]] = Field(None, description="场景状态更新")
    session_id: str = Field(..., description="会话ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="响应时间")

class EchoResponse(BaseModel):
    """回响之室响应模型"""
    success: bool = Field(..., description="请求是否成功")
    message: str = Field(..., description="系统消息或错误信息")
    subjective_attribution: Optional[str] = Field(None, description="主观因果归因")
    memory_evidence: Optional[List[str]] = Field(None, description="支持记忆证据列表")
    belief_insight: Optional[str] = Field(None, description="信念洞察")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="响应时间")

class SceneInfo(BaseModel):
    """场景信息模型"""
    scene_id: str = Field(..., description="场景ID")
    name: str = Field(..., description="场景名称")
    description: str = Field(..., description="场景描述")
    active_characters: List[Dict[str, Any]] = Field(..., description="场景中的活跃角色")
    atmosphere: Dict[str, Any] = Field(default_factory=dict, description="场景氛围")

class CharacterInfo(BaseModel):
    """角色信息模型"""
    id: str = Field(..., description="角色ID")
    name: str = Field(..., description="角色名称")
    role: str = Field(..., description="角色职业/身份")
    is_player: bool = Field(..., description="是否为玩家角色")
    is_active: bool = Field(..., description="是否活跃")
    belief_summary: Optional[str] = Field(None, description="信念系统摘要")

# =============================================
# 内部处理模型
# =============================================

class BeliefSystem(BaseModel):
    """信念系统模型"""
    worldview: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="世界观信念")
    selfview: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="自我认知信念")
    values: Dict[str, float] = Field(default_factory=dict, description="价值观权重")

class InteractionLog(BaseModel):
    """交互日志模型"""
    character_id: str = Field(..., description="角色ID")
    action_type: str = Field(..., description="行动类型")
    input_data: Dict[str, Any] = Field(..., description="输入数据")
    output_data: Dict[str, Any] = Field(..., description="输出数据")
    scene_id: str = Field(..., description="场景ID")
    session_id: Optional[str] = Field(None, description="会话ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="时间戳")

class CognitionDissonance(BaseModel):
    """认知失调事件模型"""
    character_id: str = Field(..., description="角色ID")
    description: str = Field(..., description="失调事件描述")
    conflict_level: float = Field(..., description="冲突强度 0.0-1.0", ge=0.0, le=1.0)
    belief_challenged: str = Field(..., description="被挑战的信念")
    trigger_context: Dict[str, Any] = Field(..., description="触发上下文")

# =============================================
# 配置模型
# =============================================

class APIConfig(BaseModel):
    """API配置模型"""
    local_dev_mode: bool = Field(default=True, description="本地开发模式")
    ai_gateway_url: Optional[str] = Field(None, description="AI Gateway URL")
    ai_gateway_key: Optional[str] = Field(None, description="AI Gateway API Key")
    supabase_url: Optional[str] = Field(None, description="Supabase URL")
    supabase_key: Optional[str] = Field(None, description="Supabase Service Key")
    zep_api_key: Optional[str] = Field(None, description="Zep API Key")

# =============================================
# 错误模型
# =============================================

class APIError(BaseModel):
    """API错误模型"""
    error_type: str = Field(..., description="错误类型")
    message: str = Field(..., description="错误消息")
    details: Optional[Dict[str, Any]] = Field(None, description="错误详情")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="错误时间")