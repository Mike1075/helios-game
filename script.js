// 应用状态
let currentCharacter = null;
let chatHistory = [];

// 角色信息映射
const characterInfo = {
    'shy_student': { name: '内向学生', description: '22岁的大学生，总觉得自己不够好' },
    'ambitious_worker': { name: '上进青年', description: '25岁的职场新人，渴望成功但经常焦虑' },
    'lonely_artist': { name: '孤独艺术家', description: '28岁的自由创作者，敏感而富有想象力' },
    'anxious_parent': { name: '焦虑家长', description: '35岁的父母，总是担心孩子的未来' }
};

// DOM 元素
const characterSelection = document.getElementById('character-selection');
const chatInterface = document.getElementById('chat-interface');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const currentCharacterName = document.getElementById('current-character-name');
const changeCharacterBtn = document.getElementById('change-character-btn');
const loadingOverlay = document.getElementById('loading-overlay');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('初始化应用...');

    // 绑定角色选择事件
    const characterCards = document.querySelectorAll('.character-card');
    console.log('找到角色卡片数量:', characterCards.length);

    characterCards.forEach(card => {
        card.addEventListener('click', function() {
            const characterId = this.dataset.character;
            console.log('点击了角色:', characterId);
            selectCharacter(characterId);
        });
    });

    // 绑定聊天事件
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 绑定切换角色事件
    changeCharacterBtn.addEventListener('click', function() {
        showCharacterSelection();
    });

    // 检查是否有保存的角色
    const savedCharacter = localStorage.getItem('currentCharacter');
    if (savedCharacter && characterInfo[savedCharacter]) {
        selectCharacter(savedCharacter);
    }
}

function selectCharacter(characterId) {
    console.log('选择角色:', characterId);
    currentCharacter = characterId;
    localStorage.setItem('currentCharacter', characterId);

    // 更新UI
    if (currentCharacterName) {
        currentCharacterName.textContent = characterInfo[characterId].name;
    }

    // 切换到聊天界面
    showChatInterface();

    // 清空聊天历史并添加欢迎消息
    chatHistory = [];
    clearChatMessages();
    addWelcomeMessage(characterId);
}

function showCharacterSelection() {
    console.log('显示角色选择界面');
    if (characterSelection) {
        characterSelection.classList.add('active');
    }
    if (chatInterface) {
        chatInterface.classList.remove('active');
    }
}

function showChatInterface() {
    console.log('显示聊天界面');
    if (characterSelection) {
        characterSelection.classList.remove('active');
    }
    if (chatInterface) {
        chatInterface.classList.add('active');
    }
}

function addWelcomeMessage(characterId) {
    const character = characterInfo[characterId];
    const welcomeMessage = `你现在是${character.name}。${character.description}。\n\n在这个意识世界中，你的每一个想法都会经过信念系统、内驱力、集体潜意识的层层转化，最终成为角色的行动和体验。`;
    
    addMessage('system', welcomeMessage);
}

function clearChatMessages() {
    chatMessages.innerHTML = '';
}

function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentCharacter) return;

    // 禁用输入
    messageInput.disabled = true;
    sendBtn.disabled = true;
    
    // 添加用户消息
    addMessage('user', message);
    chatHistory.push({ role: 'user', content: message });
    
    // 清空输入框
    messageInput.value = '';
    
    // 显示加载动画
    showLoading();
    
    try {
        // 调用n8n API
        const response = await callN8nAPI(message);
        
        // 添加AI回复
        addMessage('ai', response);
        chatHistory.push({ role: 'ai', content: response });
        
    } catch (error) {
        console.error('API调用失败:', error);
        addMessage('system', '抱歉，意识转化过程中出现了问题，请稍后再试。');
    } finally {
        // 恢复输入
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
        
        // 隐藏加载动画
        hideLoading();
    }
}

async function callN8nAPI(message) {
    // 检查是否为测试模式
    if (APP_CONFIG.testMode) {
        console.log('测试模式：模拟API响应');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟延迟
        return generateTestResponse(message);
    }

    // 检查URL配置
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.includes('your-n8n-instance.com')) {
        throw new Error('请先在config.js中配置正确的n8n webhook URL');
    }

    console.log('调用n8n API:', N8N_WEBHOOK_URL);

    // 构建请求数据
    const requestData = {
        chatInput: message,
        character_id: currentCharacter,
        sessionId: getSessionId()
    };

    console.log('请求数据:', requestData);

    try {
        // 调用n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        console.log('响应状态:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('响应数据:', data);

        // 根据n8n的返回格式解析结果
        return data.output || data.result || data.message || '意识转化完成，但结果未知。';

    } catch (error) {
        console.error('API调用详细错误:', error);

        // 提供更具体的错误信息
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error(`无法连接到n8n服务器。请检查：
1. n8n是否正在运行
2. URL是否正确: ${N8N_WEBHOOK_URL}
3. 是否存在网络问题或CORS限制`);
        }

        throw error;
    }
}

function generateTestResponse(message) {
    const responses = [
        `【信念系统】: 基于你的核心信念，这个想法被重新解读...`,
        `【内驱力】: 你内心深处的动机为这个意图注入了能量...`,
        `【集体潜意识】: 社会的共同认知对你的行为产生了影响...`,
        `【外我行为】: 最终，你的角色在现实中做出了相应的行动...`,
        `【头脑解释】: 你的理性思维为刚才发生的事情找到了合理的解释...`,
        `【外我反应】: 你感受到了身心的变化和情绪的波动...`
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse}\n\n(这是测试模式的模拟响应，输入: "${message}")`;
}

function getSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

function showLoading() {
    loadingOverlay.classList.add('show');
}

function hideLoading() {
    loadingOverlay.classList.remove('show');
}

// 错误处理
window.addEventListener('error', function(e) {
    console.error('应用错误:', e.error);
    hideLoading();
    if (messageInput) {
        messageInput.disabled = false;
    }
    if (sendBtn) {
        sendBtn.disabled = false;
    }
});

// 页面卸载时保存状态
window.addEventListener('beforeunload', function() {
    if (chatHistory.length > 0) {
        localStorage.setItem('chatHistory_' + currentCharacter, JSON.stringify(chatHistory));
    }
});

// 恢复聊天历史（可选功能）
function restoreChatHistory(characterId) {
    const savedHistory = localStorage.getItem('chatHistory_' + characterId);
    if (savedHistory) {
        try {
            const history = JSON.parse(savedHistory);
            history.forEach(msg => {
                addMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
            });
            chatHistory = history;
        } catch (e) {
            console.error('恢复聊天历史失败:', e);
        }
    }
}
