#!/usr/bin/env python3
"""สร้างแผนภูมิแกนต์ของโครงการ เป็นไฟล์ SVG และ PNG

ใช้ประกอบเอกสารกำหนดการโครงการ  SCH-XXX-001

วิธีใช้
    python3 tools/gen-gantt.py

แก้ไขกำหนดการที่ส่วน "ข้อมูลกำหนดการ" ด้านล่างเท่านั้น
ส่วนที่เหลือเป็นการวาดภาพ ไม่ต้องแก้

ข้อควรระวังเรื่องขนาด
    ความกว้างภาพต้องไม่เกินประมาณ 950 พิกเซล
    เนื่องจากพื้นที่เนื้อหาบนกระดาษ A4 กว้าง 160 มม. หรือประมาณ 605 พิกเซล
    หากภาพกว้างเกินไป ตัวอักษรจะถูกย่อจนอ่านไม่ออกในเอกสารฉบับพิมพ์
    สคริปต์จะแจ้งเตือนหากขนาดตัวอักษรที่ได้ต่ำกว่า 10 พอยต์
"""

from datetime import date, timedelta
import pathlib
import subprocess
import sys

# ─────────────────────────────────────────────────────────────
# ข้อมูลกำหนดการ · แก้ไขเฉพาะส่วนนี้
# ─────────────────────────────────────────────────────────────

# วันเริ่มโครงการ ต้องเป็นวันจันทร์ และต้องตรงกับที่ระบุใน SCH-XXX-001
START = date(2026, 1, 5)

# ช่วงเวลาที่แสดงบนแกน กำหนดให้กว้างกว่างานจริงเล็กน้อยเพื่อความสวยงาม
AXIS_FROM = date(2025, 12, 29)
AXIS_TO = date(2026, 4, 30)

# กลุ่มงาน · (ชื่อย่อ, รอบเริ่ม, รอบสิ้นสุด) — นับรอบเป็นสัปดาห์จาก START
# ชื่อย่อควรสั้น เนื่องจากพื้นที่ป้ายกว้างเพียง 300 พิกเซล
# ชื่อเต็มอยู่ในตารางโครงสร้างการแบ่งงานของเอกสาร WBS-XXX-001
#
# แทนที่ตัวอย่างข้างล่างด้วยงานจริงของโครงการ
TASKS = [
    ("1 ข้อกำหนดและการจัดลำดับ", 1, 3),
    ("2 วิเคราะห์และออกแบบระบบ", 3, 6),
    ("3 ระบบออกแบบและหน้าจอ", 5, 8),
    ("4 พัฒนา", 7, 14),
    ("5 ทบทวนและประกันคุณภาพ", 13, 16),
    ("6 เตรียมปล่อยของ", 16, 17),
]

# หลักหมาย · (รหัส, รอบที่, เป็นจุดตัดสินใจหรือไม่)
# จุดตัดสินใจจะแสดงด้วยสีเน้น
MILESTONES = [
    ("G1", 3, True),
    ("G2", 6, True),
    ("G3", 8, False),
    ("G4", 14, False),
    ("G5", 15, False),
    ("G6", 17, True),
]

# ─────────────────────────────────────────────────────────────
# ค่าคงที่ของการวาด · ปกติไม่ต้องแก้
# ─────────────────────────────────────────────────────────────

LABEL_W, CHART_W = 300, 600      # ความกว้างคอลัมน์ป้าย และพื้นที่แผนภูมิ
PAD_L, PAD_T = 14, 12
HEAD_H, ROW_H, MS_H = 46, 48, 62
FONT_LABEL, FONT_MONTH = 21, 18

COL_BAR = "#0E6B75"              # สีแถบงาน
COL_CRIT = "#A33528"             # สีหลักหมายที่เป็นจุดตัดสินใจ
COL_MS = "#3A4247"               # สีหลักหมายทั่วไป
COL_TEXT = "#15191A"
COL_GRID = "#DCE0E1"
COL_STRIPE = "#F3F5F5"

PAGE_W_PX = 605                  # ความกว้างพื้นที่เนื้อหาบน A4 หน่วยพิกเซล
MIN_PT = 10                      # ขนาดตัวอักษรต่ำสุดที่ยอมรับได้ในเอกสารฉบับพิมพ์

TH_MONTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
            "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

ROOT = pathlib.Path(__file__).resolve().parent.parent
SVG_OUT = ROOT / "project" / "assets" / "gantt.svg"
PNG_OUT = ROOT / "project" / "assets" / "gantt.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def round_start(n):
    return START + timedelta(weeks=n - 1)


def round_end(n):
    return START + timedelta(weeks=n - 1, days=4)


def build_svg():
    span = (AXIS_TO - AXIS_FROM).days
    width = PAD_L * 2 + LABEL_W + CHART_W
    height = PAD_T + HEAD_H + ROW_H * len(TASKS) + MS_H

    def x_of(d):
        return PAD_L + LABEL_W + (d - AXIS_FROM).days / span * CHART_W

    months, y, m = [], AXIS_FROM.year, AXIS_FROM.month
    while (y, m) <= (AXIS_TO.year, AXIS_TO.month):
        months.append(date(y, m, 1))
        m += 1
        if m == 13:
            y, m = y + 1, 1

    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
         f'viewBox="0 0 {width} {height}" font-family="Sarabun, sans-serif">',
         f'<rect width="{width}" height="{height}" fill="#ffffff"/>']

    top = PAD_T + HEAD_H
    bottom = top + ROW_H * len(TASKS)

    for i, mm in enumerate(months):
        mx = x_of(mm)
        o.append(f'<line x1="{mx:.1f}" y1="{PAD_T + 26}" x2="{mx:.1f}" y2="{bottom + 30}" '
                 f'stroke="{COL_GRID}" stroke-width="1"/>')
        if i + 1 < len(months):
            cx = (mx + x_of(months[i + 1])) / 2
            year_suffix = f' {mm.year + 543 - 2500:02d}' if mm.month in (1, 7) else ''
            o.append(f'<text x="{cx:.1f}" y="{PAD_T + 20}" font-size="{FONT_MONTH}" '
                     f'fill="{COL_MS}" text-anchor="middle">{TH_MONTH[mm.month - 1]}{year_suffix}</text>')

    o.append(f'<line x1="{PAD_L + LABEL_W}" y1="{top - 8}" x2="{PAD_L + LABEL_W + CHART_W}" '
             f'y2="{top - 8}" stroke="{COL_TEXT}" stroke-width="2"/>')

    for i, (label, a, b) in enumerate(TASKS):
        ry = top + i * ROW_H
        if i % 2 == 0:
            o.append(f'<rect x="{PAD_L}" y="{ry}" width="{LABEL_W + CHART_W}" '
                     f'height="{ROW_H}" fill="{COL_STRIPE}"/>')
        o.append(f'<text x="{PAD_L + 2}" y="{ry + ROW_H / 2 + 7}" font-size="{FONT_LABEL}" '
                 f'fill="{COL_TEXT}">{label}</text>')
        x1, x2 = x_of(round_start(a)), x_of(round_end(b))
        o.append(f'<rect x="{x1:.1f}" y="{ry + 11}" width="{max(x2 - x1, 4):.1f}" '
                 f'height="{ROW_H - 22}" fill="{COL_BAR}"/>')

    my = bottom + 26
    o.append(f'<line x1="{PAD_L + LABEL_W}" y1="{bottom + 3}" x2="{PAD_L + LABEL_W + CHART_W}" '
             f'y2="{bottom + 3}" stroke="#C6CCCD" stroke-width="1"/>')
    o.append(f'<text x="{PAD_L + 2}" y="{my + 7}" font-size="{FONT_LABEL}" fill="{COL_MS}">หลักหมาย</text>')
    for code, n, is_crit in MILESTONES:
        mx = x_of(round_end(n))
        col = COL_CRIT if is_crit else COL_MS
        o.append(f'<polygon points="{mx:.1f},{my - 10} {mx + 8:.1f},{my} {mx:.1f},{my + 10} '
                 f'{mx - 8:.1f},{my}" fill="{col}"/>')
        o.append(f'<text x="{mx:.1f}" y="{my + 30}" font-size="{FONT_MONTH - 1}" fill="{col}" '
                 f'text-anchor="middle" font-weight="700">{code}</text>')

    o.append('</svg>')
    return "\n".join(o), width, height


def main():
    svg, width, height = build_svg()
    SVG_OUT.parent.mkdir(parents=True, exist_ok=True)
    SVG_OUT.write_text(svg)

    printed_pt = FONT_LABEL * PAGE_W_PX / width * 0.75
    print(f"ภาพขนาด {width} x {height} พิกเซล")
    print(f"ขนาดตัวอักษรป้ายในเอกสารฉบับพิมพ์ {printed_pt:.1f} พอยต์")
    if printed_pt < MIN_PT:
        print(f"\nคำเตือน ตัวอักษรเล็กกว่า {MIN_PT} พอยต์ จะอ่านได้ยากในเอกสารฉบับพิมพ์")
        print("แก้ไขโดยลดความกว้างภาพ ย่อชื่อกลุ่มงาน หรือเพิ่มค่า FONT_LABEL")

    html = pathlib.Path("/tmp/gantt-render.html")
    html.write_text('<!doctype html><meta charset="utf-8">'
                    '<style>html,body{margin:0;padding:0;background:#fff}</style>' + svg)

    if not pathlib.Path(CHROME).exists():
        print(f"\nไม่พบ Chrome ที่ {CHROME} จึงสร้างเฉพาะไฟล์ SVG")
        sys.exit(1)

    subprocess.run([CHROME, "--headless", "--disable-gpu",
                    "--force-device-scale-factor=3", "--hide-scrollbars",
                    f"--window-size={width},{height + 18}",
                    f"--screenshot={PNG_OUT}", str(html)],
                   capture_output=True)

    print(f"\nสร้างแล้ว\n  {SVG_OUT.relative_to(ROOT)}\n  {PNG_OUT.relative_to(ROOT)}")
    print("\nขั้นตอนถัดไป ให้สร้างเอกสารใหม่ด้วยคำสั่ง  bash tools/build-docs.sh")


if __name__ == "__main__":
    main()
