'use client';

// ลิสต์สินทรัพย์ — แถบเลือกหมวด (chip) · "ทั้งหมด" + รายหมวด · เรียงตามความเสี่ยงน้อย→มาก
// แก้ไข/ลบรายการได้ในที่ (เฉพาะรายการจริงที่มี id) → บันทึกแล้ว router.refresh() + เด้งขึ้น "ล่าสุด"
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Check, X, ChevronRight } from 'lucide-react';
import { Delta } from './Delta.tsx';
import Amount from './Amount.tsx';
import { categoryRiskRank } from '@/lib/portfolio.ts';

export type AssetRowData = {
  id?: string; name: string; broker: string; group: string;
  quantity: number; costPrice: number; currentPrice: number | null; note?: string;
  valueTHB: number; pct: number | null; stale: boolean;
};

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

// สีจุดประจำหมวด (ตรงกับ AllocationTabs) + fallback deterministic
const CAT_COLORS: Record<string, string> = {
  'เงินสด': '#9CA3AF', 'เงินสำรองฉุกเฉิน': '#34D399', 'เกษียณ': '#4FD1C5',
  'ทองคำ': '#C1FD42', 'หุ้นไทย': '#7B72FF', 'หุ้นต่างประเทศ': '#60A5FA', 'คริปโต': '#FB923C',
};
const PALETTE = ['#7B72FF', '#F982FB', '#4FD1C5', '#60A5FA', '#C1FD42', '#FB923C', '#34D399', '#A78BFA'];
function dotColor(name: string): string {
  if (CAT_COLORS[name]) return CAT_COLORS[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

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
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({}); // หมวดที่กางอยู่ (accordion)

  const groups = new Map<string, AssetRowData[]>();
  for (const r of rows) {
    const arr = groups.get(r.group) ?? [];
    arr.push(r);
    groups.set(r.group, arr);
  }
  const ordered = [...groups.entries()]
    .map(([group, items]) => ({ group, items, sub: items.reduce((x, r) => x + r.valueTHB, 0) }))
    .sort((a, b) => categoryRiskRank(a.group) - categoryRiskRank(b.group) || b.sub - a.sub);

  const onSaved = () => { setEditing(null); router.refresh(); };
  const toggle = (g: string) => setOpen((o) => ({ ...o, [g]: !o[g] }));

  if (rows.length === 0) {
    return <section className="card"><p className="empty">ยังไม่มีสินทรัพย์</p></section>;
  }

  return (
    <section className="card">
      {ordered.map((g) => {
        const expanded = !!open[g.group];
        return (
        <div key={g.group}>
          {/* หัวหมวด (accordion) — จุดสี · ชื่อ · % กลาง · ยอดชิดขวา(align กับยอดย่อย) · chevron */}
          <button type="button" aria-expanded={expanded} onClick={() => toggle(g.group)}
            style={{
              width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border)',
              color: 'inherit', font: 'inherit', cursor: 'pointer',
              display: 'grid', gridTemplateColumns: 'auto auto 1fr auto 32px', alignItems: 'center', gap: 10,
              padding: '15px 0 13px', textAlign: 'left',
            }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: dotColor(g.group), flexShrink: 0 }} />
            <span style={{ fontWeight: 700 }}>{g.group}</span>
            <span className="num" style={{ fontWeight: 800, textAlign: 'center' }}>{totalTHB > 0 ? (g.sub / totalTHB * 100).toFixed(2) : '0.00'}%</span>
            <span className="num" style={{ textAlign: 'right' }}>฿<Amount>{fmt(g.sub)}</Amount></span>
            <ChevronRight size={18} style={{ justifySelf: 'center', color: 'var(--muted)', transition: 'transform .15s', transform: expanded ? 'rotate(90deg)' : 'none' }} />
          </button>
          {expanded && g.items.map((r, i) => (
            <div key={r.id ?? r.name + r.broker + i}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto 32px', alignItems: 'center', gap: 10,
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span className="nm" style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span className="broker">{r.broker}</span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <div className="price num">฿<Amount>{fmt(r.valueTHB)}</Amount></div>
                  {r.stale ? <span className="pstatus stale num">ราคาเก่า</span> : <Delta percent={r.pct} />}
                </span>
                {r.id ? (
                  <button type="button" aria-label={'แก้ไข ' + r.name} onClick={() => setEditing(editing === r.id ? null : (r.id ?? null))}
                    style={{
                      width: 32, height: 32, borderRadius: 9, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: editing === r.id ? 'var(--brand)' : 'var(--surface-2)',
                      border: '1px solid var(--border)', color: editing === r.id ? '#fff' : 'var(--muted)',
                    }}>
                    <Pencil size={15} />
                  </button>
                ) : <span />}
              </div>
              {editing === r.id && r.id && (
                <EditForm row={r} onCancel={() => setEditing(null)} onSaved={onSaved} />
              )}
            </div>
          ))}
        </div>
        );
      })}
    </section>
  );
}
