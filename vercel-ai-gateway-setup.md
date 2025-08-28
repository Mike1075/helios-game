# Helios 项目 Vercel AI Gateway 接入指南（正确 vs 错误）

目标
- 在不使用厂商 API Key 的前提下，仅用 Vercel AI Gateway 完成 AI 推理（Baseten 提供的 Qwen）。
- 记录正确的环境变量、代码范式与排障流程，避免“Not Found / DEPLOYMENT_NOT_FOUND / Gateway access failed”等常见坑。

适用范围
- 本仓库 packages/web（Next.js 14）
- 已在 Vercel AI Gateway 中为 Baseten 配置了模型（例如：qwen-3-235b）


一、名词澄清（避免混淆）
- Gateway Token（正确使用的 Token）
  - 用于调用 Vercel AI Gateway 的推理网关（OpenAI 兼容端点）
  - 在 Vercel Dashboard → AI → Gateway → Tokens 页面创建
  - 与项目管理用的 Access Token / REST Token 不同

- Gateway URL（OpenAI Compatible Gateway URL）
  - 用于 AI SDK Provider 的 baseURL，示例：https://ai-gateway.vercel.sh/v1（或模型页提供的 URL）
  - 必须与 Gateway Token 配对使用

- 模型别名（alias）
  - 在 Gateway 模型页配置的模型标识，如：qwen-3-235b
  - 代码里以字符串传入，网关据此路由到 Baseten 上游


二、正确做法（方案 2：Vercel AI Gateway + Baseten）
1) 在 Vercel AI Gateway 配置 Baseten 模型
- 确认“Models & Providers”里存在 Baseten + 你的 Qwen 模型（示例 alias：qwen-3-235b）

2) 获取网关凭据
- 在模型页/Endpoints 复制 OpenAI Compatible Gateway URL
- 在 Gateway → Tokens 页面创建 Gateway Token

3) 本地环境变量（packages/web/.env.local）
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Vercel AI Gateway（Baseten via OpenAI-compatible endpoint）
VERCEL_AI_GATEWAY_URL=https://ai-gateway.vercel.sh/v1
VERCEL_AI_GATEWAY_TOKEN=你的 Gateway Token
```
变更 .env 后必须重启本地 dev：cd packages/web; npm run dev

4) 服务端 Provider 显式配置（不要依赖“默认 Provider”）
```ts
// packages/web/src/app/api/chat/route.ts 核心片段
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,   // OpenAI Compatible Gateway URL
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,  // Gateway Token
});

// 正确：使用 openai.chat(...) 走 /chat/completions
const { text } = await generateText({
  model: openai.chat("qwen-3-235b"),            // 使用 Gateway 中配置的模型别名
  system: "你是 Helios 的对话 AI，简洁友好地回复用户。",
  prompt: userMessage,
  temperature: 0.6,
  maxTokens: 800,
});
```

5) 连通性探针（已内置）
- GET /api/ai-probe 检查 env 读取情况（返回 hasVERCEL_AI_GATEWAY_URL/TOKEN）
- POST /api/ai-probe 直连网关，成功应返回：
  { ok: true, modelUsed: "qwen-3-235b", text: "..." }

6) 聊天 API 流程（MVP）
- 前端发送消息 → /api/chat
- /api/chat：
  - upsert players / insert chat_messages（服务端使用 service_role）
  - 调用 AI（openai.chat + Gateway）
  - insert 助手回复
  - 非阻塞触发 Edge Function（database-access）进行会话总结与信念更新
- 返回 JSON：{ ok, reply, playerId, modelUsed }

7) 前端输入法注意（避免“明明输入却被判空”）
- 中文 IME 合成阶段会导致 Enter 早于内容提交
- 处理方式：使用 inputRef + composition 事件检测；发送时从 DOM 读取实际值；按钮 type="button"；底部输入栏提高 z-index 与 pointer-events


三、错误做法（典型踩坑清单）
- 用 REST/Access Token 代替 “Gateway Token”
  - 现象：/api/ai-probe 或 /api/chat 返回 404/DEPLOYMENT_NOT_FOUND
  - 原因：REST/Access Token 只用于管理 API，不具备网关推理路由权限

- 仅写 model: "alibaba/qwen-3-235b" 但未注册默认 Provider
  - 现象：Gateway access failed / Not Found
  - 解决：显式 provider（createOpenAI + baseURL + apiKey）或在项目中注册默认 Provider

- 走 /v1/responses 而非 Chat Completions
  - 现象：Not Found
  - 解决：使用 openai.chat("alias")，走 /v1/chat/completions

- 模型别名与 Gateway 配置不一致
  - 现象：404 或 Not Found
  - 解决：以 Gateway 模型页展示的 alias 为准（如 qwen-3-235b）

- .env 变更未重启
  - 现象：后端报 missing env
  - 解决：修改 .env 后必须重启 dev

- Next API 路由 runtime 重复定义或 Edge/Node 不兼容
  - 现象：编译失败；randomUUID 不可用
  - 解决：唯一的 export const runtime = "nodejs"; 并使用 globalThis.crypto.randomUUID() 安全回退


四、快速排障流程（强烈建议按顺序）
1) 环境变量
- 打开 http://localhost:3000/api/ai-probe
  - 必须：{"hasVERCEL_AI_GATEWAY_URL": true, "hasVERCEL_AI_GATEWAY_TOKEN": true}
  - 否则：检查 .env.local 是否已写入且已重启

2) 直连探针
- 控制台执行：
  fetch("/api/ai-probe",{method:"POST"}).then(r=>r.json()).then(console.log)
- 结果判断：
  - ok: true → 网关配置与模型路由正常
  - 401/403 → Token 无效或权限不足（确保使用 Gateway Token）
  - 404 → URL 或 alias 不匹配 Gateway（确认使用 OpenAI Compatible Gateway URL 与正确 alias）
  - 429/5xx → 网关故障/限流，稍后重试

3) 聊天接口
- 若 /api/ai-probe OK，但 /api/chat 失败：
  - 查看浏览器 Network → /api/chat → Response（已返回 detail）
  - 常见 detail：
    - missing env → 未读取到 Gateway URL/Token，重启
    - ai_generate_failed/Not Found → alias 错或走了错误端点
    - supabase insert failed → RLS 或表结构问题（执行 migrations 并使用 service_role）


五、最小可用代码片段（完整示例）

1) /api/ai-probe（已存在）
```ts
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const openai = createOpenAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
});

export async function GET() {
  return NextResponse.json({
    hasVERCEL_AI_GATEWAY_URL: Boolean(process.env.VERCEL_AI_GATEWAY_URL),
    hasVERCEL_AI_GATEWAY_TOKEN: Boolean(process.env.VERCEL_AI_GATEWAY_TOKEN),
  });
}

export async function POST() {
  try {
    const { text } = await generateText({
      model: openai.chat("qwen-3-235b"),
      prompt: "ping",
      maxTokens: 8,
      temperature: 0.2,
    });
    return NextResponse.json({ ok: true, modelUsed: "qwen-3-235b", text });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "probe_failed", detail: e?.message || String(e) }, { status: 500 });
  }
}
```

2) /api/chat（已存在，略）
- 关键点：openai.chat("qwen-3-235b") + baseURL/Token 来自 Gateway
- 失败时返回 detail，前端展示 error + detail
- 完成后写入 chat_messages 并触发 Edge Function（database-access）


六、TL;DR
- 只用 Vercel + 模型名想要成功，必须：Gateway URL + Gateway Token + 模型 alias 三件套齐备
- 代码层面：createOpenAI({ baseURL: GatewayURL, apiKey: GatewayToken }).chat("alias")
- 变更 .env 必须重启
- 先用 /api/ai-probe 自检，再测 /api/chat
- 避免将 REST/Access Token 误当作 Gateway Token


附：本项目易错点与已修复
- 输入法合成导致 Enter 判空：已加 composition 处理
- 按钮默认 submit 行为：已加 type="button"
- runtime 定义重复：统一 export const runtime = "nodejs"
- 错误详情未透出：后端统一返回 detail，前端显示 error + detail

如需将前端改为流式输出，或在页面展示最新 conversation/belief 概要，请在任务单中提出。