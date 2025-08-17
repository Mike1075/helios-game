-- Helios v4.1 触发器系统 - 完全基于Supabase边缘函数，移除n8n依赖
-- 实现"本我之镜"的信念观察者和认知失调检测

-- 创建信念观察者触发器函数：当某角色累计20条记录时触发
create or replace function check_belief_observer()
returns trigger language plpgsql as $$
declare
  record_count integer;
  last_generation_count integer;
begin
  -- 只处理有character_id的记录
  if NEW.character_id is null then
    return NEW;
  end if;
  
  -- 获取该角色的总记录数
  select count(*) into record_count 
  from agent_logs 
  where character_id = NEW.character_id;
  
  -- 获取上次生成信念时的记录数
  select coalesce(generation_count, 0) into last_generation_count
  from belief_systems 
  where character_id = NEW.character_id;
  
  -- 如果新增记录数达到20条，触发信念观察者（使用Supabase Edge Function）
  if record_count - last_generation_count >= 20 then
    -- 直接在数据库内调用边缘函数，而不是外部HTTP调用
    insert into events (character_id, session_id, scene_id, type, payload) values (
      NEW.character_id,
      NEW.session_id,
      NEW.scene_id,
      'belief_observer_trigger',
      json_build_object(
        'character_id', NEW.character_id,
        'trigger_type', 'batch_threshold',
        'record_count', record_count,
        'last_generation_count', last_generation_count
      )
    );
  end if;
  
  return NEW;
end $$;

-- 认知失调催化剂：检测潜在的信念冲突
create or replace function check_dissonance_catalyst()
returns trigger language plpgsql as $$
declare
  recent_count integer;
begin
  -- 只处理有character_id的记录
  if NEW.character_id is null then
    return NEW;
  end if;
  
  -- 检查最近5条记录，如果有足够的对话密度才触发分析
  select count(*) into recent_count
  from agent_logs 
  where character_id = NEW.character_id 
    and ts > now() - interval '10 minutes';
  
  -- 只有当最近有足够的交互时才触发失调检测
  if recent_count >= 3 then
    -- 通过events表触发认知失调分析，而不是外部HTTP调用
    insert into events (character_id, session_id, scene_id, type, payload) values (
      NEW.character_id,
      NEW.session_id,
      NEW.scene_id,
      'dissonance_catalyst_trigger',
      json_build_object(
        'character_id', NEW.character_id,
        'trigger_type', 'interaction_density',
        'recent_count', recent_count,
        'latest_log_id', NEW.id
      )
    );
  end if;
  
  return NEW;
end $$;

-- 删除旧触发器并创建新的（v4.1 数据库原生架构）
drop trigger if exists trg_belief on agent_logs;
drop trigger if exists trg_dissonance on agent_logs;
drop trigger if exists trg_belief_observer on agent_logs;
drop trigger if exists trg_dissonance_catalyst on agent_logs;

-- 创建新的触发器
create trigger trg_belief_observer
after insert on agent_logs
for each row execute function check_belief_observer();

create trigger trg_dissonance_catalyst
after insert on agent_logs
for each row execute function check_dissonance_catalyst();