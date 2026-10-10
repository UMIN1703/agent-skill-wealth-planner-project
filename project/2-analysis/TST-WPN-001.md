# Test cases — WealthPlaner (F001–F007)

| รายการ | รายละเอียด |
|---|---|
| รหัสเอกสาร | TST-WPN-001 |
| ฉบับแก้ไขครั้งที่ | 00 |
| วันที่มีผลบังคับใช้ | 2026-08-22 |
| สถานะ | ร่าง |
| เอกสารอ้างอิง | REQ-WPN-001 rev 00 · SRS-WPN-001 rev 00 |
| ผู้จัดทำ | นักวิเคราะห์ระบบ |
| Coverage rule | ทุก AC ได้อย่างน้อย 1 case; ทุก requirement มี negative case อย่างน้อย 1 |

---

## 1. Test data sets

| ID | Name | Contents | Used for |
|---|---|---|---|
| DS-01 | Minimal | user 1 คน ไม่มี asset | empty / boundary |
| DS-02 | Typical | user + 10 assets หลายโบรก/หลายคลาส มีทั้งไทย/ตปท./ทอง | functional ส่วนใหญ่ |
| DS-03 | Capacity | user + 200 assets | สมรรถนะ NFR-01 |
| DS-04 | Migration | ข้อมูลจาก schema_version v1 | upgrade path |
| DS-05 | Stale | asset ที่ price_updated_at = now−16 นาที และ = now−14 นาที | ตรรกะ stale 15 นาที |
| DS-06 | Import | ไฟล์ Excel/Sheet ถูกต้อง 1 ไฟล์ + ผิดรูปแบบ 1 ไฟล์ | F005 |

---

## 2. Detailed test cases (เคสตรรกะสำคัญ)

```
TC-F003-004a   ราคาที่เก่า 14 นาที ยังถือเป็น online (ขอบล่างของ stale)
Traces to      F003 AC-04, BR-01
Type           Boundary value · Technique: boundary
Data set       DS-05
Preconditions
  - timezone Asia/Bangkok, เวลาปัจจุบันคงที่ (freeze) 12:00:00
  - asset A: price_updated_at = 11:46:00 (เก่า 14 นาที)
Steps
  1. เปิดหน้าพอร์ตรวม
Expected result
  - asset A แสดงสถานะ "online" (ไม่ใช่ stale) เพราะ 14 < 15 นาที
```

```
TC-F003-004b   ราคาที่เก่า 16 นาที ถือเป็น stale/offline (ขอบบน)
Traces to      F003 AC-04, BR-01
Type           Boundary value
Data set       DS-05
Preconditions
  - เวลาปัจจุบัน freeze 12:00:00 · asset B: price_updated_at = 11:44:00 (เก่า 16 นาที)
Steps
  1. เปิดหน้าพอร์ตรวม
Expected result
  - asset B แสดงสถานะ "ไม่อัปเดต (offline)" พร้อมเวลา 11:44 เพราะ 16 > 15 นาที
```

```
TC-F004-E02   คำนวณ %income เมื่อ cost_price = 0 (กันหารศูนย์)
Traces to     F004 AC-E02, BR-04
Type          Negative
Preconditions
  - asset C: cost_price = 0, market_price = 100, quantity = 5
Steps
  1. เปิดพอร์ต ดูรายการ asset C
Expected result
  - แสดงกำไร/ขาดทุนเป็นจำนวนเงินได้ (500) แต่ช่อง % แสดง "—" หรือ "คำนวณไม่ได้"
  - ระบบไม่ crash ไม่แสดง Infinity/NaN
```

```
TC-F004-002   แปลงค่าเงินสินทรัพย์ต่างประเทศเป็น THB
Traces to     F004 AC-01, BR-05, NFR-04
Type          Functional
Preconditions
  - asset D: หุ้น ตปท. currency=USD, quantity=10, cost_price=100 USD, market_price=120 USD
  - FXRate USD→THB = 35.00 (updated_at ภายใน 15 นาที)
Steps
  1. เปิดพอร์ต ดู asset D
Expected result
  - มูลค่าตลาดแสดงเป็น THB = 10 × 120 × 35 = 42,000 THB
  - income = (120−100) × 10 × 35 = 7,000 THB
```

```
TC-F007-004   ต้องกดรับทราบ disclaimer ก่อนเห็นผลแบบประเมิน
Traces to     F007 AC-04, BR-07
Type          State transition
Preconditions
  - user ทำแบบประเมินครบทุกข้อ
Steps
  1. กดดูผล
Expected result
  - แสดง disclaimer "ตัวอย่างเชิงการศึกษา ไม่ใช่คำแนะนำการลงทุน" พร้อมปุ่มรับทราบ
  - ยังไม่แสดง allocation ตัวอย่างจนกว่าจะกดรับทราบ
  - หลังกด → บันทึก disclaimer_ack_at และแสดงผล
```

```
TC-F001-E04   ไม่เลือก broker channel → ปฏิเสธการบันทึก
Traces to     F001 AC-E04
Type          Negative
Preconditions
  - อยู่หน้าเพิ่มสินทรัพย์ กรอกครบยกเว้น broker channel
Steps
  1. กดบันทึก
Expected result
  - ไม่บันทึก · แสดงข้อความว่า broker channel เป็นฟิลด์บังคับ · focus ไปช่องนั้น
```

---

## 3. Case index — ครอบทุก AC

**F001 · บันทึกสินทรัพย์ + broker channel**

| Test ID | Traces | Type | Expected result (สังเกตได้) |
|---|---|---|---|
| TC-F001-001 | AC-01 | Functional | กรอกครบ (รวม broker channel) + บันทึก → สินทรัพย์ปรากฏในรายการ |
| TC-F001-002 | AC-02 | Functional | มีหลายโบรก → จัดกลุ่มและแสดง broker channel ต่อรายการ |
| TC-F001-003 | AC-03 | Functional | กรอง/สรุปมูลค่าตาม broker channel ได้ |
| TC-F001-E01 | AC-E01 | Negative | เว้นจำนวน → error ระบุช่อง, focus ไปช่องนั้น, ไม่บันทึก |
| TC-F001-E02 | AC-E02 | Negative | จำนวน/ราคาติดลบ → ปฏิเสธพร้อมข้อความ |
| TC-F001-E03 | AC-E03 | Negative | ชื่อ+broker channel ซ้ำ → เตือนซ้ำ ให้ยืนยัน/รวม |
| TC-F001-E04 | AC-E04 | Negative | ไม่เลือก broker channel → ปฏิเสธ (ดู §2) |

**F002 · พอร์ตรวม + allocation**

| Test ID | Traces | Type | Expected result |
|---|---|---|---|
| TC-F002-001 | AC-01 | Functional | มี asset ≥1 → แสดงมูลค่ารวม + สัดส่วน % ตามประเภท |
| TC-F002-002 | AC-02 | Functional | หลายโบรก → ยอดรวมข้ามโบรกในตัวเลขเดียว |
| TC-F002-E01 | AC-E01 | Boundary | ไม่มี asset (DS-01) → empty state + ปุ่มเพิ่ม (ไม่ใช่ error) |
| TC-F002-E02 | AC-E02 | Negative | บางรายการไม่มีราคาตลาด → แสดงสัดส่วน + flag ว่าใช้ราคาต้นทุน/ล่าสุด + เวลา |

**F003 · ราคา + online/offline + refresh**

| Test ID | Traces | Type | Expected result |
|---|---|---|---|
| TC-F003-001 | AC-01 | Functional | หุ้นไทย → ดึงจาก settrade + แสดงเวลาอัปเดต |
| TC-F003-002 | AC-02 | Functional | หุ้น ตปท./ทอง → ดึงจาก investing.com/แหล่งทอง |
| TC-F003-003 | AC-03 | Functional | ไม่มีแหล่งรองรับ → เปิดช่องกรอกราคาเอง |
| TC-F003-004a/b | AC-04, BR-01 | Boundary | 14 นาที=online, 16 นาที=stale (ดู §2) |
| TC-F003-005 | AC-05 | State | ดึงสำเร็จ → สถานะเป็น online + เวลาล่าสุดอัปเดต |
| TC-F003-006 | AC-06 | Functional | ออนไลน์ + กด refresh → loading → อัปเดตราคา/สถานะ/เวลา |
| TC-F003-E01 | AC-E01 | Negative | ดึงไม่สำเร็จ → คง offline, แสดงค่าล่าสุด, ไม่แสดง 0 |
| TC-F003-E02 | AC-E02 | Negative | ไม่มีเน็ต → offline ทั้งพอร์ต ใช้ cache ไม่ crash |
| TC-F003-E03 | AC-E03 | Negative | ราคาผิดปกติ (0/กระโดด) → ไม่เขียนทับเงียบ, flag ให้ตรวจ |
| TC-F003-E04 | AC-E04 | Negative | refresh ตอนไม่มีเน็ต → "ยังออฟไลน์" ไม่ค้าง loading |
| TC-F003-E05 | AC-E05 | Negative | กด refresh รัว → ปุ่ม disable ระหว่างโหลด + rate-limit |

**F004 · income/outcome**

| Test ID | Traces | Type | Expected result |
|---|---|---|---|
| TC-F004-001 | AC-01, BR-03 | Functional | มีราคาต้นทุน+ตลาด → แสดงกำไร/ขาดทุน (เงิน+%) ต่อรายการและรวม |
| TC-F004-002 | AC-01, BR-05 | Functional | สินทรัพย์ ตปท. → แปลง THB ด้วย FXRate (ดู §2) |
| TC-F004-E01 | AC-E01 | Negative | ไม่มีราคาตลาด → แสดง "—" ไม่ใช่ 0/ขาดทุน 100% |
| TC-F004-E02 | AC-E02, BR-04 | Negative | cost=0 → ไม่หารศูนย์ (ดู §2) |

**F005 · นำเข้า Excel**

| Test ID | Traces | Type | Expected result |
|---|---|---|---|
| TC-F005-001 | AC-01 | Functional | ไฟล์ถูกรูปแบบ (DS-06) → สร้างสินทรัพย์ตามแถว |
| TC-F005-E01 | AC-E01 | Negative | ไฟล์ผิดรูปแบบ/คอลัมน์ไม่ครบ → ระบุแถว/คอลัมน์ที่ผิด, ไม่นำเข้าบางส่วนเงียบ |

**F006 · rebalance gap**

| Test ID | Traces | Type | Expected result |
|---|---|---|---|
| TC-F006-001 | AC-01, BR-06 | Functional | ตั้งเป้ารวม 100% → แสดงส่วนต่างปัจจุบัน vs เป้า |
| TC-F006-E01 | AC-E01 | Negative | เป้ารวม ≠ 100% → เตือน, ไม่คำนวณ gap |

**F007 · แบบประเมินความเสี่ยง**

| Test ID | Traces | Type | Expected result |
|---|---|---|---|
| TC-F007-001 | AC-01 | Functional | ทำครบ → คำนวณ risk_level 1–5 + เสนอ allocation ตัวอย่าง |
| TC-F007-002 | AC-02 | Functional | ผลระบุ "ตัวอย่าง ปรับได้" + แก้เองได้ก่อนบันทึกเป็นเป้า |
| TC-F007-003 | AC-03 | Functional | ทำใหม่ → บันทึกผลล่าสุด + วันที่ประเมิน |
| TC-F007-004 | AC-04, BR-07 | State | ต้องกดรับทราบ disclaimer ก่อน (ดู §2) |
| TC-F007-E01 | AC-E01 | Negative | ทำไม่ครบ → ไม่คำนวณ, แจ้งข้อที่ยังไม่ตอบ |
| TC-F007-E02 | AC-E02 | Negative | แก้ allocation รวม ≠ 100% → เตือน, ไม่บันทึกเป็นเป้า |
| TC-F007-E03 | AC-E03 | Functional | ข้ามแบบประเมิน → ยังตั้งเป้าเองได้โดยตรง |

**NFR (test ไม่ใช่ prose)**

| Test ID | Traces | Type | Expected result |
|---|---|---|---|
| TC-NFR-01 | NFR-01 | Performance | DS-03 (200 assets) → หน้าพอร์ตรวมโหลด < 2 วิ p95 |
| TC-NFR-02 | NFR-02 | Accessibility | หน้าหลักผ่าน axe (0 critical) + คีย์บอร์ดเข้าถึงครบ |
| TC-NFR-03 | NFR-03 | Security | user อื่นเปิดข้อมูลไม่ได้ · ไฟล์ไม่ public |
| TC-NFR-05 | NFR-05 | Compat | เปิดผ่าน LINE OA in-app browser + mobile/tablet/desktop ได้ |
| TC-MIG-01 | SRS 4.4 | Migration | DS-04 v1→v2 สำเร็จ · ถ้าล้ม ข้อมูลเดิมไม่เสีย |

---

## 4. Coverage summary

| Requirement | AC count | Cases | Negative | NFR/อื่น | Gap |
|---|---|---|---|---|---|
| F001 | 7 | 7 | 4 | — | 0 |
| F002 | 4 | 4 | 2 | — | 0 |
| F003 | 11 | 12 (004 แยก a/b) | 5 | — | 0 |
| F004 | 3 | 4 | 2 | — | 0 |
| F005 | 2 | 2 | 1 | — | 0 |
| F006 | 2 | 2 | 1 | — | 0 |
| F007 | 7 | 7 | 2 | — | 0 |
| NFR | — | — | — | 5 | 0 (NFR-04 ครอบใน TC-F004-002) |

**Gaps to report:** ไม่มี AC ที่ไม่มี case · ไม่มี case ที่ไม่มี requirement

---

## 5. Edge-case coverage confirmation

**Date/time (stale logic)**
- [x] ขอบ stale 15 นาที ทั้งสองด้าน — TC-F003-004a/b
- [x] เวลา freeze/timezone Asia/Bangkok ระบุใน precondition
- [ ] DST — ไม่เกี่ยวข้อง (ไทยไม่มี DST) · timezone travel — deferred (single-region MVP)

**Offline/refresh**
- [x] ทุก capability ตอนไม่มีเน็ต — TC-F003-E02
- [x] refresh ตอน offline — TC-F003-E04 · กดรัว — TC-F003-E05
- [ ] sync สองเครื่อง — ไม่เกี่ยวข้อง (BR-02 ไม่มี offline sync)

**Storage/migration**
- [x] upgrade v1→v2 + migration ล้มไม่เสียข้อมูล — TC-MIG-01
- [x] capacity 200 assets ยังได้ budget — TC-NFR-01

**Accessibility**
- [x] สถานะราคาไม่พึ่งสีอย่างเดียว (มีข้อความ online/offline) — TC-NFR-02
- [x] contrast/คีย์บอร์ด — TC-NFR-02

---

## 6. Traceability matrix

### 6.1 Forward — requirement → design → test

| Req | Data model | ADR/Arch | Behaviour | Test cases | Status |
|---|---|---|---|---|---|
| F001 | Asset, BrokerChannel | — | E-VALIDATION, E-DUP | TC-F001-001…E04 | Covered |
| F002 | Asset, AssetType | — | — | TC-F002-001…E02 | Covered |
| F003 | Asset(price_*), PriceSource | ADR-001 (งานดึงราคา) | BR-01/02, state machine, E-PRICE-* | TC-F003-001…E05 | Covered |
| F004 | Asset, FXRate | — | BR-03/04/05 | TC-F004-001…E02 | Covered |
| F005 | Asset, SchemaMeta | ADR-001 (Sheet import) | — | TC-F005-001/E01 | Covered |
| F006 | TargetAllocation | — | BR-06, E-ALLOC-SUM | TC-F006-001/E01 | Covered |
| F007 | RiskAssessment | — | BR-07 | TC-F007-001…E03 | Covered |
| NFR-01/02/03/05 | — | ADR-001 | §8 | TC-NFR-01/02/03/05 | Covered |
| REQ-07 | (ไม่บล็อก) | — | — | — | Deferred (SRS 4.5) |

### 6.2 Backward — test → requirement

ทุก TC ในเอกสารนี้มี "Traces" ชี้ไปยัง AC/NFR/BR ที่มีอยู่ → **ไม่มี test ที่ไม่มี requirement** (ไม่มี scope creep)

### 6.3 Design element → requirement

| Design element | Traces to | Verdict |
|---|---|---|
| ทุก entity (User…SchemaMeta) | มีคอลัมน์ Traces ใน SRS 4.2 | Justified |
| ADR-001 | NFR-01/03, F005 | Justified |
| ทุก BR-01…07 | F003/F004/F006/F007 | Justified |

### 6.4 Acceptance criteria not converted

| AC | Reason | Blocks |
|---|---|---|
| — | ไม่มี | — |

## 7. Coverage summary (ตัวเลข)

| Metric | Count |
|---|---|
| Requirements in scope | 7 (F001–F007) + 5 NFR |
| Requirements fully covered | 7/7 + NFR |
| Acceptance criteria total | 36 |
| AC with ≥ 1 test case | **36 / 36** |
| Test cases total | 43 (38 functional F001–F007 + 5 NFR/migration) |
| Test cases with no traced requirement | 0 |
| Design elements with no traced requirement | 0 |

**Coverage of acceptance criteria: 36 of 36.**

## 8. Revision history

| Rev | Date | Sections | Substance | Author |
|---|---|---|---|---|
| 00 | 2026-08-22 | All | First issue — test cases + traceability ครอบทุก AC (F001–F007) | นักวิเคราะห์ระบบ |
| 00 | 2026-08-29 | §4, §7 | แก้ยอด test case ให้ตรงจำนวนจริง — 38 → **43** (38 functional F001–F007 + 5 NFR/migration) · F003 cases 11 → 12 (นับ 004a/b เป็น 2) · AC coverage 36/36 ไม่เปลี่ยน · ยังเป็นร่าง จึงไม่ขึ้นฉบับ 01 | audit correction |
| 00 | 2026-08-29 | §3, §5, §6.1 | renumber TC-F003-E05→E04, TC-F003-E06→E05 ตาม REQ AC renumber (audit) · coverage ไม่เปลี่ยน | audit cleanup |
