# Change request — WealthPlaner document set

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-001 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-08-22 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | PRD-WPN-001 rev 00 · SRS-WPN-001 rev 00 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | SRS-WPN-001 ข้อ 2.5 conflict C1 · ข้อ 2.4 B2 |
| Request count | 2 |
| Requested by | system-analyst |
| Approved by | เจ้าของโครงการ (solo) 2026-08-22 |

---

## 1. Why this is a request, not an edit

> การค้นพบระหว่างการออกแบบที่ทำให้ข้อกำหนดเปลี่ยน ต้องจัดการด้วยการออกฉบับแก้ไข
> ของเอกสารที่ได้รับผลกระทบ ผู้รับต้องไม่แก้ข้อกำหนดฝ่ายเดียว
> — system-analyst SKILL "Non-negotiables"

นักวิเคราะห์จึงเสนอข้อความแทนที่แบบ paste ได้ ไม่แก้ PRD เอง

## 2. Request summary

| # | Document | Clause | Closes finding | Severity | Changes scope/effort/metrics? |
|---|---|---|---|---|---|
| CR-01 | PRD-WPN-001 ข้อ 9, project.yml technical.data_location | ที่เก็บข้อมูล | C1 (ADR-001) | High | **Yes — effort backend เพิ่ม** |
| CR-02 | PRD-WPN-001 ข้อ 9, REQ NFR-03 | โมเดล auth | B2 | Medium | No (นิยามเพิ่ม) |

---

## 3. Requests

### CR-01 · ที่เก็บข้อมูล: Google Sheet/Drive → สถาปัตยกรรมไฮบริด

| Item | Value |
|---|---|
| Document | PRD-WPN-001 ข้อ 9 · project.yml `technical.data_location` |
| Closes | C1 / ADR-001 |
| Severity | High |

**Evidence of the problem**

| Statement | Source |
|---|---|
| "ข้อมูลการเงิน... เก็บบน Google Sheet/Drive" | PRD-WPN-001 ข้อ 9 |
| "หน้าพอร์ตรวมภายใน 2 วินาที (p95)" + "สิทธิ์เข้าถึงเฉพาะเจ้าของ" | REQ NFR-01, NFR-03 |

Google Sheet บังคับ constraint/สิทธิ์ระดับแถวไม่ได้ และช้าเมื่อข้อมูลโต → ทำ NFR-01/03 ไม่ได้

**Proposed change**

| | Text |
|---|---|
| **Current** | ข้อมูลการเงินอ่อนไหวสูง — เก็บบน Google Sheet/Drive |
| **Proposed** | ข้อมูลจัดเก็บใน **ฐานข้อมูลเฉพาะ (สถาปัตยกรรมไฮบริดตาม ADR-001)** โดยรองรับการนำเข้า/ส่งออกผ่าน Google Sheet (F005); ต้องจำกัดสิทธิ์เข้าถึงเฉพาะเจ้าของ |

**Impact** — effort: เพิ่มงานตั้ง/ดูแลฐานข้อมูล (backend) · scope: F005 กลายเป็นสะพาน import · metrics: ไม่กระทบ

### CR-02 · เพิ่มโมเดลยืนยันตัวตน (LINE + Google)

| Item | Value |
|---|---|
| Document | PRD-WPN-001 ข้อ 9 · REQ NFR-03 |
| Closes | B2 |
| Severity | Medium |

**Proposed change**

| | Text |
|---|---|
| **Current** | (ไม่ระบุวิธียืนยันตัวตน) |
| **Proposed** | ผู้ใช้ยืนยันตัวตนผ่าน **LINE Login และ Google** (รองรับทั้งสอง) โดย map ทั้งสอง identity เข้าสู่ผู้ใช้เดียว; ข้อมูลผูกกับ user_id ภายใน |

**Impact** — effort: เพิ่มงาน map 2 identity (เล็กน้อยสำหรับ solo) · metrics: ไม่กระทบ

---

## 4. Combined impact and recommended order

### 4.1 Combined impact

| Dimension | Effect |
|---|---|
| Scope | F005 เป็นสะพาน Sheet↔DB · เพิ่ม auth 2 ช่องทาง |
| Effort | เพิ่ม backend (ฐานข้อมูล) + auth |
| Metrics | ไม่กระทบ |
| Schedule | ยังไม่มี deadline (solo) — PM ยังไม่ประเมิน |

### 4.2 Recommended order

| # | Request | Why this position |
|---|---|---|
| 1 | CR-01 | กำหนด physical schema ทั้งหมด ต้องปิดก่อน |
| 2 | CR-02 | นิยาม User entity |

## 5. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-08-22 | All | First issue — ปิด C1/B2 หลังเจ้าของตัดสิน ADR-001 (ไฮบริด) + auth (LINE+Google) | system-analyst | เจ้าของโครงการ |
| 00 | 2026-08-29 | §4, §5 | renumber section §5→§4, §6→§5 ให้ต่อเนื่อง (เดิมข้าม §4) · cosmetic ไม่กระทบเนื้อหา/การอนุมัติ | system-analyst | — |
