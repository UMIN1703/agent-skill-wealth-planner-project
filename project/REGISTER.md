# ทะเบียนเอกสารควบคุม — WealthPlaner

| รายการ | รายละเอียด |
|---|---|
| รหัสโครงการ | WPN |
| เจ้าของโครงการ | TBD — ต้องการ [ชื่อ] |
| ปรับปรุงทะเบียนล่าสุด | 2026-11-21 |

ทะเบียนนี้ต้องปรับปรุงในการแก้ไขครั้งเดียวกับที่สร้างหรือแก้เอกสาร
ทะเบียนที่ตามมาปรับทีหลัง คือทะเบียนที่ผิดในช่วงเวลาระหว่างนั้น

---

## เอกสารที่มีอยู่

| รหัสเอกสาร | ชื่อเอกสาร | ฉบับแก้ไข | สถานะ | ปรับปรุงล่าสุด |
|---|---|---|---|---|
| PRD-WPN-001 | WealthPlaner — ระบบจัดการ Personal Wealth และ Asset Allocation | 00 | ร่าง | 2026-08-22 |
| REQ-WPN-001 | ข้อกำหนดความต้องการและเกณฑ์การยอมรับ — WealthPlaner | 00 | ร่าง | 2026-11-07 |
| SRS-WPN-001 | System Requirements and Design Specification — WealthPlaner | 00 | ร่าง | 2026-08-29 |
| CR-WPN-001 | Change request — data_location ไฮบริด + auth | 00 | อนุมัติแล้ว | 2026-08-29 |
| CR-WPN-002 | Change request — เพิ่มฟีเจอร์ F009 Slip-to-Ledger (LINE → เว็บ → Drive) | 00 | อนุมัติแล้ว | 2026-11-07 |
| CR-WPN-003 | Change request — เพิ่ม OCR auto-fill ให้ F009 (Tesseract.js) + Drive→R2 ลิงก์ + หัว/คอลัมน์ชีต | 00 | อนุมัติแล้ว | 2026-11-18 |
| CR-WPN-004 | Change request — เชื่อมสลิป (F009) เข้าพอร์ต (F001/F002) | 00 | อนุมัติแล้ว | 2026-11-18 |
| CR-WPN-005 | Change request — LINE ตอบ 2 จังหวะ (สรุปยอด + ปุ่มดูพอร์ต/ดูชีต) | 00 | อนุมัติแล้ว | 2026-11-18 |
| CR-WPN-006 | Change request — ชั้นข้อมูลพอร์ตจริง (Supabase) สำหรับ F001/F002 | 00 | อนุมัติแล้ว | 2026-11-18 |
| CR-WPN-007 | Change request — ยืนยันเข้าพอร์ตผ่านการ์ด LINE (confirm/cancel → success) | 00 | อนุมัติแล้ว | 2026-11-18 |
| CR-WPN-008 | Change request — ขยายระบบให้เทียบเท่าชีตพอร์ตจริง (เฟส 1–3: ราคาปัจจุบัน/P&L, taxonomy+tax bucket, import Sheet) | 00 | อนุมัติแล้ว | 2026-11-18 |
| CR-WPN-009 | Change request — ปรับโครงนำทาง (IA): /assets + /activity, ย้าย Rebalance/Import เข้า Profile, หน้าตั้งค่าใช้งานจริง, ย้าย logout, เรียงความเสี่ยง, เป้าหมายตรงชีต | 00 | อนุมัติแล้ว | 2026-11-21 |
| TST-WPN-001 | Test cases + traceability matrix — WealthPlaner | 00 | ร่าง | 2026-08-29 |
| DSN-WPN-001 | ระบบออกแบบและข้อกำหนดหน้าจอ (Neon Dark) — WealthPlaner | 00 | ร่าง | 2026-08-31 |
| QAR-WPN-001 | รายงานการประกันคุณภาพ (F001–F006) — WealthPlaner | 00 | ร่าง | 2026-09-19 |
| RVW-WPN-001 | รายงานผลการทบทวนโค้ด — รอบ IA restructure (CR-WPN-009) | 00 | อนุมัติแล้ว | 2026-11-21 |

สถานะที่ใช้ได้ — `ร่าง` · `รอทบทวน` · `อนุมัติแล้ว` · `ยกเลิก`

---

## ลำดับชั้นของเอกสาร

`PRD-WPN-001` เป็นเอกสารหลักของระยะข้อกำหนด เอกสารประกอบทุกฉบับอ้างรหัสข้อกำหนด
จากเอกสารหลัก **รหัสในเอกสารประกอบต้องตรงกับเอกสารหลักเสมอ** หากแก้รหัสในเอกสารหลัก
ให้ปรับเอกสารประกอบทั้งหมดในคราวเดียวกัน — วิธีกวาดหาข้อความตกค้างอยู่ใน
skill `document-control`

`SRS-WPN-001` เป็นทางเข้าของระยะวิเคราะห์ และรวบรวมเนื้อหาจาก `ARC` `DM` `NAV`
`TST` เข้าด้วยกัน

---

## คำขอเปลี่ยนแปลงที่ยังไม่ได้ข้อยุติ

| รหัส | เรื่อง | ผู้ขอ | วันที่ | สถานะ |
|---|---|---|---|---|
| — | ยังไม่มี | — | — | — |

---

## บันทึกการสร้างเอกสาร

| วันที่ | รหัสเอกสาร | การกระทำ | หมายเหตุ |
|---|---|---|---|
| 2026-08-22 | PRD-WPN-001 | สร้าง | ร่างแรกจาก product-owner |
| 2026-08-22 | REQ-WPN-001 | สร้าง | แตก user story + AC จาก PRD ข้อ 7 |
| 2026-08-22 | SRS-WPN-001 | สร้าง | data model + ADR-001 + behaviour + traceability |
| 2026-08-22 | CR-WPN-001 | สร้าง+อนุมัติ | ปิด C1/B2 → PRD ปรับ data_location + auth |
| 2026-08-22 | TST-WPN-001 | สร้าง | test cases 43 + traceability (AC 36/36) |
| 2026-08-29 | TST-WPN-001 · SRS-WPN-001 | แก้ไข (ร่าง) | audit: แก้ยอด test case 38 → 43 ให้ตรงจำนวนจริง ทั้ง TST §4/§7, SRS §9, README (AC 36/36 ไม่เปลี่ยน) |
| 2026-08-29 | REQ · SRS · TST · CR · REGISTER | แก้ไข (cosmetic) | audit cleanup: F003 renumber AC-E05/E06→E04/E05 (REQ/SRS/TST), CR section §5/§6→§4/§5, ลบ typo "DAY" ในลำดับชั้น · ไม่กระทบ logic/traceability/AC 36 |
| 2026-08-29 | SRS-WPN-001 · project.yml | แก้ไข (ร่าง) | ปิด B3: เจ้าของเลือก stack = Next.js + Supabase (Postgres) · เพิ่ม definition_of_done (ข้อเสนอ commander) · owner คงเป็น TBD ตามเจ้าของ |
| 2026-08-29 | DSN-WPN-001 | สร้าง | เริ่ม stage design — tokens (Neon Dark: พื้น #0E0A1C การ์ด #181330) + components ทุก state + screens 5 state + contrast วัดจริง (AA) + traceability F001–F007 · เจ้าของเลือกพาเลตต์+ฟอนต์ IBM Plex Sans Thai |
| 2026-08-31 | DSN-WPN-001 | แก้ไข (ร่าง) | sync DSN ให้ตรง code/component ที่ build — warn #C9A227, muted #A79FC0 (+muted-2/ink), radius 18/26 (design↔code drift ปิด) |
| 2026-11-07 | CR-WPN-002 | สร้าง+อนุมัติ | เปิดคำขอเพิ่ม F009 Slip-to-Ledger (LINE Messaging API → ยืนยันบนเว็บ → ซิงค์ Drive/Sheets ของผู้ใช้) · ตัดสิน staging = Cloudflare KV+R2 · ระบุ Class B (LINE OA, Google OAuth, KV/R2, deploy) |
| 2026-11-07 | REQ-WPN-001 | แก้ไข (ร่าง) | เพิ่ม F009 + AC (01–05, E01–E05) ตาม CR-WPN-002 · เพิ่ม dependencies + open issues · coverage เพิ่มหมวด "เพิ่มเติม" 1/1 |
| 2026-11-18 | CR-WPN-003 | สร้าง+อนุมัติ | เปิดคำขอ OCR auto-fill ให้ F009 ด้วย Claude vision (claude-opus-4-8) · ปรับ F009 AC-03 ให้ระบบเติมฟอร์มก่อนผู้ใช้ยืนยัน · Class B = ANTHROPIC_API_KEY |
| 2026-11-18 | CR-WPN-003 | แก้ไข (CR-04/05) | เปลี่ยน OCR เป็น Tesseract.js (ฟรี, client-side, ลบโค้ด Claude/ANTHROPIC_API_KEY) · เลิกอัปรูปขึ้น Drive → เก็บ R2 + ลิงก์ในเซลล์ · เพิ่มหัวคอลัมน์ไทย + คอลัมน์ หมวดหมู่สินทรัพย์/ช่องทาง (9 คอลัมน์) · ไม่มี Class B |
| 2026-11-18 | CR-WPN-004 | สร้าง+อนุมัติ | เปิดคำขอเชื่อมสลิป (F009) เข้าพอร์ต (F001/F002) · ตัดสิน: สลิปเติมฟอร์ม F001 ล่วงหน้าผ่าน URL query + เก็บ mock ไปก่อน (persistence รอ Supabase/Class B) · auto คำนวณต้นทุน/หน่วย · ไม่มี Class B |
| 2026-11-18 | CR-WPN-005 | สร้าง+อนุมัติ | เปิดคำขอ LINE ตอบ 2 จังหวะ: reply "ได้รับสลิป"+ปุ่ม → push "สรุปยอด ฿X"+ปุ่มดูพอร์ต/ดูชีต หลังยืนยัน · ตัดสิน push หลังยืนยัน (เลี่ยง OCR เซิร์ฟเวอร์เสียเงิน) · push เฉพาะเมื่อมี claim.u · ไม่มี Class B เพิ่ม |
| 2026-11-18 | CR-WPN-006 | สร้าง+อนุมัติ | เปิดคำขอ wire Supabase เป็นชั้นข้อมูลพอร์ตจริง (ตาราง holdings) · อ่านหน้า / + เขียนผ่าน /api/holdings · PostgREST+service_role (server-only) · user_key จาก session · graceful fallback เดโม · Class B = Supabase creds + รัน docs/supabase-holdings.sql |
| 2026-11-18 | CR-WPN-007 | สร้าง+อนุมัติ | เปิดคำขอยืนยันเข้าพอร์ตผ่านการ์ด LINE: /add (สลิป) → stage KV + push การ์ดคอนเฟิร์ม/ยกเลิก (postback) → webhook postback บันทึก Supabase → การ์ดสำเร็จ+ปุ่มดูพอร์ต · อธิบายข้อจำกัด เงิน(OCR)/หน่วย(ไม่มีบนสลิป) · ไม่มี Class B เพิ่ม |
| 2026-11-18 | CR-WPN-007 | แก้ไข | รวมเป็นฟอร์มเดียว (ชื่อ/จำนวนหน่วยใน SlipReview) → เวอร์ชันสุดท้าย บันทึกเข้าพอร์ตทันที (ตัดขั้นกดคอนเฟิร์มในการ์ด ตามที่เจ้าของขอ) + push การ์ดสำเร็จ |
| 2026-11-18 | CR-WPN-008 | สร้าง+อนุมัติ | เปิดคำขอขยายระบบเทียบชีตพอร์ตจริง (เฟส 1–3) · เฟส1 ราคาปัจจุบัน→P&L+note · เฟส2 taxonomy+หมวด+tax bucket · เฟส3 import Google Sheet · เฟส4 (price/FX live)=backlog · Class B = Supabase creds + รัน migration |
| 2026-11-21 | CR-WPN-008 | แก้ไข (build) | ปรับ taxonomy ตามชีตจริง: หมวดใหญ่ 7 (รวมครอบครัว→ฉุกเฉิน, ตัดประกันออกจากหมวด) · ETF/SSF/RMF = ประเภทย่อยใต้หุ้น (import จับ sub-type ขึ้นต้น) · / และ /rebalance group ตามหมวด 7 |
| 2026-11-20 | — (build F007) | สร้าง (code) | F007 Risk MVP: แบบประเมิน Suitability 10 ข้อ (ร่างตามแนว กลต., เกณฑ์ 5 ระดับ) ที่ /profile · เก็บ localStorage · การ์ดความเสี่ยงในพอร์ต · ยังไม่มีเอกสาร CR แยก (อยู่ภายใต้ REQ F007 เดิม + project.yml progress) |
| 2026-11-21 | CR-WPN-009 | สร้าง+อนุมัติ | เปิดคำขอปรับโครงนำทาง (IA): แยก /assets (รายการสินทรัพย์) ออกจากหน้าแรก (=ภาพรวม), เพิ่ม /activity (รายการล่าสุด จัดกลุ่มตามวัน + ป้ายซื้อ/ขาย/สับเปลี่ยน), bottom nav ใหม่ (พอร์ต/สินทรัพย์/เพิ่ม/ล่าสุด/โปรไฟล์) + ย้าย Rebalance/Import เข้าการ์ด Profile, หน้าตั้งค่าใช้งานจริง 4 หน้า (account/notifications/drive/privacy), ย้าย logout ไปการ์ด Profile จุดเดียว, เรียงหมวดตามความเสี่ยง + คืนแถบ "ทั้งหมด", CATEGORY_TARGETS ตรงแท็บ Targets ในชีต · ไม่มี Class B เพิ่ม · migration note/category/tax_bucket รันแล้ว (ปลดบล็อกสุดท้าย CR-WPN-008) |
| 2026-11-21 | — (build) | สร้าง (code) | สร้างตาม CR-WPN-009: /assets, /activity, /profile/{account,notifications,drive,privacy}, portfolioData.loadAssets, categoryRiskRank, LogoutButton label variant · tsc สะอาด · commits a52c74f/192dbfa/fd208e7 push แล้ว |
| 2026-11-21 | RVW-WPN-001 | สร้าง+อนุมัติ | ทบทวนโค้ดรอบ CR-WPN-009 (27 ไฟล์) · 1 MAJOR (ขาดเทส categoryRiskRank/CATEGORY_TARGETS) + 4 MINOR → แก้ MAJOR (เพิ่ม 2 เทส, 54/54 ผ่าน) + reuse (ดึง Toggle รวมเป็น Toggle.tsx) → APPROVE · เหลือ 3 MINOR รับทราบ/เลื่อน/ส่ง QA (privacy mask hero-only) |
