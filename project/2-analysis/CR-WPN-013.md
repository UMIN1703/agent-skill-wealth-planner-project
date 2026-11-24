# Change request — WealthPlanner · หน้านโยบายความเป็นส่วนตัว (/privacy)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-013 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F008 · CR-WPN-010 (export) · CR-WPN-011 (auth/Google) |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-24 — ต้องการหน้า Privacy Policy (ปูทางส่ง Google OAuth verification เพื่อลบหน้าเตือน "unverified app" ถาวร) |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-24 |

---

## 1. Why this is a request, not an edit

เพิ่มหน้าสาธารณะใหม่ (`/privacy`) + ข้อผูกพันเชิงนโยบายต่อผู้ใช้ และเป็นเอกสารที่ Google ต้องตรวจสำหรับ OAuth verification ของสโคปที่อ่อนไหว (Drive/Sheets) → ออกเป็นคำขอ

## 2. Request summary

| # | เรื่อง | กระทบ | Class B |
|---|---|---|---|
| CR-32 | หน้า `/privacy` (นโยบายความเป็นส่วนตัว) + Google Limited Use disclosure + ลิงก์จากหน้า login | F008 | ไม่มี |

---

## 3. Requests

### CR-32 · หน้านโยบายความเป็นส่วนตัว
หน้า `app/privacy/page.tsx` สาธารณะ (ไม่ต้อง login · ไม่อยู่ใน middleware matcher) · เนื้อหา **อิงสิ่งที่แอปทำจริง** 9 หัวข้อ:
ข้อมูลที่เก็บ (บัญชี Google/LINE, พอร์ต, รูปสลิป, การตั้งค่า) · วิธีใช้ · การเข้าถึง Google Drive/Sheets (สโคปจำกัด `drive.file`+`spreadsheets` เฉพาะไฟล์ที่แอปสร้าง) · ผู้ให้บริการ (Supabase/Cloudflare/Google/LINE) · การเก็บ/ลบข้อมูล · ความปลอดภัย · สิทธิผู้ใช้ · ติดต่อ · การเปลี่ยนแปลง ·
มี **Google API Services User Data Policy — Limited Use disclosure** (ไม่ขาย/ไม่โฆษณา/ไม่ให้มนุษย์อ่านเว้นแต่ยินยอม) ซึ่งจำเป็นต่อการผ่าน OAuth verification ·
ลิงก์ "นโยบายความเป็นส่วนตัว" ที่ footer หน้า login ชี้มาที่ `/privacy` · อีเมลติดต่อ = `yuwadee00001@gmail.com` (แก้ได้ที่ค่าคงที่ `CONTACT_EMAIL` ในไฟล์)

---

## 4. Combined impact

| Dimension | Effect |
|---|---|
| Scope | เพิ่มหน้าสาธารณะ + นโยบายต่อผู้ใช้ · ไม่แตะ data model/โค้ดหลัก |
| Effort | สร้างเสร็จแล้ว · tsc สะอาด · deploy d7456fa4 · commit 9f63e90 · smoke test `/privacy` → HTTP 200 (prod) |
| Class B | ไม่มี |

### 4.1 ขั้นต่อไป (เจ้าของทำใน Google Cloud Console)
ตั้งค่า OAuth consent screen: **App home page** = `https://wealthplaner.pages.dev` · **App privacy policy link** = `https://wealthplaner.pages.dev/privacy` → จึงกด "PUBLISH APP" + ส่ง verification เพื่อลบหน้าเตือน (ต้องมี authorized domain ที่ยืนยันแล้วด้วย — อาจต้อง custom domain)

## 5. ไม่รวมในรอบนี้ (backlog)
- หน้า Terms of Service (ลิงก์ "ข้อกำหนดการใช้งาน" ที่ login ยังเป็น `#`)
- ส่ง Google verification จริง + ยืนยัน authorized domain (ต้องใช้ custom domain — `.pages.dev` อาจยืนยันไม่ได้)

## 6. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | All | เปิดคำขอ: หน้า /privacy (นโยบายความเป็นส่วนตัวอิงการทำงานจริง + Google Limited Use disclosure) + ลิงก์จาก login · ไม่มี Class B | system-analyst | เจ้าของโครงการ (solo) |
