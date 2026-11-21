# บันทึกการปล่อยของและแผนถอยกลับ — WealthPlaner · Cloudflare Pages (preview)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | REL-WPN-001 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-21 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | QAR-WPN-002 rev 01 · RVW-WPN-001 rev 00 · docs/deploy-cloudflare.md |
| ผู้จัดทำ | devops-release (บทบาท, solo) |

---

## 1. สิ่งที่ปล่อย

1.1 รหัสอ้างอิง — commit `0c6640a` (branch `feature/F008-login-sso`)

1.2 ปลายทาง — Cloudflare Pages (โปรเจกต์ `wealthplaner`, next-on-pages) · **รอบนี้ = preview URL** (ยังไม่ promote production)

1.3 วิธีปล่อย — `npm run deploy` (= `next-on-pages` + `wrangler pages deploy`) หลังทำ provisioning ขั้น A ใน runbook

1.4 เวอร์ชันก่อนหน้าที่ถอยกลับไปได้ — deployment ก่อนหน้าใน Cloudflare Pages (รอบแรกยังไม่มี → rollback = ไม่ promote / ลบ preview)

---

## 2. คำตัดสินและข้อแม้

| รายการ | ผล |
|---|---|
| คำตัดสิน | **GO WITH CONDITIONS** (preview เท่านั้น) |
| ผู้ตัดสิน | เจ้าของโครงการ (solo) |
| วันเวลาที่ปล่อย | 2026-11-21 (เมื่อผู้ใช้รันขั้น A–B) |

Gate inputs: QA = PASS WITH ADVISORIES (ไม่มี BLOCK) · Review = APPROVE · build next-on-pages ผ่าน (22s)

| ข้อแม้ | ผู้รับผิดชอบ | ผล |
|---|---|---|
| preview เท่านั้น — ไม่ promote production จนกว่าตั้ง OAuth/LINE console (ขั้น C) | เจ้าของ | รอ |
| ทำ provisioning: wrangler login + สร้าง KV/R2 + เติม KV id + ตั้ง secrets (ขั้น A) | เจ้าของ | รอ |
| ซ้อม rollback 1 ครั้งหลัง deploy แรก (Cloudflare "Rollback to this deployment") | เจ้าของ | รอ |

---

## 3. สิ่งที่เปลี่ยนไปในสายตาผู้ใช้

- แอปเปิดได้จาก URL สาธารณะ (เดิมเฉพาะ localhost) — หน้าพอร์ต/สินทรัพย์/รายการล่าสุดเรนเดอร์ด้วยข้อมูลเดโม

### สิ่งที่ผู้ใช้ต้องทำ
- ไม่มี (ผู้ใช้ปลายทาง) · ผู้ดูแลทำขั้น A–B ใน runbook

### สิ่งที่ยังพังอยู่และยอมปล่อยไปก่อน (preview)

| เรื่อง | ผลกระทบ | จะแก้เมื่อไหร่ |
|---|---|---|
| login Google/LINE บน preview URL | redirect_uri ยังไม่รองรับ domain preview → ล็อกอินไม่ได้ | ขั้น C (ก่อน production) |
| F009 สลิป (LINE webhook) | webhook ยังชี้ domain เดิม | ขั้น C |
| ราคา/FX live (F003/F004) | ยังไม่มี feed (เฟส 4, รอ O1) | backlog |

---

## 4. แผนถอยกลับ

4.1 ขั้นตอน — Cloudflare Dashboard → Pages → wealthplaner → Deployments → เลือก deployment ก่อนหน้า → **"Rollback to this deployment"** · (preview รอบแรก: แค่ไม่ promote / ลบ preview — prod ไม่ถูกแตะ)

4.2 เวลาที่ใช้โดยประมาณ — ~1 นาที (1 คลิก)

4.3 เคยลองจริงเมื่อไหร่ — **ยังไม่เคย → ข้อแม้: ซ้อม 1 ครั้งหลัง deploy แรก** (preview จึงยอมรับได้เพราะไม่กระทบ production)

4.4 สิ่งที่ถอยกลับไม่ได้ — ไม่มี (ไม่มี DB migration ในรอบนี้ · schema `holdings` ตั้งไว้แล้ว คงที่ · โค้ด edge rollback ได้เต็ม)

---

## 5. แผนเฝ้าดู

| สัญญาณ | เกณฑ์ที่ถือว่าต้องถอยกลับ | ใครเฝ้า | นานเท่าไหร่ |
|---|---|---|---|
| หน้า `/`, `/assets`, `/activity` โหลด | ขึ้น 5xx หรือจอขาว | เจ้าของ | 15 นาทีแรกหลัง deploy |
| Cloudflare Pages build/Functions log | error ซ้ำ ๆ ใน Functions | เจ้าของ | 15 นาทีแรก |

(preview = ความเสี่ยงต่ำ ไม่มีผู้ใช้จริง · เฝ้าสั้น ๆ พอ)

---

## 6. สิ่งที่เกิดขึ้นจริงหลังปล่อย

| รายการ | ค่า |
|---|---|
| ผลลัพธ์ | _กรอกหลัง deploy_ |
| เวลาที่ใช้กว่าจะรู้ว่ามีปัญหา | — |
| เวลาที่ใช้กว่าจะกลับมาปกติ | — |
| สาเหตุ | — |
| สิ่งที่จะทำต่างไปครั้งหน้า | — |

---

## 7. ประวัติการแก้ไข

| ฉบับที่ | วันที่ | ข้อที่แก้ | สาระสำคัญ | เหตุผล |
|---|---|---|---|---|
| 00 | 2026-11-21 | All | release record แรก · GO WITH CONDITIONS สำหรับ preview Cloudflare Pages (commit 0c6640a) · build ผ่าน · ข้อแม้ = provisioning + ซ้อม rollback + ยังไม่ promote prod จนตั้ง OAuth/LINE console | ฉบับแรก |
