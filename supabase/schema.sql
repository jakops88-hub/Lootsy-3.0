create extension if not exists pgcrypto;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  title text not null,
  description text,
  category text,
  price numeric,
  currency text,
  link_url text not null,
  image_url text,
  score numeric,
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals(id) on delete cascade,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists deals_category_idx on public.deals (category);
create index if not exists deals_score_idx on public.deals (score desc);
create index if not exists deals_featured_idx on public.deals (is_featured);
create index if not exists clicks_deal_idx on public.clicks (deal_id);

alter table public.deals enable row level security;
alter table public.clicks enable row level security;

drop policy if exists deals_read_public on public.deals;
create policy deals_read_public on public.deals for select using (true);

drop policy if exists clicks_insert_public on public.clicks;
create policy clicks_insert_public on public.clicks for insert with check (true);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_deals_updated_at on public.deals;
create trigger trg_deals_updated_at
before update on public.deals
for each row execute function public.set_updated_at();
