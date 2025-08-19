# 🚀 Supabase设置指南

## 📋 前置要求

1. 确保你有Supabase账户
2. 已经创建了一个Supabase项目
3. 项目已经运行并可以访问

## 🔧 设置步骤

### 步骤1：获取Supabase项目信息

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制以下信息：
   - **Project URL** (例如: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (以 `eyJ...` 开头的长字符串)

### 步骤2：创建环境配置文件

在 `web` 目录下创建 `.env.local` 文件：

```bash
# 在VS Code中，右键web目录 -> 新建文件 -> 命名为 .env.local
```

### 步骤3：配置环境变量

在 `.env.local` 文件中添加以下内容：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# DeepSeek API配置（可选）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# 应用配置
NEXT_PUBLIC_APP_NAME=赫利俄斯港口酒馆
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**重要：** 请将 `your-project-id.supabase.co` 和 `your_actual_anon_key_here` 替换为你实际的值！

### 步骤4：初始化数据库

1. 在Supabase Dashboard中，进入 **SQL Editor**
2. 复制 `supabase-init.sql` 文件的内容
3. 粘贴到SQL编辑器中并运行

### 步骤5：测试连接

1. 重启开发服务器：
   ```bash
   npm run dev
   ```

2. 访问测试API：
   ```
   http://localhost:3000/api/test-supabase
   ```

3. 检查控制台输出，应该看到：
   ```
   ✅ 连接测试成功
   ✅ 角色查询成功，找到 X 个角色
   ✅ 插入测试成功
   ✅ agent_logs插入测试成功
   ✅ 测试数据清理成功
   ```

## 🚨 常见问题

### 问题1：环境变量未配置
**错误信息：** `Supabase环境变量未配置！`

**解决方案：**
- 确保 `.env.local` 文件在 `web` 目录下
- 检查环境变量名称是否正确
- 重启开发服务器

### 问题2：连接被拒绝
**错误信息：** `Connection refused` 或 `Network error`

**解决方案：**
- 检查Supabase项目是否正在运行
- 验证Project URL是否正确
- 检查网络连接

### 问题3：认证失败
**错误信息：** `Invalid API key` 或 `Unauthorized`

**解决方案：**
- 检查anon public key是否正确
- 确保复制了完整的密钥
- 验证项目权限设置

### 问题4：表不存在
**错误信息：** `relation "characters" does not exist`

**解决方案：**
- 运行 `supabase-init.sql` 脚本
- 检查表是否创建成功
- 验证表结构是否正确

## 🔍 调试技巧

### 1. 检查环境变量
在浏览器控制台运行：
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### 2. 检查网络请求
在浏览器开发者工具的Network标签中查看API请求的状态

### 3. 查看Supabase日志
在Supabase Dashboard中查看API请求日志

## ✅ 成功标志

当一切配置正确时，你应该能够：

1. ✅ 成功连接到Supabase
2. ✅ 查询现有角色数据
3. ✅ 插入新的角色和日志记录
4. ✅ 在聊天功能中正常保存对话历史
5. ✅ 在Supabase Dashboard中看到数据

## 🆘 需要帮助？

如果遇到问题，请提供：
1. 具体的错误信息
2. 浏览器控制台的输出
3. Supabase Dashboard中的错误日志
4. 你的环境配置（隐藏敏感信息）

---

**记住：** 环境变量文件 `.env.local` 不会被提交到Git，所以你的密钥是安全的！
