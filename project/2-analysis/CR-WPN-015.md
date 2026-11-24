# Change request — WealthPlanner · ปรับ UX/ดีไซน์ + SSO-only + หน้าแบบประเมินแยก

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-015 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F002/F006/F007/F008 · CR-WPN-012 · DSN-WPN-001 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-24 — เก็บบั๊กดีไซน์ที่พบจากการใช้งานจริง + ปรับ flow แบบประเมิน + ตัดล็อกอินอีเมลที่ไม่ได้ทำจริง |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-24 |

---

## 1. Why this is a request, not an edit

รวมการปรับ UX/ดีไซน์หลายจุด + เปลี่ยน flow แบบประเมินความเสี่ยง (F007) เป็นหน้าแยก + ตัดสโคปล็อกอินอีเมล/สมัครสมาชิก (F008) → มีทั้งแก้บั๊กและเปลี่ยนสโคป จึงออกเป็นคำขอ

## 2. Request summary

| # | เรื่อง | กระทบ | Class B |
|---|---|---|---|
| CR-36 | แก้บั๊กฟอร์ม: dropdown ไม่มีลูกศร · date input ล้นขอบ/จัดกึ่งกลาง · `.note` flex ทำประโยคแตกคอลัมน์ | F001/F009 · DSN | ไม่มี |
| CR-37 | ล็อกอิน SSO-only — ตัดฟอร์มอีเมล/รหัสผ่าน + ปุ่มสมัครสมาชิก (เป็น stub ใช้ไม่ได้จริง) | F008 | ไม่มี |
| CR-38 | แบบประเมินความเสี่ยง: accordion → **หน้าแยก** `/profile/risk` (back + modal เตือน unsaved + toast สำเร็จ) | F007 · DSN | ไม่มี |
| CR-39 | Risk onboarding: การ์ดชวนประเมินครั้งแรกบนหน้าแรก · RiskStat เลิกโชว์เลขปลอม · ปุ่ม "คืนค่าที่ระบบแนะนำ" ใน rebalance | F006/F007 | ไม่มี |
| CR-40 | ดีไซน์ระบบ: `.topbar` เพิ่ม gap · class ปุ่มไอคอนทรงกลม `.icon-btn` (consistency ทุกปุ่ม) | DSN | ไม่มี |

---

## 3. Requests

### CR-36 · แก้บั๊กฟอร์ม (slip/add)
`select.input` เดิม `appearance:none` ทำลูกศร native หาย → ใส่ chevron SVG เอง (เห็นชัดว่าเป็น dropdown) · `input[type=date]` เพิ่ม `-webkit-appearance:none; min-width:0` (เดิมล้นขอบการ์ดบน iOS) + ชิดซ้าย + ไอคอนปฏิทิน · `.note` เปลี่ยน `display:flex` → `block` (เดิมประโยคที่มี `<strong>` แตกเป็น 3 คอลัมน์ + `textAlign:center` ไม่ทำงาน — แก้ทีเดียวดีขึ้นหลายหน้า)

### CR-37 · ล็อกอิน SSO-only
ฟอร์มอีเมล/รหัสผ่าน + ปุ่ม "สมัครสมาชิก" (ลิงก์วนกลับ /login) + "ลืมรหัสผ่าน?" เป็น **stub ไม่มี Credentials provider/ที่เก็บผู้ใช้** → ตัดออกทั้งหมด เหลือ **Google + LINE SSO** (ตรงกับที่ใช้งานจริง) · ลบ state/handler/import ที่ไม่ใช้

### CR-38 · แบบประเมินความเสี่ยงเป็นหน้าแยก
จาก accordion ใน /profile → แถวนำทางไปหน้าใหม่ `app/profile/risk` (`RiskForm`) · ปุ่มย้อนกลับ: ถ้าตอบแล้ว ≥1 ข้อและยังไม่บันทึก → **modal เตือน "ยังไม่ได้บันทึก"** (+ `beforeunload` กันรีเฟรช/ปิดแท็บ) · บันทึก → `/api/prefs` + localStorage → **toast "บันทึกผลประเมินแล้ว"** แล้วเด้งกลับ /profile · ลบคอมโพเนนต์ accordion เดิม

### CR-39 · Risk onboarding
หน้าแรก: ถ้า login แล้วแต่ยังไม่ประเมิน → การ์ด "ประเมินความเสี่ยงของคุณ (2 นาที)" ลิงก์ /profile/risk · `RiskStat` เลิกโชว์ "4/5 • ตัวอย่าง" (เลขปลอม) → "ประเมินเลย →" · `/rebalance` ปุ่มรีเซ็ตเปลี่ยนเป็น "↺ คืนค่าที่ระบบแนะนำ · ระดับ N/5" โชว์เฉพาะตอนค่าต่างจากโมเดลที่แนะนำ (ข้อ 2/3/4 ของฟีเจอร์นี้มีแล้วใน CR-012)

### CR-40 · ดีไซน์ระบบ (consistency)
`.topbar` เพิ่ม `gap:10px` + `min-height` (เดิมปุ่มย้อนกลับติดหัวข้อ) · เพิ่ม class **`.icon-btn` (+ `.sm`)** = ปุ่มไอคอนทรงกลมจริง (`border-radius:50%` ขนาดจัตุรัสคงที่ → outline โฟกัสกลมตาม) · แปลงปุ่มไอคอนทั้งแอปมาใช้ (ย้อนกลับ 6 หน้า + RiskForm, นำเข้า, ส่งออก, ลูกศรสลับปีกราฟ, ดินสอแก้ไข, ซ่อน/แสดงยอด) แทน `btn-ghost + inline` ที่ลักลั่น

---

## 4. Combined impact

| Dimension | Effect |
|---|---|
| Scope | แก้บั๊กดีไซน์หลายจุด · ตัดสโคป email auth · F007 เป็นหน้าแยก · design-system consistency |
| Effort | สร้างเสร็จ · tsc สะอาด · 59 เทสผ่าน · commits 70656be/5a43916/a3d9eb0/9e71c7f/237da26/0c8acb2/4382872 |
| Class B | ไม่มี (ไม่มี migration) |
| ความเสี่ยง | ต่ำ — ส่วนใหญ่ CSS/UI · RiskForm บันทึกผ่าน /api/prefs (best-effort + localStorage) เหมือนเดิม |

## 5. ไม่รวมในรอบนี้ (backlog)
- ลบ CSS login ที่ตายแล้ว (`.auth-form`/`.auth-div`/`.auth-foot` ฯลฯ) · modal แบบประเมินยังไม่ focus-trap/Esc-close · Terms of Service (ลิงก์ยังเป็น `#`)

## 6. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | All | เปิดคำขอ: แก้บั๊กฟอร์ม (chevron/date/.note), SSO-only, แบบประเมินเป็นหน้าแยก (+modal/toast), risk onboarding, `.icon-btn`/topbar consistency · ไม่มี Class B | system-analyst | เจ้าของโครงการ (solo) |
