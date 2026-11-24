# รายงานผลการทบทวนโค้ด — WealthPlanner · รอบกราฟการเติบโต + rebrand (CR-WPN-011)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | RVW-WPN-002 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | CR-WPN-011 · REQ-WPN-001 F002/F008 · DSN-WPN-001 |
| ผู้ทบทวน | code-reviewer (บทบาท, solo) |

---

## 1. ขอบเขตการทบทวน

**Decision:** APPROVE
**Intent source:** CR-WPN-011 (CR-25…CR-28)
**ไฟล์ที่ทบทวน:** `src/lib/portfolio.ts` (buildGrowthSeries) · `src/components/GrowthChart.tsx` · `src/lib/supabase.ts` (recordSnapshot/listSnapshots/todayBangkok) · `src/lib/portfolioData.ts` · `app/page.tsx` · `src/auth.ts` · `src/components/LoginForm.tsx` + rename ทุก user-facing + `docs/supabase-snapshots.sql`
**ยืนยัน:** `tsc --noEmit` สะอาด · เทสต์ portfolio 10/10 (รวมเคสใหม่ TC-F002-growth) + sheetExport 2/2

## 2. Correctness

- [MINOR] `portfolio.ts` buildGrowthSeries — เส้นมูลค่าพึ่งพา `snapshots` เรียง as_of จากเก่า→ใหม่ (loop ใช้ "ตัวท้ายที่ผ่านเงื่อนไข = ล่าสุด"). ปัจจุบัน `listSnapshots` order `as_of.asc` จึงถูกต้อง → เป็น invariant ที่ต้องรักษา ถ้าเปลี่ยน query ภายหลังจะพัง · ควรมีคอมเมนต์กำกับ (มีแล้วบางส่วน)
- [MINOR] buildGrowthSeries — เทียบ `new Date(a.createdAt)` (ISO มี Z = UTC) กับ `new Date(year, m+1, 0, 23,59,59)` (เวลาเครื่อง). บน production (Cloudflare edge = UTC) ผลตรงกัน · ความเสี่ยงคลาดเคลื่อน ±ชั่วโมงเฉพาะรันบนเครื่องที่ไม่ใช่ UTC ใกล้เที่ยงคืนสิ้นเดือน — ยอมรับได้ (เซิร์ฟเวอร์จริงเป็น UTC)

## 3. Reuse

- [MINOR] ฟังก์ชัน `compact()` (ย่อเลข ฿1.58M/420k) ซ้ำกันใน `app/page.tsx` และ `GrowthChart.tsx` (เหมือนกันทุกบรรทัด) → เสี่ยง drift · ควรยกไป util กลาง (เช่น `src/lib/format.ts`) — ไม่บล็อก merge

## 4. Clarity

- ผ่าน · `GrowthChart` ใช้ค่าคงที่พิกัดตั้งชื่อชัด (PL/PR/PT/PB), path สร้างแบบอ่านได้ · `buildGrowthSeries` เป็น pure + มีเทสต์ครอบ · ชั้น snapshot best-effort (try/catch) สื่อเจตนาชัด

## 5. Maintainability

- [MINOR] `app/page.tsx` เรียก `recordSnapshot` (POST) แล้วตามด้วย `listSnapshots` (GET) แบบ await ต่อเนื่องทุกครั้งที่เปิดหน้าแรก → +1 round-trip Supabase ต่อการโหลด · หมายเหตุ: เดือนปัจจุบันใช้ "ค่าสด" (currentValue) อยู่แล้วไม่ต้องรอ snapshot วันนี้ ⇒ `recordSnapshot` ไม่จำเป็นต้อง await ก่อน list (ย้ายเป็น fire-and-forget ท้าย request ได้ถ้าต้องการลด latency) — ไม่บล็อก
- [MINOR] `src/auth.ts` เอา `prompt:'consent'` ออก → login Google ตรง ๆ รอบใหม่จะไม่การันตีได้ refresh_token ⇒ auto-refresh (jwt callback) อาจใช้ไม่ได้ในบางเซสชัน · มี fallback graceful: token หมด → เส้นทาง needReauth ให้ login ใหม่ได้ fresh token · เป็น trade-off ที่เจ้าของเลือกเพื่อลดหน้าเตือน (ยอมรับ)

## 6. จุดดี (calibration)

- การแยก pure builder (`buildGrowthSeries`) ออกจาก I/O + ชั้น snapshot best-effort ที่ไม่ทำให้หน้าแรกพังเมื่อตารางยังไม่ถูกสร้าง = ออกแบบดี (กราฟยัง fallback เป็นต้นทุนสะสมได้)
- ไม่มีการสร้างข้อมูลมูลค่าย้อนหลังปลอม — ตรงเจตนา "ไม่ invent data"

## 7. สรุป

ไม่มี BLOCKER/MAJOR · minor ทั้งหมดเป็น polish (DRY `compact`, ย้าย snapshot เป็น fire-and-forget, คอมเมนต์ invariant) ไม่กระทบความถูกต้องของผู้ใช้ → **APPROVE** · minor บันทึกเป็น backlog ใน CR-WPN-011 §5

## 8. Revision history

| Rev | Date | ข้อ | สาระ/เหตุผล | ผู้จัดทำ | ผู้อนุมัติ |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | ทั้งหมด | ทบทวน CR-WPN-011 (กราฟการเติบโต/snapshot, rename, logo, auth prompt) · APPROVE · 5 MINOR เป็น backlog | code-reviewer | เจ้าของโครงการ (solo) |
