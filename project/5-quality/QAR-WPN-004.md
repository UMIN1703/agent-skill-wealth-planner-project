# รายงานการประกันคุณภาพ — WealthPlanner · รอบ CR-010/012/013/014/015

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | QAR-WPN-004 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | CR-WPN-010/012/013/014/015 · RVW-WPN-003 · REQ-WPN-001 · DSN-WPN-001 |
| ผู้ตรวจ | quality-assurance (บทบาท, solo) |

---

## 1. ขอบเขตและสเปก

**Verdict:** PASS WITH ADVISORIES
**Scope:** แก้/ลบ/export (010), prefs+risk targets (012), privacy (013), ราคา/FX สด (014), UX/SSO/risk page (015)
**Conformance:** WCAG 2.2 AA · วิธี: static review + tsc + unit tests (ยังไม่รัน axe/Playwright — gap เดิม)

## 2. Functional [ADVISORIES]
- ✅ แก้ไข/ลบรายการ (migration updated_at รันแล้ว) · export Sheet · prefs sync ข้ามเครื่อง · เป้าหมายตามความเสี่ยง · ราคา/FX สด (best-effort) · privacy /privacy 200
- ✅ RiskForm: ตอบครบ→บันทึก→toast→เด้งกลับ · ออกกลางคันทั้งที่ตอบ→modal เตือน (+beforeunload) · ลิงก์ชวนประเมินครบ (home CTA/RiskStat/rebalance → /profile/risk)
- [MAJOR] `/rebalance` "ปัจจุบัน %" มาจากเดโม (mock) ไม่ใช่พอร์ตจริง → ผู้ใช้อาจเข้าใจผิด → backlog 4.1
- [MINOR] ราคา crypto/หุ้นเดา symbol จากชื่อ — ไม่ match = คงราคาที่กรอกเอง (ปลอดภัย) แต่ coverage ไม่ครบ

## 3. Visual & Design System [PASS]
- ✅ `.icon-btn` ทำปุ่มไอคอนกลม+เท่ากันทั้งแอป (outline โฟกัสกลม) · `.topbar` gap · dropdown มี chevron · date ชิดซ้าย+ไอคอนปฏิทิน · `.note` ไหลปกติ (เลิก flex) · token ใช้ var ครบ · ปีพุทธ
- ✅ SSO-only login สะอาด ตรงกับความจริง

## 4. Accessibility (WCAG 2.2 AA) [ADVISORIES]
- ✅ `.icon-btn` มี `:focus-visible` outline + ทุกปุ่มมี aria-label · dropdown chevron เห็นชัด · modal `role="dialog" aria-modal` · toast `role="status"` · pill ใช้ ▲▼+เครื่องหมาย ไม่พึ่งสีอย่างเดียว
- [MINOR] modal แบบประเมินยังไม่ **focus-trap / ปิดด้วย Esc** (ปิดได้ด้วยแตะ backdrop/ปุ่ม) → backlog
- [MINOR] กราฟยังไม่มีทางเลือกข้อความต่อจุด (เคารพ privacy) — ยกจาก QAR-003

## 5. Gaps
- ยังไม่รัน axe-core + Playwright · browsers=TBD (gap เดิมโปรเจกต์) — ตรวจรอบนี้เป็น static + unit

## 6. สรุป
ไม่มี BLOCKER · 1 MAJOR (rebalance mock → 4.1) + MINOR เป็น advisory/ backlog → **PASS WITH ADVISORIES** · ปล่อยต่อได้

## 7. Revision history
| Rev | Date | ข้อ | สาระ/เหตุผล | ผู้จัดทำ | ผู้อนุมัติ |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | ทั้งหมด | QA CR-010/012/013/014/015 (functional/visual/a11y, static) · PASS WITH ADVISORIES · 0 BLOCKER · 1 MAJOR (rebalance mock) + MINOR | quality-assurance | เจ้าของโครงการ (solo) |
