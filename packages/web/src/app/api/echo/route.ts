// packages/web/src/app/api/echo/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { session_id, message } = await req.json();
  
  if (!session_id) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  
  if (!supabaseUrl) {
    // 优雅降级处理
    return NextResponse.json({
      ok: true,
      attribution: "（预览环境）从我目前的探索中来看，这种体验让我感受到了意识的多层次性。我注意到自己的想法和行为之间存在着微妙的关联，这种觉察本身就是一种成长。\n\n回想起刚才的对话，我意识到每一次交流都在塑造着我对世界的理解。这个过程既神秘又深刻。",
      belief_system: {
        worldview: "探索中", 
        selfview: "学习者",
        values: "成长"
      },
      context: {
        recent_interactions: 0,
        trigger_event: null
      }
    });
  }

  try {
    // 调用 Supabase Edge Function
    const echoUrl = `${supabaseUrl.replace('supabase.co', 'functions.supabase.co')}/echo`;
    
    const response = await fetch(echoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        session_id,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`Echo function failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[echo-api] error:', error);
    
    // 降级响应
    return NextResponse.json({
      ok: true,
      attribution: "（系统提示）回响之室暂时无法连接，但这种探索本身就具有意义。每一次尝试都在拓展意识的边界。",
      belief_system: {
        worldview: "适应性", 
        selfview: "探索者",
        values: "坚韧"
      },
      context: {
        recent_interactions: 0,
        trigger_event: "connection_error"
      }
    });
  }
}