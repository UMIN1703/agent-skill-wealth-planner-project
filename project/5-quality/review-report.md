# Code review report — WealthPlaner build round (G5)

| รายการ | รายละเอียด |
|---|---|
| ผู้รีวิว | code-reviewer (บทบาท) · รอบ /command-center |
| วันที่ | 2026-09-19 |
| ขอบเขต | โค้ดที่เพิ่ม/แก้รอบ build: F001 Add asset, F006 Rebalance, F005 Import + lib/asset.ts + nav/styles |
| Decision | **APPROVE** — ไม่มี BLOCKER/MAJOR ค้าง |

รีวิวเทียบ AC/สเปกจริง (REQ/DSN) และอ่าน diff เหมือนงานคนอื่น — report ก่อน ไม่แก้โค้ดให้

---

## หลักฐานที่ตรวจ
- `npm test` → 33/33 ผ่าน (เพิ่ม 2 เทสต์ใหม่ครอบ `draftToDisplayAsset` + กันข้าม validate)
- `npm run build` → ผ่าน 4 routes (`/`, `/add`, `/import`, `/rebalance`), type-check ผ่าน
- ต่อ logic จริงทุกหน้า (ไม่ mock ตรรกะ): `validateAssetDraft`/`isDuplicate`/`draftToDisplayAsset`, `computeRebalanceGap`, `importAssets`
- design token ล้วน ไม่ hardcode สี/ระยะ · a11y: label ผูก id, `aria-invalid`, `aria-describedby`, focus ring มองเห็น, ▲▼ + คำ (colorblind-safe)

## Findings

### BLOCKER
- ไม่มี

### MAJOR
- ไม่มี

### MINOR (บันทึกเลื่อน — ผู้รีวิว/เจ้าของรับทราบ)
1. **CSV parser (app/import/page.tsx)** — `parseCsv` แยกด้วยคอมมาตรงๆ ไม่รองรับคอมมาในเครื่องหมายคำพูด/ค่าเว้นวรรค
   *เหตุผลที่รับได้รอบนี้:* เป็นทางเข้าแบบ paste ระยะ MVP และมีหมายเหตุกำกับในไฟล์แล้ว · การเชื่อม Google Sheet/.xlsx จริง (พร้อม parser ที่ทนกว่า) เป็นงาน integration ที่ STAGED รอ Class B — ยกไปพร้อมกัน
2. **`draftToDisplayAsset` fxToThb=1 สำหรับ foreign_stock** — สินทรัพย์ต่างสกุลที่เพิ่มมือจะยังไม่แปลง FX
   *เหตุผลที่รับได้รอบนี้:* บันทึกเป็น assumption แล้ว · FX จริงเป็น F004/O1 (Class B) — deferred ตามเอกสาร

### สังเกต (ไม่ใช่ finding)
- `--warn-bg` ใช้ใน `.notice.error`/`.pstatus.stale` โดยมี fallback — ถ้าจะให้เนียนควรเพิ่ม token นี้ใน tokens.css รอบหน้า (cosmetic)

## สรุป
โค้ดรอบ build ทำตาม AC/สเปกของขอบเขต must-have (F001–F004) + ควรมี (F005/F006) ที่ทำเกินให้ · MINOR ทั้งสองผูกกับ Class B ที่เอกสารเลื่อนไว้แล้ว ไม่ใช่หนี้ที่ซ่อน · ไม่มีเหตุให้ REQUEST CHANGES → **ผ่าน G5**
