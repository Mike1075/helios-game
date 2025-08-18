#!/usr/bin/env python3
"""
Helios Game - 数据库设置工具
用于初始化Supabase数据库表结构和示例数据
"""

import os
import sys
from pathlib import Path

# 添加父目录到Python路径，以便导入API模块
sys.path.append(str(Path(__file__).parent.parent / "packages" / "api"))

from database import db
from dotenv import load_dotenv

def load_sql_file(filename: str) -> str:
    """读取SQL文件内容"""
    sql_path = Path(__file__).parent / filename
    with open(sql_path, 'r', encoding='utf-8') as f:
        return f.read()

def setup_database():
    """设置数据库表结构"""
    print("🚀 开始设置Helios数据库...")
    
    # 加载环境变量
    load_dotenv(Path(__file__).parent.parent / ".env.local")
    
    # 检查数据库连接
    print("📡 检查数据库连接...")
    if not db.is_connected():
        print("❌ 数据库连接失败！请检查环境变量配置。")
        print("确保 .env.local 文件中包含正确的 SUPABASE_URL 和 SUPABASE_SERVICE_KEY")
        return False
    
    print("✅ 数据库连接成功！")
    
    # 读取并执行schema.sql
    print("📋 创建数据库表结构...")
    try:
        schema_sql = load_sql_file("schema.sql")
        
        # 注意：Supabase不支持直接执行多语句SQL
        # 这里我们需要手动分解或使用Supabase Dashboard执行
        print("⚠️  请手动在Supabase Dashboard的SQL编辑器中执行以下文件：")
        print("   1. database/schema.sql - 创建表结构")
        print("   2. database/sample_data.sql - 插入示例数据")
        print("   ")
        print("💡 或者使用Supabase CLI：")
        print("   supabase db reset")
        print("   ")
        
    except Exception as e:
        print(f"❌ 读取schema.sql失败: {e}")
        return False
    
    return True

def verify_setup():
    """验证数据库设置"""
    print("🔍 验证数据库设置...")
    
    health = db.health_check()
    print(f"📊 数据库状态: {health}")
    
    if health["connected"]:
        print("✅ 数据库设置验证成功！")
        print(f"   角色数量: {health.get('character_count', 0)}")
        print(f"   信念系统数量: {health.get('belief_systems_count', 0)}")
        print(f"   最近日志数量: {health.get('recent_logs_count', 0)}")
        return True
    else:
        print("❌ 数据库设置验证失败！")
        return False

def quick_test():
    """快速测试数据库功能"""
    print("🧪 运行快速测试...")
    
    # 测试获取角色列表
    characters = db.get_all_characters()
    print(f"   找到 {len(characters)} 个角色")
    
    # 测试获取场景信息
    scene = db.get_scene("harbor_tavern")
    if scene:
        print(f"   场景 'harbor_tavern': {scene['name']}")
    
    # 测试日志功能
    logs = db.get_recent_logs(hours=24)
    print(f"   最近24小时日志: {len(logs)} 条")
    
    print("✅ 快速测试完成！")

def main():
    """主函数"""
    print("=" * 50)
    print("🌟 Helios Game - 数据库设置工具")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "verify":
            verify_setup()
        elif command == "test":
            quick_test()
        else:
            print("未知命令。可用命令: verify, test")
    else:
        # 默认执行完整设置流程
        success = setup_database()
        
        if success:
            print("\n" + "=" * 50)
            print("🎉 数据库设置指南完成！")
            print("=" * 50)
            print("请按照上述说明在Supabase Dashboard中执行SQL文件。")
            print("\n完成后，运行以下命令验证设置：")
            print("python database/setup.py verify")

if __name__ == "__main__":
    main()