# design-lazyyy-skills

เทมเพลตสำหรับ **AI Design System Bootcamp** — skill 24 ตัวสำหรับ Claude Code
ที่ต่อกันเป็นสายงานเดียวตั้งแต่ไอเดียจนถึงปล่อยของ

เทมเพลตนี้ **ว่างเปล่าโดยตั้งใจ แต่รู้วิธีถาม** นักเรียน clone แล้วสั่ง `/kickoff`
ระบบจะถามคำถาม เอาคำตอบไปเติมแม่แบบเอกสาร แล้วพาเดินผ่านประตูทีละด่าน
— ไม่มีเนื้อหาโครงการตัวอย่างให้ลอก และไม่มีการเดาเนื้อหาให้

---

## เริ่มใน 5 นาที

```sh
git clone git@github.com:plugin87/design-lazyyy-skills.git my-project
cd my-project
claude
```

จากนั้นในหน้าต่าง Claude Code

```
/kickoff
```

ระบบจะถาม 5 ข้อ — ชื่อโครงการ · รหัสสามตัวอักษร · ปัญหาที่จะแก้ในหนึ่งประโยค
· ใครคือผู้ใช้และวันนี้เขาทำยังไง · มีเวลาเท่าไหร่

ตอบไม่ได้ให้บอกว่าไม่รู้ ระบบจะบันทึกเป็น `TBD` ไม่ใช่เดาแทน

```
/gate            ดูว่าตอนนี้ขาดอะไรถึงจะไปต่อได้
/doc-new PRD     สร้างเอกสารข้อกำหนดจากแม่แบบ
/status          สรุปว่าอยู่ตรงไหนแล้ว
```

---

## สายงาน

```
เปิดโครงการ → อะไร/ทำไม → สร้างได้จริงอย่างไร → หน้าตา → สร้าง → ตรวจ → ปล่อย
              G1            G2                    G3       G4      G5    G6
```

รายละเอียดทั้งหมด ผังสายงาน และเกณฑ์ของแต่ละประตูอยู่ใน [`WORKFLOW.md`](WORKFLOW.md)

---

## skill ทั้งหมด

### แกนกลาง

| skill | ทำอะไร |
|---|---|
| `project-intake` | ถามคำถามแล้วเขียน `project/project.yml` ซึ่งเป็นความจำร่วมของทุกบทบาท |
| `document-control` | รหัสเอกสาร ฉบับแก้ไข ทะเบียน และการสร้าง PDF/DOCX ตามรูปแบบเอกสารไทย |

### บทบาทในสายงาน

| skill | ตอบคำถามว่า |
|---|---|
| `product-owner` | ทำอะไร และทำไม |
| `project-manager` | อย่างไร และเมื่อไหร่ |
| `system-analyst` | สร้างได้จริงอย่างไร |
| `developer` | สร้างเสร็จหรือยัง |
| `code-reviewer` | โค้ดนี้ควรเข้า repo ไหม |
| `quality-assurance` | พร้อมส่งมอบหรือยัง |
| `devops-release` | ปล่อยได้ตอนนี้ไหม |

### UX/UI และ frontend — 15 skill

**รากฐาน** `design-fundamentals` · `web-accessibility-a11y`
· `design-systems-architecture` · `web-performance-optimization`
· `anti-ai-design-patterns`

**ออกแบบ** `figma-expert-workflows` · `responsive-universal-design`
· `inclusive-design-patterns`

**พัฒนา** `frontend-framework-guide` · `css-styling-pixel-perfect`

**เชื่อมต่อและส่งมอบ** `design-to-code-workflow` · `design-tokens-system`
· `component-library-mastery` · `qa-testing-visual-regression`
· `deployment-devops-workflow`

---

## พูดแบบไหน เรียก skill ตัวไหน

| พูดแบบนี้ | ได้ตัวนี้ |
|---|---|
| "เริ่มโปรเจกต์ใหม่" · "ตั้งโครงการ" | `project-intake` |
| "เขียน spec ให้หน่อย" · "ควรทำอะไรก่อน" | `product-owner` |
| "ทันเดดไลน์ไหม" · "รับได้กี่งาน" | `project-manager` |
| "ออกแบบแบบจำลองข้อมูล" · "spec นี้สร้างได้จริงไหม" | `system-analyst` |
| "สีนี้เข้ากันไหม" · "ทำไมหน้านี้ดูไม่ลงตัว" | `design-fundamentals` |
| "ทำ design token" · "ซิงค์ token กับ Figma" | `design-tokens-system` |
| "ลงมือเขียนโค้ดได้ยัง" · "งานนี้เสร็จหรือยัง" | `developer` |
| "ทบทวนโค้ดให้หน่อย" · "merge ได้ยัง" | `code-reviewer` |
| "ตรวจงานให้ที" · "ตรงกับแบบไหม" | `quality-assurance` |
| "ปล่อยได้ยัง" · "ถอยกลับยังไง" | `devops-release` |
| "รหัสเอกสารตั้งยังไง" · "ออกฉบับแก้ไขยังไง" | `document-control` |

skill ทุกตัวมีบรรทัด "Do NOT use for… — that is the X skill" ใน description
เพื่อให้ Claude เลือกตัวเดิมทุกครั้งเมื่อถามคำถามเดียวกัน

---

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `/kickoff` | เปิดโครงการ ถามคำถาม เขียน `project.yml` |
| `/gate` | ตรวจประตูของระยะปัจจุบัน บอกว่าขาดอะไร บันทึกผล |
| `/doc-new <TYPE>` | สร้างเอกสารจากแม่แบบ แทนรหัสโครงการ ลงทะเบียนให้ |
| `/doc-build` | สร้าง PDF และ DOCX จากไฟล์ `.md` |
| `/cr` | เปิดคำขอเปลี่ยนแปลงเมื่อเอกสารขัดกันเอง |
| `/status` | สรุปสถานะโครงการ |

---

## โครงสร้าง

```
.claude/skills/       skill 24 ตัว
.claude/commands/     คำสั่ง 6 ตัว
project/              งานของนักเรียน — ที่เดียวที่แก้ตอนทำโครงการ
  project.yml         ความจำร่วมของทุกบทบาท
  REGISTER.md         ทะเบียนเอกสาร
  1-product/ … 6-release/
templates/role-skill/ โครงเปล่าสำหรับเพิ่มบทบาทใหม่
tools/                สคริปต์สร้างเอกสารและเรนเดอร์ผัง
docs/                 print-th.css และ PDF/DOCX ที่สร้างขึ้น
examples/             ตัวอย่าง design system หนึ่งแบรนด์ สามระบบภาพ
```

---

## สร้างเอกสาร PDF และ DOCX

```sh
brew install pandoc
npm install --prefix tools @mermaid-js/mermaid-cli

bash tools/build-docs.sh              # ทุกฉบับ
bash tools/build-docs.sh PRD-BKG-001  # เฉพาะฉบับที่ระบุ
bash tools/make-handoff.sh            # จัดชุดส่งมอบ
```

เอกสารใช้รูปแบบเอกสารราชการไทย — Sarabun 16 พอยต์ · ตาราง 14 พอยต์ · A4
· ระยะขอบตามระเบียบงานสารบรรณ กำหนดไว้ใน `docs/print-th.css`

**ผัง mermaid ต้องเรนเดอร์เป็นรูปก่อน** ถ้าส่งเข้า pandoc ตรง ๆ ผังจะกลายเป็น
รหัสดิบในไฟล์ที่ส่งมอบ `build-docs.sh` จึงเรียก `render-mermaid.py` ก่อนเสมอ

---

## ติดตั้งเป็น plugin เพื่อใช้ข้ามโปรเจกต์

```
/plugin marketplace add plugin87/design-lazyyy-skills
/plugin install design-lazyyy@design-lazyyy-skills
```

แบบ clone ได้ทั้ง skill คำสั่ง แม่แบบ และเครื่องมือ · แบบ plugin ได้ skill
กับคำสั่ง ใช้ได้ทุกโปรเจกต์ แต่ไม่มีโฟลเดอร์ `project/` และเครื่องมือสร้างเอกสาร

---

## เพิ่มบทบาทใหม่

1. คัดลอก `templates/role-skill/` ไปเป็น `.claude/skills/<ชื่อบทบาท>/`
2. ชื่อโฟลเดอร์ต้องตรงกับ `name` ใน frontmatter เสมอ
3. เขียน `description` ให้จบด้วย `Do NOT use for… — that is the X skill`
   แล้วไล่ตรวจว่าไม่ทับกับ skill ที่มีอยู่
4. เพิ่มหัวข้อ `## Intake` ที่อ่าน `project.yml` ก่อนเริ่มงาน
5. ถ้าบทบาทนี้ผลิตเอกสาร ให้เพิ่มประเภทลงทะเบียนใน `document-control`
   พร้อมชี้ path ของแม่แบบ
6. ถ้าบทบาทนี้มีประตู ให้เพิ่มเกณฑ์ใน `.claude/commands/gate.md`
7. เพิ่มลงตารางใน `WORKFLOW.md` และ `README.md`

---

## หลักการที่เทมเพลตนี้ยึด

**ห้ามแต่งข้อมูลที่ไม่รู้** — ตอบไม่ได้ให้เขียน `TBD` ไม่ใช่เดา
เพราะข้อกำหนดที่แต่งขึ้นแย่กว่าช่องว่าง มันถูกเอาไปสร้างจริง

**ประตูต้องปฏิเสธได้จริง** — ประตูที่ผ่านทุกครั้งไม่ใช่ประตู

**สาวกลับได้ทั้งสองทาง** — ข้อกำหนด → ออกแบบ → หน้าจอ → กรณีทดสอบ → โค้ด
ทุกลูกศรเดินได้สองทาง

**รายงานปัญหา ไม่ใช่แก้เงียบ ๆ** — เจอเอกสารขัดกันให้ออกคำขอเปลี่ยนแปลง
ไม่ใช่เลือกเองแล้วสร้างต่อ

รายละเอียดกติกาที่ Claude ยึดทุก session อยู่ใน [`CLAUDE.md`](CLAUDE.md)

---

## สัญญาอนุญาต

MIT — ดู [`LICENSE`](LICENSE)
