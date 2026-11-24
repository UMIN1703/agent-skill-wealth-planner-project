-- WealthPlanner — ตาราง portfolio_snapshots (กราฟการเติบโตของพอร์ต · CR-WPN-011)
-- เก็บมูลค่า/ต้นทุนรวมของพอร์ต 1 แถวต่อผู้ใช้ต่อวัน (as_of) → เอาไปวาดเส้นมูลค่าจริงรายเดือน
-- รันใน Supabase: Dashboard → SQL Editor → วาง → Run (รันซ้ำได้ ปลอดภัย)

create table if not exists portfolio_snapshots (
  id          bigint generated always as identity primary key,
  user_key    text not null,                 -- 'google:<email>' หรือ 'line:<userId>'
  as_of       date not null,                 -- วันที่ของ snapshot (โซนเวลาไทย)
  total_cost  double precision not null default 0,  -- ต้นทุนรวม ณ วันนั้น
  total_value double precision not null default 0,  -- มูลค่าตลาดรวม ณ วันนั้น
  created_at  timestamptz not null default now(),
  unique (user_key, as_of)                   -- 1 แถว/คน/วัน → upsert ทับได้
);

create index if not exists portfolio_snapshots_user_idx
  on portfolio_snapshots (user_key, as_of);

alter table portfolio_snapshots enable row level security;
-- ไม่มี policy ให้ anon/authenticated → เข้าถึงเฉพาะ service_role (ฝั่งเซิร์ฟเวอร์)
grant all privileges on table public.portfolio_snapshots to service_role;
