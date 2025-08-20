"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type EchoDraft = {
  emotion: string
  beliefs: string[]
  thought: string
  createdAt: string
}

const EMOTIONS = ["宁静", "好奇", "不安", "欣喜", "迷惘"]
const BELIEF_TAGS = ["秩序", "自由", "连接", "探索", "守护"]

export default function MirrorPage() {
  const router = useRouter()
  const [emotion, setEmotion] = useState(EMOTIONS[0])
  const [beliefs, setBeliefs] = useState<string[]>([])
  const [thought, setThought] = useState("")

  function toggleBelief(tag: string) {
    setBeliefs(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const draft: EchoDraft = {
      emotion,
      beliefs,
      thought: thought.trim(),
      createdAt: new Date().toISOString(),
    }
    try {
      const last = localStorage.getItem('helios:lastEcho')
      if (last) localStorage.setItem('helios:prevEcho', last)
      localStorage.setItem('helios:lastEcho', JSON.stringify(draft))
    } catch {}
    router.push('/echo')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">镜面</h1>
        <form onSubmit={handleSubmit} className="space-y-8 bg-white/5 p-6 rounded-xl">
          <section>
            <h2 className="font-semibold mb-3">选择此刻最贴近的情绪</h2>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(e => (
                <button type="button" key={e} onClick={() => setEmotion(e)}
                  className={`px-3 py-1.5 rounded-full border ${emotion===e? 'bg-blue-600 border-blue-400':'border-white/30'}`}>
                  {e}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-3">勾选与你当下共鸣的信念</h2>
            <div className="flex flex-wrap gap-2">
              {BELIEF_TAGS.map(t => (
                <button type="button" key={t} onClick={() => toggleBelief(t)}
                  className={`px-3 py-1.5 rounded-full border ${beliefs.includes(t)? 'bg-pink-600 border-pink-400':'border-white/30'}`}>
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-3">一句话把它说出来</h2>
            <textarea value={thought} onChange={e=>setThought(e.target.value)}
              placeholder="此刻的念头……"
              className="w-full h-28 bg-black/30 border border-white/20 rounded-lg p-3 outline-none" />
          </section>

          <div className="flex items-center justify-end gap-4">
            <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">生成回响</button>
          </div>
        </form>
      </div>
    </main>
  )
}


