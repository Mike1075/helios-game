-- ensure pg_net extension exists:
-- create extension if not exists pg_net;

create or replace function notify_belief_observer()
returns trigger language plpgsql as $$
declare payload json;
begin
  payload := json_build_object('session_id', NEW.session_id);
  perform net.http_post(
    url := 'https://<YOUR-PROJECT-REF>.functions.supabase.co/belief-observer',
    headers := json_build_object('Content-Type','application/json'),
    body := payload
  );
  return NEW;
end $$;

drop trigger if exists trg_belief on agent_logs;
create trigger trg_belief
after insert on agent_logs
for each row execute function notify_belief_observer();

create or replace function notify_dissonance_catalyst()
returns trigger language plpgsql as $$
declare payload json;
begin
  payload := json_build_object('session_id', NEW.session_id);
  perform net.http_post(
    url := 'https://<YOUR-PROJECT-REF>.functions.supabase.co/dissonance-catalyst',
    headers := json_build_object('Content-Type','application/json'),
    body := payload
  );
  return NEW;
end $$;

drop trigger if exists trg_dissonance on agent_logs;
create trigger trg_dissonance
after insert on agent_logs
for each row execute function notify_dissonance_catalyst();