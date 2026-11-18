'use client';

// หน้าเพิ่มสินทรัพย์ (F001) — DSN-WPN-001 §5.2
// ต่อ validation จริงจาก lib/asset.ts (validateAssetDraft, isDuplicate, draftToDisplayAsset)
// ครอบคลุม AC-01 (เพิ่มแล้วปรากฏในรายการ) · AC-E01 ไม่ครบ+focus · AC-E02 ติดลบ/ไม่ใช่ตัวเลข
// · AC-E03 ซ้ำ→ยืนยัน · AC-E04 broker บังคับ · สถานะกำลังบันทึก
// ข้อมูลอยู่ในหน่วยความจำ (mock) — การคงอยู่ข้ามเซสชันคือชั้น Supabase (Class B, รอ creds)

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Plus, Sparkles } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton.tsx';
import {
  validateAssetDraft,
  isDuplicate,
  draftToDisplayAsset,
  ASSET_TYPE_LABELS,
  type AssetDraft,
  type AssetType,
  type FieldError,
} from '@/lib/asset.ts';
import { sampleAssets, type DisplayAsset } from '@/data/sampleAssets.ts';
import { marketValueTHB } from '@/lib/portfolio.ts';

const BROKERS = ['SCBS', 'KBank', 'IBKR', 'Bualuang', 'manual'];
const baht = (n: number) => '฿' + new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

const emptyDraft: AssetDraft = { name: '', type: '', quantity: null, costPrice: null, brokerChannel: '' };

// field → id ของ control (สำหรับเลื่อน focus ไปช่องแรกที่ผิด — F001 AC-E01)
const FIELD_ID: Record<keyof AssetDraft, string> = {
  name: 'f-name', type: 'f-type', quantity: 'f-qty', costPrice: 'f-cost', brokerChannel: 'f-broker',
};
const focusField = (f: keyof AssetDraft) => document.getElementById(FIELD_ID[f])?.focus();

function AddAssetInner() {
  // สะพานจากสลิป (F009→F001): เติมประเภท/โบรก/ชื่อ จาก query · ยอดสลิป (amount) = ยอดรวมบาท
  const params = useSearchParams();
  const fromSlip = params.get('from') === 'slip';
  const seedType = params.get('type');
  const seedBroker = params.get('broker') ?? '';
  const seedName = params.get('name') ?? '';
  const slipTotal = Number(params.get('amount')) || null; // ยอดรวมจากสลิป (บาท) ไว้คำนวณต้นทุน/หน่วย

  const seededDraft: AssetDraft = {
    name: seedName,
    type: seedType && (seedType in ASSET_TYPE_LABELS) ? (seedType as AssetType) : '',
    quantity: null,
    costPrice: null,
    brokerChannel: seedBroker,
  };
  // โบรกจากสลิป (เช่น ttb) อาจไม่อยู่ในลิสต์มาตรฐาน → เติมเข้า option ให้เลือกได้
  const brokers = seedBroker && !BROKERS.includes(seedBroker) ? [seedBroker, ...BROKERS] : BROKERS;

  const [draft, setDraft] = useState<AssetDraft>(seededDraft);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [saving, setSaving] = useState(false);
  const [dupPending, setDupPending] = useState(false); // AC-E03: รอผู้ใช้ยืนยันเพิ่มทั้งที่ซ้ำ
  const [added, setAdded] = useState<DisplayAsset[]>([]); // รายการที่เพิ่มในเซสชันนี้ (optimistic)
  const [saveNote, setSaveNote] = useState<{ kind: 'ok' | 'warn' | 'error'; text: string } | null>(null);

  const errFor = (f: keyof AssetDraft) => errors.find((e) => e.field === f)?.message;

  const set = <K extends keyof AssetDraft>(field: K, value: AssetDraft[K]) => {
    setDraft((d) => ({ ...d, [field]: value }));
    if (errors.some((e) => e.field === field)) setErrors((es) => es.filter((e) => e.field !== field));
    setDupPending(false);
  };

  const num = (s: string): number | null => (s.trim() === '' ? null : Number(s));

  // กรอกจำนวน → ถ้ามียอดรวมจากสลิป และยังไม่ได้ใส่ต้นทุน → คำนวณต้นทุน/หน่วย = ยอดสลิป ÷ จำนวนให้
  const onQty = (s: string) => {
    const q = num(s);
    setDraft((d) => {
      const next = { ...d, quantity: q };
      if (slipTotal && q && q > 0 && d.costPrice == null) {
        next.costPrice = Math.round((slipTotal / q) * 100) / 100;
      }
      return next;
    });
    if (errors.some((e) => e.field === 'quantity')) setErrors((es) => es.filter((e) => e.field !== 'quantity'));
    setDupPending(false);
  };

  async function commit() {
    const asset = draftToDisplayAsset(draft);
    const payloadDraft = draft; // เก็บก่อนรีเซ็ต
    setAdded((list) => [asset, ...list]); // AC-01: ปรากฏในรายการ (optimistic)
    setDraft(emptyDraft);
    setErrors([]);
    setDupPending(false);
    focusField('name');

    // persist จริงลง Supabase (CR-WPN-006) — ยังไม่เชื่อม → เก็บเฉพาะเซสชัน (แจ้งตรง ๆ)
    try {
      const r = await fetch('/api/holdings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: payloadDraft, source: fromSlip ? 'slip' : 'manual' }),
      });
      const d = (await r.json()) as { ok: boolean; configured?: boolean; reason?: string };
      if (d.ok) setSaveNote({ kind: 'ok', text: 'บันทึกเข้าพอร์ตจริงแล้ว — ดูยอดรวมที่หน้าแรก' });
      else if (d.configured === false) setSaveNote({ kind: 'warn', text: 'บันทึกในเซสชันแล้ว (ยังไม่เชื่อมฐานข้อมูล — reload แล้วหาย)' });
      else setSaveNote({ kind: 'error', text: d.reason ?? 'บันทึกลงฐานข้อมูลไม่สำเร็จ' });
    } catch {
      setSaveNote({ kind: 'error', text: 'เครือข่ายขัดข้อง — บันทึกในเซสชันไว้ก่อน' });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // AC-E01/E02/E04 — ตรวจครบ/ชนิด/บังคับ ก่อน แล้วเลื่อน focus ช่องแรกที่ผิด
    const result = validateAssetDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      setDupPending(false);
      focusField(result.firstField);
      return;
    }
    setErrors([]);

    // AC-E03 — ซ้ำ (ชื่อ+broker เดียวกัน) → เตือนและขอยืนยันก่อนเพิ่ม
    const existing = [...sampleAssets, ...added].map((a) => ({ name: a.name, brokerChannel: a.brokerChannel }));
    if (!dupPending && isDuplicate({ name: draft.name, brokerChannel: draft.brokerChannel }, existing)) {
      setDupPending(true);
      return;
    }

    // สถานะกำลังบันทึก (DSN §5.2)
    setSaving(true);
    setSaveNote(null);
    await commit();
    setSaving(false);
  }

  return (
    <main className="app">
      <div className="topbar">
        <h1>เพิ่มสินทรัพย์</h1>
        <LogoutButton />
      </div>

      {fromSlip && (
        <div className="notice warn" role="status" style={{ marginBottom: 12 }}>
          <Sparkles size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          เติมจากสลิปแล้ว: ประเภท/โบรก{slipTotal ? ` · ยอดสลิป ${baht(slipTotal)}` : ''} — กรอก <strong>ชื่อ + จำนวนหน่วย</strong> ที่เหลือ
          {slipTotal ? ' (ใส่จำนวนแล้วระบบคำนวณต้นทุน/หน่วยให้)' : ''}
        </div>
      )}

      <form className="card form" onSubmit={onSubmit} noValidate>
        <Field id="f-name" label="ชื่อสินทรัพย์" error={errFor('name')}>
          <input
            id="f-name" type="text" className="input" placeholder="เช่น PTT, AAPL, ทองคำ 96.5%"
            value={draft.name} onChange={(e) => set('name', e.target.value)}
            aria-invalid={!!errFor('name')} aria-describedby={errFor('name') ? 'f-name-err' : undefined}
          />
        </Field>

        <Field id="f-type" label="ประเภทสินทรัพย์" error={errFor('type')}>
          <select
            id="f-type" className="input"
            value={draft.type} onChange={(e) => set('type', e.target.value as AssetType | '')}
            aria-invalid={!!errFor('type')} aria-describedby={errFor('type') ? 'f-type-err' : undefined}
          >
            <option value="">— เลือกประเภท —</option>
            {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((t) => (
              <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        <div className="row2">
          <Field id="f-qty" label="จำนวน" error={errFor('quantity')}>
            <input
              id="f-qty" type="number" inputMode="decimal" step="any" className="input num" placeholder="0"
              value={draft.quantity ?? ''} onChange={(e) => onQty(e.target.value)}
              aria-invalid={!!errFor('quantity')} aria-describedby={errFor('quantity') ? 'f-qty-err' : undefined}
            />
          </Field>
          <Field id="f-cost" label="ราคาต้นทุน (บาท/หน่วย)" error={errFor('costPrice')}>
            <input
              id="f-cost" type="number" inputMode="decimal" step="any" className="input num" placeholder="0.00"
              value={draft.costPrice ?? ''} onChange={(e) => set('costPrice', num(e.target.value))}
              aria-invalid={!!errFor('costPrice')} aria-describedby={errFor('costPrice') ? 'f-cost-err' : undefined}
            />
          </Field>
        </div>

        <Field id="f-broker" label="Broker channel (บังคับ)" error={errFor('brokerChannel')}>
          <select
            id="f-broker" className="input"
            value={draft.brokerChannel} onChange={(e) => set('brokerChannel', e.target.value)}
            aria-invalid={!!errFor('brokerChannel')} aria-describedby={errFor('brokerChannel') ? 'f-broker-err' : undefined}
          >
            <option value="">— เลือกโบรก/ช่องทาง —</option>
            {brokers.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>

        {dupPending && (
          <div className="notice warn" role="alert">
            มีสินทรัพย์ชื่อ “{draft.name.trim()}” ที่โบรก “{draft.brokerChannel}” อยู่แล้ว — กดบันทึกอีกครั้งเพื่อยืนยันเพิ่มเป็นรายการแยก
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'กำลังบันทึก…' : dupPending ? <>ยืนยันเพิ่มทั้งที่ซ้ำ</> : <><Plus size={18} /> บันทึกสินทรัพย์</>}
        </button>

        {saveNote && (
          <div className={'notice ' + (saveNote.kind === 'error' ? 'error' : 'warn')} role={saveNote.kind === 'error' ? 'alert' : 'status'}>
            {saveNote.text}
          </div>
        )}
      </form>

      {/* AC-01: สินทรัพย์ที่เพิ่มปรากฏในรายการ (mock ในเซสชัน — คงอยู่ข้ามเซสชัน = Supabase, Class B) */}
      <section className="card" aria-live="polite">
        <h2>เพิ่มในเซสชันนี้ ({added.length})</h2>
        {added.length === 0 ? (
          <p className="empty">ยังไม่ได้เพิ่มสินทรัพย์ — กรอกฟอร์มด้านบนแล้วกดบันทึก</p>
        ) : (
          added.map((a, i) => (
            <div className="arow" key={a.name + a.brokerChannel + i}>
              <span>
                <span className="nm">{a.name}</span>
                <span className="broker">{a.brokerChannel}</span>
              </span>
              <span className="rt">
                <div className="price num">{baht(marketValueTHB(a))}</div>
                <span className="pstatus stale num" aria-label="ยังไม่มีราคาตลาด ใช้ราคาต้นทุน">ยังไม่มีราคาตลาด</span>
              </span>
            </div>
          ))
        )}
        {added.length > 0 && (
          <p className="note"><Check size={13} /> เพิ่มแล้ว · ดูรวมในพอร์ตที่หน้าแรก (ราคาตลาดจริงคือ F003/F004 รอ ToS)</p>
        )}
      </section>
    </main>
  );
}

// useSearchParams ต้องอยู่ใต้ Suspense (Next.js app router) — ครอบไว้
export default function AddAssetPage() {
  return (
    <Suspense fallback={<main className="app"><div className="topbar"><h1>เพิ่มสินทรัพย์</h1></div></main>}>
      <AddAssetInner />
    </Suspense>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={'field' + (error ? ' has-error' : '')}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="field-err" id={id + '-err'} role="alert">{error}</span>}
    </div>
  );
}
