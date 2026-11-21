# รายงานผลการทบทวนโค้ด — WealthPlaner · รอบ IA restructure (CR-WPN-009)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | RVW-WPN-001 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-11-21 |
| สถานะ | อนุมัติแล้ว |
| เอกสารอ้างอิง | CR-WPN-009 · REQ-WPN-001 F002/F005/F006/F008 · DSN-WPN-001 |
| ผู้ทบทวน | code-reviewer (บทบาท, solo) |

---

## 1. ขอบเขตการทบทวน

1.1 การเปลี่ยนแปลงที่ทบทวน — ช่วง commit `b83824f..39c0bcb` (งาน CR-WPN-009): a52c74f · 192dbfa · fd208e7

1.2 ไฟล์ที่อ่าน — 27 ไฟล์โค้ด (835+/123−): `app/activity|assets|profile/*` , `src/components/{AccountSettings,NotificationSettings,PrivacySettings,PortfolioHero,DisplayName,LogoutButton,AllocationTabs,AssetList,BottomNav}`, `src/lib/{portfolio,portfolioData,supabase,driveSync}`, `src/data/sampleAssets`

1.3 ต้นทางของเจตนา — CR-WPN-009 (§2–§3) + REQ F002/F005/F006/F008

1.4 สิ่งที่ไม่ได้ทบทวน — งานก่อน b83824f (CR-004…008 รีวิวไปแล้ว/คนละรอบ) · การเทียบ feature-vs-spec เชิงภาพ/คีย์บอร์ด = ส่งต่อ QA (QAR)

---

## 2. คำตัดสิน

| รายการ | ผล |
|---|---|
| คำตัดสิน (แรก) | APPROVE WITH CHANGES |
| คำตัดสิน (หลังแก้) | **APPROVE** — MAJOR + reuse แก้แล้ว |
| BLOCKER | 0 |
| MAJOR | 1 (แก้แล้ว) |
| MINOR | 4 (แก้ 1 · รับทราบ/เลื่อน 3) |
| NIT | 0 |

---

## 3. ข้อค้นพบ

### 3.1 ความถูกต้อง

| ระดับ | ตำแหน่ง | ปัญหา | อินพุตที่ทำให้พัง | วิธีแก้ | สถานะ |
|---|---|---|---|---|---|
| MINOR | `PortfolioHero.tsx` | อ่าน `wp_privacy` ใน `useEffect` → ตอนโหลด ตัวเลขจริงโชว์ 1 เฟรมก่อนถูกปิดบัง (ซ่อนเงินรั่วชั่วขณะ) | เปิด "ซ่อนจำนวนเงิน" แล้วรีโหลดหน้า | ยอมรับได้ (กัน layout shift) — ถ้าจะปิดสนิทต้องซ่อนจนกว่า mount | รับทราบ |

### 3.2 การใช้ของเดิมซ้ำ

| ระดับ | ตำแหน่ง | ซ้ำกับอะไร | วิธีแก้ | สถานะ |
|---|---|---|---|---|
| MINOR | `NotificationSettings.tsx` · `PrivacySettings.tsx` | คอมโพเนนต์ `Toggle` (สวิตช์) เขียนซ้ำเป๊ะ 2 ที่ | ดึงเป็น `src/components/Toggle.tsx` ตัวเดียว | **แก้แล้ว** |

### 3.3 ความชัดเจน

| ระดับ | ตำแหน่ง | ปัญหา | วิธีแก้ | สถานะ |
|---|---|---|---|---|
| MINOR | `app/rebalance/page.tsx` | บล็อก empty-state `{!anySet && …}` เป็น dead code (prefill เป้าเสมอ → `anySet` จริงตลอด) | ลบ หรือคงไว้โดยตั้งใจ | เลื่อน (ไม่กระทบการทำงาน) |

### 3.4 การดูแลรักษาต่อ

| ระดับ | ตำแหน่ง | ต้นทุนที่ตามมา | วิธีแก้ | สถานะ |
|---|---|---|---|---|
| MAJOR | `src/lib/portfolio.ts` | `categoryRiskRank` + `CATEGORY_TARGETS` (แก้ให้ตรงชีต) ไม่มีเทสคุม → ลำดับ/ตัวเลขเป้าเพี้ยนกลับได้เงียบ ๆ (ขัด DoD) | เพิ่ม unit test ลำดับ 7 หมวด + เป้ารวม 100% + ค่าตรงชีต | **แก้แล้ว** (TC-F002-risk-order, TC-F006-targets) |

---

## 4. สิ่งที่ทำได้ดี

- แยก data loader เป็น `loadAssets()` (`portfolioData.ts`) ตัวเดียว → หน้า `/` กับ `/assets` ใช้แหล่งข้อมูลเดียว ไม่หลุดจากกัน — เก็บแนวนี้ไว้
- `categoryRiskRank` รวมศูนย์ที่ `portfolio.ts` → chip/allocation เรียงตรงกันเสมอ ไม่กระจายกฎ
- ซื่อตรงกับผู้ใช้: prefs เก็บ localStorage + มีโน้ตว่าการส่ง LINE จริงยังไม่ทำ (ไม่ทำปุ่มหลอก)

## 5. ช่องว่างของการทบทวนครั้งนี้

- การเทียบเชิงภาพ/คีย์บอร์ด/สถานะหน้าจอ (empty/loading/error/unauthorized) ครบทุกหน้าใหม่ = งาน QA (QAR-WPN-001)
- 1 MINOR ที่ส่งต่อ QA: "ซ่อนจำนวนเงิน" ปิดบังแค่ hero หน้าแรก · `/assets`, `/activity`, legend allocation ยังโชว์ตัวเลข → ขอบเขตไม่สอดคล้องที่ผู้ใช้คาด (feature-vs-spec)

## 6. ความเชื่อมโยงกับ Definition of Done

| ข้อ DoD ที่ยังไม่ผ่านจริงก่อนทบทวน | หลักฐาน |
|---|---|
| "มี test สำหรับพฤติกรรมใหม่ และ test พังถ้าเอาโค้ดออก" | `categoryRiskRank`/`CATEGORY_TARGETS` ไม่มีเทส (MAJOR §3.4) → **ปิดแล้ว** เพิ่ม 2 เทส (54/54 ผ่าน) |

## 7. ประวัติการแก้ไข

| ฉบับที่ | วันที่ | ข้อที่แก้ | สาระสำคัญ | เหตุผล |
|---|---|---|---|---|
| 00 | 2026-11-21 | All | ทบทวนรอบ CR-WPN-009 (27 ไฟล์) · 1 MAJOR (ขาดเทส categoryRiskRank/CATEGORY_TARGETS) + 4 MINOR · แก้ MAJOR (เพิ่ม 2 เทส) + reuse (ดึง Toggle รวม) → APPROVE · เหลือ 3 MINOR รับทราบ/เลื่อน/ส่ง QA | ฉบับแรก |
