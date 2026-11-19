-- 0003_razorpay.sql
-- Payments move from Stripe to Razorpay, in rupees (INR) or US dollars (USD).
-- Run once in Supabase → SQL Editor, after 0002_commerce.sql. Safe to re-run.
--
-- The tables stay as they are. For Razorpay the payment columns hold:
--   payments.provider_session_id         the Razorpay order id   (order_…)
--   payments.provider_payment_intent_id  the Razorpay payment id (pay_…)
--   refunds.provider_refund_id           the Razorpay refund id  (rfnd_…)
--   webhook_events.id                    the Razorpay event id
-- Amounts stay in the smallest unit: paise for INR, cents for USD.

begin;

-- New rows are Razorpay's unless said otherwise.
alter table public.payments alter column provider set default 'razorpay';
alter table public.webhook_events alter column provider set default 'razorpay';

comment on column public.payments.provider_session_id is 'Razorpay order id (order_…). Stripe Checkout session id on older rows.';
comment on column public.payments.provider_payment_intent_id is 'Razorpay payment id (pay_…). Stripe PaymentIntent id on older rows.';
comment on column public.orders.currency is 'inr or usd: what the reservation was paid in.';

-- ─── mark_payment_succeeded: no longer tied to Stripe ───────────────────────
-- Same arguments as before. Finds the payment by its order id (unique), so it works
-- for Razorpay orders and any older Stripe sessions. Returns 'paid_now' the first
-- time, then 'already_paid'; 'not_found' if no payment row has that id.
create or replace function public.mark_payment_succeeded(
  p_session_id         text,
  p_payment_intent_id  text,
  p_customer_id        text,
  p_amount_minor       int,
  p_currency           text
) returns text language plpgsql set search_path = public as $$
declare v_payment payments%rowtype;
begin
  select * into v_payment from payments where provider_session_id = p_session_id for update;
  if not found then return 'not_found'; end if;
  if v_payment.status = 'succeeded' then return 'already_paid'; end if;

  update payments
  set status = 'succeeded',
      provider_payment_intent_id = coalesce(p_payment_intent_id, provider_payment_intent_id),
      provider_customer_id = coalesce(p_customer_id, provider_customer_id),
      amount_minor = p_amount_minor,
      currency = lower(p_currency),
      failure_reason = null,
      succeeded_at = now()
  where id = v_payment.id;

  update orders
  set amount_paid_minor = amount_paid_minor + p_amount_minor,
      status = case when status in ('pending_payment', 'payment_failed', 'expired') then 'reserved' else status end,
      paid_at = coalesce(paid_at, now())
  where id = v_payment.order_id;

  return 'paid_now';
end $$;

-- ─── mark_payment_unpaid: a pending payment failed or expired ───────────────
create or replace function public.mark_payment_unpaid(p_session_id text, p_status text, p_reason text default null)
returns void language plpgsql set search_path = public as $$
declare v_order uuid;
begin
  if p_status not in ('failed', 'expired') then
    raise exception 'mark_payment_unpaid: unsupported status %', p_status;
  end if;

  update payments set status = p_status, failure_reason = p_reason
  where provider_session_id = p_session_id and status = 'pending'
  returning order_id into v_order;
  if v_order is null then return; end if;

  -- The order only follows if nothing else on it has been paid.
  update orders
  set status = case p_status when 'failed' then 'payment_failed' else 'expired' end
  where id = v_order
    and status = 'pending_payment'
    and not exists (select 1 from payments where order_id = v_order and status = 'succeeded');
end $$;

-- A buyer whose first attempt fails can retry in the same Razorpay order: mark_payment_succeeded
-- accepts a 'failed' payment and marks it succeeded, and the order goes back to 'reserved'.

-- Backend only, as before.
revoke execute on function public.mark_payment_succeeded(text, text, text, int, text) from public, anon, authenticated;
revoke execute on function public.mark_payment_unpaid(text, text, text) from public, anon, authenticated;
grant execute on function public.mark_payment_succeeded(text, text, text, int, text) to service_role;
grant execute on function public.mark_payment_unpaid(text, text, text) to service_role;

commit;

-- Tell the Supabase API about the changes straight away.
notify pgrst, 'reload schema';
