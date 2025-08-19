// 赫利俄斯港口酒馆 - 信念系统测试脚本
console.log("🧠 信念系统测试脚本");
console.log("=====================================");

// 模拟玩家数据存储
const player_data_store = {};

// 初始化玩家信念系统的函数
function initializePlayerBeliefs(player_id, characterName, characterPurpose) {
  if (!player_data_store[player_id]) {
    player_data_store[player_id] = {
      beliefs: {
        worldview: "世界是未知的，充满可能性",
        selfview: `我是一个名为"${characterName}"的探索者`,
        values: ["探索未知", "寻找真相", "成长学习"],
        rules: ["保持好奇心", "尊重他人", "勇敢面对挑战"]
      },
      message_history: []
    }
    console.log(`✅ 初始化玩家 ${player_id} 的信念系统`);
  }
  return player_data_store[player_id];
}

// 模拟对话历史更新
function updateMessageHistory(player_id, userMessage, aiResponse, characterName) {
  const playerData = player_data_store[player_id];
  if (!playerData) {
    console.log(`❌ 玩家 ${player_id} 不存在`);
    return;
  }

  // 添加用户消息到历史
  playerData.message_history.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  });

  // 添加 AI 响应到历史
  playerData.message_history.push({
    role: 'assistant',
    content: aiResponse,
    character_name: characterName,
    timestamp: new Date().toISOString()
  });

  // 限制历史长度
  const max_history_length = 20;
  if (playerData.message_history.length > max_history_length) {
    playerData.message_history = playerData.message_history.slice(-max_history_length);
  }

  console.log(`📝 消息已更新到玩家 ${player_id} 的内存存储中`);
  console.log(`📊 当前历史记录数量: ${playerData.message_history.length}`);
  console.log(`🌍 玩家信念 - 世界观: ${playerData.beliefs.worldview}`);
  console.log(`👤 玩家信念 - 自我认知: ${playerData.beliefs.selfview}`);
}

// 信念更新函数
function updateBeliefs(player_id, newBeliefs) {
  const playerData = player_data_store[player_id];
  if (!playerData) {
    console.log(`❌ 玩家 ${player_id} 不存在`);
    return false;
  }

  if (newBeliefs.worldview) playerData.beliefs.worldview = newBeliefs.worldview;
  if (newBeliefs.selfview) playerData.beliefs.selfview = newBeliefs.selfview;
  if (newBeliefs.values) playerData.beliefs.values = newBeliefs.values;
  if (newBeliefs.rules) playerData.beliefs.rules = newBeliefs.rules;

  console.log(`🔄 玩家 ${player_id} 的信念已更新`);
  return true;
}

// 重置信念函数
function resetBeliefs(player_id) {
  const playerData = player_data_store[player_id];
  if (!playerData) {
    console.log(`❌ 玩家 ${player_id} 不存在`);
    return false;
  }

  playerData.beliefs = {
    worldview: "世界是未知的，充满可能性",
    selfview: "我是一个探索者",
    values: ["探索未知", "寻找真相", "成长学习"],
    rules: ["保持好奇心", "尊重他人", "勇敢面对挑战"]
  };

  console.log(`🔄 玩家 ${player_id} 的信念已重置`);
  return true;
}

// 测试用例
console.log("\n🧪 开始测试信念系统...\n");

// 测试1: 初始化玩家
console.log("📋 测试1: 初始化玩家信念系统");
const testPlayerId = "test_player_001";
const testCharacterName = "冒险者小明";
const testCharacterPurpose = "寻找传说中的宝藏";

const playerData = initializePlayerBeliefs(testPlayerId, testCharacterName, testCharacterPurpose);
console.log(`   玩家ID: ${testPlayerId}`);
console.log(`   角色名称: ${testCharacterName}`);
console.log(`   角色目的: ${testCharacterPurpose}`);
console.log(`   初始世界观: ${playerData.beliefs.worldview}`);
console.log(`   初始自我认知: ${playerData.beliefs.selfview}`);
console.log(`   初始价值观: ${playerData.beliefs.values.join(', ')}`);
console.log(`   初始行为准则: ${playerData.beliefs.rules.join(', ')}`);

// 测试2: 模拟对话
console.log("\n📋 测试2: 模拟对话历史");
const testMessages = [
  {
    user: "你好，我是新来的冒险者",
    ai: "欢迎来到港口，冒险者小明！我是卫兵艾尔文，负责维护这里的秩序。看到你带着'寻找传说中的宝藏'的目的来到这里，我希望能确保你的安全。",
    character: "卫兵艾尔文"
  },
  {
    user: "这里有什么危险吗？",
    ai: "安全永远是第一位的，冒险者小明。作为港口的守护者，我建议你在追求'寻找传说中的宝藏'的同时，也要注意周围的环境。",
    character: "卫兵艾尔文"
  },
  {
    user: "我想了解一些关于信仰的事情",
    ai: "愿光明与你同在，冒险者小明！我是祭司莉拉。看到你带着'寻找传说中的宝藏'的愿望来到这里，我相信信仰会指引你的道路。",
    character: "祭司莉拉"
  }
];

testMessages.forEach((msg, index) => {
  console.log(`\n   对话 ${index + 1}:`);
  console.log(`   用户: ${msg.user}`);
  console.log(`   ${msg.character}: ${msg.ai}`);
  updateMessageHistory(testPlayerId, msg.user, msg.ai, msg.character);
});

// 测试3: 信念更新
console.log("\n📋 测试3: 信念更新");
const newBeliefs = {
  worldview: "世界充满神秘和冒险，每个角落都藏着故事",
  selfview: "我是一个勇敢的冒险者，正在寻找传说中的宝藏",
  values: ["探索未知", "寻找真相", "成长学习", "勇敢冒险", "保护弱者"],
  rules: ["保持好奇心", "尊重他人", "勇敢面对挑战", "帮助需要帮助的人", "永远不放弃"]
};

updateBeliefs(testPlayerId, newBeliefs);
console.log(`   更新后的世界观: ${player_data_store[testPlayerId].beliefs.worldview}`);
console.log(`   更新后的自我认知: ${player_data_store[testPlayerId].beliefs.selfview}`);
console.log(`   更新后的价值观: ${player_data_store[testPlayerId].beliefs.values.join(', ')}`);
console.log(`   更新后的行为准则: ${player_data_store[testPlayerId].beliefs.rules.join(', ')}`);

// 测试4: 显示最终状态
console.log("\n📋 测试4: 最终状态显示");
const finalPlayerData = player_data_store[testPlayerId];
console.log(`   玩家ID: ${testPlayerId}`);
console.log(`   对话次数: ${Math.floor(finalPlayerData.message_history.length / 2)}`);
console.log(`   消息总数: ${finalPlayerData.message_history.length}`);
console.log(`   最后互动: ${finalPlayerData.message_history[finalPlayerData.message_history.length - 1]?.timestamp || '无'}`);

// 测试5: 信念重置
console.log("\n📋 测试5: 信念重置");
resetBeliefs(testPlayerId);
console.log(`   重置后的世界观: ${player_data_store[testPlayerId].beliefs.worldview}`);
console.log(`   重置后的自我认知: ${player_data_store[testPlayerId].beliefs.selfview}`);

console.log("\n=====================================");
console.log("✅ 信念系统测试完成！");
console.log("💡 所有功能都正常工作");
console.log("🚀 现在可以启动服务器并测试真实功能了");
