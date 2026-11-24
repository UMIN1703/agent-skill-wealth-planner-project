# ทะเบียนเอกสารควบคุม — WealthPlaner

| รายการ | รายละเอียด |
|---|---|
| รหัสโครงการ | WPN |
| เจ้าของโครงการ | TBD — ต้องการ [ชื่อ] |
| ปรับปรุงทะเบียนล่าสุด | 2026-11-24 |

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
| CR-WPN-010 | Change request — แก้ไข/ลบสินทรัพย์ + หน้าสินทรัพย์ accordion + F009 KV-free + Option B (สลิปไม่พึ่ง Google) + ส่งออกรายงาน Sheet | 00 | อนุมัติแล้ว | 2026-11-23 |
| CR-WPN-011 | Change request — กราฟการเติบโตของพอร์ต (ไฮบริด) + เปลี่ยนชื่อแบรนด์ WealthPlanner + โลโก้ login ใหม่ + ลดหน้าเตือน Google | 00 | อนุมัติแล้ว | 2026-11-24 |
| CR-WPN-012 | Change request — เก็บความเสี่ยง + เป้าหมาย allocation ขึ้น Supabase (user_prefs) + เป้าหมายปรับตามความเสี่ยง | 01 | อนุมัติแล้ว | 2026-11-24 |
| TST-WPN-001 | Test cases + traceability matrix — WealthPlaner | 00 | ร่าง | 2026-08-29 |
| DSN-WPN-001 | ระบบออกแบบและข้อกำหนดหน้าจอ (Neon Dark) — WealthPlaner | 00 | ร่าง | 2026-08-31 |
| QAR-WPN-001 | รายงานการประกันคุณภาพ (F001–F006) — WealthPlaner | 00 | ร่าง | 2026-09-19 |
| RVW-WPN-001 | รายงานผลการทบทวนโค้ด — รอบ IA restructure (CR-WPN-009) | 00 | อนุมัติแล้ว | 2026-11-21 |
| QAR-WPN-002 | รายงานการประกันคุณภาพ — รอบ IA restructure (CR-WPN-009) | 01 | อนุมัติแล้ว | 2026-11-21 |
| RVW-WPN-002 | รายงานผลการทบทวนโค้ด — รอบกราฟการเติบโต + rebrand (CR-WPN-011) | 00 | อนุมัติแล้ว | 2026-11-24 |
| QAR-WPN-003 | รายงานการประกันคุณภาพ — รอบกราฟการเติบโต + rebrand (CR-WPN-011) | 00 | อนุมัติแล้ว | 2026-11-24 |
| REL-WPN-001 | บันทึกการปล่อยของและแผนถอยกลับ — Cloudflare Pages (production) | 04 | อนุมัติแล้ว | 2026-11-24 |

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
| 2026-11-21 | QAR-WPN-002 | สร้าง+อนุมัติ | QA รอบ CR-WPN-009 (functional/visual/a11y, static) · Verdict PASS WITH ADVISORIES · 0 BLOCKER, 2 MAJOR (ซ่อนเงินปิดแค่ hero หน้าแรก · token drift hardcode สีแทน var(--gain)/--loss), 4 MINOR · a11y โครงสร้างผ่าน · gap: ยังไม่รัน axe/Playwright + browsers=TBD |
| 2026-11-21 | QAR-WPN-002 | แก้ไข (rev 01) | ปิด 2 MAJOR: (1) `<Amount>` ซ่อนยอดทุกหน้า (home/assets/activity/legend) sync สดผ่าน event wp-privacy (2) token drift → เพิ่ม --info/--line + color-mix, แทน hardcode สีหมด · เหลือเฉพาะ MINOR · tsc สะอาด, 54/54 |
| 2026-11-21 | REL-WPN-001 | สร้าง+อนุมัติ | release record แรก · GO WITH CONDITIONS สำหรับ preview Cloudflare Pages (commit 0c6640a) · next-on-pages build ผ่าน (22s) · release.* ใน project.yml เติมครบ · runbook docs/deploy-cloudflare.md · ข้อแม้ = provisioning (login/KV/R2/secrets) + ซ้อม rollback + ยังไม่ promote prod จนตั้ง OAuth/LINE console |
| 2026-11-22 | REL-WPN-001 | แก้ไข (rev 01) | Deploy preview สำเร็จ — live ที่ preview.wealthplaner.pages.dev · ตั้ง 9 secrets + AUTH_TRUST_HOST · upgrade next-on-pages 1.13.10→1.13.16 (แก้บั๊ก index route `/`→404) · ปิด KV/R2 binding (free ไม่ใช้บัตร) · middleware matcher แคบลง · ทุกหน้าเรนเดอร์ |
| 2026-11-22 | REL-WPN-001 | แก้ไข (rev 02) | Production live ที่ wealthplaner.pages.dev — แก้ auth 500 (secrets ผูก production branch feature/F008-login-sso + trustHost:true) · login LINE/Google ใช้งานจริง |
| 2026-11-23 | CR-WPN-010 | สร้าง+อนุมัติ | เปิดคำขอ: แก้ไข/ลบสินทรัพย์ (+activity ป้าย "แก้ไข"), หน้าสินทรัพย์ accordion/กล่องแยก/% align, F009 staging ฟรี (KV แทน R2), Option B สลิป→พอร์ตไม่พึ่ง Google, ส่งออกรายงาน Google Sheet (สรุป+log รายเดือน) · Class B = migration updated_at |
| 2026-11-23 | — (build) | สร้าง (code) | ตาม CR-WPN-010: updateHolding/deleteHolding + PATCH/DELETE /api/holdings + AssetList edit/delete, slipStore KV-only, /api/slips/confirm ไม่พึ่ง Google, sheetExport + /api/export/sheet + ExportSheetButton · tsc สะอาด, 56 เทส · commits 5ad42c6/09af518/3ad56e4/0e63261 push+deploy |
| 2026-11-23 | REL-WPN-001 | แก้ไข (rev 03) | deploy CR-WPN-010 ขึ้น production (0e63261) · ยังค้าง: รัน migration updated_at |
| 2026-11-24 | CR-WPN-011 | สร้าง+อนุมัติ | เปิดคำขอ: กราฟการเติบโตของพอร์ต (ไฮบริด ต้นทุนสะสม+snapshot มูลค่าจริง), เปลี่ยนชื่อแบรนด์ WealthPlanner (ตรงกับ Google consent), โลโก้ login ใหม่ (W), ลดหน้าเตือน Google (prompt consent ครั้งแรกครั้งเดียว) · Class B = migration portfolio_snapshots |
| 2026-11-24 | — (build) | สร้าง (code) | ตาม CR-WPN-011: GrowthChart (inline SVG) + buildGrowthSeries (pure, +test) + portfolio_snapshots (recordSnapshot/listSnapshots, upsert รายวัน) · rename WealthPlanner ทุก user-facing + ชื่อชีต · public/brand-w.png หน้า login · เอา prompt:'consent' ออกจาก auth.ts · tsc สะอาด, 10/10+2/2 เทส · commits b38df7b/2a86891/9451142 push+deploy |
| 2026-11-24 | — (migration) | รันแล้ว (prod) | รัน migration ทั้งสองใน Supabase: holdings.updated_at + portfolio_snapshots · ยืนยัน HTTP 200 ผ่าน PostgREST · ปิด Class B ของ CR-WPN-010 (updated_at) + CR-WPN-011 (snapshots) |
| 2026-11-24 | RVW-WPN-002 | สร้าง+อนุมัติ | ทบทวนโค้ด CR-WPN-011 (buildGrowthSeries/GrowthChart/snapshot layer, rename, auth prompt) · **APPROVE** · 0 BLOCKER/MAJOR · 5 MINOR (DRY compact(), TZ nuance, snapshot-sort invariant, recordSnapshot await, auth refresh trade-off) → backlog |
| 2026-11-24 | QAR-WPN-003 | สร้าง+อนุมัติ | QA CR-WPN-011 (functional/visual/a11y, static) · **PASS WITH ADVISORIES** · 0 BLOCKER/MAJOR · token ใช้ var ครบ (เลี่ยง --line เขียว LINE) · advisories: ตาราง a11y ที่เคารพ privacy, duplicate-sheet หลัง rename, ยังไม่รัน axe/Playwright · migration ยืนยัน 200 |
| 2026-11-24 | REL-WPN-001 | แก้ไข (rev 04) | ปล่อย CR-WPN-011 ขึ้น production (deploy e73419d1 / code 9451142): กราฟการเติบโต, rename WealthPlanner, โลโก้ login, auth prompt · **GO** (RVW-002 APPROVE + QAR-003 PASS) · **ปิดเงื่อนไข migration ทั้งหมด** (updated_at + portfolio_snapshots รันแล้ว ยืนยัน 200) · rollback-safe เพราะ migration additive |
| 2026-11-24 | CR-WPN-012 | สร้าง+อนุมัติ | เปิดคำขอ: เก็บความเสี่ยง (F007) + เป้าหมาย allocation (F006) ขึ้น Supabase `user_prefs` → sync ข้ามเครื่อง + แก้เป้าหมายเองได้ถาวร · Class B = migration user_prefs |
| 2026-11-24 | — (build) | สร้าง (code) | ตาม CR-WPN-012: ตาราง user_prefs + /api/prefs (GET/PATCH) + getPrefs/savePrefs · RiskAssessment/RiskStat seed+เขียน server · home target tab อ่าน prefs.targets · /rebalance โหลด+ปุ่มบันทึกเป้าหมาย · best-effort fallback · tsc สะอาด, 57 เทส · deploy 2bb6f989 · commit 6c786d0 |
| 2026-11-24 | — (migration) | รันแล้ว (prod) | รัน migration `user_prefs` ใน Supabase · ยืนยัน read HTTP 200 + upsert 201 (ลบ row ทดสอบแล้ว) · ปิด Class B ของ CR-WPN-012 |
| 2026-11-24 | CR-WPN-012 | แก้ไข (rev 01) | เพิ่ม CR-31: target allocation ปรับตามระดับความเสี่ยง (RISK_TARGETS 5 ชุด รวม 100% + targetsForRisk) · ลำดับ ค่าที่ตั้งเอง>โมเดลความเสี่ยง>โมเดลกลาง · ปุ่ม "ใช้สัดส่วนแนะนำ" + disclaimer ที่ /rebalance · tsc สะอาด, 58 เทส · deploy 04e352af · commit 60e467c · ไม่มี Class B เพิ่ม |
