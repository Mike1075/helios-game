import { useEffect, useState } from 'react';
import ChatInterface from '../components/ChatInterface';

export default function Home() {
  const [characterName, setCharacterName] = useState('');
  const [characterPurpose, setCharacterPurpose] = useState('');

  useEffect(() => {
    // 从localStorage中获取角色信息
    const name = localStorage.getItem('characterName') || '';
    const purpose = localStorage.getItem('characterPurpose') || '';
    setCharacterName(name);
    setCharacterPurpose(purpose);

    // 如果没有角色信息，跳转到角色创建页面
    if (!name || !purpose) {
      window.location.href = '/create-character';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {characterName && characterPurpose ? (
        <ChatInterface characterName={characterName} characterPurpose={characterPurpose} />
      ) : (
        <p>正在加载...</p>
      )}
    </div>
  );
}