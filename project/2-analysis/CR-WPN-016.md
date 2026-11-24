# Change request — WealthPlanner · ฟิลด์สัญลักษณ์ (ticker) ต่อรายการ + rebalance พอร์ตจริง

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-016 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | CR-WPN-014 · RVW-WPN-003 · QAR-WPN-004 · REQ-WPN-001 F001/F003/F006 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | ปิด 2 MAJOR จาก gate รอบ RVW-003/QAR-004 (rebalance ใช้ mock · ราคาสดเดา symbol จากชื่อ) |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-24 |

---

## 1. Why this is a request, not an edit

ปิดข้อบกพร่องระดับ MAJOR ที่ gate ตรวจพบ: (1) หน้า rebalance คำนวณสัดส่วนปัจจุบันจากข้อมูล mock, (2) ราคาสด map สินทรัพย์ด้วยการเดา symbol จากชื่อ (อาจผิด) → เพิ่มฟิลด์ข้อมูลใหม่ → ออกเป็นคำขอ

## 2. Request summary

| # | เรื่อง | กระทบ | Class B |
|---|---|---|---|
| CR-41 | `/rebalance` คำนวณสัดส่วนปัจจุบันจากพอร์ตจริง (server + RebalanceForm client) | F006 | ไม่มี |
| CR-42 | ฟิลด์ `symbol` (ticker) ต่อรายการ → ราคาสด map แม่น (ใช้ก่อนเดาจากชื่อ) | F001/F003 | migration `holdings.symbol` |

---

## 3. Requests

### CR-41 · rebalance พอร์ตจริง (ปิด MAJOR)
แยก `app/rebalance/page.tsx` เป็น **server** (โหลดพอร์ตจริง `loadAssets → categoryAllocation`) + **`RebalanceForm`** (client) รับ allocation จริงเป็น prop · แสดง 7 หมวดมาตรฐาน (union กับหมวดที่ถือ) ให้ตั้งเป้าหมวดที่ยังไม่ถือได้ · ยังไม่ล็อกอิน/พอร์ตว่าง → ขึ้น notice "พอร์ตตัวอย่าง" · เลิกใช้ `sampleAssets`

### CR-42 · ฟิลด์ symbol/ticker (ปิด MAJOR)
เพิ่มฟิลด์ `symbol` (ไม่บังคับ, เก็บตัวพิมพ์ใหญ่) ลง `AssetDraft`/`DisplayAsset`/ตาราง `holdings` (+ insert/update/patch/rowToHeld) · ฟอร์ม **เพิ่ม** + **แก้ไข** มีช่อง "สัญลักษณ์ / Ticker" (เช่น BTC, NVDA) · `applyLivePrices` ใช้ `symbol` ที่กรอก**ก่อน** แล้วค่อย fallback เดาจากชื่อ → map ราคา crypto/หุ้นแม่นขึ้น ·
**Class B:** migration `alter table holdings add column if not exists symbol text;` (idempotent · ยืนยันแล้ว read 200/insert 201)

---

## 4. Combined impact

| Dimension | Effect |
|---|---|
| Scope | ปิด 2 MAJOR จาก gate · เพิ่มความแม่นของราคาสด · rebalance สะท้อนพอร์ตจริง |
| Effort | สร้างเสร็จ · tsc สะอาด · 59 เทสผ่าน · commits 120a1d1 (rebalance) + a77eb30 (symbol) · deploy 581ea0bb |
| Class B | migration `holdings.symbol` (รัน+ยืนยันแล้ว) |
| Backward-compat | รายการเก่าไม่มี symbol → เดาจากชื่อเหมือนเดิม · อ่านพอร์ตปลอดภัยแม้ก่อน migration (select ไม่คืน symbol = undefined) |

## 5. ไม่รวมในรอบนี้ (backlog)
- ช่อง symbol ใน SlipReview โดยตรง (ตอนนี้เพิ่มผ่านหน้า "เพิ่ม"/แก้ที่ /assets) · หุ้นไทย SET · stale-price flag/ทองสด/normalize (4.3/4.4)

## 6. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | All | ปิด 2 MAJOR จาก RVW-003/QAR-004: rebalance อ่านพอร์ตจริง (CR-41) + ฟิลด์ symbol/ticker ให้ราคาสด map แม่น (CR-42) · Class B = migration holdings.symbol | system-analyst | เจ้าของโครงการ (solo) |
