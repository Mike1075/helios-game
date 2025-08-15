



### **Vercel AI 开发规范与标准**

**文档版本:** 1.0
**最后更新:** 2025年8月14日

#### **1. 概述**

本规范旨在为使用 Vercel 平台进行 AI 应用开发的团队提供一套统一的标准和最佳实践。目标是通过 Vercel AI Gateway 实现对多种大语言模型（LLM）的统一访问和管理，并利用 Vercel AI SDK 5 简化和标准化应用的开发流程。所有 AI 相关开发工作均须遵循本规范。

---

#### **2. Vercel AI Gateway 规范**

AI Gateway 是所有 AI 请求的统一入口点，它提供了一个单一的 API 终端，用于访问超过100种模型，并实现了高可靠性、成本监控和无缝的模型切换。

**2.1. 核心特性**

* **统一 API**: 使用统一的接口格式，以最小的代码改动切换不同的模型和提供商。
* **高可靠性**: 当主模型或提供商出现故障时，能自动重试或切换到备用选项。
* **成本监控**: 在统一的仪表盘中监控和管理跨多个提供商的 API 调用开销。
* **嵌入支持**: 支持为搜索、检索等任务生成向量嵌入。

**2.2. 认证标准**

* 所有到 AI Gateway 的请求都必须通过 API 密钥进行认证。
* 在项目根目录下创建一个 `.env` 文件。
* 将从 Vercel 仪表盘获取的 API 密钥存储在环境变量 `AI_GATEWAY_API_KEY` 中。

**.env 文件示例:**

```
AI_GATEWAY_API_KEY=your_ai_gateway_api_key
```

AI SDK 将自动使用此环境变量进行请求认证。

---

#### **3. Vercel AI SDK 5 开发规范**

AI SDK 5 是一个面向 TypeScript/JavaScript 的开源工具包，用于构建全栈 AI 应用。它提供了类型安全、模块化和高度可扩展的开发体验。

**3.1. 核心库与功能**

* **AI SDK Core**: 提供与模型交互的统一核心 API。
  * **文本生成 (`streamText` / `generateText`)**: 用于标准的文本问答和内容生成。
  * **结构化数据生成 (`streamObject` / `generateObject`)**: 用于从模型获取严格类型的 JSON 对象。必须使用 `zod` 定义数据模式 (schema) 以确保类型安全和输出的可靠性。
  * **工具调用 (`tool`)**: 允许模型调用外部函数或 API。工具的定义和执行必须遵循类型安全标准。

**3.2. 代码实现标准与示例**

* **文本生成示例:**
  
  ```typescript
  import { streamText } from 'ai';
  import { openai } from '@ai-sdk/openai';
  import 'dotenv/config';
  
  const { textStream } = await streamText({
    model: openai('openai/gpt-4o'), // 必须使用标准模型名称
    prompt: '请介绍一下旧金山教会区的墨西哥卷饼历史。'
  });
  
  for await (const delta of textStream) {
    process.stdout.write(delta);
  }
  ```

* **结构化数据生成示例 (使用 Zod):**
  
  ```typescript
  import { generateObject } from 'ai';
  import { openai } from '@ai-sdk/openai';
  import { z } from 'zod';
  import 'dotenv/config';
  
  const { object } = await generateObject({
    model: openai('openai/gpt-4o'),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
        steps: z.array(z.string()),
      })
    }),
    prompt: '生成一份千层面食谱。',
  });
  // 'object' 将是严格符合 schema 的类型安全对象
  ```

**3.3. AI SDK 5 关键特性规范**

* **类型安全的聊天 (`useChat`)**:
  * 必须区分 **`UIMessage`** (用于UI状态和持久化，包含元数据和工具结果) 和 **`ModelMessage`** (发送给模型的精简消息)。
  * 可为 `UIMessage` 附加类型安全的元数据 (`meta`) 和自定义数据 (`data`)。
* **代理循环控制 (Agentic Loop Control)**:
  * 在构建需要多步工具调用的代理时，必须使用 `stopWhen` 定义明确的停止条件，以防止无限循环。
  * 使用 `prepareStep` 在代理执行的每一步前动态调整上下文，如更换模型、修改系统提示或筛选可用工具。
* **框架与协议**:
  * 所有流式传输优先采用**服务器发送事件 (SSE)** 协议。
  * 确保在 React, Vue, Svelte, Angular 等主流框架中遵循一致的开发模式。
* **实验性功能**:
  * 语音生成 (`experimental_generateSpeech`) 和语音转录 (`experimental_transcribe`) 功能仅用于实验性项目，不用于生产环境。

---

#### **4. 标准模型名称列表**

所有通过 Vercel AI Gateway 和 SDK 进行的模型调用，都**必须**使用 `厂商/模型具体名称` 的统一格式。

**4.1. 命名标准**

* **格式**: `creator/model-name`
* **示例**: `openai/gpt-4o`, `anthropic/claude-3-haiku-20240307`
* **目的**: 这种格式确保了在代码库中可以灵活、快速地切换模型，而无需修改提供商相关的实例化代码。

**4.2. 官方模型名称列表**

以下是根据您提供的信息整理的主流模型准确名称列表。

| 通俗名称 (Common Name) | 准确名称 (API Name) - **必须在代码中使用** |
|:------------------ |:------------------------------ |
| Claude Sonnet 4    | `anthropic/claude-sonnet-4`    |
| GPT-4o             | `openai/gpt-4o`                |
| Grok 4             | `xai/grok-4`                   |
| Qwen 3 235B        | `alibaba/qwen-3-235b`          |
| DeepSeek R1        | `deepseek/deepseek-r1`         |
| DeepSeek V3        | `deepseek/deepseek-v3`         |
| *GPT-5 (Nano)*     | `openai/gpt-5-nano`            |
| *GPT-5*            | `openai/gpt-5`                 |
| *GPT-5 (Mini)*     | `openai/gpt-5-mini`            |
| *Gemini 2.5 Pro*   | `google/gemini-2.5-pro`        |
| *Gemini 2.5 Flash* | `google/gemini-2.5-flash`      |

**
