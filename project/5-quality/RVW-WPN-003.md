# รายงานผลการทบทวนโค้ด — WealthPlanner · รอบ CR-010/012/013/014/015

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | RVW-WPN-003 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | CR-WPN-010/012/013/014/015 · REQ-WPN-001 F002/F004/F006/F007/F008 |
| ผู้ทบทวน | code-reviewer (บทบาท, solo) |

---

## 1. ขอบเขต

**Decision:** APPROVE WITH CHANGES
**Scope:** งานที่ยังไม่เคยผ่าน gate — CR-010 (แก้/ลบ/export), 012 (prefs+risk targets), 013 (privacy), 014 (ราคา/FX สด), 015 (UX/SSO/risk page)
**ยืนยัน:** `tsc --noEmit` สะอาด · `node --test src/lib/*.test.ts` 59 ผ่าน

## 2. Correctness
- ✅ dual-FX (014): มูลค่า=valueFx, ต้นทุน=fxToThb → income ถูก (เทส TC-F004-livefx) · targetsForRisk/RISK_TARGETS รวม 100% ทุกระดับ (เทส) · buildGrowthSeries (เทส)
- ✅ สิทธิ์เข้าถึง: `/api/prefs`, `/api/holdings`, `/api/export` กรองด้วย `resolveUserKey` (เจ้าของเท่านั้น) · prices.ts ไม่ส่งข้อมูลผู้ใช้ออกนอก · FINNHUB key อ่านฝั่ง server
- [MAJOR] `prices.ts` + `portfolioData.applyLivePrices` เดา symbol จาก **ชื่อรายการ** (crypto regex word-boundary + curated map · หุ้นเดา ticker A–Z) → ถ้าชื่อพ้องอาจ map ราคาผิดลง `marketPrice` · บรรเทาแล้ว (conservative + key-gated หุ้น) แต่ควรเพิ่มฟิลด์ `ticker` ต่อรายการ → backlog 4.2
- [MINOR] Finnhub ดึงทีละ symbol แบบ sequential (≤12) → latency ถ้าหุ้นเยอะ

## 3. Reuse
- [MINOR] `compact()` ซ้ำ 3 ไฟล์ (page/GrowthChart/AllocationTabs) → ยกเป็น util กลาง (backlog 3.1)
- ✅ `.icon-btn` (015) ยุบปุ่มไอคอนที่เคย inline ลักลั่นมาเป็น class เดียว — ลด duplication ดี

## 4. Clarity
- ✅ pure builders แยกจาก I/O (portfolio/prices/sheetExport) · RiskForm จัดการ dirty/leave/toast อ่านง่าย
- [MINOR] rebalance.tsx เริ่มใหญ่ (seed/save/preset/differs รวมในไฟล์เดียว) — ยังอ่านได้ แต่จับตา

## 5. Maintainability
- [MAJOR] `/rebalance` คำนวณ "ปัจจุบัน %" จาก `sampleAssets` (mock) ไม่ใช่พอร์ตจริง → เป้าหมายที่บันทึกใช้ได้จริง แต่คอลัมน์ปัจจุบันลวงตา → backlog 4.1 (อ่านพอร์ตจริง)
- [MINOR] `recordSnapshot` await บนหน้าแรกทุกครั้ง (latency) · CSS login ที่ตายแล้วค้าง (backlog 3.2/3.3) · อีเมลติดต่อใน privacy ฮาร์ดโค้ด (เจ้าของทราบ)

## 6. จุดดี
best-effort graceful ทุก external (prices/prefs/snapshot ล้มเหลว → fallback ไม่พัง) · ไม่สร้างข้อมูลปลอม · dual-FX ทำถูกต้องแทนที่จะง่าย ๆ · `.icon-btn`/`.note`/topbar แก้ที่ระบบ กระทบดีทั้งแอป

## 7. สรุป
ไม่มี BLOCKER · 2 MAJOR (rebalance-mock, symbol-guess) เป็น backlog ที่ documented แล้ว (4.1/4.2) ไม่บล็อกการคงบน prod → **APPROVE WITH CHANGES**

## 8. Revision history
| Rev | Date | ข้อ | สาระ/เหตุผล | ผู้จัดทำ | ผู้อนุมัติ |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | ทั้งหมด | ทบทวน CR-010/012/013/014/015 · APPROVE WITH CHANGES · 2 MAJOR (rebalance mock, symbol guess) + MINOR → backlog | code-reviewer | เจ้าของโครงการ (solo) |
