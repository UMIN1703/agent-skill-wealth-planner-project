# Change request — WealthPlaner · ขยายระบบให้เทียบเท่าชีตพอร์ตจริงของเจ้าของ

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-008 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-18 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F001/F002/F004/F005 · CR-WPN-006 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-18 — "อ่านชีตพอร์ตจริงแล้วเทียบกับระบบ บอกว่าต้องเพิ่มอะไร" → เลือกทำเฟส 1–3 |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-18 |

---

## 1. Why this is a request, not an edit

เทียบระบบกับ Google Sheet พอร์ตจริงของเจ้าของ (คอลัมน์ Category/Sub-type/Asset/Quantity/Cost/Current Value/P&L/%Return/Note/Tax Bucket) พบว่าต้องขยายขอบเขต F001 (ฟิลด์สินทรัพย์), F002 (การจัดกลุ่ม), F004 (P&L ที่ใช้ได้จริง), F005 (นำเข้า) จึงออกเป็นคำขอ

## 2. Request (3 เฟส)

### CR-10 · เฟส 1 — ราคาปัจจุบัน → P&L จริง + โน้ตต่อรายการ
ช่อง "ราคา/มูลค่าปัจจุบันต่อหน่วย" (ไม่บังคับ) เก็บลง `market_price` ที่มีอยู่แล้ว → ปลดล็อก กำไร/ขาดทุน + %ผลตอบแทน (logic F004 มีอยู่แล้ว ขาดแค่ input) · เพิ่มคอลัมน์ `note`

### CR-11 · เฟส 2 — ขยายประเภทสินทรัพย์ + หมวด + Tax Bucket
เพิ่มประเภท: คริปโต, กองทุน SSF/RMF/ทั่วไป, ETF, PVD, ประกัน, อื่นๆ · เพิ่ม Category (เงินสำรอง/เกษียณ/หุ้นไทย/ต่างประเทศ/ทางเลือก) + Tax Bucket (SSF/RMF/PVD/ประกันลดหย่อน) · จัดกลุ่มพอร์ตตาม Category + สรุปสิทธิลดหย่อน

### CR-12 · เฟส 3 — นำเข้าจาก Google Sheet ตรง
อ่านสเปรดชีตผ่าน Sheets API ด้วย Google token ของผู้ใช้ (ใช้ซ้ำ F009) → map คอลัมน์ชีต → holdings · ยังคงนโยบาย F005 (รายงานแถวผิด ไม่นำเข้าบางส่วนเงียบ)

**ไม่รวมในรอบนี้ (backlog):** เฟส 4 — ดึงราคาตลาด live + อัตรา FX จริง (F003/F004/NFR-04, รอ O1 ToS) · ใช้การกรอกมือจากเฟส 1 แทนไปก่อน

## 3. สถาปัตยกรรม (decide-and-log)
- `AssetDraft` เพิ่ม `currentPrice`, `note` (+ เฟส 2: `category`, `taxBucket`) · `draftToDisplayAsset` เลิก hardcode `marketPrice:null` → ใช้ `currentPrice`
- Supabase `holdings` เพิ่มคอลัมน์ `note` (เฟส 1), `category`/`tax_bucket` (เฟส 2) — migration แบบ `add column if not exists` (เจ้าของรันใน SQL editor)
- graceful fallback คงเดิม (ไม่มี Class B เพิ่ม) · price/FX feed = เฟส 4 (Class B)

## 4. Revision history

| Rev | Date | Clauses | Substance | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-18 | All | เปิดคำขอขยายระบบเทียบชีตจริง (เฟส 1–3) · เฟส 1 = currentPrice→P&L + note · เฟส 2 = taxonomy+category+tax bucket · เฟส 3 = import Google Sheet · เฟส 4 (price/FX) = backlog | system-analyst | เจ้าของโครงการ (solo) |
