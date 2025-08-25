// n8n配置 - 您的云部署地址
const N8N_WEBHOOK_URL = 'https://n8n.aifunbox.com/webhook/58a6c8c7-52ff-4c2f-8809-101f1e16ed9a';

// 备用webhook ID（如果上面的不工作，可以尝试这个）
// const N8N_WEBHOOK_URL = 'https://n8n.aifunbox.com/webhook/afc32e56-6565-4a21-9ae1-1040889911cc';

// API配置
const API_CONFIG = {
    timeout: 30000, // 30秒超时
    retryAttempts: 3, // 重试次数
    retryDelay: 1000 // 重试延迟(毫秒)
};

// 应用配置
const APP_CONFIG = {
    maxMessageLength: 500,
    maxChatHistory: 100,
    autoSave: true,
    debugMode: true, // 设为true可以在控制台看到调试信息
    testMode: false // 设为true启用测试模式，不调用真实API
};

// 调试函数
function debugLog(message, data = null) {
    if (APP_CONFIG.debugMode) {
        console.log('[Helios Debug]', message, data);
    }
}

// 导出配置（如果需要在其他文件中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        N8N_WEBHOOK_URL,
        API_CONFIG,
        APP_CONFIG,
        debugLog
    };
}
