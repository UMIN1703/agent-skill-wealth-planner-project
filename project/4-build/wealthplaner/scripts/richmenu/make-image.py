#!/usr/bin/env python3
"""สร้างรูป Rich Menu ของ WealthPlaner (ธีม Neon Dark) — 2500x1686, 6 ช่อง (3x2).
ไอคอนวาดเองด้วย PIL (ไม่พึ่ง glyph ฟอนต์) + ข้อความไทยจากฟอนต์ macOS.
ผลลัพธ์: richmenu.png (PNG < 1MB ตามลิมิต LINE)."""
from PIL import Image, ImageDraw, ImageFont
import os, math

W, H = 2500, 1686
COLS, ROWS = 3, 2
BG = (14, 10, 28)
CARD = (24, 19, 48)
BORDER = (58, 48, 110)
ACCENT = (139, 124, 246)
GOLD = (201, 162, 39)
TEXT = (237, 234, 250)
MUTED = (167, 159, 192)

THAI_FONTS = [
    "/System/Library/Fonts/Supplemental/SukhumvitSet.ttc",
    "/System/Library/Fonts/Supplemental/Thonburi.ttc",
    "/System/Library/Fonts/Supplemental/Ayuthaya.ttf",
]

def font(size, index=0):
    for path in THAI_FONTS:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=index)
            except Exception:
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    continue
    return ImageFont.load_default()

# ── ไอคอนวาดเอง (cx,iy = จุดกึ่งกลาง, s = ครึ่งความกว้าง) ──────────────────────
def ic_donut(d, cx, iy, s, c):
    d.ellipse([cx-s, iy-s, cx+s, iy+s], outline=c, width=24)
    d.arc([cx-s, iy-s, cx+s, iy+s], start=-90, end=30, fill=GOLD, width=24)

def ic_grid(d, cx, iy, s, c):
    g = 14; cell = (2*s - g) / 2
    for rx in (cx-s, cx-s+cell+g):
        for ry in (iy-s, iy-s+cell+g):
            d.rounded_rectangle([rx, ry, rx+cell, ry+cell], radius=12, fill=c)

def ic_plus(d, cx, iy, s, c):
    t = 24
    d.rounded_rectangle([cx-t, iy-s, cx+t, iy+s], radius=12, fill=c)
    d.rounded_rectangle([cx-s, iy-t, cx+s, iy+t], radius=12, fill=c)

def ic_receipt(d, cx, iy, s, c):
    d.rounded_rectangle([cx-s*0.78, iy-s, cx+s*0.78, iy+s], radius=16, outline=c, width=16)
    for k in (-0.45, 0.0, 0.45):
        yy = iy + s*k
        d.line([cx-s*0.42, yy, cx+s*0.42, yy], fill=c, width=14)

def ic_swap(d, cx, iy, s, c):  # ปรับพอร์ต: ลูกศรขึ้น/ลง
    lx, rx = cx - s*0.5, cx + s*0.5
    d.line([lx, iy-s+30, lx, iy+s], fill=c, width=18)
    d.polygon([(lx, iy-s-6), (lx-30, iy-s+40), (lx+30, iy-s+40)], fill=c)
    d.line([rx, iy-s, rx, iy+s-30], fill=c, width=18)
    d.polygon([(rx, iy+s+6), (rx-30, iy+s-40), (rx+30, iy+s-40)], fill=c)

def ic_login(d, cx, iy, s, c):  # ลูกศรเข้าประตู
    d.line([cx-s, iy, cx+s*0.25, iy], fill=c, width=18)
    d.polygon([(cx+s*0.25+8, iy), (cx+s*0.25-34, iy-30), (cx+s*0.25-34, iy+30)], fill=c)
    d.line([cx+s*0.55, iy-s, cx+s*0.55, iy+s], fill=c, width=18)

# 5 ช่อง: แถวบน 3 (833/833/834) · แถวล่าง 2 (1250/1250) — ไม่มี dashboard
# rect = (x0, y0, x1, y1) ในพิกัดเต็ม (ต้องตรงกับ areas ใน setup.sh)
CELLS = [
    (ic_donut,   "พอร์ตรวม",     "Portfolio", ACCENT, (0, 0, 833, 843)),
    (ic_plus,    "เพิ่มสินทรัพย์", "Add",       GOLD,   (833, 0, 1666, 843)),
    (ic_receipt, "รายการสลิป",   "Slips",     ACCENT, (1666, 0, 2500, 843)),
    (ic_swap,    "ปรับพอร์ต",     "Rebalance", ACCENT, (0, 843, 1250, 1686)),
    (ic_login,   "เข้าสู่ระบบ",   "Login",     MUTED,  (1250, 843, 2500, 1686)),
]

f_th = font(92, index=1)
f_en = font(52)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def center(cx, y, text, fnt, fill):
    l, t, r, b = d.textbbox((0, 0), text, font=fnt)
    d.text((cx - (r - l) / 2, y), text, font=fnt, fill=fill)

pad = 26
for icon, th, en, accent, (rx0, ry0, rx1, ry1) in CELLS:
    x0, y0, x1, y1 = rx0 + pad, ry0 + pad, rx1 - pad, ry1 - pad
    d.rounded_rectangle([x0, y0, x1, y1], radius=36, fill=CARD, outline=BORDER, width=3)
    d.rounded_rectangle([x0, y0, x1, y0 + 12], radius=6, fill=accent)
    cx = (x0 + x1) / 2
    icon(d, cx, y0 + 230, 78, accent)
    center(cx, y0 + 380, th, f_th, TEXT)
    center(cx, y0 + 500, en, f_en, MUTED)

out = os.path.join(os.path.dirname(__file__), "richmenu.png")
img.save(out, "PNG", optimize=True)
print(f"saved {out} ({os.path.getsize(out)//1024} KB, {W}x{H})")
