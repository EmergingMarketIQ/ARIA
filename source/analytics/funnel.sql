-- Web funnel — run in Supabase SQL editor (this product's project).
-- 1) Daily funnel (unique anonymous visitors per stage)
select * from web_funnel_daily order by day desc limit 30;

-- 2) Conversion over the last 7 / 28 days
with f as (
  select event, count(distinct anon_id) u from web_events
  where created_at > now() - interval '28 days' group by 1)
select
  max(u) filter (where event='page_view')        as visitors,
  max(u) filter (where event='wizard_start')     as started,
  max(u) filter (where event='wizard_complete')  as completed,
  max(u) filter (where event='aria_complete')    as aria_ok,
  max(u) filter (where event='share_click')      as shared,
  max(u) filter (where event='lead_submit')      as leads,
  max(u) filter (where event='premium_interest') as premium_interest,
  round(100.0*max(u) filter (where event='wizard_start')/nullif(max(u) filter (where event='page_view'),0),1)      as start_rate_pct,
  round(100.0*max(u) filter (where event='wizard_complete')/nullif(max(u) filter (where event='wizard_start'),0),1) as completion_pct,
  round(100.0*max(u) filter (where event='lead_submit')/nullif(max(u) filter (where event='wizard_complete'),0),1)  as lead_rate_pct
from f;

-- 3) Acquisition: where do completers come from?
select coalesce(utm->>'utm_source', nullif(split_part(split_part(referrer,'/',3),'?',1),''), 'direct') as source,
       count(distinct anon_id) filter (where event='page_view') visitors,
       count(distinct anon_id) filter (where event='wizard_complete') completers,
       count(distinct anon_id) filter (where event='lead_submit') leads
from web_events where created_at > now() - interval '28 days' group by 1 order by 2 desc;

-- 4) Device + locale/timezone mix (timezone is a proxy for country)
select device, split_part(tz,'/',1) region, count(distinct anon_id) from web_events where event='page_view' group by 1,2 order by 3 desc;

-- 5) Returning visitors (return-visit rate)
select count(distinct anon_id) filter (where (props->>'returning')::boolean) * 100.0 / nullif(count(distinct anon_id),0) as returning_pct
from web_events where event='page_view' and created_at > now() - interval '28 days';

-- 6) Shared-report virality: views of shared links and conversions from them
select count(*) filter (where event='report_view' and (props->>'from_share')::boolean) shared_views,
       count(*) filter (where event='report_cta_own') clicked_build_own
from web_events where created_at > now() - interval '28 days';

-- 7) Leads by intent (and price-tested interest)
select intent, context->>'price' price, count(*) from web_leads group by 1,2 order by 3 desc;

-- Reset all web test data before launch:
-- delete from web_leads; delete from web_events; delete from web_reports; delete from web_rate_limits;
