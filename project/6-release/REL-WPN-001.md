# บันทึกการปล่อยของและแผนถอยกลับ — WealthPlaner · Cloudflare Pages (preview)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | REL-WPN-001 |
| ฉบับแก้ไขครั้งที่ | 04 |
| วันที่มีผลบังคับใช้ | 2026-11-24 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | QAR-WPN-003 rev 00 · RVW-WPN-002 rev 00 · CR-WPN-011 · docs/deploy-cloudflare.md |
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

4.4 สิ่งที่ถอยกลับไม่ได้ — ไม่มี · migration รอบ CR-WPN-010/011 (`holdings.updated_at`, ตาราง `portfolio_snapshots`) เป็น **additive ล้วน** (เพิ่มคอลัมน์/ตาราง ไม่ลบ/ไม่แก้ของเดิม) → บิลด์เก่าเพิกเฉยได้ ⇒ rollback โค้ดไป deployment ก่อนหน้าปลอดภัย **ไม่ต้อง down-migration** · โค้ด edge rollback ได้เต็มด้วย 1 คลิกใน Cloudflare

---

## 5. แผนเฝ้าดู

| สัญญาณ | เกณฑ์ที่ถือว่าต้องถอยกลับ | ใครเฝ้า | นานเท่าไหร่ |
|---|---|---|---|
| หน้า `/`, `/assets`, `/activity` โหลด | ขึ้น 5xx หรือจอขาว | เจ้าของ | 15 นาทีแรกหลัง deploy |
| Cloudflare Pages build/Functions log | error ซ้ำ ๆ ใน Functions | เจ้าของ | 15 นาทีแรก |

(preview = ความเสี่ยงต่ำ ไม่มีผู้ใช้จริง · เฝ้าสั้น ๆ พอ)

---

## 6. สิ่งที่เกิดขึ้นจริงหลังปล่อย

Deploy สำเร็จ 2026-11-21/22 · **Live: https://preview.wealthplaner.pages.dev** · ทุกหน้าเรนเดอร์ (/ /assets /activity /login /rebalance /add /import ok · /profile 307 redirect ถูกต้อง)

| รายการ | ค่า |
|---|---|
| ผลลัพธ์ | มีปัญหาแต่แก้ได้ ไม่ต้องถอย |
| เวลาที่ใช้กว่าจะรู้ว่ามีปัญหา | ทันที (smoke test curl หลัง deploy แรก เจอ `/` คืน "Not Found") |
| เวลาที่ใช้กว่าจะกลับมาปกติ | ~ภายในรอบ deploy เดียว (upgrade + rebuild + redeploy) |
| สาเหตุ | (1) secrets ยังไม่ตั้ง → /assets /activity error ก่อน (ตั้ง 9 secrets + AUTH_TRUST_HOST ผ่าน) · (2) **บั๊ก next-on-pages 1.13.10 แมป index route** `/` → serve `_next/static/not-found.txt` (หน้าแรกไปอยู่ `/index`) |
| วิธีแก้ | ตั้ง secrets ผ่าน `wrangler pages secret put` · **upgrade @cloudflare/next-on-pages 1.13.10 → 1.13.16** → `/` เรนเดอร์ปกติ |
| สิ่งที่จะทำต่างไปครั้งหน้า | pin next-on-pages ≥1.13.16 · ตั้ง secrets ก่อน smoke test · (ก่อน production: ตั้ง OAuth/LINE console + เปิด KV/R2 สำหรับ F009) |

### 6.1 รอบ CR-WPN-011 (2026-11-24)

| รายการ | ค่า |
|---|---|
| ผลลัพธ์ | สำเร็จ ไม่ต้องถอย · deploy ต่อเนื่องหลายรอบ (โลโก้ dfb33cf5 · rename 29b51fbb · auth 41a0c2f1 · กราฟ e73419d1) ทุกรอบ build next-on-pages ผ่าน |
| migration | รัน 2 ตัวใน Supabase แล้ว ยืนยัน **HTTP 200** ผ่าน PostgREST (holdings.updated_at + portfolio_snapshots) → ปุ่มแก้ไขเซฟได้ + กราฟเก็บประวัติได้ |
| เฝ้าดู | หน้า `/` โหลด + กราฟเรนเดอร์ · recordSnapshot upsert ไม่ throw แม้ตารางเพิ่งสร้าง (best-effort) · ยืนยันด้วยตา (เจ้าของ) = เรียบร้อย |
| ที่ต้องจำครั้งหน้า | DRY `compact()` (RVW minor) · snapshot อาจย้ายเป็น fire-and-forget ลด latency หน้าแรก |

---

## 7. ประวัติการแก้ไข

| ฉบับที่ | วันที่ | ข้อที่แก้ | สาระสำคัญ | เหตุผล |
|---|---|---|---|---|
| 00 | 2026-11-21 | All | release record แรก · GO WITH CONDITIONS สำหรับ preview Cloudflare Pages (commit 0c6640a) · build ผ่าน · ข้อแม้ = provisioning + ซ้อม rollback + ยังไม่ promote prod จนตั้ง OAuth/LINE console | ฉบับแรก |
| 01 | 2026-11-22 | §6 | **Deploy สำเร็จ — live ที่ preview.wealthplaner.pages.dev** · แก้ 2 ปัญหา: ตั้ง 9 secrets + AUTH_TRUST_HOST, และ upgrade next-on-pages 1.13.10→1.13.16 (บั๊ก index route `/`→404) · ปิด KV/R2 binding (free, ไม่ใช้บัตร) · middleware matcher แคบลง | บันทึกผลจริงหลัง deploy |
| 02 | 2026-11-22 | §1,§6 | **Production live ที่ https://wealthplaner.pages.dev (auth ทำงาน)** · แก้ "Server error / configuration": secrets ไปอยู่ production env ซึ่งผูกกับ **production branch = `feature/F008-login-sso`** (ตั้งตอน `npm run deploy` ครั้งแรก) — ต้อง deploy branch นั้น (ใช้ `npm run deploy` จาก branch ปัจจุบัน) ไม่ใช่ --branch preview/main · เพิ่ม `trustHost:true` ใน auth.ts · ลบ endpoint /api/envcheck ชั่วคราว · re-point rich menu → wealthplaner.pages.dev | แก้ปัญหา auth จริง |
| 03 | 2026-11-23 | §3 | deploy งาน CR-WPN-010 ขึ้น production (commit 0e63261): แก้ไข/ลบสินทรัพย์, หน้าสินทรัพย์ accordion/กล่องแยก, F009 KV-free (ปิด R2), Option B (สลิปไม่พึ่ง Google), ส่งออกรายงาน Google Sheet · LINE login/สลิป + Google export + rich menu ใช้งานจริงบนมือถือ · KV SLIP_INDEX bound · ยังค้าง: รัน migration updated_at (ให้ปุ่มแก้ไขเซฟได้) | ส่งมอบฟีเจอร์ CR-010 |
| 04 | 2026-11-24 | §1,§4.4,§6 | **ปล่อย CR-WPN-011 ขึ้น production (deploy e73419d1, code commit 9451142)** — กราฟการเติบโตของพอร์ต (ไฮบริด), เปลี่ยนชื่อแบรนด์ WealthPlanner, โลโก้ login ใหม่, ลดหน้าเตือน Google (prompt consent ครั้งแรก) · **GO** (gate: RVW-WPN-002 APPROVE · QAR-WPN-003 PASS WITH ADVISORIES) · **ปิดเงื่อนไข migration ทั้งหมด**: รัน `holdings.updated_at` + `portfolio_snapshots` ใน Supabase แล้ว ยืนยัน HTTP 200 (ไม่ค้างแล้ว) · rollback-safe เพราะ migration additive (§4.4) · docs commits ff8abf8/475851b ไม่แตะโค้ด (ไม่ต้อง redeploy) | ส่งมอบฟีเจอร์ CR-011 + ปิดหนี้ migration |
