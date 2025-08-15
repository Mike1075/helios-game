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