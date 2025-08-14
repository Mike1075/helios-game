#!/usr/bin/env python3
"""
获取Vercel AI Gateway所有可用模型列表并保存到本地
"""

import os
import json
import requests
from datetime import datetime

def fetch_models_from_gateway():
    """
    从Vercel AI Gateway获取所有可用模型
    """
    # 使用提供的API Key - 官方Vercel AI Gateway端点
    VERCEL_AI_GATEWAY_URL = os.environ.get("VERCEL_AI_GATEWAY_URL", "https://ai-gateway.vercel.sh/v1/ai")
    VERCEL_AI_GATEWAY_API_KEY = os.environ.get("VERCEL_AI_GATEWAY_API_KEY", "EtMyP4WaMfdkxizkutRrJT1j")
    
    print(f"使用API Key: {VERCEL_AI_GATEWAY_API_KEY[:8]}...{VERCEL_AI_GATEWAY_API_KEY[-4:]}")
    print(f"Gateway URL: {VERCEL_AI_GATEWAY_URL}")
    
    headers = {
        "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 尝试不同的端点格式，基于官方文档
    endpoints_to_try = [
        f"{VERCEL_AI_GATEWAY_URL}/models",
        "https://ai-gateway.vercel.sh/v1/ai/models",
        "https://api.vercel.com/v1/ai/models",
        f"{VERCEL_AI_GATEWAY_URL}/v1/models"
    ]
    
    for endpoint in endpoints_to_try:
        try:
            print(f"正在尝试端点: {endpoint}")
            response = requests.get(endpoint, headers=headers)
            
            if response.status_code == 200:
                models_data = response.json()
                models = models_data.get("data", [])
                print(f"成功获取到 {len(models)} 个模型")
                return models
            else:
                print(f"  状态码: {response.status_code}")
                print(f"  响应: {response.text[:200]}")
                
        except requests.RequestException as e:
            print(f"  请求失败: {e}")
            continue
    
    print("所有端点都失败了，尝试测试聊天端点...")
    return test_chat_endpoint(VERCEL_AI_GATEWAY_URL, VERCEL_AI_GATEWAY_API_KEY)

def test_chat_endpoint(gateway_url, api_key):
    """
    测试聊天端点，尝试获取可用模型
    """
    chat_endpoints = [
        f"{gateway_url}/chat/completions",
        "https://ai-gateway.vercel.sh/v1/ai/chat/completions",
        "https://api.vercel.com/v1/ai/chat/completions",
        f"{gateway_url}/v1/chat/completions"
    ]
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 测试用负载
    test_payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 5
    }
    
    for endpoint in chat_endpoints:
        try:
            print(f"测试聊天端点: {endpoint}")
            response = requests.post(endpoint, headers=headers, json=test_payload)
            print(f"  状态码: {response.status_code}")
            
            if response.status_code == 200:
                print(f"  ✅ 聊天端点可用!")
                # 如果聊天端点可用，返回一些默认模型
                return [
                    {"id": "gpt-4o-mini", "object": "model", "owned_by": "openai"},
                    {"id": "gpt-4o", "object": "model", "owned_by": "openai"},
                    {"id": "gpt-4", "object": "model", "owned_by": "openai"},
                ]
            else:
                print(f"  响应: {response.text[:200]}")
                
        except Exception as e:
            print(f"  错误: {e}")
            
    return None

def test_model_call(model_name, api_key, gateway_url):
    """
    测试特定模型调用
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello in one short sentence."}
        ],
        "max_tokens": 50
    }
    
    try:
        response = requests.post(f"{gateway_url}/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"

def save_models_to_file(models):
    """
    保存模型列表到本地文件
    """
    if not models:
        print("没有模型数据可保存")
        return
    
    # 创建输出目录
    output_dir = "../docs"
    os.makedirs(output_dir, exist_ok=True)
    
    # 保存原始数据
    output_file = f"{output_dir}/available-models.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_models": len(models),
            "data": models
        }, f, indent=2, ensure_ascii=False)
    
    print(f"模型列表已保存到: {output_file}")
    
    # 创建按提供商分类的版本
    providers = {}
    for model in models:
        model_id = model.get("id", "")
        if "/" in model_id:
            provider = model_id.split("/")[0]
        else:
            provider = model.get("owned_by", "unknown")
        
        if provider not in providers:
            providers[provider] = []
        providers[provider].append(model)
    
    categorized_file = f"{output_dir}/models-by-provider.json"
    with open(categorized_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "providers": list(providers.keys()),
            "total_models": len(models),
            "data": providers
        }, f, indent=2, ensure_ascii=False)
    
    print(f"按提供商分类的模型列表已保存到: {categorized_file}")
    
    # 打印统计信息
    print(f"\n模型统计:")
    for provider, provider_models in providers.items():
        print(f"  {provider}: {len(provider_models)} 个模型")

def main():
    """
    主函数
    """
    print("Vercel AI Gateway 模型获取工具")
    print("=" * 50)
    
    # 获取模型列表
    models = fetch_models_from_gateway()
    
    if models:
        # 保存到文件
        save_models_to_file(models)
        
        # 显示前几个模型作为示例
        print(f"\n前5个模型示例:")
        for i, model in enumerate(models[:5]):
            print(f"  {i+1}. {model.get('id', 'N/A')} ({model.get('owned_by', 'unknown')})")
        
        if len(models) > 5:
            print(f"  ... 还有 {len(models) - 5} 个模型")
            
        # 测试一个模型调用
        if len(models) > 0:
            test_model = models[0]["id"]
            print(f"\n测试模型调用: {test_model}")
            api_key = os.environ.get("VERCEL_AI_GATEWAY_API_KEY")
            gateway_url = os.environ.get("VERCEL_AI_GATEWAY_URL", "https://api.vercel.com/v1/ai")
            
            if api_key and api_key != "your-api-key-here":
                result = test_model_call(test_model, api_key, gateway_url)
                print(f"调用结果: {result}")
            else:
                print("跳过模型测试 (需要API Key)")

if __name__ == "__main__":
    main()