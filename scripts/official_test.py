#!/usr/bin/env python3
"""
严格按照Vercel AI Gateway官方文档进行测试
参考: https://vercel.com/docs/ai-gateway/openai-compat
"""

import requests
import json

def test_official_api():
    """
    严格按照官方文档的示例进行测试
    """
    print("=== 严格按照Vercel AI Gateway官方文档测试 ===")
    
    # 1. 官方文档中的端点地址
    API_ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions"
    
    # 2. 您提供的API Key
    API_KEY = "EtMyP4WaMfdkxizkutRrJT1j"
    
    # 3. 官方文档中的请求头格式
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"端点地址: {API_ENDPOINT}")
    print(f"API Key: {API_KEY}")
    
    # 4. 官方文档中的模型名称格式示例
    test_models = [
        "anthropic/claude-3-5-sonnet",  # 官方文档示例
        "gpt-4o-mini",                 # OpenAI格式
        "openai/gpt-4o-mini"           # 带provider前缀
    ]
    
    for model in test_models:
        print(f"\n--- 测试模型: {model} ---")
        
        # 5. 官方文档中的请求格式
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user", 
                    "content": "Hello"
                }
            ],
            "max_tokens": 10
        }
        
        print(f"请求负载: {json.dumps(payload, indent=2)}")
        
        try:
            # 发送请求
            response = requests.post(API_ENDPOINT, headers=headers, json=payload)
            
            print(f"状态码: {response.status_code}")
            print(f"响应头: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 成功! 响应: {json.dumps(result, indent=2)}")
                return model, API_ENDPOINT  # 找到可用的配置
            else:
                print(f"❌ 失败")
                print(f"错误响应: {response.text}")
                
        except Exception as e:
            print(f"❌ 请求异常: {e}")
    
    return None, None

def test_models_endpoint():
    """
    测试获取模型列表的端点
    """
    print(f"\n=== 测试模型列表端点 ===")
    
    API_KEY = "EtMyP4WaMfdkxizkutRrJT1j"
    MODELS_ENDPOINT = "https://ai-gateway.vercel.sh/v1/models"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"端点地址: {MODELS_ENDPOINT}")
    
    try:
        response = requests.get(MODELS_ENDPOINT, headers=headers)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            models = response.json()
            print(f"✅ 获取到模型列表:")
            print(json.dumps(models, indent=2))
        else:
            print(f"❌ 获取模型列表失败")
            print(f"响应: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")

if __name__ == "__main__":
    # 第一步：测试聊天端点
    working_model, working_endpoint = test_official_api()
    
    # 第二步：测试模型列表端点
    test_models_endpoint()
    
    # 总结
    print(f"\n=== 测试总结 ===")
    if working_model:
        print(f"✅ 找到可用配置:")
        print(f"  模型: {working_model}")
        print(f"  端点: {working_endpoint}")
    else:
        print("❌ 未找到可用的模型配置")
        print("请检查:")
        print("1. API Key是否正确")
        print("2. 端点地址是否正确")
        print("3. 模型名称格式是否正确")