# 📋 n8n SQL 查询替换方案

## 🎯 目的

将 n8n 工作流中的 Supabase Tool 节点替换为直接的 SQL 查询，解决大模型不支持 Function Calling 的问题。

## 📁 文件说明

| 文件名 | 对应的 n8n 节点 | 用途 |
|--------|----------------|------|
| `01-get-current-character.sql` | "获取当前角色" | 根据 user_id 获取当前激活角色 |
| `02-get-belief-systems.sql` | "获取信念" | 获取角色的信念系统数据 |
| `03-get-inner-drives.sql` | "获取内驱力" | 获取角色的内驱力数据 |
| `04-get-collective-unconscious.sql` | "获取集体潜意识" | 获取集体潜意识数据 |
| `05-get-outer-self-behavior.sql` | "获取外我" | 获取外我特征(行为) |
| `06-get-outer-self-reaction.sql` | "获取外我1" | 获取外我特征(反应) |
| `99-all-queries-combined.sql` | - | 所有查询的合集参考 |

## 🔧 在 n8n 中的使用步骤

### 1. 删除现有的 Supabase Tool 节点
- 删除所有 `n8n-nodes-base.supabaseTool` 类型的节点
- 保留 `n8n-nodes-base.postgres` 类型的"获取当前角色"节点

### 2. 添加新的 Postgres 节点
对于每个需要替换的 Supabase Tool 节点：
1. 添加新的 `Postgres` 节点
2. 选择操作：`Execute Query`
3. 复制对应的 SQL 查询到查询框中
4. 配置数据库连接（使用现有的 Supabase 凭据）

### 3. 更新节点连接
- 将原本连接到 Supabase Tool 的线路重新连接到新的 Postgres 节点
- 确保数据流向正确

### 4. 更新变量引用
在 LangChain Agent 节点的 prompt 中，更新变量引用：
```
原来: {{ $('获取信念').item.json.content }}
现在: {{ $('获取信念').item.json.content }}
```

## ⚠️ 重要注意事项

1. **数据库连接**: 所有新节点都使用相同的 Supabase Postgres 连接
2. **变量传递**: 确保 `character_id` 正确从"获取当前角色"节点传递
3. **错误处理**: 添加适当的错误处理逻辑
4. **性能优化**: 查询已经包含必要的索引优化

## 🚀 预期效果

- ✅ 解决 Function Calling 不支持的问题
- ✅ 直接使用 SQL 查询，性能更好
- ✅ 更容易调试和维护
- ✅ 避免 LangChain Agent 的工具解析错误

## 📞 支持

如果在替换过程中遇到问题，请检查：
1. 数据库连接配置是否正确
2. SQL 查询中的变量引用是否正确
3. 节点之间的连接是否正确
4. 数据库中是否有相应的数据
