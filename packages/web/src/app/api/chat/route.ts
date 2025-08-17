import { StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const aiGatewayKey = process.env.AI_GATEWAY_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;
  const openAIBaseURL = process.env.OPENAI_BASE_URL;

  const debugInfo = {
    "--- Vercel 环境诊断报告 ---": " ",
    "1. 团队规范变量 (AI_GATEWAY_API_KEY)": {
      "是否存在": !!aiGatewayKey,
      "值的前4位": aiGatewayKey?.substring(0, 4) || "未找到",
    },
    "2. Vercel 自动注入的标准变量": {
      "OPENAI_API_KEY 是否存在": !!openAIKey,
      "OPENAI_API_KEY 前4位": openAIKey?.substring(0, 4) || "未找到",
      "OPENAI_BASE_URL 是否存在": !!openAIBaseURL,
      "OPENAI_BASE_URL 的值": openAIBaseURL || "未找到",
    },
    "--- 诊断结束 ---": " "
  };

  const jsonString = JSON.stringify(debugInfo, null, 2);
  
  // Create a ReadableStream from the JSON string
  const readableStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(jsonString));
      controller.close();
    },
  });

  // Respond with the stream
  return new StreamingTextResponse(readableStream);
}
