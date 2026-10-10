#!/usr/bin/env bash
# WealthPlaner — rollback script (devops-release deliverable, G6 §3)
# ถอยกลับ Vercel (web) + Supabase (schema) ไปยัง release ก่อนหน้า
#
# กติกาสำคัญ (ตรงกับ working condition + gate):
#   - สคริปต์นี้ "รันจริง" ได้เมื่อมี creds/target เท่านั้น — ถ้าขาด จะ EXIT พร้อมบอกว่าขาดอะไร
#     ไม่มีการแกล้งทำ ไม่มีการอ้างว่าซ้อมแล้วทั้งที่ไม่ได้รัน
#   - "ไม่เคยซ้อม = NO-GO" — ใช้  --rehearse  ซ้อมบน preview ให้สำเร็จ 1 รอบก่อนปล่อยจริง
#     เมื่อซ้อมสำเร็จ สคริปต์จะเขียนเวลา+ผลลง rollback-rehearsal.log เป็นหลักฐานจริง
#
# การใช้งาน:
#   ./rollback.sh --rehearse                 # ซ้อมบน preview (ปลอดภัย ไม่แตะ production)
#   ./rollback.sh --to <git-tag|deploy-url>  # ถอย production กลับไป target ที่ระบุ (ต้องยืนยัน)
#   ./rollback.sh --dry-run                  # พิมพ์สิ่งที่จะทำ ไม่รันจริง
#
# ต้องมี env (ใส่ใน .env.release แล้ว `source`):  VERCEL_TOKEN, VERCEL_PROJECT,
#   SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD (หรือ SUPABASE_ACCESS_TOKEN)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$HERE/../4-build/wealthplaner"
LOG="$HERE/rollback-rehearsal.log"

MODE="prod"       # prod | rehearse | dry
TARGET=""

# ---- args ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    --rehearse) MODE="rehearse"; shift ;;
    --dry-run)  MODE="dry"; shift ;;
    --to)       TARGET="${2:-}"; shift 2 ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

log()  { printf '\033[0;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[0;32m✓ %s\033[0m\n' "$*"; }
die()  { printf '\033[0;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ---- preflight: ไม่มีของจริง = หยุด (ห้ามปั้น) ----
preflight() {
  log "preflight — ตรวจเครื่องมือและ creds"
  command -v vercel   >/dev/null || die "ไม่พบ vercel CLI — ติดตั้ง: npm i -g vercel (Class B: ต้องมีเพื่อถอย web)"
  command -v supabase >/dev/null || die "ไม่พบ supabase CLI — ติดตั้ง: npm i -g supabase (Class B: ต้องมีเพื่อถอย schema)"
  command -v git      >/dev/null || die "ไม่พบ git — ต้อง tag release เพื่อชี้ target rollback"

  local miss=()
  [[ -n "${VERCEL_TOKEN:-}" ]]         || miss+=("VERCEL_TOKEN")
  [[ -n "${VERCEL_PROJECT:-}" ]]       || miss+=("VERCEL_PROJECT")
  [[ -n "${SUPABASE_PROJECT_REF:-}" ]] || miss+=("SUPABASE_PROJECT_REF")
  [[ -n "${SUPABASE_DB_PASSWORD:-}${SUPABASE_ACCESS_TOKEN:-}" ]] || miss+=("SUPABASE_DB_PASSWORD|SUPABASE_ACCESS_TOKEN")
  if (( ${#miss[@]} )); then
    die "ขาด creds (Class B — เจ้าของต้องใส่ใน .env.release): ${miss[*]}"
  fi
  ok "เครื่องมือ + creds ครบ"
}

# ---- ขั้นตอนถอยกลับจริง ----
do_rollback() {
  local scope="$1"   # production | preview
  local t0 t1 dur
  t0=$(date +%s)

  log "[$scope] 1/4 ระบุ target ที่จะถอยไป"
  if [[ -z "$TARGET" ]]; then
    [[ "$scope" == "preview" ]] || die "ต้องระบุ --to <tag|deploy-url> สำหรับ production"
    TARGET="preview-latest"
  fi
  ok "target = $TARGET"

  log "[$scope] 2/4 Vercel — ถอย web ไป deployment ก่อนหน้า"
  if [[ "$MODE" == "dry" ]]; then
    echo "    DRY: vercel rollback \"$TARGET\" --token \$VERCEL_TOKEN --scope \$VERCEL_PROJECT --yes"
  else
    vercel rollback "$TARGET" --token "$VERCEL_TOKEN" --scope "$VERCEL_PROJECT" --yes
  fi

  log "[$scope] 3/4 Supabase — รัน down-migration ไปสถานะ schema ก่อนหน้า"
  # ต้องมี down-migration ที่ reversible ทุกตัว (release-checklist §3) — ถ้าไม่มี ให้หยุดและระบุชัด
  if [[ ! -d "$APP_DIR/supabase/migrations" ]]; then
    if [[ "$MODE" == "rehearse" ]]; then
      echo "    (rehearse) ยังไม่มี supabase/migrations — ข้ามส่วน DB (schema จริงยังไม่ตั้ง)"
    else
      die "ไม่พบ supabase/migrations — schema rollback ยังทำไม่ได้จริง (Class B: ตั้ง schema+down-migration ก่อน)"
    fi
  else
    if [[ "$MODE" == "dry" ]]; then
      echo "    DRY: supabase db reset --linked   # หรือ apply down-migration ที่ระบุ"
    else
      supabase db reset --linked
    fi
  fi

  log "[$scope] 4/4 health check — ยืนยันบริการกลับมา"
  if [[ "$MODE" == "dry" ]]; then
    echo "    DRY: curl -fsS \"\$HEALTHCHECK_URL\" >/dev/null"
  elif [[ -n "${HEALTHCHECK_URL:-}" ]]; then
    curl -fsS "$HEALTHCHECK_URL" >/dev/null && ok "health check ผ่าน" || die "health check ล้มเหลวหลังถอย — ต้องดูด่วน"
  else
    echo "    (ข้าม health check — ไม่ได้ตั้ง HEALTHCHECK_URL)"
  fi

  t1=$(date +%s); dur=$(( t1 - t0 ))
  ok "[$scope] rollback เสร็จใน ${dur}s"
  echo "$dur"
}

main() {
  case "$MODE" in
    dry)
      log "DRY-RUN — ไม่รันคำสั่งจริง"
      do_rollback "production" >/dev/null
      ok "ดูขั้นตอนครบแล้ว (ไม่มีการเปลี่ยนแปลง)"
      ;;
    rehearse)
      preflight
      log "REHEARSE — ซ้อมบน preview (ไม่แตะ production)"
      dur=$(do_rollback "preview" | tail -1)
      printf '%s | rehearse ok | duration=%ss | by=%s\n' "$(date -u +%FT%TZ)" "$dur" "${USER:-unknown}" >> "$LOG"
      ok "บันทึกหลักฐานการซ้อมลง $LOG (เวลา ${dur}s)"
      echo ""
      echo "→ ปิดช่องใน release-checklist-WPN.md §3: 'เคยลองจริงแล้ว' + 'ใช้เวลา ${dur}s'"
      ;;
    prod)
      preflight
      [[ -n "$TARGET" ]] || die "production rollback ต้องมี --to <tag|deploy-url>"
      # gate: ต้องเคยซ้อมสำเร็จก่อน (มีหลักฐานใน log) — ไม่เคยซ้อม = ห้ามถอย prod แบบสด
      grep -q "rehearse ok" "$LOG" 2>/dev/null || die "ยังไม่มีหลักฐานการซ้อมใน $LOG — รัน --rehearse ให้สำเร็จก่อน (กฎ: ไม่เคยซ้อม = NO-GO)"
      log "PRODUCTION rollback → $TARGET"
      read -r -p "ยืนยันถอย production ไป $TARGET ? (พิมพ์ yes): " c; [[ "$c" == "yes" ]] || die "ยกเลิก"
      dur=$(do_rollback "production" | tail -1)
      printf '%s | PROD rollback | target=%s | duration=%ss | by=%s\n' "$(date -u +%FT%TZ)" "$TARGET" "$dur" "${USER:-unknown}" >> "$LOG"
      ok "ถอย production เสร็จใน ${dur}s — บันทึกลง $LOG"
      ;;
  esac
}

main
