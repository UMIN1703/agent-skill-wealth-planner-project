# Change request — WealthPlanner · เก็บความเสี่ยง + เป้าหมาย allocation ขึ้น Supabase (sync ข้ามเครื่อง)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-012 |
| ฉบับแก้ไขครั้งที่ | 01 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F006/F007 · CR-WPN-008 · CR-WPN-011 · DSN-WPN-001 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-24 — ความเสี่ยง (F007) อยู่ localStorage ต่อเครื่อง, เป้าหมาย (F006) เป็นค่าคงที่/แก้แล้วไม่ถูกเก็บ → ขอให้ sync ข้ามเครื่อง + แก้เป้าหมายเองได้ถาวร |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-24 |

---

## 1. Why this is a request, not an edit

ขยายขอบเขต F007 (เก็บผลประเมินข้ามเครื่อง แทน localStorage ต่ออุปกรณ์) และ F006 (ทำให้เป้าหมาย allocation แก้ไขเองได้และเก็บถาวร แทนค่าคงที่ `CATEGORY_TARGETS`) → ออกเป็นคำขอ

## 2. Request summary

| # | เรื่อง | กระทบ | Class B |
|---|---|---|---|
| CR-29 | เก็บผลประเมินความเสี่ยงขึ้น Supabase → sync ข้ามเครื่อง | F007 | migration `user_prefs` |
| CR-30 | เป้าหมาย allocation แก้ไขเอง + เก็บถาวร (หน้าปรับสมดุล → หน้าพอร์ตใช้ค่าเดียวกัน) | F006 | (ตารางเดียวกัน) |
| CR-31 | target allocation ปรับอัตโนมัติตามระดับความเสี่ยง (rev 01) | F006/F007 | ไม่มี |

---

## 3. Requests

### CR-29 · ความเสี่ยง → Supabase (sync ข้ามเครื่อง)
ตารางใหม่ `user_prefs` (1 แถว/ผู้ใช้, คอลัมน์ `risk jsonb`, `targets jsonb`) · API `/api/prefs` (GET อ่าน · PATCH บันทึกเฉพาะคีย์ที่ส่ง → ไม่ทับคีย์อื่น) ·
`RiskAssessment` ตอนประเมินเสร็จ → เขียน localStorage **และ** PATCH `/api/prefs {risk}` · `RiskAssessment`/`RiskStat` seed ค่าเริ่มต้นจาก server (prop `initial` เรนเดอร์ฝั่งเซิร์ฟเวอร์) → ล็อกอินเครื่องไหนก็เห็นผลเดียวกัน · ยังไม่ล็อกอิน/ออฟไลน์ → fallback localStorage เหมือนเดิม

### CR-30 · เป้าหมาย allocation แก้ไขเอง + เก็บถาวร
หน้า `/rebalance` โหลดเป้าหมายที่บันทึกไว้ (GET `/api/prefs`) มาเติมฟอร์ม (fallback `CATEGORY_TARGETS`) · เพิ่มปุ่ม **"บันทึกเป้าหมาย"** (เปิดเมื่อรวม = 100%) → PATCH `/api/prefs {targets}` ·
หน้าพอร์ต (`app/page.tsx`) แท็บ "เป้าหมาย" อ่าน `prefs.targets` ที่บันทึกไว้ (fallback โมเดลกลาง) → เป้าที่ตั้งเองสะท้อนทั้งสองหน้า

### CR-31 · target allocation ปรับตามระดับความเสี่ยง (rev 01)
โมเดลเป้าหมาย 5 ชุดตามระดับความเสี่ยง 1–5 (`RISK_TARGETS` ใน portfolio.ts, แต่ละชุดรวม 100%, ระดับ 3 = โมเดลกลางเดิม) + `targetsForRisk(level)` (pure, เทสต์) ·
**ลำดับความสำคัญของเป้าหมาย: ค่าที่ผู้ใช้ตั้งเอง (prefs.targets) > โมเดลตามความเสี่ยง (ตาม prefs.risk.level) > โมเดลกลาง** ·
หน้าพอร์ตแท็บ "เป้าหมาย" fallback เป็นโมเดลตามความเสี่ยง · หน้า `/rebalance` seed จากโมเดลตามความเสี่ยง + ปุ่ม "ใช้สัดส่วนแนะนำ · ความเสี่ยงระดับ N/5" + ข้อความกำกับว่าเป็นแนวทางเบื้องต้น ไม่ใช่คำแนะนำตามเกณฑ์ กลต. เต็มรูป ·
ยังไม่ได้ประเมิน → ชวนทำแบบประเมินก่อน (ไม่มีโมเดลแนะนำ)

---

## 4. Combined impact

| Dimension | Effect |
|---|---|
| Scope | ผลประเมิน + เป้าหมายกลายเป็นข้อมูลระดับผู้ใช้ที่เก็บถาวร (เดิม localStorage/ค่าคงที่) · Google ไม่เกี่ยว |
| Effort | สร้างเสร็จแล้ว · tsc สะอาด, 57 เทสผ่าน · deploy 2bb6f989 · commit 6c786d0 |
| Class B | migration ตาราง `user_prefs` (idempotent · `docs/supabase-prefs.sql`) — กราฟ/แอปทำงานได้แม้ยังไม่รัน (getPrefs คืน null → fallback) |
| ความปลอดภัย | `user_prefs` เข้าถึงผ่าน service_role เท่านั้น (RLS เปิด ไม่มี policy anon) · API กรองด้วย `resolveUserKey` เจ้าของเท่านั้น |

## 5. ไม่รวมในรอบนี้ (backlog)
- หน้า `/rebalance` ยังคำนวณบน `sampleAssets` (mock) ไม่ใช่พอร์ตจริง — เป้าหมายที่บันทึกใช้ได้จริง แต่ "ปัจจุบัน %" ยังเป็นเดโม (แยกแก้ภายหลัง)
- โมเดลตามความเสี่ยงเป็นชุดคงที่เชิงการศึกษา (ยังไม่อิงสูตร glide-path/อายุ) · validate ผลรวม 100% ฝั่ง UI เท่านั้น (ยังไม่ normalize อัตโนมัติ)

## 6. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | All | เปิดคำขอ: เก็บความเสี่ยง (F007) + เป้าหมาย allocation (F006) ขึ้น Supabase `user_prefs` → sync ข้ามเครื่อง + แก้เป้าหมายเองได้ถาวร · Class B = migration user_prefs | system-analyst | เจ้าของโครงการ (solo) |
| 01 | 2026-11-24 | §2,§3 (CR-31),§5 | เพิ่ม CR-31: target allocation ปรับตามระดับความเสี่ยง (RISK_TARGETS 5 ชุด + targetsForRisk) · ลำดับ ค่าที่ตั้งเอง > โมเดลความเสี่ยง > โมเดลกลาง · ปุ่ม "ใช้สัดส่วนแนะนำ" ที่ /rebalance + disclaimer · ไม่มี Class B เพิ่ม | system-analyst | เจ้าของโครงการ (solo) |
