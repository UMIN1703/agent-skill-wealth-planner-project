#!/usr/bin/env bash
# ถอน Rich Menu ทั้งหมดออกจาก LINE OA (ยกเลิกเมนูหลัก + ลบทุก rich menu)
set -euo pipefail
cd "$(dirname "$0")/../.."

TOKEN=$(grep -E '^LINE_CHANNEL_ACCESS_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d ' \r')
[ -n "$TOKEN" ] || { echo "❌ ไม่พบ LINE_CHANNEL_ACCESS_TOKEN"; exit 1; }

echo "ยกเลิกเมนูหลัก ..."
curl -s -o /dev/null -X DELETE https://api.line.me/v2/bot/user/all/richmenu -H "Authorization: Bearer $TOKEN" || true

echo "ลบ rich menu ทั้งหมด ..."
IDS=$(curl -s https://api.line.me/v2/bot/richmenu/list -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json;print(' '.join(m['richMenuId'] for m in json.load(sys.stdin).get('richmenus',[])))")
for id in $IDS; do
  curl -s -o /dev/null -X DELETE "https://api.line.me/v2/bot/richmenu/$id" -H "Authorization: Bearer $TOKEN"
  echo "   ลบ $id"
done
echo "✅ ถอน Rich Menu เรียบร้อย"
