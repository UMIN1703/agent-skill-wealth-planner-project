// Delta — colorblind-safe gain/loss indicator (▲▼ + sign ALWAYS, per DSN)
export function Delta({ percent }: { percent: number | null }) {
  if (percent == null) return <span className="delta na">—</span>;
  const up = percent >= 0;
  return (
    <span className={up ? 'delta up num' : 'delta down num'}>
      {up ? '▲' : '▼'} {up ? '+' : '−'}
      {Math.abs(percent).toFixed(2)}%
    </span>
  );
}
