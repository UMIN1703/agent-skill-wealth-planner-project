#!/usr/bin/env bash
# ติดตั้ง Rich Menu ของ WealthPlaner ลง LINE OA (สร้าง object → อัปรูป → ตั้งเป็นเมนูหลัก)
# ต้องมี: scripts/richmenu/richmenu.png (รัน make-image.py ก่อน) + LINE_CHANNEL_ACCESS_TOKEN ใน .env.local
set -euo pipefail
cd "$(dirname "$0")/../.."   # → wealthplaner/

ENV=.env.local
TOKEN=$( { grep -E '^LINE_CHANNEL_ACCESS_TOKEN=' "$ENV" || true; } | head -1 | cut -d= -f2- | tr -d ' \r')
BASE=$( { grep -E '^AUTH_URL=' "$ENV" 2>/dev/null || true; } | head -1 | cut -d= -f2- | tr -d ' \r')
BASE=${BASE:-http://localhost:3000}
IMG=scripts/richmenu/richmenu.png

[ -n "$TOKEN" ] || { echo "❌ ไม่พบ LINE_CHANNEL_ACCESS_TOKEN ใน $ENV"; exit 1; }
[ -f "$IMG" ]   || { echo "❌ ไม่พบ $IMG — รัน: python3 scripts/richmenu/make-image.py ก่อน"; exit 1; }
echo "ฐานลิงก์ (AUTH_URL) = $BASE"

# 4 ช่อง (2500x1686, 2x2 → 1250x843 ต่อช่อง) — ต้องตรงกับ make-image.py
read -r -d '' BODY <<JSON || true
{
  "size": { "width": 2500, "height": 1686 },
  "selected": true,
  "name": "wealthplaner-main",
  "chatBarText": "เมนูหลัก",
  "areas": [
    { "bounds": {"x":0,"y":0,"width":1250,"height":843},     "action": {"type":"uri","label":"พอร์ตรวม","uri":"$BASE/"} },
    { "bounds": {"x":1250,"y":0,"width":1250,"height":843},  "action": {"type":"uri","label":"เพิ่มสินทรัพย์","uri":"$BASE/add"} },
    { "bounds": {"x":0,"y":843,"width":1250,"height":843},   "action": {"type":"uri","label":"รายการสลิป","uri":"$BASE/slips"} },
    { "bounds": {"x":1250,"y":843,"width":1250,"height":843},"action": {"type":"uri","label":"ปรับพอร์ต","uri":"$BASE/rebalance"} }
  ]
}
JSON

echo "1) สร้าง rich menu ..."
RESP=$(curl -s -X POST https://api.line.me/v2/bot/richmenu \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$BODY")
RID=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('richMenuId',''))" 2>/dev/null || true)
[ -n "$RID" ] || { echo "❌ สร้างไม่สำเร็จ: $RESP"; exit 1; }
echo "   richMenuId = $RID"

echo "2) อัปโหลดรูป ..."
UP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://api-data.line.me/v2/bot/richmenu/$RID/content" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: image/png" --data-binary "@$IMG")
[ "$UP" = "200" ] || { echo "❌ อัปรูปไม่สำเร็จ (HTTP $UP)"; exit 1; }
echo "   อัปรูป OK"

echo "3) ตั้งเป็นเมนูหลัก (ผู้ใช้ทุกคน) ..."
SET=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://api.line.me/v2/bot/user/all/richmenu/$RID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Length: 0" -d '')
[ "$SET" = "200" ] || { echo "❌ ตั้งเมนูหลักไม่สำเร็จ (HTTP $SET)"; exit 1; }

echo "✅ ติดตั้ง Rich Menu สำเร็จ! เปิดแชต OA แล้วแตะเมนูด้านล่างได้เลย (อาจต้องปิด-เปิดแชต)"
echo "   ถอนเมนู: bash scripts/richmenu/remove.sh"
