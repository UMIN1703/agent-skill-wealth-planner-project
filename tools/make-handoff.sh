#!/usr/bin/env bash
# จัดชุดเอกสารส่งมอบพร้อมแจกจ่าย
#
# วิธีใช้
#     bash tools/make-handoff.sh                    ทุกฉบับที่มีอยู่
#     bash tools/make-handoff.sh SRS ARC DM TST     เฉพาะประเภทที่ระบุ
#
# สร้างเอกสารใหม่ทุกฉบับก่อน แล้วรวบรวม PDF และ DOCX ไว้ในโฟลเดอร์ handoff
# พร้อมสารบัญที่บอกผู้รับว่าควรเริ่มอ่านที่ไหน
#
# สารบัญสร้างจากไฟล์ต้นฉบับจริง ไม่ใช่รายการที่เขียนตายไว้ในสคริปต์
# เอกสารที่เพิ่มเข้ามาใหม่จึงปรากฏในชุดส่งมอบเองโดยไม่ต้องแก้สคริปต์

set -euo pipefail
cd "$(dirname "$0")/.."

SRC_DIR="project"
[ -d "$SRC_DIR" ] || { echo "ไม่พบโฟลเดอร์ $SRC_DIR  เริ่มโครงการด้วยคำสั่ง /kickoff ก่อน"; exit 1; }

echo "สร้างเอกสารทุกฉบับใหม่"
bash tools/build-docs.sh

rm -rf handoff
mkdir -p handoff

# ดึงค่าจากหัวตารางควบคุมของไฟล์ต้นฉบับ
field() { grep -m1 "| $2 |" "$1" | sed 's/.*| \([^|]*\) |[[:space:]]*$/\1/' | xargs; }
title() { grep -m1 '^# ' "$1" | sed 's/^# //'; }

# รวบรวมเอกสารที่มีหัวควบคุม เรียงตามลำดับระยะของโฟลเดอร์
DOCS=()
while IFS= read -r F; do DOCS+=("$F"); done < <(
  grep -rlE '^\| รหัสเอกสาร \| [A-Z]{2,4}-[A-Z]+-[0-9]+ \|' "$SRC_DIR" --include='*.md' 2>/dev/null | sort || true
)
[ ${#DOCS[@]} -gt 0 ] || { echo "ไม่พบเอกสารที่จะส่งมอบ"; exit 0; }

# กรองตามประเภทที่ระบุ ถ้ามี
if [ $# -gt 0 ]; then
  FILTERED=()
  for F in "${DOCS[@]}"; do
    CODE=$(basename "$F" .md)
    for WANT in "$@"; do
      [[ "$CODE" == "$WANT"-* || "$CODE" == "$WANT" ]] && FILTERED+=("$F") && break
    done
  done
  DOCS=("${FILTERED[@]}")
fi

PROJECT=$(grep -m1 '^  name:' "$SRC_DIR/project.yml" 2>/dev/null | sed 's/^  name:[[:space:]]*//' || true)

{
  echo "ชุดเอกสารส่งมอบ${PROJECT:+  โครงการ$PROJECT}"
  echo "สร้างเมื่อ $(date '+%d/%m/%Y %H:%M')"
  echo
  echo "รายการเอกสาร  ทุกฉบับมีทั้งรูปแบบ PDF และ DOCX"
  echo
  for F in "${DOCS[@]}"; do
    CODE=$(basename "$F" .md)
    printf '  %-14s rev %-4s %-8s %s\n' \
      "$CODE" "$(field "$F" 'ฉบับแก้ไขครั้งที่')" "$(field "$F" 'สถานะ')" "$(title "$F")"
    for EXT in pdf docx; do
      [ -f "docs/$CODE.$EXT" ] && cp "docs/$CODE.$EXT" handoff/
    done
  done
  echo
  echo "ข้อควรทราบ"
  echo
  echo "  แก้ไขที่ไฟล์ .md ในโฟลเดอร์ $SRC_DIR เท่านั้น"
  echo "  ไฟล์ในชุดนี้ถูกสร้างใหม่ทุกครั้งที่ออกฉบับแก้ไข การแก้ที่ไฟล์เหล่านี้จะหายไป"
  echo
  echo "  ประเด็นที่ยังไม่ได้ข้อยุติและสมมติฐานที่ยังไม่มีใครยืนยัน"
  echo "  อยู่ในหัวข้อท้ายของเอกสารแต่ละฉบับ  ให้พิจารณาก่อนนำไปใช้ต่อ"
} > handoff/README.txt

echo
echo "ชุดส่งมอบอยู่ในโฟลเดอร์ handoff"
ls -1 handoff | sed 's/^/  /'
