-- v2: lead workflow (automatic emails + advisor-call scheduling). Additive only.
alter table public.web_leads
  add column if not exists name text check (length(name) <= 120),
  add column if not exists company text check (length(company) <= 160),
  add column if not exists message text check (length(message) <= 1000),
  add column if not exists preferred_times text check (length(preferred_times) <= 120),
  add column if not exists tz text check (length(tz) <= 64),
  add column if not exists intake text check (length(intake) <= 20),
  add column if not exists status text not null default 'new',
  add column if not exists unsub_token text not null default encode(gen_random_bytes(16), 'hex'),
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists welcome_sent_at timestamptz,
  add column if not exists reminders_sent text[] not null default '{}',
  add column if not exists owner_notified_at timestamptz,
  add column if not exists proposed_slots jsonb,
  add column if not exists scheduled_at timestamptz,
  add column if not exists calendar_event_id text;
create unique index if not exists web_leads_unsub_token on public.web_leads (unsub_token);

create table if not exists public.web_email_log (
  id bigint generated always as identity primary key,
  lead_id uuid references public.web_leads(id) on delete cascade,
  kind text not null,
  to_email text not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
alter table public.web_email_log enable row level security;

-- Private config (service role only; no RLS policies = no browser access). Holds the email API key, sender, site URL, cron secret.
create table if not exists public.web_private_config (key text primary key, value text not null, updated_at timestamptz not null default now());
alter table public.web_private_config enable row level security;
insert into public.web_private_config(key, value) values ('cron_secret', encode(gen_random_bytes(24), 'hex')) on conflict (key) do nothing;
