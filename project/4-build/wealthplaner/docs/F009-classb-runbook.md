# F009 Slip-to-Ledger — Class B provisioning runbook

ตาม **CR-WPN-002**. โค้ด integration เขียนไว้แล้ว (ตรวจลายเซ็น, ต่อ Drive/Sheets, ขอ scope, endpoint ยืนยัน) — ไฟล์นี้คือ **สิ่งที่เจ้าของต้องจัดเอง** เพราะเป็นบัญชี/คีย์จริงที่ agent สร้างแทนไม่ได้ ทำครบแล้วฟีเจอร์จะทำงาน end-to-end

> สถานะตอนนี้: `GET /api/line/webhook` ตอบ `{"configured":false}` · `POST` ตอบ 503 · หน้า `/slips` แสดงโครงจริง + ฟอร์มเดโม — ทั้งหมด**ตั้งใจ**ให้ตรงไปตรงมา ยังไม่เชื่อมของจริง

---

## 1) LINE Messaging API channel

> ⚠️ **ต้องสร้างใน LINE provider เดียวกับ LINE Login (F008)** มิฉะนั้น `userId` จะไม่ตรงกัน → จับคู่บัญชีไม่ได้ (REQ F009 AC-E03 · open_question ที่บันทึกไว้)

1. [developers.line.biz](https://developers.line.biz) → เปิด **provider เดิมที่ใช้ LINE Login**
2. **Create a Messaging API channel** (คนละ channel กับ LINE Login)
3. คัดลอก **Channel secret** → env `LINE_CHANNEL_SECRET`
4. **Issue** a long-lived **Channel access token** → env `LINE_CHANNEL_ACCESS_TOKEN`
5. **Messaging API → Webhook URL** = `https://<โดเมนที่ deploy>/api/line/webhook` · เปิด **Use webhook** · ปิด **Auto-reply/Greeting** (ไม่ให้ชนกับระบบ)
6. กด **Verify** — ควรได้ 200 (หลังตั้ง secret + deploy แล้ว)

## 2) Google OAuth — เพิ่ม scope Drive/Sheets

โค้ด (`src/auth.ts`) ขอ scope `drive.file` + `spreadsheets` ให้อัตโนมัติแล้ว เจ้าของต้องเปิดฝั่ง Google:

1. [Google Cloud Console](https://console.cloud.google.com) → โปรเจกต์เดิมของ WealthPlaner
2. **APIs & Services → Enable**: **Google Drive API** และ **Google Sheets API**
3. **OAuth consent screen → Scopes → Add**: `.../auth/drive.file` (ไม่ sensitive) และ `.../auth/spreadsheets` (**sensitive** — ใช้กับ test users ได้เลย, ถ้าจะ public ต้องผ่าน verification)
4. เพิ่มตัวเองใน **Test users**
5. **ผู้ใช้ต้อง login ใหม่** เพื่อกด consent scope ใหม่ (`prompt: 'consent'` บังคับให้ถาม) — มิฉะนั้น token เดิมจะไม่มีสิทธิ์ Drive → endpoint ยืนยันตอบ 403 (AC-05)

## 3) Cloudflare KV + R2 (staging) + env + deploy

```bash
# ที่โฟลเดอร์ project/4-build/wealthplaner
npx wrangler kv namespace create SLIP_INDEX     # → คัดลอก id ไปใส่ wrangler.toml [[kv_namespaces]].id
npx wrangler r2 bucket create wpn-slips         # ชื่อ bucket ตรงกับ wrangler.toml

# ตั้ง secrets/vars บน Pages (หรือใน dashboard → Settings → Environment variables)
npx wrangler pages secret put LINE_CHANNEL_SECRET
npx wrangler pages secret put LINE_CHANNEL_ACCESS_TOKEN
# var ธรรมดา: SLIP_STAGING=1

npm run deploy    # next-on-pages build + wrangler pages deploy
```

## 4) งานต่อสายที่เหลือฝั่ง dev (ทำได้เมื่อ binding มีจริง)

โค้ดส่วนที่ต้องมี KV/R2 binding ตอน runtime ยังเป็น TODO (ตรวจไม่ได้จนกว่าจะมี binding) — จุดที่ต้องเติม:

| ไฟล์ | TODO |
|---|---|
| `app/api/line/webhook/route.ts` | ดาวน์โหลดรูปจาก LINE (`/v2/bot/message/{id}/content` ด้วย access token) → เขียน R2 (`SLIP_FILES`) + index ลง KV (`SLIP_INDEX`) ผูกกับ `event.source.userId` → `reply` ยืนยันรับ |
| `src/lib/slipStore.ts` | `listPendingSlips` / `getStagedSlipMedia` / `removePendingSlip` อ่าน-เขียน KV/R2 ผ่าน `getRequestContext().env` ของ `@cloudflare/next-on-pages` |

ส่วน **ต่อจากนั้นทำงานแล้ว** (เขียนเสร็จ + เทสต์/typecheck ผ่าน): ตรวจ `x-line-signature`, แยก event รูป, validate, อัป Drive, append Sheets, endpoint `/api/slips/confirm`, ฟอร์มยืนยัน

---

## เช็กเมื่อเสร็จ (end-to-end)
1. ส่งรูปสลิปเข้าแชต LINE OA → ได้ข้อความตอบรับ + ลิงก์
2. เปิดเว็บ (login Google เพื่อให้มีสิทธิ์ Drive) → หน้า `/slips` เห็นสลิปค้าง
3. กรอกยอด/วันที่/หมวด → ยืนยัน → เห็นไฟล์ใน Google Drive `/WealthPlaner/slips/` + แถวใน Sheet `WealthPlaner Ledger`
