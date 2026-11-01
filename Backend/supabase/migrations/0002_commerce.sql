-- Svaraa commerce schema: customers, organisations, addresses, products, orders,
-- order items, payments, refunds, shipments, consents, status history and a
-- log of every Stripe webhook event.
--
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Replaces 0001 (the single reservations table); it stops without changing
-- anything if that table already holds orders. Safe to re-run.
--
-- Conventions
--   • Money is integer minor units (cents): 500 = $5.00. Never floats.
--   • Emails are stored lower-case, so one person is one customer.
--   • Orders copy what was agreed at the time (prices, address, items), so later
--     changes to products or a customer's details never rewrite history.
--   • Only the backend (service_role key) can read or write. Row Level Security
--     is on with no policies, so the public anon key sees nothing.

begin;

-- ─── Retire the v1 reservations table ───────────────────────────────────────
do $$
begin
  if to_regclass('public.reservations') is not null then
    if exists (select 1 from public.reservations) then
      raise exception 'public.reservations has rows. Move them into the new tables before running this script.';
    end if;
    drop table if exists public.reservation_events;
    drop table public.reservations;
  end if;
end $$;
drop function if exists public.mark_reservation_paid(text, text, int, text);
drop function if exists public.mark_reservation_unpaid(text, text);
drop function if exists public.log_reservation_status();

-- ─── Shared trigger: keep updated_at current ────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─── Customers: one row per person (by email) ───────────────────────────────
create table if not exists public.customers (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique check (email = lower(email)),
  full_name           text not null,
  phone               text not null,                 -- E.164, e.g. +919876543210
  stripe_customer_id  text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz                    -- set when personal data is erased on request
);

-- ─── Organisations: business buyers ─────────────────────────────────────────
create table if not exists public.organisations (
  id          uuid primary key default gen_random_uuid(),
  legal_name  text not null,
  gstin       text unique check (gstin is null or gstin ~ '^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Addresses: never edited once used by an order (insert a new row instead) ─
create table if not exists public.addresses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  line1        text not null,
  line2        text,
  city         text not null,
  state        text not null,
  postal_code  text not null,
  country      char(2) not null default 'IN',
  created_at   timestamptz not null default now()
);
create index if not exists addresses_customer_idx on public.addresses (customer_id);

-- ─── Products: the catalogue (prices here are the current ones) ─────────────
create table if not exists public.products (
  id                    uuid primary key default gen_random_uuid(),
  sku                   text not null unique,
  name                  text not null,
  currency              char(3) not null default 'usd' check (currency = lower(currency)),
  list_price_minor      int not null check (list_price_minor >= 0),
  preorder_price_minor  int check (preorder_price_minor >= 0),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- $130 list, $104 pre-order (see Backend/src/shared/preorder.ts).
insert into public.products (sku, name, list_price_minor, preorder_price_minor)
values ('SVARAA-FOLD', 'Svaraa Fold', 13000, 10400)
on conflict (sku) do nothing;

-- ─── Orders: one per pre-order ──────────────────────────────────────────────
create table if not exists public.orders (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique,       -- shown to the buyer, e.g. SVR-7K3QX9
  customer_id            uuid not null references public.customers (id),
  organisation_id        uuid references public.organisations (id),
  shipping_address_id    uuid not null references public.addresses (id),
  buyer_type             text not null check (buyer_type in ('individual', 'business')),
  status                 text not null default 'pending_payment'
                         check (status in (
                           'pending_payment',  -- sent to Stripe, not paid yet
                           'reserved',         -- reservation fee paid (webhook)
                           'payment_failed',   -- delayed payment method failed
                           'expired',          -- checkout abandoned
                           'in_production',
                           'awaiting_balance', -- ready; balance payment requested
                           'ready_to_ship',
                           'shipped',
                           'delivered',
                           'cancelled',
                           'refunded'
                         )),
  quantity               int not null check (quantity > 0),
  wearer                 text,
  currency               char(3) not null default 'usd' check (currency = lower(currency)),
  unit_price_minor       int not null check (unit_price_minor >= 0),  -- pre-order price per pendant, as agreed
  amount_due_now_minor   int not null check (amount_due_now_minor >= 0),
  amount_paid_minor      int not null default 0 check (amount_paid_minor >= 0),
  amount_refunded_minor  int not null default 0 check (amount_refunded_minor >= 0),
  metadata               jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  paid_at                timestamptz,
  cancelled_at           timestamptz,
  refunded_at            timestamptz
);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_organisation_idx on public.orders (organisation_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ─── Order items: the charged lines (reservation fee, or hold + booking) ────
create table if not exists public.order_items (
  id                 bigint generated always as identity primary key,
  order_id           uuid not null references public.orders (id) on delete cascade,
  product_id         uuid not null references public.products (id),
  kind               text not null check (kind in ('reservation', 'hold', 'booking', 'balance')),
  description        text not null,
  unit_amount_minor  int not null check (unit_amount_minor >= 0),
  quantity           int not null check (quantity > 0),
  amount_minor       int generated always as (unit_amount_minor * quantity) stored,
  created_at         timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ─── Payments: every attempt to pay (an order may have several) ─────────────
create table if not exists public.payments (
  id                          uuid primary key default gen_random_uuid(),
  order_id                    uuid not null references public.orders (id) on delete cascade,
  provider                    text not null default 'stripe',
  purpose                     text not null default 'reservation' check (purpose in ('reservation', 'balance')),
  status                      text not null default 'pending'
                              check (status in ('pending', 'succeeded', 'failed', 'expired', 'cancelled')),
  provider_session_id         text unique,           -- unique: a payment can never be recorded twice
  provider_payment_intent_id  text unique,
  provider_customer_id        text,
  currency                    char(3) not null check (currency = lower(currency)),
  amount_minor                int not null check (amount_minor >= 0),
  amount_refunded_minor       int not null default 0 check (amount_refunded_minor >= 0),
  failure_reason              text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  succeeded_at                timestamptz
);
create index if not exists payments_order_idx on public.payments (order_id);

-- ─── Refunds ────────────────────────────────────────────────────────────────
create table if not exists public.refunds (
  id                  uuid primary key default gen_random_uuid(),
  payment_id          uuid not null references public.payments (id) on delete cascade,
  provider_refund_id  text not null unique,
  status              text not null check (status in ('pending', 'requires_action', 'succeeded', 'failed', 'canceled')),
  currency            char(3) not null check (currency = lower(currency)),
  amount_minor        int not null check (amount_minor >= 0),
  reason              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists refunds_payment_idx on public.refunds (payment_id);

-- ─── Shipments: filled in when pendants leave the warehouse ─────────────────
create table if not exists public.shipments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  status           text not null default 'pending'
                   check (status in ('pending', 'packed', 'shipped', 'in_transit', 'delivered', 'returned')),
  carrier          text,
  tracking_number  text,
  quantity         int not null check (quantity > 0),
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists shipments_order_idx on public.shipments (order_id);

-- ─── Consents: what each customer agreed to, and when (DPDP Act record) ─────
create table if not exists public.consents (
  id              bigint generated always as identity primary key,
  customer_id     uuid not null references public.customers (id) on delete cascade,
  order_id        uuid references public.orders (id) on delete set null,
  purpose         text not null,                     -- e.g. 'preorder_contact'
  granted         boolean not null,
  policy_version  text not null,                     -- the privacy policy's "Last updated" date
  source          text not null,                     -- e.g. 'preorder_form'
  created_at      timestamptz not null default now()
);
create index if not exists consents_customer_idx on public.consents (customer_id);

-- ─── Order status history: written automatically by a trigger ───────────────
create table if not exists public.order_status_history (
  id           bigint generated always as identity primary key,
  order_id     uuid not null references public.orders (id) on delete cascade,
  from_status  text,
  to_status    text not null,
  changed_by   text not null default 'system',
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ─── Webhook events: every Stripe event received, processed once ────────────
create table if not exists public.webhook_events (
  id            text primary key,                    -- Stripe event id, evt_…
  provider      text not null default 'stripe',
  type          text not null,
  livemode      boolean not null,
  payload       jsonb not null,
  attempts      int not null default 1,
  last_error    text,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);
create index if not exists webhook_events_received_idx on public.webhook_events (received_at desc);

-- ─── Triggers ───────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['customers', 'organisations', 'products', 'orders', 'payments', 'refunds', 'shipments'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
                   t || '_touch_updated_at', t);
  end loop;
end $$;

create or replace function public.log_order_status()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into order_status_history (order_id, from_status, to_status)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status);
  end if;
  return new;
end $$;

drop trigger if exists orders_log_status on public.orders;
create trigger orders_log_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- ─── create_preorder: saves a whole pre-order in one transaction ────────────
-- p = {
--   reference, buyer_type, quantity, wearer, currency, unit_price_minor, metadata,
--   customer:     { email, full_name, phone },
--   organisation: { legal_name, gstin } | null,
--   address:      { line1, line2, city, state, postal_code, country },
--   items:        [{ sku, kind, description, unit_amount_minor, quantity }],
--   payment:      { provider_session_id, status } | null,
--   consent:      { purpose, granted, policy_version, source }
-- }
create or replace function public.create_preorder(p jsonb)
returns uuid language plpgsql set search_path = public as $$
declare
  v_customer  uuid;
  v_org       uuid;
  v_address   uuid;
  v_order     uuid;
  v_due       int;
  v_items     int;
  v_currency  text := lower(coalesce(p->>'currency', 'usd'));
  v_email     text := lower(trim(p->'customer'->>'email'));
  v_org_name  text := nullif(trim(p->'organisation'->>'legal_name'), '');
  v_gstin     text := nullif(upper(trim(p->'organisation'->>'gstin')), '');
  a           jsonb := p->'address';
begin
  -- Customer: the latest name and phone win.
  insert into customers (email, full_name, phone)
  values (v_email, p->'customer'->>'full_name', p->'customer'->>'phone')
  on conflict (email) do update set full_name = excluded.full_name, phone = excluded.phone
  returning id into v_customer;

  -- Organisation: matched by GSTIN when given, otherwise by name.
  if v_org_name is not null then
    if v_gstin is not null then
      insert into organisations (legal_name, gstin) values (v_org_name, v_gstin)
      on conflict (gstin) do update set legal_name = excluded.legal_name
      returning id into v_org;
    else
      select id into v_org from organisations
      where gstin is null and lower(legal_name) = lower(v_org_name)
      order by created_at limit 1;
      if v_org is null then
        insert into organisations (legal_name) values (v_org_name) returning id into v_org;
      end if;
    end if;
  end if;

  -- Address: reuse an identical one, otherwise add a new row.
  select id into v_address from addresses
  where customer_id = v_customer
    and lower(line1) = lower(a->>'line1')
    and lower(coalesce(line2, '')) = lower(coalesce(a->>'line2', ''))
    and lower(city) = lower(a->>'city')
    and state = a->>'state'
    and postal_code = a->>'postal_code'
    and country = coalesce(a->>'country', 'IN')
  order by created_at limit 1;
  if v_address is null then
    insert into addresses (customer_id, line1, line2, city, state, postal_code, country)
    values (v_customer, a->>'line1', nullif(a->>'line2', ''), a->>'city', a->>'state', a->>'postal_code',
            coalesce(a->>'country', 'IN'))
    returning id into v_address;
  end if;

  select coalesce(sum((i->>'unit_amount_minor')::int * (i->>'quantity')::int), 0)
  into v_due from jsonb_array_elements(p->'items') i;

  insert into orders (reference, customer_id, organisation_id, shipping_address_id, buyer_type, quantity, wearer,
                      currency, unit_price_minor, amount_due_now_minor, metadata)
  values (p->>'reference', v_customer, v_org, v_address, p->>'buyer_type', (p->>'quantity')::int,
          nullif(p->>'wearer', ''), v_currency, (p->>'unit_price_minor')::int, v_due,
          coalesce(p->'metadata', '{}'::jsonb))
  returning id into v_order;

  insert into order_items (order_id, product_id, kind, description, unit_amount_minor, quantity)
  select v_order, pr.id, i->>'kind', i->>'description', (i->>'unit_amount_minor')::int, (i->>'quantity')::int
  from jsonb_array_elements(p->'items') i
  join products pr on pr.sku = i->>'sku';
  get diagnostics v_items = row_count;
  if v_items <> jsonb_array_length(p->'items') then
    raise exception 'Unknown product SKU in order %', p->>'reference';
  end if;

  if p->'payment' is not null and jsonb_typeof(p->'payment') = 'object' then
    insert into payments (order_id, purpose, provider_session_id, currency, amount_minor)
    values (v_order, 'reservation', p->'payment'->>'provider_session_id', v_currency, v_due);
  end if;

  if p->'consent' is not null and jsonb_typeof(p->'consent') = 'object' then
    insert into consents (customer_id, order_id, purpose, granted, policy_version, source)
    values (v_customer, v_order, p->'consent'->>'purpose', (p->'consent'->>'granted')::boolean,
            p->'consent'->>'policy_version', p->'consent'->>'source');
  end if;

  return v_order;
end $$;

-- ─── mark_payment_succeeded: called by the webhook; safe to repeat ──────────
-- Returns 'paid_now' the first time, then 'already_paid'; 'not_found' if the
-- session has no payment row.
create or replace function public.mark_payment_succeeded(
  p_session_id         text,
  p_payment_intent_id  text,
  p_customer_id        text,
  p_amount_minor       int,
  p_currency           text
) returns text language plpgsql set search_path = public as $$
declare v_payment payments%rowtype;
begin
  select * into v_payment from payments
  where provider = 'stripe' and provider_session_id = p_session_id
  for update;
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

  if p_customer_id is not null then
    update customers set stripe_customer_id = p_customer_id
    where id = (select customer_id from orders where id = v_payment.order_id)
      and stripe_customer_id is null
      and not exists (select 1 from customers where stripe_customer_id = p_customer_id);
  end if;

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
  where provider = 'stripe' and provider_session_id = p_session_id and status = 'pending'
  returning order_id into v_order;
  if v_order is null then return; end if;

  -- The order only follows if nothing else on it has been paid.
  update orders
  set status = case p_status when 'failed' then 'payment_failed' else 'expired' end
  where id = v_order
    and status = 'pending_payment'
    and not exists (select 1 from payments where order_id = v_order and status = 'succeeded');
end $$;

-- ─── record_refund: add or update a refund, then recompute totals ───────────
-- Returns 'ok', or 'not_found' if the payment isn't one of ours.
create or replace function public.record_refund(
  p_payment_intent_id  text,
  p_refund_id          text,
  p_status             text,
  p_amount_minor       int,
  p_currency           text,
  p_reason             text
) returns text language plpgsql set search_path = public as $$
declare
  v_payment   payments%rowtype;
  v_refunded  int;
begin
  select * into v_payment from payments where provider_payment_intent_id = p_payment_intent_id for update;
  if not found then return 'not_found'; end if;

  insert into refunds (payment_id, provider_refund_id, status, currency, amount_minor, reason)
  values (v_payment.id, p_refund_id, p_status, lower(p_currency), p_amount_minor, p_reason)
  on conflict (provider_refund_id) do update
    set status = excluded.status, amount_minor = excluded.amount_minor, reason = coalesce(excluded.reason, refunds.reason);

  select coalesce(sum(amount_minor), 0) into v_refunded
  from refunds where payment_id = v_payment.id and status = 'succeeded';
  update payments set amount_refunded_minor = v_refunded where id = v_payment.id;

  select coalesce(sum(amount_refunded_minor), 0) into v_refunded
  from payments where order_id = v_payment.order_id;
  update orders
  set amount_refunded_minor = v_refunded,
      status = case when amount_paid_minor > 0 and v_refunded >= amount_paid_minor then 'refunded' else status end,
      refunded_at = case when amount_paid_minor > 0 and v_refunded >= amount_paid_minor then coalesce(refunded_at, now()) else refunded_at end
  where id = v_payment.order_id;

  return 'ok';
end $$;

-- ─── Webhook event log: begin returns true if the event still needs handling ─
create or replace function public.begin_webhook_event(p_id text, p_type text, p_livemode boolean, p_payload jsonb)
returns boolean language plpgsql set search_path = public as $$
declare v_pending boolean;
begin
  insert into webhook_events (id, type, livemode, payload)
  values (p_id, p_type, p_livemode, p_payload)
  on conflict (id) do update set attempts = webhook_events.attempts + 1
  returning processed_at is null into v_pending;
  return v_pending;
end $$;

create or replace function public.finish_webhook_event(p_id text, p_error text default null)
returns void language plpgsql set search_path = public as $$
begin
  update webhook_events
  set processed_at = case when p_error is null then now() end,
      last_error = p_error
  where id = p_id;
end $$;

-- ─── order_overview: one readable row per order, for the Table Editor ───────
create or replace view public.order_overview with (security_invoker = true) as
select
  o.reference,
  o.status,
  o.buyer_type,
  o.quantity,
  upper(o.currency)                  as currency,
  (o.amount_due_now_minor / 100.0)::numeric(12, 2)     as due_now,
  (o.amount_paid_minor / 100.0)::numeric(12, 2)        as paid,
  (o.amount_refunded_minor / 100.0)::numeric(12, 2)    as refunded,
  c.full_name,
  c.email,
  c.phone,
  org.legal_name                     as organisation,
  org.gstin,
  a.line1, a.line2, a.city, a.state, a.postal_code,
  o.wearer,
  o.created_at,
  o.paid_at,
  o.id                               as order_id
from public.orders o
join public.customers c on c.id = o.customer_id
join public.addresses a on a.id = o.shipping_address_id
left join public.organisations org on org.id = o.organisation_id;

-- ─── Access: backend only ───────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['customers', 'organisations', 'addresses', 'products', 'orders', 'order_items', 'payments',
                           'refunds', 'shipments', 'consents', 'order_status_history', 'webhook_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on public.order_overview from anon, authenticated;

revoke execute on function public.create_preorder(jsonb) from public, anon, authenticated;
revoke execute on function public.mark_payment_succeeded(text, text, text, int, text) from public, anon, authenticated;
revoke execute on function public.mark_payment_unpaid(text, text, text) from public, anon, authenticated;
revoke execute on function public.record_refund(text, text, text, int, text, text) from public, anon, authenticated;
revoke execute on function public.begin_webhook_event(text, text, boolean, jsonb) from public, anon, authenticated;
revoke execute on function public.finish_webhook_event(text, text) from public, anon, authenticated;
grant execute on function public.create_preorder(jsonb) to service_role;
grant execute on function public.mark_payment_succeeded(text, text, text, int, text) to service_role;
grant execute on function public.mark_payment_unpaid(text, text, text) to service_role;
grant execute on function public.record_refund(text, text, text, int, text, text) to service_role;
grant execute on function public.begin_webhook_event(text, text, boolean, jsonb) to service_role;
grant execute on function public.finish_webhook_event(text, text) to service_role;

commit;

-- Tell the Supabase API about the new tables straight away.
notify pgrst, 'reload schema';
