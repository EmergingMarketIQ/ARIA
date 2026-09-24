-- Apply ONLY after the RevenueCat webhook is live and verified (see revenuecat-webhook/index.ts).
-- Stops any signed-in user from self-granting premium via the public API.
create or replace function public.protect_subscription_columns() returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (
     new.subscription_tier is distinct from old.subscription_tier or new.subscription_status is distinct from old.subscription_status) then
    raise exception 'subscription fields are managed by the server';
  end if;
  return new;
end $$;
drop trigger if exists protect_subscription_columns on public.user_profiles;
create trigger protect_subscription_columns before update on public.user_profiles for each row execute function public.protect_subscription_columns();
-- Also block inserts that start as premium:
drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile" on public.user_profiles for insert with check (auth.uid() = id and coalesce(subscription_tier,'free') = 'free');
-- App follow-up: remove updateSupabasePremiumStatus() from lib/revenuecat.ts (the webhook now owns this).
