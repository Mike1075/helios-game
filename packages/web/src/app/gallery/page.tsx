"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function GalleryPage() {
  const [userInteracted, setUserInteracted] = useState(false)

  useEffect(() => {
    const onFirst = () => setUserInteracted(true)
    window.addEventListener('click', onFirst, { once: true })
    window.addEventListener('keydown', onFirst, { once: true })
    return () => {
      window.removeEventListener('click', onFirst)
      window.removeEventListener('keydown', onFirst)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">低语画廊</h1>
        <p className="text-blue-200 max-w-2xl mx-auto mb-10">
          闭上眼，听见世界的另一面。准备好后，进入镜面，留下你的回响。
        </p>
        <Link href="/mirror" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg">
          进入镜面
        </Link>
      </section>
      <audio src="/audio/whisper.mp3" loop autoPlay muted={!userInteracted} />
    </main>
  )
}


