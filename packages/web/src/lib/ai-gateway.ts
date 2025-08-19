import { createOpenAI } from '@ai-sdk/openai';

// Vercel AI Gateway配置
const getAIGateway = () => {
  if (!process.env.VERCEL_AI_GATEWAY_URL || !process.env.VERCEL_AI_GATEWAY_API_KEY) {
    throw new Error('Vercel AI Gateway not configured');
  }
  
  return createOpenAI({
    baseURL: process.env.VERCEL_AI_GATEWAY_URL,
    apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// 创建model helper function
export function aiGateway(modelName: string) {
  const gateway = getAIGateway();
  return gateway(modelName);
}

// 检查AI Gateway是否配置正确
export function isAIGatewayConfigured(): boolean {
  return !!(process.env.VERCEL_AI_GATEWAY_URL && process.env.VERCEL_AI_GATEWAY_API_KEY);
}

// 获取配置状态用于调试
export function getAIGatewayStatus() {
  return {
    hasURL: !!process.env.VERCEL_AI_GATEWAY_URL,
    hasKey: !!process.env.VERCEL_AI_GATEWAY_API_KEY,
    keyLength: process.env.VERCEL_AI_GATEWAY_API_KEY?.length || 0,
    urlLength: process.env.VERCEL_AI_GATEWAY_URL?.length || 0,
  };
}