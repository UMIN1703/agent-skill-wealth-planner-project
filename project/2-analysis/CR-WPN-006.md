# Change request — WealthPlaner · ชั้นข้อมูลพอร์ตจริง (Supabase) สำหรับ F001/F002

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-006 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-18 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F001/F002 · SRS-WPN-001 §4.2 (stack = Next.js + Supabase) · CR-WPN-004 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-18 — "ดูพอร์ตแล้วขึ้นยอดรวมสินทรัพย์จริง" (เลือก wire Supabase แทน mock) |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-18 |

---

## 1. Why this is a request, not an edit

F001/F002 เดิมใช้ข้อมูล mock (`sampleAssets` + หน้า Add เก็บใน state เซสชัน) โดยระบุไว้ว่าชั้นข้อมูลจริง (Supabase) เป็น Class B รอ creds · การ wire จริงเปลี่ยนที่มาของข้อมูลพอร์ตทั้งหน้า จึงเป็นคำขอ

## 2. Request

### CR-08 · persist พอร์ตลง Supabase (ตาราง holdings) + อ่านยอดจริง

| Item | Value |
|---|---|
| Document | REQ-WPN-001 F001 (persist การเพิ่ม) + F002 (ยอดรวมจากข้อมูลจริง) |
| ระดับ | เพิ่มชั้น persistence (ปลด Class B เดิมของ data layer) |

**การตัดสิน (decide-and-log, จากคำถามเจ้าของ 2026-11-18):** ปุ่ม "ดูพอร์ต" (จาก LINE/CR-WPN-005) ต้องแสดง **ยอดจริงของผู้ใช้** → wire Supabase (ไม่ใช่ mock)

**Proposed change**

| | Text |
|---|---|
| **Current** | พอร์ต (หน้า `/`, `/add`, `/rebalance`) อ่าน `sampleAssets` (mock) · เพิ่มสินทรัพย์เก็บใน state เซสชัน หายเมื่อ reload |
| **Proposed** | ตาราง Supabase `holdings` (ต่อผู้ใช้ด้วย `user_key`) · หน้า `/` (server component) อ่าน holdings ของผู้ใช้มาคำนวณยอดรวม (F002) — ยังไม่ตั้งค่า → fallback `sampleAssets` (เดโม) · หน้า Add + สะพานสลิป (CR-WPN-004) → POST `/api/holdings` เขียนลง Supabase จริง |

**สถาปัตยกรรม (decide-and-log):**
- เข้าถึง Supabase ผ่าน **PostgREST REST ตรง ๆ** ด้วย `service_role` key (edge-friendly, ไม่เพิ่ม dependency — เข้ากับสไตล์ fetch ดิบที่ใช้กับ Google API)
- **service_role key ฝั่งเซิร์ฟเวอร์เท่านั้น** (API routes + server component) — ไม่ส่งไป client · RLS เปิดและไม่มี policy ให้ anon (service_role bypass) · แอปกรองด้วย `user_key` เอง
- `user_key` = `line:<lineUserId>` เมื่อ login LINE, ไม่งั้น `google:<email>` (จาก NextAuth session · ไม่ใช้ Supabase Auth)
- **graceful fallback:** ไม่มี `SUPABASE_URL`/`SERVICE_ROLE_KEY` → `listHoldings`/`insertHolding` คืน null/false เงียบ, UI กลับไปโหมดเดโม/เซสชัน (build เขียวทั้งก่อน/หลังตั้งค่า)
- UI optimistic: หน้า Add เพิ่มในลิสต์ทันที แล้วยิง API เบื้องหลัง + แจ้งสถานะ (บันทึกจริง / เฉพาะเซสชัน / ล้มเหลว)

**Impact** — effort: `lib/supabase.ts` (REST + mapping) · `app/page.tsx` (read) · `app/api/holdings` (write) · `app/add` (wire + สถานะ) · `cfEnv` (+2 var) · `docs/supabase-holdings.sql`

**Class B (ต้องมี creds — เจ้าของจัดหา):** Supabase project + `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` ใน `.env.local` + รัน `docs/supabase-holdings.sql` สร้างตาราง · ก่อนตั้งค่าเสร็จ ระบบรันได้ในโหมดเดโม/เซสชัน

**ยังไม่ครอบคลุม (รอบนี้):** ราคาตลาดจริง (market_price ยังเป็น null → ใช้ต้นทุนแทน, F003/F004 รอ ToS) · แก้ไข/ลบ holding (ยังมีแต่เพิ่ม) · `/rebalance` ยังอ่าน mock (client component — จะตามใน iteration ถัดไป)

## 3. Revision history

| Rev | Date | Clauses | Substance | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-18 | All | เปิดคำขอ wire Supabase (ตาราง holdings) เป็นชั้นข้อมูลพอร์ตจริง · อ่านหน้า `/` + เขียนผ่าน `/api/holdings` · PostgREST + service_role (server-only) · user_key จาก session · graceful fallback เป็นเดโม · Class B = Supabase creds + รัน SQL | system-analyst | เจ้าของโครงการ (solo) |
