import { Delta } from './Delta.tsx';

const baht = (n: number) => '฿' + new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

export function AssetRow({
  name, broker, valueTHB, percent, stale,
}: { name: string; broker: string; valueTHB: number; percent: number | null; stale?: boolean }) {
  return (
    <div className="arow">
      <span>
        <span className="nm">{name}</span>
        <span className="broker">{broker}</span>
      </span>
      <span className="rt">
        <div className="price num">{baht(valueTHB)}</div>
        {stale ? <span className="pstatus stale num">ราคาเก่า</span> : <Delta percent={percent} />}
      </span>
    </div>
  );
}
