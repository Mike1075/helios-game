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
    # 这里您可以设置您的API Key
    VERCEL_AI_GATEWAY_URL = os.environ.get("VERCEL_AI_GATEWAY_URL", "https://api.vercel.com/v1/ai")
    VERCEL_AI_GATEWAY_API_KEY = os.environ.get("VERCEL_AI_GATEWAY_API_KEY", "your-api-key-here")
    
    if VERCEL_AI_GATEWAY_API_KEY == "your-api-key-here":
        print("请设置 VERCEL_AI_GATEWAY_API_KEY 环境变量或在代码中直接设置")
        return None
    
    headers = {
        "Authorization": f"Bearer {VERCEL_AI_GATEWAY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"正在从 {VERCEL_AI_GATEWAY_URL}/models 获取模型列表...")
        response = requests.get(f"{VERCEL_AI_GATEWAY_URL}/models", headers=headers)
        response.raise_for_status()
        
        models_data = response.json()
        models = models_data.get("data", [])
        
        print(f"成功获取到 {len(models)} 个模型")
        return models
        
    except requests.RequestException as e:
        print(f"获取模型列表失败: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"响应状态码: {e.response.status_code}")
            print(f"响应内容: {e.response.text[:500]}")
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