'use client';

// ลิสต์สินทรัพย์ — แถบเลือกหมวด (chip) · "ทั้งหมด" + รายหมวด · เรียงตามความเสี่ยงน้อย→มาก
// แก้ไข/ลบรายการได้ในที่ (เฉพาะรายการจริงที่มี id) → บันทึกแล้ว router.refresh() + เด้งขึ้น "ล่าสุด"
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Delta } from './Delta.tsx';
import Amount from './Amount.tsx';
import { categoryRiskRank } from '@/lib/portfolio.ts';

export type AssetRowData = {
  id?: string; name: string; broker: string; group: string;
  quantity: number; costPrice: number; currentPrice: number | null; note?: string;
  valueTHB: number; pct: number | null; stale: boolean;
};

const ALL = 'ทั้งหมด';
const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
const compact = (n: number) => {
  const a = Math.abs(n);
  return a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k' : fmt(n);
};

// field wrapper ระดับโมดูล (ถ้านิยามในคอมโพเนนต์ จะ remount ทุก render → input หลุดโฟกัส)
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
      {label}{children}
    </label>
  );
}

function EditForm({ row, onCancel, onSaved }: { row: AssetRowData; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(row.name);
  const [broker, setBroker] = useState(row.broker);
  const [qty, setQty] = useState(String(row.quantity));
  const [cost, setCost] = useState(String(row.costPrice));
  const [cur, setCur] = useState(row.currentPrice == null ? '' : String(row.currentPrice));
  const [note, setNote] = useState(row.note ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send(method: 'PATCH' | 'DELETE', body: unknown) {
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/holdings', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string };
      if (res.ok && j.ok) { onSaved(); return; }
      setErr(j.reason ?? 'ไม่สำเร็จ ลองใหม่');
    } catch { setErr('เครือข่ายขัดข้อง ลองใหม่'); }
    setBusy(false);
  }

  const save = () => send('PATCH', {
    id: row.id,
    patch: {
      name: name.trim(), brokerChannel: broker.trim(),
      quantity: Number(qty), costPrice: Number(cost),
      currentPrice: cur.trim() === '' ? null : Number(cur), note: note.trim(),
    },
  });
  const del = () => { if (confirm(`ลบ "${row.name}" ออกจากพอร์ต?`)) send('DELETE', { id: row.id }); };

  return (
    <div style={{ padding: '12px 2px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="ชื่อ"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="ช่องทาง/สถาบัน"><input className="input" value={broker} onChange={(e) => setBroker(e.target.value)} /></Field>
        <Field label="จำนวนหน่วย"><input className="input num" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="ต้นทุน/หน่วย"><input className="input num" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
        <Field label="ราคาปัจจุบัน/หน่วย"><input className="input num" inputMode="decimal" placeholder="—" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <Field label="โน้ต"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
      {err && <p className="note" style={{ color: 'var(--loss)', margin: '8px 2px 0' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="btn-primary" disabled={busy} onClick={save} style={{ width: 'auto', padding: '8px 16px' }}>
          <Check size={16} /> บันทึก
        </button>
        <button type="button" className="btn-ghost" disabled={busy} onClick={onCancel} style={{ width: 'auto', padding: '8px 14px' }}>
          <X size={15} /> ยกเลิก
        </button>
        <button type="button" className="btn-ghost" disabled={busy} onClick={del}
          style={{ width: 'auto', padding: '8px 14px', marginLeft: 'auto', color: 'var(--loss)', borderColor: 'color-mix(in srgb, var(--loss) 40%, transparent)' }}>
          <Trash2 size={15} /> ลบ
        </button>
      </div>
    </div>
  );
}

export default function AssetList({ rows, totalTHB }: { rows: AssetRowData[]; totalTHB: number }) {
  const router = useRouter();
  const [sel, setSel] = useState<string>(ALL);
  const [editing, setEditing] = useState<string | null>(null);

  const groups = new Map<string, AssetRowData[]>();
  for (const r of rows) {
    const arr = groups.get(r.group) ?? [];
    arr.push(r);
    groups.set(r.group, arr);
  }
  const ordered = [...groups.entries()]
    .map(([group, items]) => ({ group, items, sub: items.reduce((x, r) => x + r.valueTHB, 0) }))
    .sort((a, b) => categoryRiskRank(a.group) - categoryRiskRank(b.group) || b.sub - a.sub);

  const shown = sel === ALL ? ordered : ordered.filter((g) => g.group === sel);
  const onSaved = () => { setEditing(null); router.refresh(); };

  if (rows.length === 0) {
    return <section className="card"><h2>สินทรัพย์</h2><p className="empty">ยังไม่มีสินทรัพย์</p></section>;
  }

  return (
    <section className="card">
      <h2>สินทรัพย์</h2>
      <div className="cat-chips" role="tablist" aria-label="หมวดสินทรัพย์">
        <button type="button" role="tab" aria-selected={sel === ALL} className={'cat-chip' + (sel === ALL ? ' on' : '')} onClick={() => setSel(ALL)}>{ALL}</button>
        {ordered.map((g) => (
          <button type="button" key={g.group} role="tab" aria-selected={sel === g.group} className={'cat-chip' + (sel === g.group ? ' on' : '')} onClick={() => setSel(g.group)}>{g.group}</button>
        ))}
      </div>

      {shown.map((g) => (
        <div key={g.group} className="pf-group-wrap">
          <div className="pf-group">
            <span className="gt">{g.group}</span>
            <span className="gv num">฿<Amount>{compact(g.sub)}</Amount> · {totalTHB > 0 ? Math.round((g.sub / totalTHB) * 100) : 0}%</span>
          </div>
          {g.items.map((r, i) => (
            <div key={r.id ?? r.name + r.broker + i}>
              <div className="arow" style={{ alignItems: 'center' }}>
                <span className="nm" style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span className="broker">{r.broker}</span>
                </span>
                <span className="rt">
                  <div className="price num">฿<Amount>{fmt(r.valueTHB)}</Amount></div>
                  {r.stale ? <span className="pstatus stale num">ราคาเก่า</span> : <Delta percent={r.pct} />}
                </span>
                {r.id && (
                  <button type="button" aria-label={'แก้ไข ' + r.name} onClick={() => setEditing(editing === r.id ? null : (r.id ?? null))}
                    style={{
                      marginLeft: 10, flexShrink: 0, width: 32, height: 32, borderRadius: 9, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: editing === r.id ? 'var(--brand)' : 'var(--surface-2)',
                      border: '1px solid var(--border)', color: editing === r.id ? '#fff' : 'var(--muted)',
                    }}>
                    <Pencil size={15} />
                  </button>
                )}
              </div>
              {editing === r.id && r.id && (
                <EditForm row={r} onCancel={() => setEditing(null)} onSaved={onSaved} />
              )}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
