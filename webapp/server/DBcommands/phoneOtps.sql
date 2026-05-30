create extension if not exists pgcrypto;

create table if not exists public.phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on public.phone_otps(phone);
create index if not exists phone_otps_expires_idx on public.phone_otps(expires_at);
