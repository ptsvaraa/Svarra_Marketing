-- Svaraa pre-order reservations.
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement checks whether its object already exists.

-- ─── Reservations: one row per checkout ────────────────────────────────────
create table if not exists public.reservations (
  id                        uuid primary key default gen_random_uuid(),
  reference                 text not null unique,            -- shown to the buyer, e.g. SVR-7K3QX9
  status                    text not null default 'pending'
                            check (status in (
                              'pending',         -- sent to Stripe, not paid yet
                              'paid',            -- Stripe confirmed payment (webhook)
                              'payment_failed',  -- delayed payment method failed
                              'expired',         -- checkout abandoned; Stripe expired the session
                              'in_production', 'shipped', 'delivered',
                              'cancelled', 'refunded'
                            )),

  -- Stripe links
  stripe_session_id         text unique,                     -- unique: a payment can never be saved twice
  stripe_payment_intent_id  text,

  -- Buyer
  buyer_type                text not null check (buyer_type in ('individual', 'business')),
  organisation              text,
  gstin                     text,
  full_name                 text not null,
  email                     text not null,
  phone                     text not null,                   -- stored as +91XXXXXXXXXX
  wearer                    text,

  -- Delivery address
  address_line1             text not null,
  address_line2             text,
  city                      text not null,
  state                     text not null,
  pincode                   text not null,

  -- Order and money. Amounts are whole minor units (cents), never decimals.
  quantity                  int  not null check (quantity > 0),
  currency                  text not null default 'usd',
  amount_due_minor          int  not null check (amount_due_minor >= 0),   -- what we asked Stripe to charge
  amount_paid_minor         int  check (amount_paid_minor >= 0),           -- what Stripe reports as paid

  contact_consent           boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  paid_at                   timestamptz
);

create index if not exists reservations_email_idx   on public.reservations (lower(email));
create index if not exists reservations_status_idx  on public.reservations (status);
create index if not exists reservations_created_idx on public.reservations (created_at desc);

-- ─── Status history: every change, for support and auditing ────────────────
create table if not exists public.reservation_events (
  id              bigint generated always as identity primary key,
  reservation_id  uuid not null references public.reservations (id) on delete cascade,
  status          text not null,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists reservation_events_reservation_idx
  on public.reservation_events (reservation_id, created_at);

-- Keep updated_at current on every edit.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists reservations_touch_updated_at on public.reservations;
create trigger reservations_touch_updated_at
  before update on public.reservations
  for each row execute function public.touch_updated_at();

-- Log the first status, and every later status change, to reservation_events.
create or replace function public.log_reservation_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.reservation_events (reservation_id, status) values (new.id, new.status);
  end if;
  return new;
end $$;

drop trigger if exists reservations_log_status on public.reservations;
create trigger reservations_log_status
  after insert or update of status on public.reservations
  for each row execute function public.log_reservation_status();

-- ─── Payment transitions, called by the Stripe webhook ─────────────────────
-- Each runs as one statement, so it is atomic and safe when Stripe sends the
-- same event twice: only the first call changes anything.

-- Returns 'paid_now' the first time, 'already_paid' on repeats, 'not_found' if no row has this session.
create or replace function public.mark_reservation_paid(
  p_session_id        text,
  p_payment_intent_id text,
  p_amount_paid_minor int,
  p_currency          text
) returns text
language plpgsql set search_path = public as $$
declare
  v_status text;
begin
  update reservations
     set status = 'paid',
         paid_at = coalesce(paid_at, now()),
         stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
         amount_paid_minor = p_amount_paid_minor,
         currency = coalesce(p_currency, currency)
   where stripe_session_id = p_session_id
     and status in ('pending', 'expired', 'payment_failed')
  returning status into v_status;

  if found then
    return 'paid_now';
  end if;
  if exists (select 1 from reservations where stripe_session_id = p_session_id) then
    return 'already_paid';
  end if;
  return 'not_found';
end $$;

-- Moves a still-pending reservation to 'expired' or 'payment_failed'. Never touches paid orders.
create or replace function public.mark_reservation_unpaid(p_session_id text, p_status text)
returns void
language plpgsql set search_path = public as $$
begin
  if p_status not in ('expired', 'payment_failed') then
    raise exception 'invalid status %', p_status;
  end if;
  update reservations
     set status = p_status
   where stripe_session_id = p_session_id
     and status = 'pending';
end $$;

-- ─── Security ──────────────────────────────────────────────────────────────
-- Row Level Security on, with no policies: the public (anon) and logged-in
-- keys can read or write nothing. Only the server, using the secret
-- service-role key, can access these tables.
alter table public.reservations       enable row level security;
alter table public.reservation_events enable row level security;

revoke all on function public.mark_reservation_paid(text, text, int, text) from public, anon, authenticated;
revoke all on function public.mark_reservation_unpaid(text, text)          from public, anon, authenticated;
grant execute on function public.mark_reservation_paid(text, text, int, text) to service_role;
grant execute on function public.mark_reservation_unpaid(text, text)          to service_role;
