CURSOR_PROMPT.md — Helios v4.1「本我之境/镜」开发脚手架
0) 背景与目标（给 AI 的项目上下文）

项目：Helios，游戏原型，核心理念：事件即时间、见证即创造、无预设信念系统。

架构选择：Next.js (App Router) + TypeScript + Vercel Functions（Node/Edge）+ Vercel AI SDK 5 + Supabase (Postgres)。

世界引擎：数据库事件驱动。玩家/AI 的每条发言先落库（agent_logs），由 Supabase 触发器 + Edge Functions 在毫秒级回调里进行：

信念观察者（belief-observer）：基于近期行为生成/更新 belief_systems.belief_yaml（不预设）。

认知失调催化（dissonance-catalyst）：计算“冲突指数”，超过阈值写入 events。

（前端按钮）回响之室/主观归因（echo）：读取该玩家 belief_yaml + 近期日志，生成“主观解释”。

协作基线：零信任本地（本地不放密钥）、一切联调在 Vercel 预览（PR 必带 Preview 链接与 What/Why）。

你（Cursor / GPT-5）的职责：按下述任务顺序增量改代码、生成必须文件、保证可在 Vercel 预览跑通。若缺密钥，必须优雅降级（不崩溃）。

1) 约束与标准（必须遵守）

AI SDK 5：统一用 ai 包及其模型接入（如 openai/gpt-4o、anthropic/claude-sonnet-4、google/gemini-2.5-pro 等，后续可以一行替换）。

SSE 流式：后端优先使用 streamText，前端可先整条展示，随后可切 ai/react 的 useChat 做流式。

写库优先：每条 user/ai 发言都写入 agent_logs（服务端使用 SUPABASE_SERVICE_KEY）。

无本地密钥：任何本地调试代码遇到 process.env 缺失必须降级（提示“预览未注入密钥”），但不影响页面起跑。

类型安全：TypeScript 严格开启（strict: true）；API 入参/出参定义 zod 或 type。

提交规范：Conventional Commits（如 feat: … chore: …）；每次变更生成简明 PR 描述（What/Why）。

可观测：关键流程加 console.info()（仅在服务器侧），便于 Vercel Logs 定位问题。

2) 环境变量（只存在 Vercel；Fork PR 需维护者批准暴露）

AI_GATEWAY_API_KEY / 或适配的 OPENAI_API_KEY 等（统一通过 AI Gateway 最佳）

SUPABASE_URL

SUPABASE_SERVICE_KEY（Supabase Service Role Key，仅服务端）

Supabase Edge Functions 内部：SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（Deno 环境名）

要求：代码中严禁硬编码密钥；读取不到时必须降级。

3) 目录与文件（请按需创建/修改）

packages/web/app/page.tsx — 聊天 UI（最简），含“回响之室”按钮。

packages/web/app/api/chat/route.ts — 使用 AI SDK 5 的聊天 API（SSE），并写入 agent_logs。

packages/web/app/api/logs/route.ts — 拉取最近对话历史（便于刷新后回显）。

supabase/sql/001_init.sql — 初始化表结构（agent_logs、belief_systems、events、characters 可选）。

supabase/sql/010_triggers.sql — 触发器，用 pg_net/net.http_post 调用边缘函数。

supabase/functions/belief-observer/index.ts — Deno 边缘函数：从行为生成/更新 belief_yaml。

supabase/functions/dissonance-catalyst/index.ts — Deno 边缘函数：计算冲突指数 → 写 events。

supabase/functions/echo/index.ts — Deno 边缘函数：回响之室（主观归因返回文本）。

docs/PR_CHECKLIST.md — PR 自检清单（What/Why、预览链接、环境变量批准）。

若仓库结构略有不同，请自动识别并放置到等价位置（App Router 优先）。

4) 实施顺序（让项目尽快“动起来”）

第 1 步：最小可跑聊天（SSE + 写库）
A. 新增/改造 /app/api/chat/route.ts：

接收 { session_id, message }（session_id 可用前端 localStorage 生成 sess_xxx）。

先 insert 一条 user 到 agent_logs。

调 streamText（模型先用 openai/gpt-4o；可通过 AI Gateway）。

在 onFinish 时把汇总文本插入 agent_logs（speaker = 'ai'）。

返回 result.toAIStreamResponse()（SSE）。
B. 新增 /app/api/logs/route.ts：按 session_id 查询最近 N 条日志（返回按时间正序）。
C. 前端 page.tsx：最简 UI，发送→调用 /api/chat，先整条显示；页面加载时调用 /api/logs 还原历史。

第 2 步：数据库驱动的世界引擎
A. supabase/sql/001_init.sql：

agent_logs(id, session_id, speaker, text, meta, ts)

belief_systems(character_id, belief_yaml, last_updated)

events(id, session_id, type, payload, ts)
（可选 characters 表：注册玩家/NPC）
B. supabase/sql/010_triggers.sql：

AFTER INSERT ON agent_logs → net.http_post 调 belief-observer + dissonance-catalyst。
C. 边缘函数：

belief-observer：取最近 50 条该角色/会话日志 → 调模型 → 生成/更新 YAML → upsert belief_systems。

dissonance-catalyst：取最近 20 条 → 计算一个简化冲突分 → 若超阈值 → insert events。

echo：接收 character_id/session_id/message → 拉 belief_yaml+近期日志 → 生成第一人称主观解释 → 返回。

第 3 步：回响之室按钮接通

前端按钮改为调用一个 Web API（你可以先做 /app/api/echo/route.ts 代理到 Supabase Edge Function，或直接 CORS 调用 Supabase Function URL），返回“主观解释”文本并展示。

第 4 步：打磨与对齐规范

将前端改用 ai/react 的 useChat（或 useStreamableValue）实现流式渲染、打字机效果；

为 API 入参加 zod 校验与错误码；

加基本 Loading/Error 态；

重要路径添加 console.info（仅服务器）；

补 docs/PR_CHECKLIST.md。

5) 关键代码模板（请在对应路径创建/覆盖）
5.1 /app/api/chat/route.ts（AI SDK 5 + SSE + server-side logging）
// packages/web/app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function sb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  const { session_id = 'demo', message } = await req.json();
  const supabase = sb();

  // 1) log user
  try {
    await supabase?.from('agent_logs').insert({ session_id, speaker: 'user', text: message, meta: {} });
  } catch (e) { console.info('[agent_logs][user] skip due to env or error'); }

  // 2) AI stream
  const result = await streamText({
    model: openai('openai/gpt-4o'), // can be routed by AI Gateway
    prompt: message,
  });

  // 3) log ai on finish
  result.onFinish(async ({ text }) => {
    try {
      await supabase?.from('agent_logs').insert({ session_id, speaker: 'ai', text, meta: {} });
    } catch (e) { console.info('[agent_logs][ai] skip due to env or error'); }
  });

  return result.toAIStreamResponse();
}

5.2 /app/api/logs/route.ts
// packages/web/app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return NextResponse.json([]);
  const sb = createClient(url, key);

  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get('session_id') ?? 'demo';

  const { data } = await sb
    .from('agent_logs')
    .select('*')
    .eq('session_id', session_id)
    .order('ts', { ascending: false })
    .limit(40);

  const list = (data ?? []).reverse();
  return NextResponse.json(list);
}

5.3 page.tsx（最简 UI，先整条展示，后续可切流式 Hook）
'use client';
import { useEffect, useState } from 'react';
type Msg = { role:'user'|'ai'; text:string };
const SID_KEY = 'helios_session_id';

function getSessionId() {
  let v = localStorage.getItem(SID_KEY);
  if (!v) { v = 'sess_' + Math.random().toString(36).slice(2); localStorage.setItem(SID_KEY, v); }
  return v;
}

export default function ChatPage() {
  const [sid] = useState(getSessionId);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [echo, setEcho] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/logs?session_id=${encodeURIComponent(sid)}`, { cache: 'no-store' });
        const data = await res.json();
        setMsgs((data || []).filter((r:any)=>r.speaker==='user'||r.speaker==='ai')
          .map((r:any)=>({ role:r.speaker, text:r.text })));
      } catch {}
    })();
  }, [sid]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput(''); setMsgs(m=>[...m,{role:'user',text}]); setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ session_id: sid, message: text })
      });
      const ai = await res.text(); // SSE 简化整条收
      setMsgs(m=>[...m,{role:'ai',text:ai}]);
    } catch {
      setMsgs(m=>[...m,{role:'ai',text:'[提示] 预览变量未注入或后端异常'}]);
    } finally { setBusy(false); }
  }

  async function openEcho() {
    setEcho('（下一步：接 Supabase Edge Function /echo）');
  }

  return (
    <main style={{maxWidth:720,margin:'40px auto',padding:16}}>
      <h1>Helios · Chat MVP</h1>
      <div style={{fontSize:12,color:'#666'}}>session: <code>{sid}</code></div>
      <div style={{border:'1px solid #ddd',borderRadius:8,padding:12,minHeight:280,marginTop:12}}>
        {msgs.map((m,i)=>(<div key={i} style={{margin:'8px 0'}}><b>{m.role==='user'?'你':'AI'}：</b>{m.text}</div>))}
        {busy && <div>AI 正在思考…</div>}
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
               onKeyDown={e=>e.key==='Enter'&&send()}
               placeholder="输入后回车" style={{flex:1,padding:8,border:'1px solid #ddd',borderRadius:6}}/>
        <button onClick={send} disabled={busy}>发送</button>
        <button onClick={openEcho}>回响之室</button>
      </div>
      {echo && <div style={{marginTop:12,border:'1px dashed #bbb',padding:10}}>{echo}</div>}
    </main>
  );
}

5.4 supabase/sql/001_init.sql（一次性初始化）
create table if not exists agent_logs (
  id bigserial primary key,
  session_id text not null,
  speaker text not null check (char_length(speaker) <= 20),
  text text not null,
  meta jsonb default '{}'::jsonb,
  ts timestamptz default now()
);

create table if not exists belief_systems (
  character_id uuid primary key,
  belief_yaml text not null default '',
  last_updated timestamptz default now()
);

create table if not exists events (
  id bigserial primary key,
  session_id text,
  type text not null,
  payload jsonb default '{}'::jsonb,
  ts timestamptz default now()
);

alter table agent_logs enable row level security;
alter table belief_systems enable row level security;
alter table events enable row level security;

5.5 supabase/sql/010_triggers.sql（AFTER INSERT → Edge Functions）
-- ensure pg_net extension exists:
-- create extension if not exists pg_net;

create or replace function notify_belief_observer()
returns trigger language plpgsql as $$
declare payload json;
begin
  payload := json_build_object('session_id', NEW.session_id);
  perform net.http_post(
    url := 'https://<YOUR-PROJECT-REF>.functions.supabase.co/belief-observer',
    headers := json_build_object('Content-Type','application/json'),
    body := payload
  );
  return NEW;
end $$;

drop trigger if exists trg_belief on agent_logs;
create trigger trg_belief
after insert on agent_logs
for each row execute function notify_belief_observer();

create or replace function notify_dissonance_catalyst()
returns trigger language plpgsql as $$
declare payload json;
begin
  payload := json_build_object('session_id', NEW.session_id);
  perform net.http_post(
    url := 'https://<YOUR-PROJECT-REF>.functions.supabase.co/dissonance-catalyst',
    headers := json_build_object('Content-Type','application/json'),
    body := payload
  );
  return NEW;
end $$;

drop trigger if exists trg_dissonance on agent_logs;
create trigger trg_dissonance
after insert on agent_logs
for each row execute function notify_dissonance_catalyst();

5.6 Supabase Edge Function 模板（Deno + supabase-js@2）

路径举例：supabase/functions/belief-observer/index.ts（其他两个函数结构类同）

// supabase/functions/belief-observer/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = { session_id?: string };

Deno.serve(async (req) => {
  const { session_id } = (await req.json()) as Body;
  if (!session_id) return new Response(JSON.stringify({ ok:false, msg:'no session_id' }), { status:400 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb  = createClient(url, key);

  // 1) 最近行为
  const { data: logs } = await sb
    .from('agent_logs')
    .select('speaker,text,ts')
    .eq('session_id', session_id)
    .order('ts', { ascending: false })
    .limit(50);

  // 2) 调模型（建议走 AI Gateway；此处留出对接位）
  const prompt = `基于以下对话，生成/更新该“主体”的信念系统(YAML):\n${
    (logs||[]).map((r:any)=>`- [${r.ts}] ${r.speaker}: ${r.text}`).join('\n')
  }`;

  // TODO: fetch gateway here; for MVP, we写一个占位
  const beliefYaml = `worldview: tentative
selfview: observing
values: curiosity`;

  // 3) 写回（MVP：用 session_id 作为唯一键；正式版用 character_id）
  await sb.from('belief_systems').upsert({
    character_id: crypto.randomUUID(), // TODO: 按角色体系替换
    belief_yaml: beliefYaml,
    last_updated: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok:true }));
});


另外两个函数：

dissonance-catalyst：取最近 20 条 → 简单冲突打分（如“必须/不必”对撞）→ 超阈写 events。

echo：读取 belief_yaml+近期日志 → 生成第一人称主观归因文本 → 返回（同时可写 events 或 echoes）。

6) 验收与自测（在 Vercel 预览中）

打开 Preview → 输入一条 → 看到 AI 文本；

刷新 → 历史能回显（证明 agent_logs 写入成功）；

查看 Supabase：belief_systems 与 events 开始出现数据（即使先是占位）；

点击“回响之室” → 初期可占位文本，随后接 Function 真推理。

日志：Vercel 部署日志无报错；服务器侧 console.info 能定位链路。

7) 提交与 PR（由 AI 自动生成/补全）

每个里程碑请生成一个 PR，标题含 feat(chat): ... 或 feat(edge): ...；

PR 描述必须包含：What/Why、Vercel Preview 链接、需要维护者批准暴露的环境变量列表；

若为 Fork PR，请附注：“请在 Vercel 项目中批准此 PR 的环境变量注入（Supabase/AI Gateway）”。

8) 常见坑（AI 请主动规避）

本地密钥：禁止；所有密钥只在 Vercel/Functions 上。

SSE 处理：后端确保用 toAIStreamResponse()；前端逐步升级为流式 Hook。

边缘函数 URL：<YOUR-PROJECT-REF> 需替换为实际 Supabase 项目引用（AI 可在 README 注明）。

RLS：服务端用 Service Key 可写；前端不要用 Service Key。

崩溃：任何 env 缺失要降级处理，不得让 API 500 影响基本 UI。

9) 现在执行的任务（AI 先做这四步）

创建/更新：/app/api/chat/route.ts（按 5.1）与 /app/api/logs/route.ts（5.2）。

更新：/app/page.tsx（5.3）。

生成：supabase/sql/001_init.sql 与 supabase/sql/010_triggers.sql（5.4/5.5）。

生成：supabase/functions/belief-observer/index.ts（5.6，占位版）。

以上完成后，自动编写 PR 描述（What/Why + Preview 链接 + 需要批准的环境变量），并提醒维护者在 Vercel 批准 Fork PR 的环境变量注入。
随后继续生成 dissonance-catalyst 与 echo 两个函数与前端对接。