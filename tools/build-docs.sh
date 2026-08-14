#!/usr/bin/env bash
# สร้างเอกสารควบคุมในรูปแบบ PDF และ DOCX จากไฟล์ต้นฉบับ .md
#
# วิธีใช้
#     bash tools/build-docs.sh              สร้างจากไฟล์ .md ทุกฉบับที่มีรหัสเอกสารในหัวตาราง
#     bash tools/build-docs.sh SRS-FIT-001  สร้างเฉพาะฉบับที่ระบุ
#
# ต้องติดตั้งก่อน
#     brew install pandoc
#     npm install --prefix tools @mermaid-js/mermaid-cli
#
# บล็อก mermaid ในไฟล์ .md จะถูกเรนเดอร์เป็นรูปในโฟลเดอร์ assets/ ก่อนส่งให้ pandoc
# มิฉะนั้นจะปรากฏเป็นรหัสดิบในไฟล์ที่ส่งมอบ

set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

command -v pandoc >/dev/null || { echo "ไม่พบ pandoc ติดตั้งด้วย brew install pandoc"; exit 1; }
[ -x "$CHROME" ] || { echo "ไม่พบ Chrome ที่ $CHROME"; exit 1; }
[ -x tools/node_modules/.bin/mmdc ] || {
  echo "ไม่พบ mmdc ติดตั้งด้วย  npm install --prefix tools @mermaid-js/mermaid-cli"; exit 1; }

if [ $# -gt 0 ]; then
  DOCS=("$@")
else
  # ค้นหาไฟล์ .md ที่มีหัวตารางควบคุมเอกสาร คือบรรทัดรูปแบบ  | รหัสเอกสาร | XXX-FIT-001 |
  # รูปแบบนี้แยกเอกสารควบคุมออกจากไฟล์อื่นที่บังเอิญมีคำว่ารหัสเอกสารอยู่ในตาราง
  DOCS=()
  while IFS= read -r F; do DOCS+=("$(basename "$F" .md)"); done < <(
    grep -lE '^\| รหัสเอกสาร \| [A-Z]{2,4}-[A-Z]+-[0-9]+ \|' ./*.md 2>/dev/null || true
  )
fi

[ ${#DOCS[@]} -gt 0 ] || { echo "ไม่พบเอกสารที่จะสร้าง"; exit 0; }

mkdir -p docs assets

for D in "${DOCS[@]}"; do
  [ -f "$D.md" ] || { echo "ข้าม $D เนื่องจากไม่พบไฟล์ต้นฉบับ"; continue; }

  echo "$D"

  # ขั้นที่ 1  เรนเดอร์ผัง mermaid เป็นรูป แล้วได้ไฟล์ .md ที่อ้างถึงรูปแทน
  python3 tools/render-mermaid.py "$D.md" "/tmp/$D.render.md"

  # ขั้นที่ 2  PDF สร้างผ่าน Chrome เนื่องจากรองรับการตัดคำและการวางสระภาษาไทยได้ถูกต้อง
  pandoc "/tmp/$D.render.md" -f gfm -t html5 -s --embed-resources \
    --resource-path=".:$PWD" --variable pagetitle="$D" \
    -c docs/print-th.css -o "/tmp/$D.html"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=12000 --print-to-pdf="docs/$D.pdf" "file:///tmp/$D.html" 2>/dev/null

  # ขั้นที่ 3  DOCX ฝังรูปเดียวกัน
  pandoc "/tmp/$D.render.md" -f gfm --resource-path=".:$PWD" -o "docs/$D.docx"

  REV=$(grep -m1 'ฉบับแก้ไขครั้งที่ |' "$D.md" | sed 's/.*| \([0-9]*\) |.*/\1/')
  echo "  ฉบับแก้ไขครั้งที่ ${REV:-ไม่ระบุ}  สร้าง PDF และ DOCX แล้ว"
done

echo
echo "เอกสารทั้งหมดอยู่ในโฟลเดอร์ docs  รูปผังอยู่ในโฟลเดอร์ assets"
