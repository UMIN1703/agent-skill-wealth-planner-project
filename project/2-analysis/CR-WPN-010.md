# Change request — WealthPlaner · แก้ไข/ลบสินทรัพย์ + สลิปไม่พึ่ง Google + ส่งออกรายงาน Sheet + หน้าสินทรัพย์ accordion

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-010 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-23 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F001/F002/F005/F009 · CR-WPN-006 · CR-WPN-009 · REL-WPN-001 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-22/23 — ใช้งานจริงบน production แล้วขอเพิ่ม: แก้/ลบรายการในแอป, สลิปไม่ต้องเชื่อม Google, ส่งออกรายงานทำดาต้าต่อ, ปรับหน้าสินทรัพย์ |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-23 |

---

## 1. Why this is a request, not an edit

ขยายขอบเขต F001 (แก้ไข/ลบรายการ), F002 (หน้าสินทรัพย์), F005 (ส่งออก), F009 (สลิป→พอร์ตไม่พึ่ง Google) หลังใช้งานจริง → ออกเป็นคำขอ

## 2. Request summary

| # | เรื่อง | กระทบ | Class B |
|---|---|---|---|
| CR-20 | แก้ไข/ลบ สินทรัพย์ในแอป (+ activity ป้าย "แก้ไข") | F001/F002 | migration `updated_at` |
| CR-21 | หน้าสินทรัพย์ redesign — accordion ต่อหมวด, กล่องแยก, % align | F002 · DSN | ไม่มี |
| CR-22 | F009 staging ฟรี — เก็บรูปสลิปใน KV แทน R2 (ไม่ต้องผูกบัตร) | F009 | ไม่มี (ใช้ KV ฟรี) |
| CR-23 | Option B — สลิป→พอร์ต โดยไม่ต้องเชื่อม Google | F009 | ไม่มี |
| CR-24 | ส่งออกรายงานเป็น Google Sheet (on-demand: สรุป + log รายเดือน) | F005 | Google token (เชื่อมตอน export) |

---

## 3. Requests

### CR-20 · แก้ไข/ลบ สินทรัพย์
หน้า `/assets` ทุกรายการมีปุ่มดินสอ → ฟอร์มแก้ในที่ (ชื่อ/ช่องทาง/จำนวน/ต้นทุน/ราคาปัจจุบัน/โน้ต) + ปุ่มลบ (ยืนยัน) ·
PATCH/DELETE `/api/holdings` (เจ้าของเท่านั้น กรองด้วย `user_key`) · `updateHolding`/`deleteHolding` ·
ตั้ง `updated_at=now` → หน้า `/activity` เรียงตาม updatedAt + ป้าย **"แก้ไข"** (สีเหลือง) เด้งขึ้นบนสุด ·
**Class B:** migration `alter table holdings add column if not exists updated_at timestamptz not null default now();`

### CR-21 · หน้าสินทรัพย์ redesign
ตัดแถบ chip → **accordion ต่อหมวด แต่ละหมวดเป็นกล่อง (card) แยก** · หัวหมวด = จุดสี · ชื่อ · **% (คอลัมน์คงที่ ชิดขวา)** ·
ยอดรวม ฿ (align กับยอดรายการย่อย) · chevron กดพับ/กาง · เรียงตามความเสี่ยง (categoryRiskRank) ตรงกับหน้าพอร์ต

### CR-22 · F009 staging ฟรี (KV-only)
ย้ายการเก็บรูปสลิปจาก R2 (ต้องผูกบัตร) → **KV** (รับ ArrayBuffer, ฟรี) · `slipStore` ใช้ KV ทั้ง index + ไบต์รูป ·
`stagingConfigured() = !!kv()` · deploy ฟรี 100% ไม่ต้องบัตร

### CR-23 · Option B — สลิปไม่พึ่ง Google
`/api/slips/confirm` เขียนเข้าพอร์ต (Supabase) โดยตรง — **ตัด Google/Sheet/รูป ออกจากเส้นทางบันทึก** ·
`/slips` เอา gate "ต้องเชื่อม Google" ออก · ล็อกอิน LINE อย่างเดียวส่งสลิป→เข้าพอร์ตได้เลย

### CR-24 · ส่งออกรายงาน Google Sheet
ปุ่มที่หน้าสินทรัพย์ → `/api/export/sheet` → เขียนชีต "WealthPlaner Report" (refresh) 2 แท็บ:
**สรุป** (ภาพรวม + ตามหมวด + ตามเดือน) · **รายการ** (log แบน มีคอลัมน์ เดือน ไว้ pivot) ·
`sheetExport.ts` (pure builders + Sheets API) · ต้องมี Google token เฉพาะตอน export (login Google หรือ account-link) → ไม่มี = ชวนเชื่อม

---

## 4. Combined impact

| Dimension | Effect |
|---|---|
| Scope | เพิ่มความสามารถ แก้/ลบ (F001), ส่งออก (F005), ปลด Google ออกจาก F009 บันทึก · Google = เฉพาะ export |
| Effort | สร้างเสร็จแล้ว (commits 5ad42c6, 09af518, 3ad56e4, 0e63261 ฯลฯ) · tsc สะอาด, 56 เทส |
| Class B | migration `updated_at` (1 บรรทัด) · ไม่มี R2 (ย้าย KV ฟรี) · Google token เฉพาะ export |

### 4.1 โครงสร้างพื้นฐานที่แก้ระหว่างนำขึ้น production (บันทึกใน REL-WPN-001)
- auth 500 บน Cloudflare: secrets ผูกกับ production branch `feature/F008-login-sso` + `trustHost:true` · next-on-pages 1.13.10→1.13.16 (index route) · account-link state ใช้ signed token แทน KV (eventual consistency)

## 5. ไม่รวมในรอบนี้ (backlog)
- แก้ไข type/หมวด ของรายการ (ตอนนี้แก้ ชื่อ/จำนวน/ต้นทุน/ราคา/โน้ต) · model Transactions จริง · แท็บชีต Monthly Tracker/Goals/Income-Expense · sync prefs/risk ขึ้น Supabase

## 6. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-23 | All | เปิดคำขอ: แก้ไข/ลบสินทรัพย์ (+activity แก้ไข), หน้าสินทรัพย์ accordion/กล่องแยก, F009 KV-free, Option B (สลิปไม่พึ่ง Google), ส่งออกรายงาน Sheet (สรุป+log รายเดือน) · Class B = migration updated_at | system-analyst | เจ้าของโครงการ (solo) |
