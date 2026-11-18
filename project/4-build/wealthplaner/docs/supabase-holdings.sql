-- WealthPlaner — ตาราง holdings (F001/F002 persistence · CR-WPN-006)
-- รันใน Supabase: Dashboard → SQL Editor → วาง → Run
-- เข้าถึงผ่าน service_role (ฝั่งเซิร์ฟเวอร์) เท่านั้น — RLS เปิดและไม่มี policy ให้ anon
-- (service_role bypass RLS ได้ · แอปกรองด้วย user_key เอง)

create table if not exists holdings (
  id            uuid primary key default gen_random_uuid(),
  user_key      text not null,              -- 'google:<email>' หรือ 'line:<userId>'
  name          text not null,
  type          text not null,              -- ป้ายประเภทสินทรัพย์ (หุ้นไทย / หุ้น ตปท. / ทองคำ / เงินสด / ตราสารหนี้)
  broker_channel text not null,
  quantity      double precision not null,
  cost_price    double precision not null,
  market_price  double precision,           -- null = ยังไม่มีราคาตลาด (portfolio ใช้ต้นทุนแทน)
  fx_to_thb     double precision not null default 1,
  currency      text,
  note          text,                            -- บันทึกย่อต่อรายการ (Phase 1)
  source        text not null default 'manual',  -- 'manual' | 'slip'
  created_at    timestamptz not null default now()
);

-- สำหรับตารางที่สร้างไว้ก่อนหน้า (รันซ้ำได้ ปลอดภัย)
alter table holdings add column if not exists note text;

create index if not exists holdings_user_key_idx on holdings (user_key);

alter table holdings enable row level security;
-- ไม่สร้าง policy สำหรับ anon/authenticated → เข้าถึงได้เฉพาะ service_role key (ฝั่งเซิร์ฟเวอร์)

-- โปรเจ็กต์ที่ใช้ API key ระบบใหม่ (sb_secret_…) บางทีไม่ auto-grant → ให้สิทธิ์ service_role เอง
-- (service_role มี BYPASSRLS อยู่แล้ว · secret key ฝั่งเซิร์ฟเวอร์ map เป็น role นี้)
grant all privileges on table public.holdings to service_role;
