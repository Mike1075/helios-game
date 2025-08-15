# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Helios** ("赫利俄斯") is a philosophical game project that creates a "consciousness exploration sandbox" - a "Prism of Consciousness" universe. Players invest their pure consciousness through unique belief systems, creating highly subjective experiences that together form an evolving shared reality.

The MVP goal is "Prism Heart" - a minimal world with 2 core NPCs and 1 simple scenario to validate the core experience loop: belief-based actions → cognitive dissonance → "Chamber of Echoes" self-reflection → belief evolution.

## Technical Architecture

- **Platform**: Vercel (unified deployment)
- **Frontend**: Next.js (`packages/web`)
- **Backend**: Python FastAPI on Vercel Serverless Functions (`packages/api`)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Memory Engine**: Zep (conversation history)
- **AI Gateway**: Vercel AI Gateway (mandatory for all LLM calls)
- **Workflow Engine**: n8n (cognitive dissonance triggers)

## Monorepo Structure

```
packages/
├── web/          # Next.js frontend
└── api/          # Python/FastAPI backend
```

## Development Commands

### Setup and Installation
```bash
# Initial setup (from root)
npm install
```

### Local Development (Zero-Trust Mode)
```bash
# Frontend development (UI debugging)
npm run dev:web

# Backend development (API logic, requires: pip install uvicorn fastapi)
npm run dev:api
```

**Important**: Local development runs without API keys. External API calls will fail (expected behavior). Complete functionality testing is done via GitHub PR Vercel preview environments.

## Core System Components

### 1. Belief System (信念系统)
- **Belief DSL**: YAML/JSON format for defining character belief networks
- **Belief Compiler**: Python script converting belief files to LLM system prompts
- **Components**: World-view beliefs, Self-perception beliefs, Value beliefs
- **Evolution Tracking**: Records cognitive dissonance events in `agent_logs`

### 2. Agent Core (代理核心)
- **Primary API**: `/api/chat` (receives `player_id` and `message`)
- **Process Flow**: Load beliefs from Supabase → Retrieve conversation history from Zep → Call LLM via Vercel AI Gateway → Log interaction
- **Response Requirement**: Fast, belief-consistent NPC responses

### 3. Chamber of Echoes (回响之室)
- **API Endpoint**: `/api/echo` (receives `player_id` and `event_id`)
- **Function**: Generates subjective, first-person causal explanations based on player's belief system
- **Output**: Subjective attribution + 1-2 supporting "memory evidence" events

### 4. Director Engine (导演引擎)
- **Implementation**: n8n workflow monitoring `agent_logs`
- **Trigger Logic**: Detects cognitive dissonance (positive actions → negative feedback)
- **Action**: Inserts records into `events` table to trigger Chamber of Echoes opportunities

## Mandatory Development Contracts

### Environment Variables (Managed by Mike via Vercel)
**重要**: 严格遵循 `.claude/Vercel AI 开发规范与标准.md` 中的环境变量命名规范

**Backend Variables** (Node.js `process.env.`):
- `AI_GATEWAY_API_KEY`: AI Gateway 认证密钥 (符合 Vercel AI 规范第2.2节)
- `SUPABASE_URL`: Database URL
- `SUPABASE_SERVICE_KEY`: Database service key

**Frontend Variables** (Next.js `process.env.`):
- `NEXT_PUBLIC_SUPABASE_URL`: Public database URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public database key

**Note**: Never hardcode secrets. Variables are only available in Vercel preview/production environments, not locally.

### LLM Call Standard
**重要**: 严格遵循 Vercel AI SDK 5 开发规范 (`.claude/Vercel AI 开发规范与标准.md` 第3节)

All AI model calls **MUST** use Vercel AI SDK 5:

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import 'dotenv/config';

// 使用标准模型名称格式: creator/model-name (规范第4.1节)
const result = await streamText({
  model: openai('openai/gpt-4o'), // 符合 Vercel AI 规范的模型命名
  prompt: user_message,
});

// AI_GATEWAY_API_KEY 环境变量自动被 AI SDK 使用 (规范第2.2节)
return result.toAIStreamResponse();
```

## Git Workflow

### Branch Naming Convention
- `feature/[name]/[description]` - New features
- `fix/[name]/[description]` - Bug fixes
- Example: `feature/ethan/agent-core-base`

### Zero-Trust Development Workflow
1. **Sync**: `git checkout main && git pull origin main`
2. **Create branch**: `git checkout -b feature/your-name/your-feature`
3. **Local coding**: Use `npm run dev:web` or `npm run dev:api` for development
4. **Push**: `git push origin feature/your-name/your-feature`
5. **Create PR**: Submit PR with Vercel preview deployment link for cloud testing
6. **Code review**: Wait for Mike's approval and merge

**Critical**: 
- Never push directly to `main` branch
- Local development is for coding only
- Full functionality testing happens in Vercel preview environments

## MVP Scope

### ✅ In Scope
- Text-only frontend interface
- Simple belief system generation
- One scenario (tavern setting)
- Two NPCs with Belief DSL-defined personalities
- Complete core loop: conversation → logging → conflict detection → Chamber of Echoes trigger → subjective attribution

### ❌ Out of Scope
- Graphics, images, visual content
- Offline AI agents
- Complex world-building systems
- Multiple scenes/NPCs
- Combat, inventory, quest systems

## Success Criteria

1. **Belief Consistency**: NPCs demonstrate clear alignment between behavior and defined belief systems
2. **"Aha!" Moments**: Players experience "my thoughts created this outcome" realizations in Chamber of Echoes
3. **Technical Viability**: Full stack integration (Vercel, Supabase, n8n, Zep) operates smoothly

## Key Files to Watch

- `vercel.json`: Deployment configuration
- `packages/api/main.py`: FastAPI backend entry point
- `packages/api/requirements.txt`: Python dependencies
- `packages/web/`: Next.js frontend application