# EmergingMarketIQ — web (demo build)

Browser version of EmergingMarketIQ. The user answers "Which emerging market should my business enter?" in 7 questions and gets a ranked shortlist of 24 markets: fit scores, indicative first-year cost for their team size, and ARIA's analysis (why it fits, main risk, first move). It also generates 24 market-brief pages for search.

**Status:** working demo, 24 Sep 2026. **Not published yet.**

## Try the demo
Double-click `site/index.html`, or run `cd site && python3 -m http.server 8080`.

## Structure
Same as UniPath web: `site/` (built output), `src/`, `shared/`, `build.mjs`, `supabase/`, `analytics/funnel.sql`.
- `src/markets.json` is a snapshot of the `countries`, `operational_costs` and `regulatory_alerts` tables. The data was reviewed in March 2026 and needs a refresh before launch.
- `ops/revenuecat-webhook/` and `ops/lock_premium_columns.sql` close the "self-granted premium" hole in the Android app. They are **not deployed yet**. The deploy order is in the file header.

## Publish (after sign-off)
```
SITE_URL=https://<your-domain> SHARE_BASE=https://<your-domain> node build.mjs
```
Backend: Supabase project `bznlmkaepbhrpflvdxix`, edge function `aria-web`.
