-- Web-first acquisition engine: additive tables only (no changes to app tables)
create table if not exists public.web_reports (
  id text primary key,
  product text not null check (product in ('unipath','emiq')),
  input_hash text not null,
  inputs jsonb not null,
  picks jsonb not null,
  narrative jsonb,
  model text,
  views integer not null default 0,
  followups integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists web_reports_hash_idx on public.web_reports (product, input_hash);

create table if not exists public.web_leads (
  id uuid primary key default gen_random_uuid(),
  product text not null check (product in ('unipath','emiq')),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  intent text not null check (intent in ('full_report','reminders','premium_interest','advisor_call','newsletter')),
  report_id text references public.web_reports(id) on delete set null,
  anon_id text,
  consent_marketing boolean not null default false,
  context jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists web_leads_dedupe on public.web_leads (product, email, intent);

create table if not exists public.web_events (
  id bigint generated always as identity primary key,
  product text not null check (product in ('unipath','emiq')),
  event text not null check (length(event) <= 64),
  anon_id text check (length(anon_id) <= 64),
  session_id text check (length(session_id) <= 64),
  path text check (length(path) <= 300),
  referrer text check (length(referrer) <= 500),
  utm jsonb,
  device text check (length(device) <= 20),
  locale text check (length(locale) <= 20),
  tz text check (length(tz) <= 64),
  props jsonb check (pg_column_size(props) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists web_events_product_event_idx on public.web_events (product, event, created_at);

create table if not exists public.web_rate_limits (
  key text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (key, day)
);

alter table public.web_reports enable row level security;
alter table public.web_leads enable row level security;
alter table public.web_events enable row level security;
alter table public.web_rate_limits enable row level security;

-- Browsers may only INSERT analytics events (no read). Everything else goes through the edge function (service role).
drop policy if exists "anon can insert web events" on public.web_events;
create policy "anon can insert web events" on public.web_events for insert to anon, authenticated with check (true);

-- Atomic rate-limit counter used by edge functions (service role only)
create or replace function public.web_hit(p_key text, p_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare c integer;
begin
  insert into web_rate_limits(key, day, count) values (p_key, current_date, 1)
  on conflict (key, day) do update set count = web_rate_limits.count + 1
  returning count into c;
  return c <= p_limit;
end $$;
revoke all on function public.web_hit(text, integer) from public, anon, authenticated;

-- Funnel view for the founder (read via dashboard / SQL)
create or replace view public.web_funnel_daily with (security_invoker = true) as
select product, date_trunc('day', created_at)::date as day,
  count(distinct anon_id) filter (where event = 'page_view') as visitors,
  count(distinct anon_id) filter (where event = 'wizard_start') as wizard_starts,
  count(distinct anon_id) filter (where event = 'wizard_complete') as wizard_completes,
  count(distinct anon_id) filter (where event = 'result_view') as results,
  count(distinct anon_id) filter (where event = 'lead_submit') as leads,
  count(distinct anon_id) filter (where event = 'share_click') as sharers,
  count(distinct anon_id) filter (where event = 'premium_interest') as premium_interest,
  count(distinct anon_id) filter (where event = 'page_view' and (props->>'returning')::boolean) as returning_visitors
from public.web_events group by 1,2;
