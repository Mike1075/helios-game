'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function DebugPage() {
  const [apiResponse, setApiResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'GET'
      })
      const data = await response.json()
      setApiResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setApiResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  const testFastAPI = async () => {
    setLoading(true)
    try {
      // 直接测试FastAPI根路径
      const response = await fetch('/api', {
        method: 'GET'
      })
      const data = await response.json()
      setApiResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setApiResponse(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white mr-4">
            ← 返回主页
          </Link>
          <h1 className="text-3xl font-bold">调试面板</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 路由测试 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">路由测试</h2>
            <div className="space-y-3">
              <Link 
                href="/chat"
                className="block p-3 bg-blue-600 hover:bg-blue-700 rounded text-center transition-colors"
              >
                测试聊天页面链接
              </Link>
              
              <Link 
                href="/"
                className="block p-3 bg-green-600 hover:bg-green-700 rounded text-center transition-colors"
              >
                返回主页
              </Link>
            </div>
          </div>

          {/* API测试 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">API测试</h2>
            <div className="space-y-3">
              <button 
                onClick={testAPI}
                disabled={loading}
                className="w-full p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded transition-colors"
              >
                {loading ? '测试中...' : '测试Next.js API (/api/chat)'}
              </button>
              
              <button 
                onClick={testFastAPI}
                disabled={loading}
                className="w-full p-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded transition-colors"
              >
                {loading ? '测试中...' : '测试FastAPI (/api)'}
              </button>
            </div>
          </div>
        </div>

        {/* API响应 */}
        {apiResponse && (
          <div className="mt-6 bg-black/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">API响应:</h3>
            <pre className="text-sm text-green-400 overflow-auto">
              {apiResponse}
            </pre>
          </div>
        )}

        {/* 环境信息 */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">环境信息</h2>
          <div className="space-y-2 text-sm">
            <div>当前URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
            <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
            <div>时间戳: {new Date().toISOString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}