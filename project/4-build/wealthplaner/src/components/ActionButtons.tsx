import { Plus, ArrowUp, ArrowLeftRight } from 'lucide-react';

export function ActionButtons() {
  return (
    <div className="actions">
      <button className="act lime"><span className="ic"><Plus size={20} /></span><span className="t">ซื้อ / ขาย</span></button>
      <button className="act"><span className="ic"><ArrowUp size={20} /></span><span className="t">โอน</span></button>
      <button className="act"><span className="ic"><ArrowLeftRight size={20} /></span><span className="t">แลกเปลี่ยน</span></button>
    </div>
  );
}
