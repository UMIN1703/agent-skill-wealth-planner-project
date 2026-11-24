# Change request — WealthPlanner · ราคา/อัตราแลกเปลี่ยนสด (USD/THB + คริปโต + หุ้น ตปท.)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-014 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F003/F004 · SRS-WPN-001 §6.1 (BR-03/05) · CR-WPN-008 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-24 — เดิม F003/F004 (ราคาสด/FX) เป็น Phase 4 backlog (ติด ToS/แหล่งข้อมูล) · ขอเปิดใช้เท่าที่มีแหล่งฟรีที่ ToS ยอมรับได้ |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-24 |

---

## 1. Why this is a request, not an edit

เปิดใช้ F003/F004 (ราคาตลาด + อัตราแลกเปลี่ยน) ที่เดิมถูกกันเป็น backlog เพราะติดเรื่องแหล่งข้อมูล/ToS → ออกเป็นคำขอ พร้อมระบุแหล่งและขอบเขตที่ปลอดภัย

## 2. Request summary

| # | เรื่อง | กระทบ | Class B |
|---|---|---|---|
| CR-33 | อัตราแลกเปลี่ยน USD/THB สด (แปลงมูลค่าปัจจุบัน · ต้นทุนคงเรตเดิม) | F004 · portfolio | ไม่มี |
| CR-34 | ราคาคริปโตสด (CoinGecko) auto-fill marketPrice | F003 | ไม่มี |
| CR-35 | โครงราคาหุ้น/ETF ตปท. (Finnhub) — เปิดเมื่อมี API key | F003 | ต้องตั้ง `FINNHUB_API_KEY` (ออปชัน) |

---

## 3. Requests

### CR-33 · USD/THB สด (dual-FX)
`src/lib/prices.ts` → `getUsdThb()` ดึงจาก **frankfurter.dev** (ข้อมูล ECB · ฟรี ไม่ต้อง key · cache 1 ชม.) ·
**โมเดล dual-FX (ถูกต้อง):** leg **มูลค่าปัจจุบัน** ของสินทรัพย์สกุล USD แปลงด้วย **เรตสด** (`valueFx`) · leg **ต้นทุน** คงใช้เรตตอนซื้อ (`fxToThb`) → กำไร/ขาดทุนจากอัตราแลกเปลี่ยนไม่ถูกกลบ ·
`marketValueTHB` ใช้ `valueFx ?? fxToThb` · `summarizePortfolio` คำนวณ income = มูลค่า(valueFx) − ต้นทุน(fxToThb) · หน้าแรกโชว์ตัวบ่งชี้ “USD/THB ≈ x.xx · อัปเดตอัตโนมัติ”

### CR-34 · ราคาคริปโตสด (CoinGecko)
`getCryptoPrices(symbols)` ดึงจาก CoinGecko (ฟรี ไม่ต้อง key · cache 5 นาที · คืน usd+thb) ·
map สัญลักษณ์ → coingecko id แบบ **curated** (BTC/ETH/SOL/…) + เดาสัญลักษณ์จากชื่อรายการแบบคอนเซอร์เวทีฟ (`cryptoSymbolFromName`, มี alias ไทย) ·
`loadAssets` เติม `marketPrice` ให้รายการหมวดคริปโตที่ match ชัวร์ (สกุลบาท→ราคาบาทตรง valueFx=1 · สกุล USD→ราคา USD + เรตสด) · ไม่ match → คงราคาที่กรอกเอง

### CR-35 · หุ้น/ETF ตปท. (Finnhub — โครงพร้อม key)
`getStockQuotesUsd(symbols)` ใช้ Finnhub quote ต้องมี `FINNHUB_API_KEY` (ตั้งผ่าน `wrangler pages secret put`) — **ไม่มี key → คืน {} (ข้าม)** ·
`loadAssets` เดา ticker จากชื่อ (ตัวพิมพ์ใหญ่ 1–5 ตัว) สำหรับหมวดหุ้นต่างประเทศ → ราคา USD + แปลงด้วยเรตสด · จำกัด ≤12 สัญลักษณ์/โหลด กัน rate limit

---

## 4. Combined impact

| Dimension | Effect |
|---|---|
| Scope | เปิด F003/F004 บางส่วน (FX+คริปโตฟรี · หุ้นรอ key) · กราฟ/มูลค่า/กำไรใช้ค่าสดอัตโนมัติ |
| Effort | สร้างเสร็จ · tsc สะอาด · 59 เทส (เพิ่ม TC-F004-livefx dual-FX) · deploy f59e276d · commit 2b86be9 |
| Class B | ไม่มี (FINNHUB_API_KEY เป็นออปชัน — ไม่ตั้งก็ทำงานได้) |
| ความเสถียร | ทุก fetch best-effort (try/catch, cache) · ล้มเหลว/ไม่มี key/ไม่ match → fallback ราคาที่กรอกเอง ไม่พัง · เดโม/ล็อกเอาต์ไม่ยิง API |
| ToS | ใช้เฉพาะแหล่งฟรีที่อนุญาต (frankfurter=ECB, CoinGecko free, Finnhub ต้อง key ของผู้ใช้เอง) |

## 5. ไม่รวมในรอบนี้ (backlog)
- หุ้นไทย (SET) — ไม่มีแหล่งฟรีที่ ToS ยอมรับ · ยังกรอกเอง
- การ map สัญลักษณ์แบบแม่นยำ: ควรเพิ่มฟิลด์ `symbol`/`ticker` ต่อรายการ (ตอนนี้เดาจากชื่อ — คอนเซอร์เวทีฟ อาจไม่ครบ)
- ธงราคา stale (BR-01 >15 นาที) ใน UI · ราคาทองสด

## 6. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | All | เปิดคำขอ F003/F004: USD/THB สด (dual-FX ถูกต้อง), ราคาคริปโตสด (CoinGecko), โครงหุ้น ตปท. (Finnhub รอ key) · แหล่งฟรี ToS-safe · ไม่มี Class B บังคับ | system-analyst | เจ้าของโครงการ (solo) |
