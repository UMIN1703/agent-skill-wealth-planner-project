# Deploy — Cloudflare Pages (next-on-pages)

คู่มือปล่อย WealthPlaner ขึ้น Cloudflare Pages · อ้างอิง REL-WPN-001
ขั้นตอนที่ต้องใช้ **บัญชี Cloudflare ของคุณ** (login/secrets/bindings) — รันเองใน Terminal
(หรือพิมพ์ `! <คำสั่ง>` ในแชตเพื่อให้รันในเซสชันนี้; `wrangler login` ต้องทำใน Terminal จริงเพราะเปิดเบราว์เซอร์)

ทำงานจากโฟลเดอร์: `project/4-build/wealthplaner`

---

## A. ครั้งแรกครั้งเดียว (provisioning)

### 1. ล็อกอิน Cloudflare
```sh
npx wrangler login          # เปิดเบราว์เซอร์ให้ยืนยัน (ทำใน Terminal จริง)
npx wrangler whoami         # เช็กว่าล็อกอินบัญชีถูกตัว
```

### 2. สร้าง KV + R2 — **ข้ามได้สำหรับ preview ฟรี**
preview แค่เรนเดอร์หน้า (เดโม) ไม่แตะ KV/R2 · binding ถูกปิดไว้ใน `wrangler.toml` แล้ว →
**ไม่ต้องทำขั้นนี้ ไม่ต้องผูกบัตร** · ค่อยเปิดกลับตอนทำ F009 บน production:
```sh
npx wrangler kv namespace create SLIP_INDEX   # KV ฟรี ไม่ต้องบัตร
npx wrangler r2 bucket create wpn-slips        # R2 ต้องผูกบัตร (ฟรี tier)
```
> แล้วเอาคอมเมนต์บล็อก `[[kv_namespaces]]` / `[[r2_buckets]]` ใน `wrangler.toml` ออก + ใส่ id จริง

### 3. ตั้ง secrets (ค่าเดียวกับ .env.local — อย่า commit ค่า)
ตั้งผ่าน Dashboard (Pages → wealthplaner → Settings → Environment variables)
**หรือ** CLI หลังสร้างโปรเจกต์แล้ว:
```sh
# จำเป็น (auth + ข้อมูล)
AUTH_SECRET  AUTH_GOOGLE_ID  AUTH_GOOGLE_SECRET  AUTH_LINE_ID  AUTH_LINE_SECRET
SUPABASE_URL  SUPABASE_SERVICE_ROLE_KEY
# F009 (LINE Messaging)
LINE_CHANNEL_SECRET  LINE_CHANNEL_ACCESS_TOKEN
# ให้ NextAuth เชื่อ host ของ Cloudflare
AUTH_TRUST_HOST = true
```
> ตั้ง `AUTH_TRUST_HOST=true` เสมอบน Pages · `AUTH_URL` ไม่ต้องตั้งถ้าใช้ domain เดียว
> (ANTHROPIC_API_KEY ไม่ต้อง — OCR เป็น Tesseract ฝั่ง client แล้ว)

---

## B. Deploy preview (รอบนี้)

```sh
npm run deploy        # = next-on-pages build + wrangler pages deploy
```
ครั้งแรก wrangler จะถามให้สร้าง Pages project ชื่อ `wealthplaner` → ยืนยัน
ได้ **preview URL** กลับมา (เช่น `https://<hash>.wealthplaner.pages.dev`)

**Smoke test บน preview URL:**
- เปิด `/` , `/assets` , `/activity` → ต้องเรนเดอร์ (ข้อมูลเดโม)
- ป้าย ซื้อ/ขาย/สับเปลี่ยน + ซ่อนจำนวนเงิน ทำงาน

> ⚠️ **ยังทำไม่ได้บน preview จนกว่าจะตั้ง console (ขั้น C):** login Google/LINE, F009 สลิป
> (OAuth redirect/webhook ยังชี้ domain เดิม) — ถือเป็น known limitation ของ preview

**ซ้อม rollback 1 ครั้ง:** Dashboard → Pages → wealthplaner → Deployments →
เลือก deployment ก่อนหน้า → "Rollback to this deployment" → ยืนยันว่ากลับได้

---

## C. ก่อน promote เป็น production (รอบถัดไป)

เมื่อได้ production domain (`<project>.pages.dev` หรือ custom domain) ต้องเพิ่ม URL ใน console:

1. **Google OAuth** (console.cloud.google.com → Credentials):
   - Authorized redirect URI: `https://<domain>/api/auth/callback/google`
2. **LINE Login** (developers.line.biz → channel LINE Login):
   - Callback URL: `https://<domain>/api/auth/callback/line`
3. **LINE Messaging** (channel Messaging API):
   - Webhook URL: `https://<domain>/api/line/webhook` → Verify
4. **LINE Rich menu**: ปุ่มที่ชี้ localhost → รัน `scripts/richmenu/setup.sh` ใหม่ด้วย domain จริง

แล้ว `npm run deploy` อีกครั้ง (promote) · ตรวจ login + ส่งสลิป 1 ใบ end-to-end

---

## สรุปสิ่งที่พร้อม/ต้องทำ

| สิ่งของ | สถานะ |
|---|---|
| next-on-pages build | ✅ ผ่าน (22s, edge funcs ครบ) |
| wrangler.toml (KV/R2 binding) | ✅ มี · ต้องเติม KV id จริง (ขั้น A2) |
| wrangler CLI | ✅ v3.114 |
| Cloudflare login + secrets + KV/R2 | ⬜ คุณรัน (ขั้น A) |
| OAuth/LINE console สำหรับ domain จริง | ⬜ ก่อน production (ขั้น C) |
