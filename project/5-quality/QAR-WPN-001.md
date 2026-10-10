# Quality Assurance — WealthPlaner build round (F001–F006)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | QAR-WPN-001 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-09-19 |
| สถานะ | ร่าง |
| เอกสารอ้างอิง | REQ-WPN-001 rev 00 · DSN-WPN-001 rev 00 · TST-WPN-001 rev 00 |
| ผู้จัดทำ | quality-assurance (บทบาท) · รอบ /command-center |

**Verdict:** PASS WITH ADVISORIES
**Scope:** build ที่ `project/4-build/wealthplaner` — หน้า F002 Portfolio, F001 Add asset, F006 Rebalance, F005 Import (+ F004 ใน Portfolio)
**Spec source:** REQ-WPN-001 (AC) · DSN-WPN-001 (§4–§5 screens/states) · TST-WPN-001 (test cases)
**Date:** 2026-09-19 · **Reviewer:** quality-assurance agent

> Verdict derived: ไม่มี BLOCKER · มี ≥1 MAJOR/MINOR ⇒ PASS WITH ADVISORIES

---

## Functional            [ADVISORIES]

- [MAJOR] `app/page.tsx` — **F001 AC-03 ยังไม่ทำ**: ยังไม่มีการกรอง/สรุปมูลค่าตาม broker channel (มีแค่แสดง broker ต่อแถว = AC-02) → เพิ่มตัวกรอง/สรุปตาม broker หรือเลื่อนเป็น follow-up ที่บันทึกไว้
- [MINOR] `app/page.tsx` — **F002 AC-E01 empty state ไม่ render ใน UI**: `summarizePortfolio` คืน `isEmpty` แล้ว แต่หน้า Portfolio ไม่มี branch แสดง empty + ปุ่มไลม์ "เพิ่มสินทรัพย์" (DSN §5.1) → เพิ่ม empty state
- [MINOR] `app/add/page.tsx` — สินทรัพย์ที่เพิ่มปรากฏใน "เพิ่มในเซสชันนี้" แต่ยังไม่รวมเข้าพอร์ตข้ามหน้า (คงอยู่จริง = Supabase, carry-forward) — สาธิต AC-01 ได้ในเซสชัน

**Criteria coverage**

| # | Acceptance criterion | Result | Evidence |
|---|---|---|---|
| F001 AC-01 | เพิ่มครบ → ปรากฏในรายการ | met | `asset.test.ts` TC-F001-001b · `app/add` added list |
| F001 AC-02 | แสดง broker channel ต่อรายการ | met | `AssetRow` broker badge |
| F001 AC-03 | กรอง/สรุปตาม broker channel | **failed (unmet)** | ยังไม่มีใน UI → MAJOR |
| F001 AC-E01 | ไม่ครบ → error + focus ช่องแรก | met | TC-F001-E01 · `focusField(firstField)` |
| F001 AC-E02 | ติดลบ/ไม่ใช่ตัวเลข → ปฏิเสธ | met | TC-F001-E02 |
| F001 AC-E03 | ซ้ำ → เตือน+ยืนยัน | met | TC-F001-E03 · `dupPending` |
| F001 AC-E04 | ไม่เลือก broker → ปฏิเสธ | met | TC-F001-E04 |
| F002 AC-01 | มูลค่ารวม + allocation | met | TC-F002-001/002 |
| F002 AC-E01 | ไม่มีสินทรัพย์ → empty | logic met / UI gap | `portfolio.ts isEmpty` (test) แต่ไม่ render → MINOR |
| F003 AC-03 | ไม่มีแหล่ง → กรอกราคาเอง | met (manual) | ฟอร์ม Add asset |
| F003 AC-04 | สถานะราคา stale >15 นาที | met | `isStale` + AssetRow "ราคาเก่า" |
| F003 AC-01/02/05/06 | ดึงราคาสด settrade/investing | **carry-forward** | STAGED รอ O1 (ToS) — untestable รอบนี้ |
| F004 AC-01 | income/outcome เงิน+% | met | `finance.ts` tests · `Delta` |
| F004 AC-E01 | ไม่มีราคาตลาด → "—" ไม่ใช่ 0 | met | TC-F002-E02 · `Delta` na |
| F005 AC-01/E01 | นำเข้า/รายงานแถวผิด | met | `import.test.ts` TC-F005-001/E01 · `app/import` |
| F006 AC-01/E01 | gap ต่อคลาส / เป้า≠100 เตือน | met | `rebalance.test.ts` TC-F006-001/E01 · `app/rebalance` |

**อัตโนมัติ:** `npm test` 33/33 ผ่าน · `npm run build` ผ่าน 4 routes

---

## Visual & Design System [ADVISORIES]

- [MINOR] ทุกหน้า — **loading/skeleton state ยังไม่ทำ** (DSN §5.1/§5.3 ระบุ skeleton ระหว่างโหลด) → เพิ่มเมื่อต่อข้อมูลจริง (ผูก Supabase, carry-forward)
- [MINOR] ทุกหน้า — **unauthorized state ยังไม่ทำ** (DSN บังคับ 5 สถานะ) → ผูกกับ auth จริง (Supabase, carry-forward Class B)
- [NIT] `globals.css` — `--warn-bg` ใช้โดยไม่ได้ประกาศใน tokens.css (มี fallback) → เพิ่ม token ให้ครบ

**Coverage run:** token ✓ ไม่ hardcode สี/ระยะ · ▲▼ + เครื่องหมาย +/− (colorblind-safe) ✓ · breakpoints: mobile ✓ (คอลัมน์ 440px กึ่งกลาง ใช้ได้ tablet/desktop) · states: default/error/empty ✓ · loading/unauthorized ✗ (ข้างบน)

---

## Accessibility (WCAG 2.2 AA) [ADVISORIES]

- [MINOR] `app/import/page.tsx` — textarea มี label ผูก id ✓ แต่ยังไม่มี error ผูก `aria-describedby` เท่าฟอร์ม add → เพิ่มให้สม่ำเสมอ
- [NIT] ปุ่ม icon-only (topbar/back) มี `aria-label` ครบ ✓ — ตรวจแล้วไม่พบปัญหา

**Layers run:** keyboard ✓ (control เนทีฟทั้งหมด, focus ring มองเห็น `:focus-visible`) · semantics ✓ (label/`aria-invalid`/`aria-describedby`/`role="alert"`/`aria-live`) · contrast ✓ (DSN วัดจริงทุกคู่ ผ่าน AA)

---

## Gaps

- **axe-core อัตโนมัติยังไม่รัน** (ไม่มี browser harness ในรอบนี้) — a11y ตรวจด้วยการอ่านโค้ด+เกณฑ์ DSN เท่านั้น → ควรรัน axe เมื่อมี e2e harness (qa-testing-visual-regression)
- **F003 ดึงราคาสด / real data-auth** untestable — STAGED รอ O1 (ToS) + Supabase creds (Class B) บันทึกเป็น carry-forward ชัดเจน ไม่นับเป็น PASS
- ตรวจบน mock data — พฤติกรรมกับข้อมูลจริงปริมาณมาก (SRS สมมติ 50–200 assets) ยังไม่ทดสอบ

---

## Next action

- **PASS WITH ADVISORIES** — ผ่านเกณฑ์ G6 (verdict ≠ BLOCK) · ship-able ตามขอบเขต must-have ที่เอกสารรองรับ
- Advisories ที่ต้องติดตาม (follow-up รอบหน้า / เมื่อปลด Class B):
  1. [MAJOR] F001 AC-03 กรอง/สรุปตาม broker channel
  2. [MINOR] F002 empty-state UI · loading skeleton · unauthorized state (ผูก auth)
  3. [MINOR] import a11y `aria-describedby` · [NIT] `--warn-bg` token
- ส่งต่อ devops-release: ใช้ verdict นี้คู่กับ release-checklist-WPN.md — G6 ยังต้องปิด Class B (target/approver, ซ้อม rollback)
