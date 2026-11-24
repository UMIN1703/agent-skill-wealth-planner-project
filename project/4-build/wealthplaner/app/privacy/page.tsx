// หน้านโยบายความเป็นส่วนตัว (สาธารณะ ไม่ต้อง login) — CR-WPN-013
// เนื้อหาอิงสิ่งที่แอปทำจริง · มี Google API Limited Use disclosure (จำเป็นสำหรับ OAuth verification สโคป Drive/Sheets)
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const runtime = 'edge';

export const metadata = {
  title: 'นโยบายความเป็นส่วนตัว · WealthPlanner',
  description: 'นโยบายความเป็นส่วนตัวของ WealthPlanner — ข้อมูลที่เก็บ วิธีใช้ การเข้าถึง Google และสิทธิของคุณ',
};

const CONTACT_EMAIL = 'yuwadee00001@gmail.com'; // อีเมลผู้ดูแล — เปลี่ยนได้ที่นี่
const UPDATED = '24 พฤศจิกายน 2569';

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{n}. {title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--muted)' }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="app" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="topbar">
        <Link href="/login" aria-label="กลับ" className="icon-btn">
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ flex: 1 }}>นโยบายความเป็นส่วนตัว</h1>
      </div>

      <section className="card">
        <p style={{ fontSize: 13, color: 'var(--muted-2)', margin: 0 }}>มีผลวันที่ {UPDATED}</p>
        <p style={{ fontSize: 14, lineHeight: 1.75, marginTop: 10, marginBottom: 0 }}>
          WealthPlanner (“แอป”, “เรา”) เป็นเครื่องมือช่วยจัดการพอร์ตการลงทุนส่วนบุคคล นโยบายนี้อธิบายว่าเราเก็บข้อมูลอะไร
          ใช้ทำอะไร จัดเก็บที่ไหน และคุณมีสิทธิอะไรบ้าง เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการเท่านั้น
          และ <b style={{ color: 'var(--text)' }}>ไม่ขายข้อมูลของคุณ</b> ให้บุคคลที่สาม
        </p>

        <Section n={1} title="ข้อมูลที่เราเก็บ">
          <ul style={{ margin: '0', paddingLeft: 18 }}>
            <li><b style={{ color: 'var(--text)' }}>ข้อมูลบัญชี</b> — เมื่อเข้าสู่ระบบด้วย Google หรือ LINE เราจะได้รับชื่อที่แสดง, อีเมล (กรณี Google), รหัสผู้ใช้ (userId กรณี LINE) และรูปโปรไฟล์ เพื่อระบุตัวตนและผูกข้อมูลพอร์ตเข้ากับบัญชีของคุณ</li>
            <li><b style={{ color: 'var(--text)' }}>ข้อมูลพอร์ตการลงทุน</b> — รายการสินทรัพย์ที่คุณเพิ่ม (ชื่อ จำนวน ต้นทุน ราคาปัจจุบัน โน้ต หมวด ฯลฯ) ที่คุณกรอกเอง นำเข้า หรือส่งผ่านสลิป</li>
            <li><b style={{ color: 'var(--text)' }}>รูปสลิป</b> — ภาพสลิปที่คุณส่งเข้ามาเพื่อบันทึกรายการ (จัดเก็บชั่วคราวเพื่อการประมวลผล)</li>
            <li><b style={{ color: 'var(--text)' }}>การตั้งค่า</b> — ผลประเมินความเสี่ยงและเป้าหมายสัดส่วนการลงทุนที่คุณบันทึก</li>
          </ul>
        </Section>

        <Section n={2} title="วิธีที่เราใช้ข้อมูล">
          เราใช้ข้อมูลเพื่อ: แสดงและคำนวณพอร์ตของคุณ, คำนวณกำไร/ขาดทุนและสัดส่วน, บันทึกประวัติมูลค่าพอร์ตเพื่อแสดงกราฟการเติบโต,
          ให้คุณส่งออกรายงานเป็น Google Sheet, และจดจำการตั้งค่าของคุณข้ามอุปกรณ์ เราไม่ใช้ข้อมูลเพื่อโฆษณา
          และไม่สร้างโปรไฟล์เพื่อการตลาด
        </Section>

        <Section n={3} title="การเข้าถึงข้อมูล Google (Drive / Sheets)">
          หากคุณเลือกเชื่อมต่อ Google เพื่อส่งออกรายงาน แอปจะขอสิทธิ์แบบจำกัด (<code>drive.file</code> และ <code>spreadsheets</code>)
          เพื่อ<b style={{ color: 'var(--text)' }}>สร้างและแก้ไขเฉพาะไฟล์สเปรดชีตที่แอปสร้างขึ้นเอง</b> (เช่น “WealthPlanner Report”) เท่านั้น
          แอปไม่เข้าถึงไฟล์อื่นใน Google Drive ของคุณ
          <p style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            การใช้งานและการโอนข้อมูลที่ได้รับจาก Google API ของ WealthPlanner เป็นไปตาม{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="inlink">
              Google API Services User Data Policy
            </a>{' '}รวมถึงข้อกำหนด Limited Use — เราใช้ข้อมูล Google เพื่อให้ฟีเจอร์ส่งออกรายงานแก่คุณเท่านั้น
            ไม่โอนหรือขายให้บุคคลที่สาม ไม่ใช้เพื่อโฆษณา และไม่ให้มนุษย์อ่านข้อมูล เว้นแต่คุณยินยอม จำเป็นด้านความปลอดภัย หรือเพื่อปฏิบัติตามกฎหมาย
          </p>
        </Section>

        <Section n={4} title="ที่จัดเก็บและผู้ให้บริการบุคคลที่สาม">
          เราจัดเก็บข้อมูลผ่านผู้ให้บริการโครงสร้างพื้นฐานต่อไปนี้ ซึ่งประมวลผลข้อมูลในนามของเรา:
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li><b style={{ color: 'var(--text)' }}>Supabase</b> — ฐานข้อมูลพอร์ต การตั้งค่า และประวัติมูลค่า</li>
            <li><b style={{ color: 'var(--text)' }}>Cloudflare</b> — โฮสต์เว็บแอปและจัดเก็บรูปสลิปชั่วคราว</li>
            <li><b style={{ color: 'var(--text)' }}>Google / LINE</b> — การยืนยันตัวตน (เข้าสู่ระบบ) และ Google Sheets สำหรับส่งออก</li>
          </ul>
        </Section>

        <Section n={5} title="การเก็บรักษาและการลบข้อมูล">
          เราเก็บข้อมูลไว้ตราบที่บัญชีของคุณยังใช้งาน คุณสามารถลบรายการสินทรัพย์ได้เองในแอป
          หรือขอให้ลบข้อมูลทั้งหมดของคุณได้โดยติดต่อเราตามข้อ 8 เราจะดำเนินการลบภายในเวลาอันสมควร
          คุณสามารถเพิกถอนสิทธิ์ที่ให้ Google ได้ที่{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="inlink">Google Account → ความปลอดภัย</a> ได้ทุกเมื่อ
        </Section>

        <Section n={6} title="ความปลอดภัย">
          ข้อมูลรับส่งผ่านการเข้ารหัส (HTTPS) และเข้าถึงฐานข้อมูลผ่านคีย์ฝั่งเซิร์ฟเวอร์เท่านั้น
          เราจำกัดการเข้าถึงข้อมูลพอร์ตให้เฉพาะเจ้าของบัญชี อย่างไรก็ตามไม่มีระบบใดปลอดภัย 100%
          เราจึงแนะนำให้คุณดูแลการเข้าถึงบัญชี Google/LINE ของคุณด้วย
        </Section>

        <Section n={7} title="สิทธิของคุณ">
          คุณมีสิทธิเข้าถึง แก้ไข ส่งออก และลบข้อมูลของคุณ รวมถึงเพิกถอนความยินยอมในการเชื่อมต่อ Google ได้ทุกเมื่อ
          หากมีข้อสงสัยเกี่ยวกับการใช้ข้อมูล ติดต่อเราได้ตามช่องทางด้านล่าง
        </Section>

        <Section n={8} title="ติดต่อเรา">
          หากมีคำถามเกี่ยวกับนโยบายนี้ หรือต้องการใช้สิทธิเกี่ยวกับข้อมูลของคุณ ติดต่อ:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="inlink">{CONTACT_EMAIL}</a>
        </Section>

        <Section n={9} title="การเปลี่ยนแปลงนโยบาย">
          เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงสำคัญ เราจะอัปเดตวันที่มีผลด้านบน
          การใช้งานแอปต่อไปถือว่าคุณยอมรับนโยบายฉบับปรับปรุง
        </Section>
      </section>

      <p className="note" style={{ textAlign: 'center' }}>WealthPlanner · นโยบายนี้ใช้กับแอปที่ wealthplaner.pages.dev</p>
    </main>
  );
}
