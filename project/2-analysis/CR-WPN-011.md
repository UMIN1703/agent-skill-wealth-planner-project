# Change request — WealthPlanner · กราฟการเติบโตของพอร์ต + เปลี่ยนชื่อแบรนด์ + โลโก้ login + ลดหน้าเตือน Google

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | CR-WPN-011 |
| ฉบับแก้ไขครั้งที่ | 01 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | REQ-WPN-001 F002/F008 · CR-WPN-010 · REL-WPN-001 · DSN-WPN-001 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Origin | คำขอเจ้าของ 2026-11-24 — ใช้งานจริงบน production แล้วขอเพิ่ม: กราฟดูการเติบโตของพอร์ตทั้งปี, ปรับโลโก้/ชื่อแบรนด์ให้ตรงกับ Google, ลดหน้าเตือน "unverified app" |
| Requested by | เจ้าของโครงการ |
| Approved by | เจ้าของโครงการ (solo) 2026-11-24 |

---

## 1. Why this is a request, not an edit

ขยายขอบเขต F002 (เพิ่มมุมมองการเติบโตตามเวลา + ตารางข้อมูลใหม่ `portfolio_snapshots`) และ F008 (แบรนด์/โลโก้หน้า login + พฤติกรรม OAuth) หลังใช้งานจริงบน production → ออกเป็นคำขอ ไม่ใช่แก้เอกสารต้นทาง

## 2. Request summary

| # | เรื่อง | กระทบ | Class B |
|---|---|---|---|
| CR-25 | กราฟการเติบโตของพอร์ตรายเดือนทั้งปี (ไฮบริด: ต้นทุนสะสม + มูลค่าจริงจาก snapshot) | F002 · DSN | migration `portfolio_snapshots` |
| CR-26 | เปลี่ยนชื่อแบรนด์ที่ผู้ใช้เห็น `WealthPlaner` → `WealthPlanner` (ให้ตรงกับ Google consent) | F008 | ไม่มี |
| CR-27 | โลโก้ใหม่หน้า login (เครื่องหมาย "W") | F008 · DSN | ไม่มี |
| CR-28 | ลดหน้าเตือน Google "unverified app" ให้ขึ้นครั้งแรกครั้งเดียว (ไม่ทุก login) | F008 | ไม่มี |

---

## 3. Requests

### CR-25 · กราฟการเติบโตของพอร์ต (ไฮบริด)
การ์ดใหม่บน `app/page.tsx` ใต้ hero · คอมโพเนนต์ `GrowthChart.tsx` เป็น **inline SVG ล้วน (ไม่พึ่งไลบรารีกราฟ, รันบน edge ได้)**:
- **ต้นทุนสะสม** (พื้นที่) — คำนวณจริงจาก `created_at` ของแต่ละรายการ (รวมต้นทุนของ holding ที่เพิ่ม ณ/ก่อนสิ้นเดือนนั้น) → เห็นได้เต็ม 12 เดือนทันทีจากข้อมูลที่มี
- **มูลค่าจริง** (เส้นเน้น) — จากตารางใหม่ `portfolio_snapshots` ที่หน้าแรก upsert **1 แถว/คน/วัน** (โซนเวลาไทย) ทุกครั้งที่เปิด → เส้นค่อย ๆ สมบูรณ์ตามเวลา **ไม่สร้างข้อมูลย้อนหลังปลอม**
- หัวการ์ด: มูลค่าปัจจุบัน + pill %ผลตอบแทน · รองรับโหมดซ่อนยอด (`<Amount>`) · มีหมายเหตุบอกผู้ใช้ว่าเส้นมูลค่าจะละเอียดขึ้นเมื่อเก็บข้อมูลมากขึ้น
- ตรรกะรวมข้อมูลเป็น pure function `buildGrowthSeries()` ใน `portfolio.ts` (เทสต์ได้) · ชั้นข้อมูล `recordSnapshot`/`listSnapshots`/`todayBangkok` ใน `supabase.ts` (best-effort — ตารางไม่มี/เน็ตล่ม → กราฟ fallback เป็นต้นทุนสะสม+จุดปัจจุบัน ไม่ error)
- **Class B:** migration สร้างตาราง `portfolio_snapshots` (unique `user_key,as_of`) — ไฟล์ `docs/supabase-snapshots.sql` (idempotent)

### CR-26 · เปลี่ยนชื่อแบรนด์ให้ตรงกับ Google
ชื่อที่ผู้ใช้เห็นทุกจุดเปลี่ยนจาก `WealthPlaner` → `WealthPlanner` (สอง n) เพื่อให้ตรงกับ App name ในหน้า OAuth consent ที่เจ้าของตั้งไว้:
หัวหน้า login · `<title>`/metadata · ชื่อ fallback ในโปรไฟล์+ตั้งค่าบัญชี · ถ้อยคำหน้าสลิป · ชื่อไฟล์ชีต **"WealthPlanner Report"** / **"WealthPlanner Ledger"** ·
**หมายเหตุ:** รหัสเอกสาร/โค้ดโครงการยังเป็น `WPN` และชื่อในเอกสารควบคุมยังเขียน "WealthPlaner/WealthPlanner" ปนได้ (ไม่กวาดย้อนในรอบนี้ — เป็นชื่อแสดงผล ไม่ใช่รหัส)

### CR-27 · โลโก้ใหม่หน้า login
แทนไอคอน trending-up (inline SVG) ด้วยเครื่องหมายแบรนด์ตัว **"W"** (`public/brand-w.png`, สีขาว) วางในกรอบสี่เหลี่ยมสีแบรนด์เดิม (`.auth-logo`) — คง CI เดิม

### CR-28 · ลดหน้าเตือน Google "unverified app"
หน้าเตือนเป็นพฤติกรรมของ Google สำหรับแอปสถานะ **Testing** — ลบถาวรไม่ได้หากไม่ส่ง verification (ต้องมี custom domain + privacy policy; เจ้าของเลือกยังไม่ทำ) ·
บรรเทาโดย **เอา `prompt:'consent'` ออกจาก NextAuth Google provider** (`src/auth.ts`) → Google ขอ consent (+หน้าเตือน) เฉพาะ **authorization ครั้งแรกต่อบัญชี** ไม่ขึ้นซ้ำทุก login · `access_type:'offline'` คงไว้ (ได้ refresh token ตอน consent แรก) · token หมดอายุ → re-login ได้ fresh token โดยไม่โชว์หน้าเตือนซ้ำ ·
flow ผูก Google เข้าบัญชี LINE (`googleLink.ts`) **คง `prompt:'consent'`** เพราะต้องได้ refresh token ลง KV (ทำครั้งเดียว)

---

## 4. Combined impact

| Dimension | Effect |
|---|---|
| Scope | เพิ่มมุมมองการเติบโตตามเวลา (F002) + ตารางเวลา-ซีรีส์ใหม่ · แบรนด์/โลโก้/พฤติกรรม OAuth (F008) |
| Effort | สร้างเสร็จแล้ว · tsc สะอาด, เทสต์ 10/10 (portfolio) + 2/2 (sheetExport) ผ่าน · commits `b38df7b` (rename) · `2a86891` (auth prompt) · `9451142` (growth chart) + โลโก้ |
| Class B | migration `portfolio_snapshots` (idempotent, ยืนยัน HTTP 200 แล้ว 2026-11-24) · ไม่มี Class B อื่น |
| Privacy | กราฟไม่ติดป้ายตัวเลขบนแกน → โหมดซ่อนยอดยังมีผล (เห็นแค่รูปทรง) |

## 5. ไม่รวมในรอบนี้ (backlog)
- ~~กราฟ: แตะดูค่าต่อเดือน (tooltip) + ปุ่มสลับปี~~ **ทำแล้ว rev 01** · เก็บ snapshot ถี่กว่ารายวัน/ผ่าน cron · backfill มูลค่าย้อนหลัง (ทำไม่ได้ — ไม่มีราคาย้อนหลัง)
- Google verification เต็มรูปแบบ (custom domain + privacy policy) เพื่อลบหน้าเตือนถาวร
- กวาดเปลี่ยนชื่อ "WealthPlaner" ในเอกสารควบคุม/คอมเมนต์โค้ดให้เป็น "WealthPlanner" ทั้งหมด

## 6. Revision history

| Rev | Date | Clauses | Substance and reason | Author | Approver |
|---|---|---|---|---|---|
| 00 | 2026-11-24 | All | เปิดคำขอ: กราฟการเติบโตของพอร์ต (ไฮบริด ต้นทุนสะสม+snapshot มูลค่าจริง), เปลี่ยนชื่อแบรนด์ WealthPlanner, โลโก้ login ใหม่, ลดหน้าเตือน Google (prompt consent ครั้งแรกครั้งเดียว) · Class B = migration portfolio_snapshots | system-analyst | เจ้าของโครงการ (solo) |
| 01 | 2026-11-24 | §5 (CR-25) | ปิด backlog ของกราฟ: GrowthChart เป็น client — แตะ/ลากดูค่าต่อเดือน (crosshair + tooltip มาสก์ privacy ด้วย Amount) + ปุ่มสลับปี (series ต่อปี ≤6 ปี) · หัวการ์ดโชว์มูลค่าปลายปีที่เลือก, pill %เฉพาะปีปัจจุบัน · ไม่มี Class B · deploy 863270a3 · commit 3ed3484 | system-analyst | เจ้าของโครงการ (solo) |
