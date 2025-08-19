// 检查OpenAI是否配置
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// 获取配置状态用于调试
export function getOpenAIStatus() {
  return {
    hasKey: !!process.env.OPENAI_API_KEY,
    keyLength: process.env.OPENAI_API_KEY?.length || 0,
  };
}