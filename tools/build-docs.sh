#!/usr/bin/env bash
# สร้างเอกสารควบคุมในรูปแบบ PDF และ DOCX จากไฟล์ต้นฉบับ .md ในโฟลเดอร์ project/
#
# วิธีใช้
#     bash tools/build-docs.sh              สร้างทุกฉบับที่มีหัวตารางควบคุมเอกสาร
#     bash tools/build-docs.sh SRS-BKG-001  สร้างเฉพาะฉบับที่ระบุ
#
# ต้องติดตั้งก่อน
#     brew install pandoc
#     npm install --prefix tools @mermaid-js/mermaid-cli
#
# บล็อก mermaid ในไฟล์ .md จะถูกเรนเดอร์เป็นรูปในโฟลเดอร์ project/assets/ ก่อนส่งให้ pandoc
# มิฉะนั้นจะปรากฏเป็นรหัสดิบในไฟล์ที่ส่งมอบ ซึ่งอ่านไม่ได้

set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC_DIR="project"

command -v pandoc >/dev/null || { echo "ไม่พบ pandoc ติดตั้งด้วย  brew install pandoc"; exit 1; }
[ -x "$CHROME" ] || { echo "ไม่พบ Chrome ที่ $CHROME"; exit 1; }
[ -x tools/node_modules/.bin/mmdc ] || {
  echo "ไม่พบ mmdc ติดตั้งด้วย  npm install --prefix tools @mermaid-js/mermaid-cli"; exit 1; }
[ -d "$SRC_DIR" ] || { echo "ไม่พบโฟลเดอร์ $SRC_DIR  เริ่มโครงการด้วยคำสั่ง /kickoff ก่อน"; exit 1; }

# หาไฟล์ต้นฉบับจากรหัสเอกสาร — เอกสารกระจายอยู่ในโฟลเดอร์ย่อยตามระยะ
find_doc() {
  find "$SRC_DIR" -name "$1.md" -not -path '*/assets/*' -print -quit
}

if [ $# -gt 0 ]; then
  DOCS=("$@")
else
  # ค้นหาไฟล์ที่มีหัวตารางควบคุมเอกสาร คือบรรทัดรูปแบบ  | รหัสเอกสาร | ABC-XXX-001 |
  # รูปแบบนี้แยกเอกสารควบคุมออกจากไฟล์อื่นที่บังเอิญมีคำว่ารหัสเอกสารอยู่ในตาราง
  DOCS=()
  while IFS= read -r F; do DOCS+=("$(basename "$F" .md)"); done < <(
    grep -rlE '^\| รหัสเอกสาร \| [A-Z]{2,4}-[A-Z]+-[0-9]+ \|' "$SRC_DIR" --include='*.md' 2>/dev/null | sort || true
  )
fi

[ ${#DOCS[@]} -gt 0 ] || { echo "ไม่พบเอกสารที่จะสร้างในโฟลเดอร์ $SRC_DIR"; exit 0; }

mkdir -p docs "$SRC_DIR/assets"

for D in "${DOCS[@]}"; do
  SRC=$(find_doc "$D")
  [ -n "$SRC" ] || { echo "ข้าม $D เนื่องจากไม่พบไฟล์ต้นฉบับใน $SRC_DIR"; continue; }

  echo "$D"

  if grep -q 'XXX' <<<"$D"; then
    echo "  ข้าม  รหัสเอกสารยังเป็น XXX แปลว่ายังไม่ได้แทนรหัสโครงการ"
    continue
  fi

  # ขั้นที่ 1  เรนเดอร์ผัง mermaid เป็นรูป แล้วได้ไฟล์ .md ที่อ้างถึงรูปแทน
  python3 tools/render-mermaid.py "$SRC" "/tmp/$D.render.md"

  # ขั้นที่ 2  PDF สร้างผ่าน Chrome เนื่องจากรองรับการตัดคำและการวางสระภาษาไทยได้ถูกต้อง
  pandoc "/tmp/$D.render.md" -f gfm -t html5 -s --embed-resources \
    --resource-path=".:$PWD" --variable pagetitle="$D" \
    -c docs/print-th.css -o "/tmp/$D.html"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=12000 --print-to-pdf="docs/$D.pdf" "file:///tmp/$D.html" 2>/dev/null

  # ขั้นที่ 3  DOCX ฝังรูปเดียวกัน
  pandoc "/tmp/$D.render.md" -f gfm --resource-path=".:$PWD" -o "docs/$D.docx"

  REV=$(grep -m1 'ฉบับแก้ไขครั้งที่ |' "$SRC" | sed 's/.*| \([0-9]*\) |.*/\1/')
  echo "  ฉบับแก้ไขครั้งที่ ${REV:-ไม่ระบุ}  สร้าง PDF และ DOCX แล้ว"
done

echo
echo "เอกสารทั้งหมดอยู่ในโฟลเดอร์ docs  รูปผังอยู่ในโฟลเดอร์ $SRC_DIR/assets"
echo "แก้ไขที่ไฟล์ .md เท่านั้น ไฟล์ .pdf และ .docx ถูกเขียนทับทุกครั้งที่สร้างใหม่"
