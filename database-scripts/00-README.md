# 📋 Helios 数据库设置脚本

## 🚀 执行顺序

请按以下顺序执行SQL文件：

### 1️⃣ `01-create-tables.sql`
- 启用vector扩展
- 创建所有数据库表
- **执行位置**：Supabase Dashboard → SQL Editor

### 2️⃣ `02-create-indexes.sql`
- 创建性能优化索引
- 创建向量搜索索引
- **执行位置**：Supabase Dashboard → SQL Editor

### 3️⃣ `03-insert-data.sql`
- 插入预设角色数据
- **执行位置**：Supabase Dashboard → SQL Editor

### 4️⃣ `04-create-functions.sql`
- 创建用户管理函数
- 创建角色绑定函数
- **执行位置**：Supabase Dashboard → SQL Editor

### 5️⃣ `05-test-examples.sql`
- 测试用例和示例
- 验证功能是否正常
- **执行位置**：Supabase Dashboard → SQL Editor

### 6️⃣ `06-n8n-queries.sql`
- n8n工作流中使用的查询
- **执行位置**：复制到n8n的Supabase节点中

## ⚠️ 重要提醒

1. **必须按顺序执行**：1→2→3→4→5→6
2. **一个文件一个文件执行**：不要跳跃执行
3. **检查执行结果**：每个文件执行后检查是否有错误
4. **保存UUID**：执行测试时记录返回的user_id

## 🎯 执行完成后

- 数据库表结构完整
- 用户角色管理功能可用
- n8n工作流可以正确查询用户角色
- 前端可以调用用户管理API
