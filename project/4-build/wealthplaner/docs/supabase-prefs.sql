-- WealthPlanner — ตาราง user_prefs (ความเสี่ยง + เป้าหมาย allocation ต่อผู้ใช้ · CR-WPN-012)
-- 1 แถว/ผู้ใช้ → sync ข้ามเครื่อง (แทน localStorage) · แก้เป้าหมายเองได้แล้วเก็บถาวร
-- รันใน Supabase: Dashboard → SQL Editor → วาง → Run (รันซ้ำได้ ปลอดภัย)

create table if not exists user_prefs (
  user_key   text primary key,              -- 'google:<email>' หรือ 'line:<userId>'
  risk       jsonb,                          -- ผลประเมิน {score,level,label,short}
  targets    jsonb,                          -- เป้าหมาย allocation {"หมวด": เปอร์เซ็นต์, ...}
  updated_at timestamptz not null default now()
);

alter table user_prefs enable row level security;
-- ไม่มี policy ให้ anon/authenticated → เข้าถึงเฉพาะ service_role (ฝั่งเซิร์ฟเวอร์)
grant all privileges on table public.user_prefs to service_role;
