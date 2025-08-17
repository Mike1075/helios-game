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
  const [sceneImage, setSceneImage] = useState('');
  const [characterPortrait, setCharacterPortrait] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);

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
      
      // 生成场景图像
      await generateSceneImage();
    } catch {
      setMsgs(m=>[...m,{role:'ai',text:'[提示] 预览变量未注入或后端异常'}]);
    } finally { setBusy(false); }
  }

  async function generateSceneImage() {
    if (loadingImage) return;
    
    setLoadingImage(true);
    try {
      const res = await fetch('/api/scene-image?scene=harbor_tavern');
      const data = await res.json();
      
      if (data.success && data.image_url) {
        setSceneImage(data.image_url);
      }
    } catch (error) {
      console.log('Scene image generation failed:', error);
    } finally {
      setLoadingImage(false);
    }
  }

  async function generateCharacterPortrait(characterId: string) {
    if (loadingImage) return;
    
    setLoadingImage(true);
    try {
      const res = await fetch(`/api/character-portrait/${characterId}`);
      const data = await res.json();
      
      if (data.success && data.image_url) {
        setCharacterPortrait(data.image_url);
      }
    } catch (error) {
      console.log('Character portrait generation failed:', error);
    } finally {
      setLoadingImage(false);
    }
  }

  async function openEcho() {
    if (busy) return;
    
    setEcho('正在进入回响之室...');
    setBusy(true);
    
    try {
      const res = await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sid, 
          message: msgs.length > 0 ? msgs[msgs.length - 1]?.text : '初次探索' 
        })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setEcho(`🪞 回响之室\n\n${data.attribution}\n\n信念系统: ${data.belief_system?.worldview} | ${data.belief_system?.selfview} | ${data.belief_system?.values}`);
      } else {
        setEcho('回响之室暂时无法访问，请稍后再试。');
      }
    } catch (error) {
      setEcho('连接回响之室时出现问题，但这种尝试本身就有意义。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{maxWidth:720,margin:'40px auto',padding:16}}>
      <h1>Helios · Chat MVP</h1>
      <div style={{fontSize:12,color:'#666'}}>session: <code>{sid}</code></div>
      
      {/* 场景图像显示 */}
      {sceneImage && (
        <div style={{marginTop:12,textAlign:'center'}}>
          <img src={sceneImage} alt="Scene" style={{maxWidth:'100%',maxHeight:200,borderRadius:8}} />
          <div style={{fontSize:10,color:'#888',marginTop:4}}>港口酒馆场景</div>
        </div>
      )}
      
      {loadingImage && (
        <div style={{marginTop:12,textAlign:'center',fontSize:12,color:'#666'}}>
          🎨 正在生成场景图像...
        </div>
      )}
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
        <button onClick={generateSceneImage} disabled={loadingImage}>🎨 场景</button>
      </div>
      {echo && <div style={{marginTop:12,border:'1px dashed #bbb',padding:10}}>{echo}</div>}
    </main>
  );
}