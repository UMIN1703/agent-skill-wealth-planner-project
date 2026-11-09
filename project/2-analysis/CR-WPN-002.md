# Change request — WealthPlaner · เพิ่มฟีเจอร์ F009 Slip-to-Ledger

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-002 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-07 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | PRD-WPN-001 rev 00 · REQ-WPN-001 rev 00 · CR-WPN-001 rev 00 (auth model) |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเพิ่มขอบเขตจากเจ้าของโครงการ 2026-11-07 (ส่งสลิปเข้า LINE → บันทึกบนเว็บ → ซิงค์ Google Drive) |
| Request count | 1 |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-07 |

---

## 1. Why this is a request, not an edit

> การค้นพบ/คำขอที่ทำให้ **ขอบเขตของข้อกำหนดเปลี่ยน** ต้องจัดการด้วยการออกฉบับแก้ไข
> ของเอกสารที่ได้รับผลกระทบ ไม่ใช่เพิ่มฟีเจอร์ลงโค้ดลอย ๆ โดยข้ามเอกสาร
> — CLAUDE.md "Roles stay separate" · system-analyst SKILL

นี่ไม่ใช่ข้อขัดแย้งระหว่างเอกสาร (เหมือน CR-WPN-001) แต่เป็น **การเพิ่มขอบเขต (scope addition)**
ที่เกินชุดฟีเจอร์ที่ผูกไว้ (F001–F008) นักวิเคราะห์จึงเสนอข้อความเพิ่มแบบ paste ได้
ไม่แก้ PRD เอง และบันทึกข้อสมมติ/ของที่ยังไม่รู้ไว้ชัดเจนแทนการเดา

## 2. Request summary

| # | Document | Clause | ผลที่ปิด | Severity | Changes scope/effort/metrics? |
|---|---|---|---|---|---|
| CR-03 | REQ-WPN-001 (เพิ่ม F009) · PRD-WPN-001 ข้อ 7 (feature set) | ฟีเจอร์ใหม่ | เพิ่มขีดความสามารถ (owner request) | Medium | **Yes — เพิ่ม scope + effort (webhook, Drive/Sheets, staging)** |

ต้องประเมินผลกระทบก่อนปล่อย: CR-03 ต้องมีข้อเท็จจริงภายนอก (creds/infra) ที่ยังไม่พร้อม — ดู §4.3 Class B

---

## 3. Requests

### CR-03 · เพิ่ม F009 — ส่งสลิปเข้า LINE → ยืนยันบนเว็บ → ซิงค์ Google Drive

| Item | Value |
|---|---|
| Document | REQ-WPN-001 (ฟีเจอร์ใหม่ F009) · PRD-WPN-001 ข้อ 7 |
| Closes | คำขอเพิ่มขอบเขตจากเจ้าของ 2026-11-07 |
| Severity | Medium (ฟีเจอร์เสริม นอก must-have F001–F004) |

**คำขอ (ตามที่เจ้าของเลือก 2026-11-07)**

| ประเด็น | การตัดสิน |
|---|---|
| ช่องทางรับสลิป | **LINE OA + Messaging API** (webhook) — คนละตัวกับ LINE Login (F008) |
| บันทึกเป็นอะไร | **เก็บรูปสลิป + ผู้ใช้กรอก/ยืนยันยอด·วันที่เอง** (MVP — ยังไม่ทำ OCR) |
| Google Drive ซิงค์อะไร | **ทั้งรูปสลิป + สเปรดชีตรายการ (Sheets)** |
| เก็บลง Drive ของใคร | **Drive ของผู้ใช้แต่ละคน ผ่าน OAuth** (scope `drive.file` + `spreadsheets`) |

**Proposed change**

| | Text |
|---|---|
| **Current** | ชุดฟีเจอร์ = F001–F008 · ไม่มีช่องทางรับสลิปผ่าน LINE · ไม่มี sync ขึ้น Drive/Sheets ของผู้ใช้ |
| **Proposed** | เพิ่ม **F009 Slip-to-Ledger**: ผู้ใช้ส่งรูปสลิปเข้า LINE OA → ระบบรับผ่าน Messaging API webhook (ตรวจ `x-line-signature`) → พักไว้ใน staging → ผู้ใช้เปิดเว็บ(login อยู่) ยืนยัน/กรอกยอด·วันที่·หมวด → อัปรูปขึ้น Google Drive ของผู้ใช้ (`/WealthPlaner/slips/`) + append แถวใน Google Sheets ของผู้ใช้ แล้วนำออกจาก staging |

**Impact** — ดู §4

---

## 4. Combined impact and recommended order

### 4.1 Combined impact

| Dimension | Effect |
|---|---|
| Scope | +1 ฟีเจอร์ (F009) · เพิ่มพื้นผิว integration: LINE Messaging API, Google Drive/Sheets API, staging store |
| Effort | webhook handler + signature verify · โมดูลซิงค์ Drive/Sheets · หน้าเว็บ "สลิปรอยืนยัน" · OAuth scope เพิ่ม |
| Metrics | ไม่กระทบ metric เดิม (NFR-01 2 วินาที ฯลฯ) — F009 เป็น flow แยก |
| Schedule | ยังไม่มี deadline (solo) — เป็นงานรอบถัดไป ต่อจาก MVP F001–F004 ที่ผ่าน G4 แล้ว |

### 4.2 สถาปัตยกรรมที่ตัดสิน (decide-and-log — เจ้าของ overrule ได้)

| ประเด็น | การตัดสิน | เหตุผล |
|---|---|---|
| ที่พักสลิปก่อนยืนยัน (staging) | **Cloudflare KV (index) + R2 (ไฟล์รูป)** | webhook (เซิร์ฟเวอร์) กับการเขียน Drive (token ผู้ใช้ในเบราว์เซอร์) เกิดคนละจังหวะ/คนละ auth context → ต้องมีที่พัก · deploy อยู่ Cloudflare Pages อยู่แล้ว ไม่ต้องเพิ่ม DB · ทางเลือก DB (Supabase) ไม่เสนอ เพราะเจ้าของเคยเลือกไม่ผูก |

### 4.3 ของที่ยังไม่พร้อม (Class B — เจ้าของต้องจัดให้ก่อน F009 ทำงานจริง)

| รายการ | ทำไมหยุด |
|---|---|
| LINE OA + Messaging channel (token/secret) | รับสลิปไม่ได้จนกว่าจะมี channel + ตั้ง webhook URL |
| Google Cloud OAuth: scope `drive.file`+`spreadsheets` + consent screen/verification | เขียน Drive/Sheets ของผู้ใช้ไม่ได้จนกว่า scope ผ่าน |
| Cloudflare KV/R2 namespace + binding | ไม่มีที่พักสลิปก่อนยืนยัน |
| Deploy เว็บจริง (public URL) | LINE ยิง webhook เข้า endpoint สาธารณะเท่านั้น |

### 4.4 Recommended order

| # | งาน | ตำแหน่งนี้เพราะ |
|---|---|---|
| 1 | เพิ่ม F009 + AC ลง REQ-WPN-001 (ฉบับนี้) | ตรึงเกณฑ์ยอมรับก่อน build |
| 2 | Scaffold ส่วนบริสุทธิ์/เทสต์ได้ (data model, Sheets mapping, webhook skeleton, review UI) — creds เป็น stub | เดินหน้าได้โดยไม่ติด Class B |
| 3 | เจ้าของจัด LINE OA + Google OAuth + Cloudflare KV/R2 แล้วต่อสายจริง | ปลดบล็อก Class B |

## 5. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-07 | All | First issue — เปิดคำขอเพิ่ม F009 Slip-to-Ledger ตามคำขอเจ้าของ · ตัดสิน staging = Cloudflare KV+R2 · ระบุ Class B 4 รายการ | system-analyst | เจ้าของโครงการ (solo) |
