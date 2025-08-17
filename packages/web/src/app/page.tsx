import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #581c87, #1e3a8a, #312e81)',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '100px' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          Helios
        </h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#bfdbfe' }}>
          赫利俄斯 - 意识的棱镜
        </h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: '#d1d5db', lineHeight: 1.6 }}>
          这不是一个传统的游戏，而是一个意识探索与演化的沙盒。
          <br />
          你的意识之光将通过独特的信念系统折射，创造属于你的主观现实。
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '10px', 
          padding: '2rem', 
          maxWidth: '400px', 
          margin: '0 auto' 
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            MVP "棱镜之心" 正在构建中...
          </h3>
          <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
            <p>🔮 信念系统</p>
            <p>🤖 NPC代理核心</p>
            <p>🪞 回响之室</p>
            <p>🎭 导演引擎</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link 
              href="/chat"
              style={{
                display: 'block',
                background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
                color: 'white',
                fontWeight: '500',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              🚀 开始AI聊天 (AI SDK 3)
            </Link>
            
            <Link 
              href="/debug"
              style={{
                display: 'block',
                background: 'linear-gradient(90deg, #4b5563, #374151)',
                color: 'white',
                fontWeight: '500',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              🔧 调试面板
            </Link>
            
            <Link 
              href="/test"
              style={{
                display: 'block',
                background: 'linear-gradient(90deg, #059669, #047857)',
                color: 'white',
                fontWeight: '500',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              🧪 基础测试页面
            </Link>
            
            <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '10px' }}>
              基于AI SDK 3 + OpenAI (稳定版本)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}