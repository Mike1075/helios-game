// 测试AI回复质量的脚本
const testCases = [
  {
    playerName: "冒险者小明",
    playerPurpose: "寻找传说中的宝藏",
    message: "你好，我是新来的冒险者",
    expectedCharacter: "guard_elvin"
  },
  {
    playerName: "商人老王",
    playerPurpose: "在这里做生意赚钱",
    message: "这里有什么好买卖吗？",
    expectedCharacter: "merchant_karl"
  },
  {
    playerName: "水手小李",
    playerPurpose: "寻找航海冒险",
    message: "我想了解大海的秘密",
    expectedCharacter: "sailor_maya"
  },
  {
    playerName: "信徒小张",
    playerPurpose: "寻找内心的平静",
    message: "我需要信仰的指引",
    expectedCharacter: "priestess_lila"
  }
];

console.log("🧪 开始测试AI回复质量...\n");

testCases.forEach((testCase, index) => {
  console.log(`📝 测试用例 ${index + 1}:`);
  console.log(`   玩家: ${testCase.playerName}`);
  console.log(`   目的: ${testCase.playerPurpose}`);
  console.log(`   消息: ${testCase.message}`);
  console.log(`   预期角色: ${testCase.expectedCharacter}`);
  console.log("   ---");
});

console.log("\n✅ 测试用例准备完成！");
console.log("💡 现在可以启动服务器并测试这些对话场景");
console.log("🌐 访问: http://localhost:3000");
