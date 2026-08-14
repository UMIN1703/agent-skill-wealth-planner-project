#!/usr/bin/env python3
"""แปลงบล็อก mermaid ในไฟล์ .md ให้เป็นรูปภาพ แล้วคืนไฟล์ .md ที่อ้างถึงรูปแทน

วิธีใช้
    python3 tools/render-mermaid.py project/2-analysis/SRS-BKG-001.md /tmp/SRS-BKG-001.render.md

รูปที่สร้างจะอยู่ในโฟลเดอร์ project/assets/ ชื่อ <รหัสเอกสาร>-fig<ลำดับ>.png
ถ้าเนื้อหาของผังไม่เปลี่ยน จะข้ามการเรนเดอร์ใหม่ เพื่อไม่ให้เสียเวลา
"""

import hashlib
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "project" / "assets"
MMDC = ROOT / "tools" / "node_modules" / ".bin" / "mmdc"
CONFIG = ROOT / "tools" / "mermaid-config.json"
SCALE = "3"

BLOCK = re.compile(r"^```mermaid[ \t]*\n(.*?)^```[ \t]*$", re.S | re.M)


def render(code: str, out_png: pathlib.Path, cache: pathlib.Path) -> None:
    """เรนเดอร์ผังหนึ่งผัง ข้ามถ้าเนื้อหาเดิมและไฟล์รูปยังอยู่"""
    digest = hashlib.sha256(code.encode("utf-8")).hexdigest()
    if out_png.exists() and cache.exists() and cache.read_text().strip() == digest:
        print(f"  ข้าม  {out_png.name} (ไม่เปลี่ยนแปลง)")
        return

    src = out_png.with_suffix(".mmd")
    src.write_text(code, encoding="utf-8")

    result = subprocess.run(
        [str(MMDC), "-i", str(src), "-o", str(out_png),
         "-c", str(CONFIG), "-b", "white", "-s", SCALE],
        capture_output=True, text=True,
    )
    if result.returncode != 0 or not out_png.exists():
        sys.stderr.write(f"เรนเดอร์ {out_png.name} ไม่สำเร็จ\n{result.stderr}\n")
        sys.exit(1)

    cache.write_text(digest)
    print(f"  สร้าง {out_png.name}  ({out_png.stat().st_size // 1024} กิโลไบต์)")


def main() -> None:
    if len(sys.argv) != 3:
        sys.stderr.write(__doc__)
        sys.exit(2)

    src_md = pathlib.Path(sys.argv[1])
    dst_md = pathlib.Path(sys.argv[2])
    doc = src_md.stem
    text = src_md.read_text(encoding="utf-8")

    if not BLOCK.search(text):
        dst_md.write_text(text, encoding="utf-8")
        return

    if not MMDC.exists():
        sys.stderr.write(
            "ไม่พบ mmdc  ติดตั้งด้วย  npm install --prefix tools @mermaid-js/mermaid-cli\n")
        sys.exit(1)

    ASSETS.mkdir(parents=True, exist_ok=True)
    counter = [0]

    def replace(match: "re.Match[str]") -> str:
        counter[0] += 1
        n = counter[0]
        png = ASSETS / f"{doc}-fig{n:02d}.png"
        render(match.group(1), png, png.with_suffix(".sha256"))
        # ใช้เส้นทางแบบสัมพัทธ์จากรากโครงการ เพื่อให้ pandoc หาไฟล์เจอ
        return f"![ผังที่ {n} ของเอกสาร {doc}](project/assets/{png.name})"

    dst_md.write_text(BLOCK.sub(replace, text), encoding="utf-8")
    print(f"  รวม {counter[0]} ผัง")


if __name__ == "__main__":
    main()
