-- ========================================
-- n8n SQL 查询故障排除指南
-- ========================================

-- ========================================
-- 问题1: "There is no connection back to the node" 错误
-- ========================================

-- 原因: 节点引用名称不匹配或节点未连接
-- 解决方案:

-- 步骤1: 确认前置节点的确切名称
-- 在 n8n 中查看节点名称，注意大小写和特殊字符

-- 步骤2: 测试前置节点输出格式
-- 使用这个查询查看前置节点的实际输出:
SELECT '{{ $("您的前置节点名").item.json }}' as debug_output;

-- 步骤3: 根据实际输出调整引用方式
-- 如果输出是 {"character_id": "shy_student"}，使用:
-- WHERE character_id = '{{ $("前置节点名").item.json.character_id }}';

-- 如果输出是 {"data": {"character_id": "shy_student"}}，使用:
-- WHERE character_id = '{{ $("前置节点名").item.json.data.character_id }}';

-- ========================================
-- 问题2: 节点名称包含特殊字符
-- ========================================

-- 如果节点名称包含空格、中文或特殊字符，尝试:
-- 方法1: 使用方括号
-- WHERE character_id = '{{ $["获取当前角色"].item.json.character_id }}';

-- 方法2: 使用节点索引 (0 表示第一个输入节点)
-- WHERE character_id = '{{ $node[0].json.character_id }}';

-- ========================================
-- 问题3: 数据结构不确定
-- ========================================

-- 调试查询1: 查看完整的输入数据
SELECT 
    '{{ $json }}' as webhook_data,
    '{{ $("前置节点名").item.json }}' as previous_node_data;

-- 调试查询2: 查看所有可用变量
SELECT 
    '{{ Object.keys($json) }}' as webhook_keys,
    '{{ Object.keys($("前置节点名").item.json) }}' as node_keys;

-- ========================================
-- 问题4: 硬编码到动态的转换步骤
-- ========================================

-- 步骤1: 确认硬编码查询工作
SELECT * FROM belief_systems WHERE character_id = 'shy_student';

-- 步骤2: 逐步替换为动态
-- 先测试简单的变量引用:
SELECT '{{ $json.body.user_id }}' as test_user_id;

-- 步骤3: 测试前置节点引用:
SELECT '{{ $("获取当前角色").item.json.character_id }}' as test_character_id;

-- 步骤4: 完整的动态查询:
SELECT * FROM belief_systems 
WHERE character_id = '{{ $("获取当前角色").item.json.character_id }}';

-- ========================================
-- 常用的节点引用模式
-- ========================================

-- 模式1: 标准引用
-- '{{ $("节点名").item.json.字段名 }}'

-- 模式2: 数组引用 (如果有多个结果)
-- '{{ $("节点名").all()[0].json.字段名 }}'

-- 模式3: 安全引用 (避免空值错误)
-- '{{ $("节点名").item.json.字段名 || "默认值" }}'

-- 模式4: 条件引用
-- '{{ $("节点名").item.json.字段名 ? $("节点名").item.json.字段名 : "默认值" }}'

-- ========================================
-- 测试用的角色ID列表
-- ========================================

-- 可用的测试角色ID:
-- 'shy_student' - 害羞的学生
-- 'ambitious_worker' - 雄心勃勃的工作者

-- 测试查询模板:
-- SELECT * FROM belief_systems WHERE character_id = 'shy_student';
-- SELECT * FROM inner_drives WHERE character_id = 'shy_student';
-- SELECT * FROM outer_self_traits WHERE character_id = 'shy_student';
-- SELECT * FROM collective_unconscious; -- 不需要 character_id

-- ========================================
