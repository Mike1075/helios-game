# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Helios** ("赫利俄斯") v4.1 is a philosophical game project that creates a "consciousness exploration sandbox" - a **"Mirror of the Self"** universe. The core philosophy: we don't create beliefs, we **discover** them. Players inject their authentic inner humanity, and the game reflects their hidden belief systems back to them, allowing them to see their true "self" for the first time.

The MVP goal is "Genesis Heart" ("创世之心") - a micro-society with **7-8 AI NPCs** and **3-4 human player slots** in a single core scene (harbor tavern) to validate the complete emergent cycle: emergent beliefs → cognitive dissonance → "Chamber of Echoes" introspection → belief evolution.

## Technical Architecture (v4.1)

- **Platform**: Vercel (unified deployment)
- **Frontend**: Next.js (`packages/web`)
- **Backend**: Python FastAPI on Vercel Serverless Functions (`packages/api`)
- **Database**: Supabase (PostgreSQL + Triggers + Edge Functions)
- **Memory Engine**: Zep (conversation history)
- **AI Gateway**: Vercel AI Gateway (mandatory for all LLM calls)
- **Director Engine**: ~~n8n~~ → **Supabase Database Triggers + Edge Functions**

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

### 1. Belief System (信念系统) - "Emergent Discovery" Model
- **Initial State**: Characters start with only `identity`, `role`, and `core_motivation` - NO pre-defined beliefs
- **Belief Observer**: Supabase database function + trigger that analyzes behavioral patterns every N interactions
- **Dynamic Generation**: LLM analyzes `agent_logs` to infer and generate character's hidden belief system in YAML format  
- **Evolution Tracking**: Continuous belief refinement based on cognitive dissonance events
- **Storage**: Generated beliefs stored in `belief_systems` table, updated asynchronously

### 2. Agent Core (代理核心)
- **Primary API**: `/api/chat` (receives `player_id` and `message`)
- **Process Flow**: Load beliefs from Supabase → Retrieve conversation history from Zep → Call LLM via Vercel AI Gateway → Log interaction
- **Response Requirement**: Fast, belief-consistent NPC responses

### 3. Chamber of Echoes (回响之室)
- **API Endpoint**: `/api/echo` (receives `player_id` and `event_id`)
- **Function**: Generates subjective, first-person causal explanations based on player's belief system
- **Output**: Subjective attribution + 1-2 supporting "memory evidence" events

### 4. Director Engine (导演引擎) - Database-Native
- **Implementation**: Supabase database triggers + edge functions (NO external n8n)
- **Cognitive Dissonance Trigger**: Database function monitoring `agent_logs` for belief conflicts
- **Belief Observer Trigger**: Activates every N records per character to update belief systems
- **Performance**: Millisecond-level response vs n8n's minute-level delays

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
**重要**: 严格遵循 Vercel AI SDK 5 开发规范

All AI model calls **MUST** use Vercel AI Gateway through standard model naming:

```python
# Python backend uses OpenAI client configured for Vercel AI Gateway
import openai
client = openai.OpenAI(api_key=os.getenv("AI_GATEWAY_API_KEY"))

response = client.chat.completions.create(
    model="gpt-4o-mini",  # Standard model naming for Vercel AI Gateway
    messages=[{"role": "system", "content": belief_system_prompt}],
    max_tokens=150
)
```

```typescript
// Frontend uses Vercel AI SDK 5 (when needed)
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await streamText({
  model: openai('openai/gpt-4o'),
  prompt: user_message,
});
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

## MVP Scope v4.1 "Genesis Heart"

### ✅ In Scope
- **7-8 AI NPCs** with emergent belief discovery (not pre-defined)
- **3-4 human player slots** for authentic human testing
- **Single core scene**: Harbor tavern social ecosystem 
- **Belief Observer system**: Database-driven behavioral analysis
- **Complete Mirror cycle**: authentic actions → belief discovery → cognitive dissonance → Chamber of Echoes introspection → belief evolution
- **Database-native Director Engine**: No external workflow dependencies

### ❌ Out of Scope
- Graphics, images, visual content
- Multiple scenes or complex world-building
- Combat, inventory, quest systems
- Pre-defined character belief systems
- External n8n workflows

## Success Criteria v4.1

1. **Emergent Belief Discovery**: System successfully infers and generates authentic belief systems from behavioral patterns
2. **"Mirror" Moments**: Players experience profound "this is really me" realizations when seeing their discovered beliefs
3. **Social Ecosystem**: 7-8 NPCs + 3-4 players create unpredictable emergent social dynamics and relationships
4. **Technical Viability**: Full database-native stack (Vercel + Supabase + Zep) operates with millisecond responsiveness

## Key Files to Watch

- `vercel.json`: Deployment configuration
- `packages/api/main.py`: FastAPI backend entry point
- `packages/api/requirements.txt`: Python dependencies
- `packages/web/`: Next.js frontend application