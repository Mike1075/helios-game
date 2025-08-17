export default function EthanPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-8xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Ethan
          </h1>
          <h2 className="text-3xl mb-6 text-blue-200">
            欢迎光临
          </h2>
          <h3 className="text-2xl mb-6 text-purple-300">
            Branch Preview Page
          </h3>
          <p className="text-xl max-w-2xl mx-auto mb-12 text-gray-300 leading-relaxed">
            This is Ethan's development branch preview
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </main>
  )
}