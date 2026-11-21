# รายงานการประกันคุณภาพ — WealthPlaner · รอบ IA restructure (CR-WPN-009)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | QAR-WPN-002 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-21 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | CR-WPN-009 · RVW-WPN-001 · REQ-WPN-001 F002/F005/F006/F008 · DSN-WPN-001 |
| ผู้ตรวจ | quality-assurance (บทบาท, solo) |

---

## 1. ขอบเขตและสเปก

- **ขอบเขต:** งาน CR-WPN-009 — /assets, /activity, /profile/{account,notifications,drive,privacy}, bottom nav, ย้าย logout, ซ่อนจำนวนเงิน, เรียงความเสี่ยง, เป้าหมายตรงชีต
- **สเปก:** CR-WPN-009 §3 · REQ-WPN-001 F002/F005/F006/F008 · DSN-WPN-001 (tokens) · DoD (project.yml)
- **ระดับ a11y:** WCAG 2.2 AA (project.yml quality.wcag = AA)
- **วิธีตรวจ:** static — เทียบโค้ดกับสเปก/โทเคน + ตรวจ a11y จากโครงสร้าง (ไม่มี harness รัน axe/Playwright ใน env นี้)

## 2. คำตัดสิน

| รายการ | ผล |
|---|---|
| Verdict | **PASS WITH ADVISORIES** |
| BLOCKER | 0 |
| MAJOR | 2 |
| MINOR | 4 |
| Gap | 3 |

คำตัดสินคำนวณจากข้อค้นพบ: ไม่มี BLOCKER แต่มี MAJOR ⇒ PASS WITH ADVISORIES (ขึ้น release ได้ แต่ควรปิด advisories)

## 3. ข้อค้นพบ

### 3.1 Functional

| ระดับ | ตำแหน่ง | ปัญหา | วิธีแก้ |
|---|---|---|---|
| MAJOR | `PrivacySettings.tsx` · `PortfolioHero.tsx` | "ซ่อนจำนวนเงิน" ปิดบังแค่ hero หน้าแรก · `/assets`, `/activity`, legend allocation ยังโชว์ตัวเลข | ต่อ flag `wp_privacy.hideAmounts` ไปหน้าเหล่านั้น หรือเปลี่ยน label เป็น "ซ่อนยอดหน้าแรก" |
| MINOR | `app/assets`, `app/activity` | ไม่ redirect เมื่อไม่ล็อกอิน (โชว์เดโม) ขณะ `/profile/*` redirect → unauthorized ไม่สม่ำเสมอ | ตัดสินใจแพตเทิร์นเดียว (เดโม-public เหมือนหน้าแรก หรือ redirect) |
| MINOR | `BottomNav.tsx` | ไม่มี active state ตอนอยู่ `/rebalance` (ย้ายออกจาก tabs) | ยอมรับได้ (เข้าจาก Profile) หรือไฮไลต์ Profile |

### 3.2 Visual & Design System

| ระดับ | ตำแหน่ง | ปัญหา | วิธีแก้ |
|---|---|---|---|
| MAJOR | `app/activity`, `app/profile/drive`, `PrivacySettings`, `NotificationSettings`, `app/profile` | token drift — hardcode `#34D399`/`#F87171`/`#60A5FA`/`#06C755` แทน token · สีเขียว/แดง ซื้อ/ขาย ไม่ตรงพาเลตต์กำไร/ขาดทุน (`--gain #3DDC84`/`--loss #FF6B6B`) | ใช้ `var(--gain)`/`var(--loss)` · เพิ่ม token สี "สับเปลี่ยน" + LINE green |
| MINOR | หน้าตั้งค่าหลายไฟล์ | spacing/สไตล์ inline กระจาย แทน token/class | ย้ายเป็น utility class/token เมื่อสะดวก |

### 3.3 Accessibility (WCAG 2.2 AA)

| ระดับ | ตำแหน่ง | ปัญหา | วิธีแก้ |
|---|---|---|---|
| — | `Toggle`, `LogoutButton`, activity labels | ผ่าน: role=switch+aria-checked+aria-label · aria-label logout · ป้ายการกระทำเป็นข้อความไม่พึ่งสี (colorblind-safe) · คีย์บอร์ดเนทีฟ | — |
| MINOR | สี hardcode บนการ์ด | contrast (#60A5FA ฯลฯ บนพื้นการ์ด) ยังไม่วัด อาจไม่ผ่าน AA สำหรับ text เล็ก | วัด contrast จริง ปรับให้ ≥ 4.5:1 (ผูกกับ token drift §3.2) |

## 4. สิ่งที่ผ่านชัดเจน
- โครงสร้าง a11y ของคอมโพเนนต์ใหม่แข็งแรง (switch/aria/keyboard/colorblind-safe)
- empty state มีครบใน /assets, /activity · prefs เก็บ localStorage ตรงไปตรงมา (ไม่แกล้งสำเร็จ)
- ลำดับความเสี่ยง + เป้าหมายมีเทสคุมแล้ว (RVW-WPN-001 ปิด MAJOR)

## 5. Gaps (จำกัดความเชื่อมั่นของ gate นี้)
- ไม่ได้รัน axe-core / Playwright / visual-regression (ไม่มี harness ใน env)
- browsers รองรับ = TBD ใน project.yml (quality.browsers ว่าง)
- contrast ยังไม่วัดด้วยเครื่องมือจริง

## 6. Next action
- ปิด 2 MAJOR (privacy mask ให้ครบ + token drift → ใช้ var(--gain)/--loss) ก่อน release
- เติม quality.browsers + รัน contrast/axe จริงเมื่อมี harness/deploy

## 7. ประวัติการแก้ไข

| ฉบับที่ | วันที่ | สาระสำคัญ |
|---|---|---|
| 00 | 2026-11-21 | ตรวจรอบ CR-WPN-009 · Verdict PASS WITH ADVISORIES (0 BLOCKER, 2 MAJOR: privacy mask hero-only + token drift, 4 MINOR) · static review (ไม่มี harness axe/Playwright) |
