# ทะเบียนเอกสารควบคุม — WealthPlaner

| รายการ | รายละเอียด |
|---|---|
| รหัสโครงการ | WPN |
| เจ้าของโครงการ | TBD — ต้องการ [ชื่อ] |
| ปรับปรุงทะเบียนล่าสุด | 2026-11-18 |

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
| TST-WPN-001 | Test cases + traceability matrix — WealthPlaner | 00 | ร่าง | 2026-08-29 |
| DSN-WPN-001 | ระบบออกแบบและข้อกำหนดหน้าจอ (Neon Dark) — WealthPlaner | 00 | ร่าง | 2026-08-31 |
| QAR-WPN-001 | รายงานการประกันคุณภาพ (F001–F006) — WealthPlaner | 00 | ร่าง | 2026-09-19 |

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
