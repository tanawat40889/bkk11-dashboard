create table public.sd_attendance (
  year int not null check (year between 2560 and 2700),
  month int not null check (month between 1 and 12),
  phak text not null check (phak = btrim(phak) and char_length(phak) between 1 and 100),
  khet text not null check (khet = btrim(khet) and char_length(khet) between 1 and 100),
  tambon text not null check (tambon = btrim(tambon) and char_length(tambon) between 1 and 100),
  md int not null default 0 check (md >= 0),
  wd int not null default 0 check (wd >= 0),
  ymd int not null default 0 check (ymd >= 0),
  ywd int not null default 0 check (ywd >= 0),
  mb int not null default 0 check (mb >= 0),
  mg int not null default 0 check (mg >= 0),
  newcomers int not null default 0 check (newcomers >= 0),
  total int generated always as (md + wd + ymd + ywd + mb + mg + newcomers) stored,
  updated_at timestamptz not null default now(),
  primary key (year, month, phak, khet, tambon)
);
alter table public.sd_attendance enable row level security;
create policy sd_attendance_read on public.sd_attendance for select to anon, authenticated using (true);
revoke all on public.sd_attendance from anon, authenticated;
grant select on public.sd_attendance to anon, authenticated;
