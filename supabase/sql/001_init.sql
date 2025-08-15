-- Helios v4.1 "本我之镜" 数据库结构
-- 严格遵循 PRD v1.2 规范

-- 角色表：存储所有角色（玩家/NPC）的基础信息
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  core_motivation text not null,
  is_player boolean default false,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 信念系统表：存储每个角色动态生成的信念YAML
create table if not exists belief_systems (
  character_id uuid primary key references characters(id) on delete cascade,
  belief_yaml text not null default '',
  belief_summary jsonb default '{}'::jsonb,
  last_updated timestamptz default now(),
  generation_count integer default 0
);

-- 代理日志表：记录每一次有意义的交互
create table if not exists agent_logs (
  id bigserial primary key,
  character_id uuid references characters(id) on delete cascade,
  session_id text not null,
  scene_id text default 'harbor_tavern',
  action_type text default 'dialogue',
  speaker text not null check (char_length(speaker) <= 20),
  text text not null,
  input_context jsonb default '{}'::jsonb,
  output_context jsonb default '{}'::jsonb,
  belief_snapshot text,
  ts timestamptz default now()
);

-- 事件表：记录导演引擎或核心交互触发的事件
create table if not exists events (
  id bigserial primary key,
  character_id uuid references characters(id) on delete set null,
  session_id text,
  scene_id text default 'harbor_tavern',
  type text not null,
  payload jsonb default '{}'::jsonb,
  ts timestamptz default now()
);

-- 创建索引优化性能
create index if not exists idx_agent_logs_character_ts on agent_logs(character_id, ts desc);
create index if not exists idx_agent_logs_session on agent_logs(session_id, ts desc);
create index if not exists idx_events_character on events(character_id, ts desc);
create index if not exists idx_events_session on events(session_id, ts desc);

-- 启用行级安全
alter table characters enable row level security;
alter table agent_logs enable row level security;
alter table belief_systems enable row level security;
alter table events enable row level security;

-- 初始化 MVP "创世之心" 的7个核心NPC（遵循PRD v1.2要求）
insert into characters (id, name, role, core_motivation, is_player, tags) values
  ('11111111-1111-1111-1111-111111111111', '艾尔文', '港口卫兵', '维护港口秩序，保护商贸安全，执行王国法律', false, '{"order", "authority", "duty"}'),
  ('22222222-2222-2222-2222-222222222222', '卡琳', '流浪者', '在危险的世界中生存，寻找机会改善处境，保护自己不被利用', false, '{"survival", "freedom", "pragmatic"}'),
  ('33333333-3333-3333-3333-333333333333', '瑟兰杜斯', '学者祭司', '追求知识与真理，传播智慧，帮助迷茫的灵魂找到方向', false, '{"knowledge", "wisdom", "guidance"}'),
  ('44444444-4444-4444-4444-444444444444', '马库斯', '酒馆老板', '经营好酒馆生意，倾听每个人的故事，维持酒馆的和谐氛围', false, '{"business", "hospitality", "neutrality"}'),
  ('55555555-5555-5555-5555-555555555555', '莉莉安', '港口商人', '最大化贸易利润，建立商业网络，获取有价值的信息', false, '{"profit", "networking", "information"}'),
  ('66666666-6666-6666-6666-666666666666', '托马斯', '水手', '寻找下一次出海机会，享受港口生活，与同伴分享冒险故事', false, '{"adventure", "camaraderie", "wanderlust"}'),
  ('77777777-7777-7777-7777-777777777777', '伊莎贝拉', '神秘女子', '隐藏真实身份，观察港口动态，完成不为人知的使命', false, '{"secrecy", "observation", "mission"}')
on conflict (id) do nothing;

-- 为每个NPC初始化空的信念系统记录
insert into belief_systems (character_id, belief_yaml) values
  ('11111111-1111-1111-1111-111111111111', '# 艾尔文的初始信念系统将通过行为观察生成'),
  ('22222222-2222-2222-2222-222222222222', '# 卡琳的初始信念系统将通过行为观察生成'),
  ('33333333-3333-3333-3333-333333333333', '# 瑟兰杜斯的初始信念系统将通过行为观察生成'),
  ('44444444-4444-4444-4444-444444444444', '# 马库斯的初始信念系统将通过行为观察生成'),
  ('55555555-5555-5555-5555-555555555555', '# 莉莉安的初始信念系统将通过行为观察生成'),
  ('66666666-6666-6666-6666-666666666666', '# 托马斯的初始信念系统将通过行为观察生成'),
  ('77777777-7777-7777-7777-777777777777', '# 伊莎贝拉的初始信念系统将通过行为观察生成')
on conflict (character_id) do nothing;