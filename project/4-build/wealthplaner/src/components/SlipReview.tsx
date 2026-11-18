'use client';

// ฟอร์มยืนยันสลิป (F009 AC-03) — ผู้ใช้กรอก/ยืนยัน ยอด·วันที่·หมวด แล้วบันทึก
// ใช้ validateSlipEntry (pure) ตรวจก่อน · เมื่อยังไม่ wire Google Drive (Class B)
// การกดบันทึกจะแสดง "ค่าที่จะบันทึก" อย่างตรงไปตรงมา ไม่แกล้งว่าบันทึกสำเร็จ
import { useState } from 'react';
import { Receipt, Check, Sparkles, Loader2 } from 'lucide-react';
import {
  validateSlipEntry, slipToSheetRow, SLIP_CATEGORIES, SLIP_ASSET_TYPES, SLIP_SHEET_COLUMNS,
  type PendingSlip, type SlipCategory,
} from '@/lib/slip.ts';
import { type AssetType } from '@/lib/asset.ts';
import { parseSlipText } from '@/lib/slipParse.ts';

const today = () => new Date().toISOString().slice(0, 10);

export default function SlipReview({ slip, configured, claim }: { slip: PendingSlip; configured: boolean; claim?: string }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<SlipCategory | ''>('');
  const [assetType, setAssetType] = useState<AssetType | ''>('');
  const [channel, setChannel] = useState('');
  const [name, setName] = useState('');       // ชื่อสินทรัพย์ (ถ้าจะเพิ่มเข้าพอร์ตด้วย)
  const [quantity, setQuantity] = useState(''); // จำนวนหน่วย (ถ้าจะเพิ่มเข้าพอร์ตด้วย)
  const [curPrice, setCurPrice] = useState(''); // ราคาปัจจุบัน/หน่วย (ไม่บังคับ) → P&L จริง
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; date?: string; category?: string }>({});
  const [saved, setSaved] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'warn' | 'error' | 'ok'; text: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);

  // CR-WPN-003 — อ่านสลิปอัตโนมัติด้วย Tesseract.js (ฟรี รันในเบราว์เซอร์) แล้วเติมฟอร์ม
  async function onAutoFill() {
    if (!slip.imageUrl) { setNotice({ kind: 'warn', text: 'เดโมไม่มีรูปสลิปจริงให้อ่าน' }); return; }
    setReading(true); setNotice(null); setProgress(0);
    try {
      const img = await fetch(slip.imageUrl);
      if (!img.ok) throw new Error('image');
      const blob = await img.blob();
      const Tesseract = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(blob, 'tha+eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
        },
      });
      const parsed = parseSlipText(data.text);
      let filled = 0;
      if (parsed.amountTHB) { setAmount(String(parsed.amountTHB)); filled++; }
      if (parsed.date) { setDate(parsed.date); filled++; }
      if (parsed.category) { setCategory(parsed.category); filled++; }
      if (parsed.channel) { setChannel(parsed.channel); filled++; }
      setErrors({});
      setNotice(filled > 0
        ? { kind: 'ok', text: `อ่านสลิปแล้ว ✨ เติมให้ ${filled} ช่อง — ตรวจ/แก้ก่อนบันทึก` }
        : { kind: 'warn', text: 'อ่านไม่ชัด — กรอกเองได้เลย (OCR ฟรีอาจพลาดบ้าง)' });
    } catch {
      setNotice({ kind: 'error', text: 'อ่านสลิปไม่สำเร็จ ลองใหม่หรือกรอกเอง' });
    } finally {
      setReading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(null); setNotice(null);
    const res = validateSlipEntry({ amountTHB: amount, date, category, assetType, channel, note }, new Date());
    if (!res.ok) {
      setErrors(res.errors);
      document.getElementById(
        res.errors.amount ? 's-amount' : res.errors.date ? 's-date' : 's-category',
      )?.focus();
      return;
    }

    // ส่วนเพิ่มเข้าพอร์ต (ไม่บังคับ) — ถ้าจะเพิ่ม ต้องมีทั้ง ชื่อ + จำนวน + หมวดหมู่สินทรัพย์
    const wantPortfolio = !!(name.trim() || quantity.trim());
    const qty = Number(quantity.replace(/,/g, '').trim());
    if (wantPortfolio) {
      if (!name.trim() || !quantity.trim() || !(qty > 0)) {
        setNotice({ kind: 'error', text: 'จะเพิ่มเข้าพอร์ต ต้องกรอกทั้ง "ชื่อสินทรัพย์" และ "จำนวนหน่วย" (>0) — หรือเว้นทั้งคู่ถ้าบันทึกเฉพาะรายการ' });
        document.getElementById(!name.trim() ? 's-name' : 's-qty')?.focus();
        return;
      }
      if (!assetType) {
        setNotice({ kind: 'error', text: 'เลือก "หมวดหมู่สินทรัพย์" ด้วย เพื่อเพิ่มเข้าพอร์ต' });
        document.getElementById('s-asset-type')?.focus();
        return;
      }
    }
    setErrors({});

    if (!configured) {
      // Class B — ยังไม่เชื่อม staging/Drive → แสดงแถวที่จะบันทึก ไม่อ้างว่าบันทึกจริง
      setSaved(slipToSheetRow({
        ...res.entry,
        slipImageUrl: '(จะได้ URL หลังอัปขึ้น Drive)',
        sourceMessageId: slip.sourceMessageId,
        confirmedAt: new Date().toISOString(),
      }));
      return;
    }

    // staging พร้อม → ยิงครั้งเดียว: บันทึกสลิปลงชีต + (ถ้ากรอกพอร์ต) ส่งการ์ดยืนยันเข้าพอร์ตไป LINE
    setPending(true);
    try {
      const r = await fetch('/api/slips/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slip.id, sourceMessageId: slip.sourceMessageId, claim,
          draft: { amountTHB: amount, date, category, assetType, channel, note },
          portfolio: wantPortfolio ? { name: name.trim(), quantity: qty, currentPrice: curPrice.trim() ? Number(curPrice.replace(/,/g, '')) : null } : undefined,
        }),
      });
      const data = (await r.json()) as { ok: boolean; addedToPortfolio?: boolean; reason?: string };
      if (r.ok && data.ok) {
        setNotice({ kind: 'ok', text: data.addedToPortfolio
          ? 'บันทึกรายการ + เพิ่มเข้าพอร์ตแล้ว ✅ เปิดหน้าแรกดูยอดรวมได้เลย'
          : 'บันทึกรายการลงชีตแล้ว ✅' });
      } else {
        setNotice({ kind: 'error', text: data.reason ?? 'บันทึกไม่สำเร็จ ลองใหม่' });
      }
    } catch {
      setNotice({ kind: 'error', text: 'เครือข่ายขัดข้อง ลองใหม่' });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card slip-card">
      <div className="slip-preview" aria-hidden="true">
        {slip.imageUrl
          ? <img src={slip.imageUrl} alt="" className="slip-img" />
          : <span className="slip-ph"><Receipt size={22} /> ตัวอย่างรูปสลิป</span>}
      </div>

      <button type="button" className="btn-ai" onClick={onAutoFill} disabled={reading}>
        {reading
          ? <><Loader2 size={16} className="spin" /> กำลังอ่าน… {progress > 0 ? progress + '%' : ''}</>
          : <><Sparkles size={16} /> อ่านอัตโนมัติ (ฟรี)</>}
      </button>

      <form className="form" onSubmit={onSubmit} noValidate>
        <div className={'field' + (errors.amount ? ' has-error' : '')}>
          <label htmlFor="s-amount">ยอดเงิน (บาท)</label>
          <input
            id="s-amount" className="input" inputMode="decimal" placeholder="เช่น 1,250.50"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((x) => ({ ...x, amount: undefined })); }}
            aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 's-amount-err' : undefined}
          />
          {errors.amount && <span className="field-err" id="s-amount-err" role="alert">{errors.amount}</span>}
        </div>

        <div className={'field' + (errors.date ? ' has-error' : '')}>
          <label htmlFor="s-date">วันที่</label>
          <input
            id="s-date" type="date" className="input" value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: undefined })); }}
            aria-invalid={!!errors.date} aria-describedby={errors.date ? 's-date-err' : undefined}
          />
          {errors.date && <span className="field-err" id="s-date-err" role="alert">{errors.date}</span>}
        </div>

        <div className={'field' + (errors.category ? ' has-error' : '')}>
          <label htmlFor="s-category">หมวด</label>
          <select
            id="s-category" className="input" value={category}
            onChange={(e) => { setCategory(e.target.value as SlipCategory); setErrors((x) => ({ ...x, category: undefined })); }}
            aria-invalid={!!errors.category} aria-describedby={errors.category ? 's-category-err' : undefined}
          >
            <option value="">— เลือกหมวด —</option>
            {SLIP_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {errors.category && <span className="field-err" id="s-category-err" role="alert">{errors.category}</span>}
        </div>

        <div className="field">
          <label htmlFor="s-asset-type">หมวดหมู่สินทรัพย์ (ไม่บังคับ)</label>
          <select
            id="s-asset-type" className="input" value={assetType}
            onChange={(e) => setAssetType(e.target.value as AssetType | '')}
          >
            <option value="">— ไม่ระบุ —</option>
            {SLIP_ASSET_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="s-channel">ช่องทาง/สถาบัน (ไม่บังคับ)</label>
          <input
            id="s-channel" className="input" value={channel}
            onChange={(e) => setChannel(e.target.value)} placeholder="เช่น ttb, SCB, KBank"
          />
        </div>

        <p className="note" style={{ margin: '4px 0 0' }}>กรอก 2 ช่องนี้ถ้าจะ<strong>เพิ่มเข้าพอร์ตด้วย</strong> (เว้นไว้ = บันทึกเฉพาะรายการ)</p>

        <div className="field">
          <label htmlFor="s-name">ชื่อสินทรัพย์</label>
          <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น PTT, ทองคำ 96.5%" />
        </div>

        <div className="field">
          <label htmlFor="s-qty">จำนวนหน่วย</label>
          <input id="s-qty" className="input" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="เช่น 100" />
        </div>

        <div className="field">
          <label htmlFor="s-cur">ราคาปัจจุบัน/หน่วย (ไม่บังคับ)</label>
          <input id="s-cur" className="input" inputMode="decimal" value={curPrice} onChange={(e) => setCurPrice(e.target.value)} placeholder="เว้นว่าง = ใช้ราคาต้นทุน" />
        </div>

        <div className="field">
          <label htmlFor="s-note">บันทึกย่อ (ไม่บังคับ)</label>
          <input id="s-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น รอบซื้อ/โน้ต" />
        </div>

        <button type="submit" className="btn-primary" disabled={pending}><Check size={18} /> {pending ? 'กำลังบันทึก…' : 'ยืนยันและบันทึก'}</button>
      </form>

      {notice && (
        <div className={'notice ' + (notice.kind === 'ok' ? 'warn' : notice.kind)} role={notice.kind === 'error' ? 'alert' : 'status'}>
          {notice.text}
        </div>
      )}

      {saved && (
        <div className="notice warn" role="status">
          โหมดเดโม — ยังไม่ได้เชื่อม Google Drive/Sheets (Class B) จึง<strong>ยังไม่บันทึกจริง</strong>
          <div className="slip-row">
            {SLIP_SHEET_COLUMNS.map((col, i) => (
              <div key={col} className="slip-cell"><span className="k">{col}</span><span className="v">{saved[i]}</span></div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
