"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Echo = {
  emotion: string
  beliefs: string[]
  thought: string
  createdAt: string
}

export default function EchoRoom() {
  const [last, setLast] = useState<Echo | null>(null)
  const [prev, setPrev] = useState<Echo | null>(null)

  useEffect(() => {
    try {
      const l = localStorage.getItem('helios:lastEcho')
      const p = localStorage.getItem('helios:prevEcho')
      setLast(l ? JSON.parse(l) : null)
      setPrev(p ? JSON.parse(p) : null)
    } catch {}
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">回响之室</h1>
          <Link href="/mirror" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">再次凝视</Link>
        </div>

        {!last && (
          <div className="text-blue-200">
            暂无记录。先去 <Link href="/mirror" className="underline">镜面</Link> 留下你的第一道回响。
          </div>
        )}

        {last && (
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white/5 p-5 rounded-xl">
              <h2 className="font-semibold mb-2">本次回响</h2>
              <EchoCard data={last} />
            </section>
            <section className="bg-white/5 p-5 rounded-xl">
              <h2 className="font-semibold mb-2">上次印记</h2>
              {prev ? <EchoCard data={prev} /> : <p className="text-blue-200">第一次来到这里。</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

function EchoCard({ data }: { data: Echo }) {
  return (
    <div className="space-y-2 text-blue-100">
      <div>情绪：<span className="text-white">{data.emotion}</span></div>
      <div>信念：<span className="text-white">{data.beliefs?.join('、') || '—'}</span></div>
      <div>念头：<span className="text-white">{data.thought || '—'}</span></div>
      <div className="text-xs text-gray-400">{new Date(data.createdAt).toLocaleString()}</div>
    </div>
  )
}


