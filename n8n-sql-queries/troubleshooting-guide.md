# 🔧 n8n SQL 查询故障排除指南

## 🎯 问题: "There is no connection back to the node" 错误

### 原因分析
- 节点引用名称不匹配
- 节点之间没有正确连接
- 变量引用格式错误

### 解决步骤

#### 步骤1: 确认节点连接
1. 确保"获取信念系统"节点连接在"获取当前角色"节点之后
2. 检查数据流向是否正确

#### 步骤2: 确认节点名称
在 n8n 中查看前置节点的确切名称，注意：
- 大小写是否匹配
- 是否有额外的空格
- 是否有特殊字符

#### 步骤3: 测试不同的引用方式

**方式1: 标准引用**
```sql
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';
```

**方式2: 方括号引用 (处理特殊字符)**
```sql
WHERE character_id = '{{ $["获取当前角色"].item.json.character_id }}';
```

**方式3: 节点索引引用**
```sql
WHERE character_id = '{{ $node[0].json.character_id }}';
```

**方式4: 从 webhook 直接获取**
```sql
WHERE character_id = '{{ $json.body.character_id }}';
```

#### 步骤4: 调试查询
使用这个查询查看前置节点的实际输出：
```sql
SELECT '{{ $("获取当前角色").item.json }}' as debug_output;
```

## 🚀 推荐的测试流程

### 1. 先用硬编码测试
```sql
SELECT * FROM belief_systems WHERE character_id = 'shy_student';
```

### 2. 测试变量引用
```sql
SELECT '{{ $json.body.user_id }}' as test_user_id;
```

### 3. 测试前置节点引用
```sql
SELECT '{{ $("获取当前角色").item.json.character_id }}' as test_character_id;
```

### 4. 完整动态查询
```sql
SELECT * FROM belief_systems 
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';
```

## 📋 常见问题解决

### 问题1: 节点名称包含中文
**解决方案**: 使用方括号或索引引用
```sql
-- 使用方括号
WHERE character_id = '{{ $["获取当前角色"].item.json.character_id }}';

-- 使用索引
WHERE character_id = '{{ $node[0].json.character_id }}';
```

### 问题2: 数据结构不确定
**解决方案**: 先查看数据结构
```sql
SELECT 
    '{{ $json }}' as webhook_data,
    '{{ $("获取当前角色").item.json }}' as node_data;
```

### 问题3: 空值处理
**解决方案**: 添加默认值
```sql
WHERE character_id = '{{ $("获取当前角色").item.json.character_id || "shy_student" }}';
```

## 🎯 最终建议

1. **先确保硬编码查询工作** ✅
2. **逐步替换为动态引用**
3. **使用调试查询确认数据格式**
4. **选择最适合的引用方式**

如果所有动态方式都不工作，可以考虑：
- 修改前端，直接在 webhook 中传递 character_id
- 使用 n8n 的 Set 节点来处理数据转换
