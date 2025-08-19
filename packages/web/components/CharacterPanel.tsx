import { useState } from 'react';

interface Character {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

const CHARACTERS: Character[] = [
  {
    id: "guard_elvin",
    name: "卫兵艾尔文",
    avatar: "🛡️",
    role: "港口卫兵",
    description: "维护港口秩序，保护无辜者。他相信世界需要秩序来保护弱者。",
    color: "bg-blue-600",
    borderColor: "border-blue-400",
    bgColor: "bg-blue-50"
  },
  {
    id: "priestess_lila",
    name: "祭司莉拉",
    avatar: "⛪",
    role: "港口祭司",
    description: "传播信仰，帮助需要帮助的人。她相信信仰能给人力量和希望。",
    color: "bg-purple-600",
    borderColor: "border-purple-400",
    bgColor: "bg-purple-50"
  },
  {
    id: "merchant_karl",
    name: "商人卡尔",
    avatar: "💰",
    role: "港口商人",
    description: "寻找商机，获取利润。他认为金钱是世界的驱动力。",
    color: "bg-yellow-600",
    borderColor: "border-yellow-400",
    bgColor: "bg-yellow-50"
  },
  {
    id: "sailor_maya",
    name: "水手玛雅",
    avatar: "⚓",
    role: "经验丰富的水手",
    description: "探索未知的海域，寻找冒险。她相信大海蕴含着无限的可能。",
    color: "bg-teal-600",
    borderColor: "border-teal-400",
    bgColor: "bg-teal-50"
  }
];

interface CharacterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCharacter?: string;
}

export default function CharacterPanel({ isOpen, onClose, currentCharacter }: CharacterPanelProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(currentCharacter || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-4 border-amber-600 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 rounded-t-lg p-6 border-b-4 border-amber-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">👥</span>
              <h2 className="text-2xl font-bold text-amber-100 font-serif">酒馆中的角色</h2>
            </div>
            <button
              onClick={onClose}
              className="text-amber-200 hover:text-white text-2xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-amber-200 mt-2">在赫利俄斯港口酒馆中，你可能会遇到这些有趣的角色...</p>
        </div>

        {/* 角色列表 */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CHARACTERS.map((character) => (
              <div
                key={character.id}
                className={`${character.bgColor} ${character.borderColor} border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  selectedCharacter === character.id ? 'ring-4 ring-amber-400' : ''
                }`}
                onClick={() => setSelectedCharacter(character.id)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-4xl">{character.avatar}</span>
                  <div>
                    <h3 className={`text-xl font-bold ${character.color.replace('bg-', 'text-')}`}>
                      {character.name}
                    </h3>
                    <p className="text-gray-600 font-medium">{character.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{character.description}</p>
                
                {/* 角色特色标签 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {character.id === "guard_elvin" && (
                    <>
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">秩序</span>
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">保护</span>
                    </>
                  )}
                  {character.id === "priestess_lila" && (
                    <>
                      <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">信仰</span>
                      <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">慈悲</span>
                    </>
                  )}
                  {character.id === "merchant_karl" && (
                    <>
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">商业</span>
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">利润</span>
                    </>
                  )}
                  {character.id === "sailor_maya" && (
                    <>
                      <span className="px-2 py-1 bg-teal-200 text-teal-800 rounded-full text-xs font-medium">冒险</span>
                      <span className="px-2 py-1 bg-teal-200 text-teal-800 rounded-full text-xs font-medium">自由</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-amber-200 rounded-lg border-2 border-amber-300">
            <div className="flex items-start space-x-2">
              <span className="text-amber-600 text-lg">💡</span>
              <div className="text-amber-700 text-sm">
                <p className="font-medium mb-1">如何与角色互动：</p>
                <p>在对话中提及相关的关键词，系统会自动为你选择合适的角色进行回应。每个角色都有独特的性格和专长领域。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t-4 border-amber-600 bg-gradient-to-r from-amber-100 to-amber-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-bold"
          >
            开始对话
          </button>
        </div>
      </div>
    </div>
  );
}
