# รายงานการประกันคุณภาพ — WealthPlanner · รอบกราฟการเติบโต + rebrand (CR-WPN-011)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | QAR-WPN-003 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | CR-WPN-011 · RVW-WPN-002 · REQ-WPN-001 F002/F008 · DSN-WPN-001 |
| ผู้ตรวจ | quality-assurance (บทบาท, solo) |

---

## 1. ขอบเขตและสเปก

**Verdict:** PASS WITH ADVISORIES
**Scope:** กราฟการเติบโตบนหน้าแรก, ตาราง `portfolio_snapshots`, เปลี่ยนชื่อแบรนด์ WealthPlanner, โลโก้ login, พฤติกรรมหน้าเตือน Google · **Spec source:** CR-WPN-011
**Conformance:** WCAG 2.2 AA (เป้าตาม project.yml) · วิธี: static review + tsc + unit tests (ยังไม่รัน axe/Playwright — gap เดิม)

## 2. Functional [ADVISORIES]

- ✅ กราฟแสดงเมื่อพอร์ตไม่ว่าง (guard `!s.isEmpty`) · ต้นทุนสะสมคำนวณจาก `created_at` จริง (เทส TC-F002-growth ยืนยัน cumulative + ค่าสดเดือนปัจจุบัน + อนาคต=null)
- ✅ migration ยืนยันแล้ว (HTTP 200): `holdings.updated_at` → ปุ่มแก้ไขเซฟได้ · `portfolio_snapshots` → `recordSnapshot` upsert รายวันได้
- ✅ เดือนปัจจุบันใช้ค่าสด → มีจุดมูลค่าเสมอแม้ snapshot ยังน้อย (ไม่มีสถานะกราฟว่างแปลก ๆ)
- [MINOR] rename `REPORT_NAME`/`LEDGER_NAME` → "WealthPlanner Report/Ledger": ผู้ใช้ที่เคยมีไฟล์ชื่อเก่า "WealthPlaner …" จะถูกสร้างไฟล์ใหม่ซ้ำ (ไม่พบไฟล์เดิม) · ผลกระทบต่ำ (ยังไม่มี report เดิมในระบบ) → advisory
- [MINOR] เดโม (sampleAssets ไม่มี `createdAt`) → ต้นทุนสะสมเกาะเดือน 0 ทั้งก้อน (เส้นแบนแล้วมีจุดปัจจุบัน) · เป็นพฤติกรรมที่อธิบายได้ ไม่ใช่ข้อมูลผิด

## 3. Visual & Design System [PASS]

- ✅ ใช้ token จริงทั้งหมด: `--brand` (พื้นที่ต้นทุน), `--accent` (เส้นมูลค่า), `--border` (gridline), `--gain/--loss` (pill), `--muted/--muted-2` · **แก้บั๊ก token**: ไม่ใช้ `--line` (สีเขียวแบรนด์ LINE) เป็นเส้น grid
- ✅ การ์ดใช้ `.card` เดิม · ปีพุทธ (year+543) · โลโก้ W ในกรอบ `.auth-logo` สีแบรนด์เดิม (คง CI) · ชื่อ "WealthPlanner" ตรงกันทุกหน้า
- ✅ SVG responsive (`viewBox` + `width:100%`) → ไม่ล้นแนวนอนบนจอแคบ

## 4. Accessibility (WCAG 2.2 AA) [ADVISORIES]

- ✅ SVG มี `role="img"` + `aria-label` (ชื่อกราฟ) · pill ใช้สัญลักษณ์ ▲/▼ + เครื่องหมาย +/− ร่วมกับสี → ไม่พึ่งสีอย่างเดียว (1.4.1)
- ✅ legend มีทั้ง swatch สีและ **ข้อความ** (ต้นทุนสะสม/มูลค่าจริง) → แยกความหมายได้โดยไม่พึ่งสี
- [MINOR] 1.1.1 Non-text content: กราฟเป็นภาพข้อมูลเชิงซ้อน แต่ให้เฉพาะ aria-label สรุป ไม่มีทางเลือกข้อความต่อจุด (per-month) · **ข้อจำกัดโดยตั้งใจ**: การฝังตัวเลขมูลค่าใน DOM จะรั่วในโหมดซ่อนยอด (privacy) → เลือกสรุปเชิงคุณภาพแทน · advisory: พิจารณาตารางข้อมูลที่เคารพ privacy toggle ภายหลัง
- [MINOR] ป้ายเดือน 9px สี `--muted-2` บน `--surface` — เป็นข้อมูลรอง แต่ขนาดเล็ก · advisory: ตรวจ contrast/size จริงด้วย axe เมื่อรัน

## 5. Gaps

- ยังไม่รัน axe-core + Playwright (keyboard/visual regression) และ browsers=TBD (gap เดิมของโปรเจกต์ ไม่ใช่ของรอบนี้) — การตรวจรอบนี้เป็น static + unit
- privacy: แกนกราฟไม่ติดป้ายตัวเลข → โหมดซ่อนยอดยังมีผล (เห็นแค่รูปทรง) ✅

## 6. สรุป

ไม่มี BLOCKER/MAJOR · advisories เป็น polish (ตาราง a11y ที่เคารพ privacy, duplicate-sheet หลัง rename, รัน axe) → **PASS WITH ADVISORIES** · ปล่อยต่อได้ (ไปข้อ REL)

## 7. Revision history

| Rev | Date | ข้อ | สาระ/เหตุผล | ผู้จัดทำ | ผู้อนุมัติ |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | ทั้งหมด | QA CR-WPN-011 (กราฟ/snapshot, rename, logo, auth) · functional+visual+a11y (static) · PASS WITH ADVISORIES · 0 BLOCKER/MAJOR · migration ยืนยัน 200 | quality-assurance | เจ้าของโครงการ (solo) |
