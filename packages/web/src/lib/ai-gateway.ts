import { openai } from '@ai-sdk/openai';

// 检查AI Gateway是否配置
export function isAIGatewayConfigured(): boolean {
  return !!process.env.AI_GATEWAY_API_KEY;
}

// 获取配置状态用于调试
export function getAIGatewayStatus() {
  return {
    hasKey: !!process.env.AI_GATEWAY_API_KEY,
    keyLength: process.env.AI_GATEWAY_API_KEY?.length || 0,
  };
}

// 导出配置好的OpenAI provider
export { openai };