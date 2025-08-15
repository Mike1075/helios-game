-- Helios v4.1 触发器系统 - 完全基于Supabase边缘函数，无n8n依赖
-- 遵循PRD v1.2规范：累计N条记录后触发，基于character_id

-- ensure pg_net extension exists:
-- create extension if not exists pg_net;

-- 信念观察者触发器：当某角色累计20条记录时触发
create or replace function check_belief_trigger()
returns trigger language plpgsql as $$
declare
  record_count integer;
  last_generation_count integer;
begin
  -- 获取该角色的总记录数
  select count(*) into record_count 
  from agent_logs 
  where character_id = NEW.character_id;
  
  -- 获取上次生成信念时的记录数
  select coalesce(generation_count, 0) into last_generation_count
  from belief_systems 
  where character_id = NEW.character_id;
  
  -- 如果新增记录数达到20条，触发信念观察者
  if record_count - last_generation_count >= 20 then
    perform net.http_post(
      url := 'https://<YOUR-PROJECT-REF>.functions.supabase.co/belief-observer',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key', true)
      ),
      body := json_build_object(
        'character_id', NEW.character_id,
        'trigger_type', 'batch_threshold',
        'record_count', record_count
      )
    );
  end if;
  
  return NEW;
end $$;

-- 认知失调催化剂：每次插入都检测，但更智能的判断
create or replace function check_dissonance_catalyst()
returns trigger language plpgsql as $$
declare
  recent_count integer;
begin
  -- 检查最近5条记录，如果有足够的对话密度才触发分析
  select count(*) into recent_count
  from agent_logs 
  where character_id = NEW.character_id 
    and ts > now() - interval '10 minutes';
  
  -- 只有当最近有足够的交互时才触发失调检测
  if recent_count >= 3 then
    perform net.http_post(
      url := 'https://<YOUR-PROJECT-REF>.functions.supabase.co/dissonance-catalyst',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key', true)
      ),
      body := json_build_object(
        'character_id', NEW.character_id,
        'session_id', NEW.session_id,
        'trigger_type', 'interaction_density'
      )
    );
  end if;
  
  return NEW;
end $$;

-- 删除旧触发器并创建新的
drop trigger if exists trg_belief on agent_logs;
drop trigger if exists trg_dissonance on agent_logs;

create trigger trg_belief_observer
after insert on agent_logs
for each row execute function check_belief_trigger();

create trigger trg_dissonance_catalyst
after insert on agent_logs
for each row execute function check_dissonance_catalyst();