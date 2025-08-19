import { useState } from 'react';

export default function CreateCharacter() {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 在这里处理角色创建逻辑，例如将角色信息存储到localStorage
    localStorage.setItem('characterName', name);
    localStorage.setItem('characterPurpose', purpose);
    // 跳转到聊天界面
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* 装饰元素 */}
      <div className="fixed top-10 left-10 text-amber-300 opacity-20 text-6xl">🏰</div>
      <div className="fixed top-20 right-20 text-amber-300 opacity-20 text-4xl">⚓</div>
      <div className="fixed bottom-20 left-20 text-amber-300 opacity-20 text-5xl">🍺</div>
      <div className="fixed bottom-10 right-10 text-amber-300 opacity-20 text-4xl">💰</div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-4 border-amber-600 max-w-md w-full p-8">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-4xl">🏰</span>
              <h2 className="text-3xl font-bold text-amber-800 font-serif">赫利俄斯港口</h2>
              <span className="text-4xl">🏰</span>
            </div>
            <p className="text-amber-600 text-lg font-medium mb-2">创建你的角色</p>
            <p className="text-amber-500 text-sm italic">你的选择将悄然塑造你的信念</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 角色名称输入 */}
            <div className="space-y-2">
              <label className="block text-amber-800 text-lg font-bold" htmlFor="name">
                <span className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>你是谁？</span>
                </span>
              </label>
              <input
                className="w-full px-4 py-3 border-2 border-amber-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300 focus:border-amber-500 bg-amber-50 text-gray-800 placeholder-amber-600 font-medium transition-all duration-300"
                id="name"
                type="text"
                placeholder="例如：一个刚来到港口城市的年轻人"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* 角色目的输入 */}
            <div className="space-y-2">
              <label className="block text-amber-800 text-lg font-bold" htmlFor="purpose">
                <span className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>你来这里的目的是什么？</span>
                </span>
              </label>
              <input
                className="w-full px-4 py-3 border-2 border-amber-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300 focus:border-amber-500 bg-amber-50 text-gray-800 placeholder-amber-600 font-medium transition-all duration-300"
                id="purpose"
                type="text"
                placeholder="例如：想在这里出人头地"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            {/* 提交按钮 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!name.trim() || !purpose.trim()}
                className="w-full px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-bold text-lg"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>进入赫利俄斯的世界</span>
                  <span>🚀</span>
                </span>
              </button>
            </div>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-amber-200 rounded-lg border-2 border-amber-300">
            <div className="flex items-start space-x-2">
              <span className="text-amber-600 text-lg">💡</span>
              <div className="text-amber-700 text-sm">
                <p className="font-medium mb-1">小贴士：</p>
                <p>在赫利俄斯港口，每个角色都有自己的故事。你的选择将影响你遇到的NPC和对话内容。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}