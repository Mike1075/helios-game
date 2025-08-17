'use client'

import { useState } from 'react'

export default function DatabaseTestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initResult, setInitResult] = useState<any>(null)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/db/test')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ error: 'Failed to test connection', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  const initDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/db/init', { method: 'POST' })
      const data = await response.json()
      setInitResult(data)
      // 重新测试连接以获取更新的表信息
      testConnection()
    } catch (error) {
      setInitResult({ error: 'Failed to initialize database', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '2rem',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          🔍 数据库连接测试
        </h1>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={testConnection}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? '测试中...' : '🔍 测试数据库连接'}
          </button>

          <button
            onClick={initDatabase}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: isLoading ? '#ccc' : '#28a745',
              color: 'white',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? '初始化中...' : '🛠️ 初始化数据库'}
          </button>
        </div>

        {testResult && (
          <div style={{
            background: testResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: testResult.success ? '#155724' : '#721c24',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h3>连接测试结果</h3>
            <pre style={{ 
              background: 'rgba(255,255,255,0.8)', 
              padding: '1rem', 
              borderRadius: '4px',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {initResult && (
          <div style={{
            background: initResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${initResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: initResult.success ? '#155724' : '#721c24',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            <h3>数据库初始化结果</h3>
            <pre style={{ 
              background: 'rgba(255,255,255,0.8)', 
              padding: '1rem', 
              borderRadius: '4px',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}>
              {JSON.stringify(initResult, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <h4>⚠️ 环境变量检查</h4>
          <p>确保在Vercel中配置了以下团队标准环境变量：</p>
          <ul>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code> - Supabase项目URL</li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> - Supabase匿名密钥</li>
            <li><code>SUPABASE_SERVICE_KEY</code> - Supabase服务角色密钥</li>
            <li><code>VERCEL_AI_GATEWAY_API_KEY</code> - AI Gateway API密钥</li>
            <li><code>ZEP_API_KEY</code> - Zep记忆服务密钥</li>
          </ul>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
            环境变量命名遵循团队开发文档 (CLAUDE.md) 标准
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a 
            href="/login" 
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => (e.target as HTMLElement).style.transform = 'translateY(0)'}
          >
            返回登录页面
          </a>
        </div>
      </div>
    </div>
  )
}