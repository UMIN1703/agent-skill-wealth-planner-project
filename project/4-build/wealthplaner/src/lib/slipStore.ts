// Staging seam สำหรับ F009 (CR-WPN-002) — จุดต่อ Cloudflare KV (index) + R2 (ไฟล์รูป)
// ยังไม่ wire ของจริง (Class B: KV/R2 namespace + binding) — stub คืนค่าว่างอย่างตรงไปตรงมา
import { type PendingSlip } from './slip.ts';

/** ตั้งค่าแล้วหรือยัง (จะ true เมื่อผูก KV/R2 binding) */
export function stagingConfigured(): boolean {
  return !!process.env.SLIP_STAGING;
}

/** F009 AC-02 — ดึงสลิปที่รอยืนยันของผู้ใช้ (จับคู่ด้วย lineUserId) */
export async function listPendingSlips(lineUserId: string | undefined): Promise<PendingSlip[]> {
  // TODO(F009 Class B): อ่าน index จาก Cloudflare KV ที่ key = lineUserId แล้วชี้รูปไป R2
  void lineUserId;
  return [];
}

/** อ่านไบต์รูปสลิปจาก staging (R2) ด้วย id — ใช้ตอนยืนยันเพื่ออัปขึ้น Drive */
export async function getStagedSlipMedia(
  id: string,
): Promise<{ bytes: Uint8Array; mediaType: string } | null> {
  // TODO(F009 Class B): อ่าน object จาก R2 (key = id) + content-type
  void id;
  return null;
}

/** นำสลิปออกจาก staging หลังบันทึกสำเร็จ (AC-03) */
export async function removePendingSlip(id: string): Promise<void> {
  // TODO(F009 Class B): ลบ index ใน KV + object ใน R2
  void id;
}

/** ตัวอย่างสลิป (เดโม) ไว้พรีวิวฟอร์มยืนยันระหว่างยังไม่ wire staging */
export function demoPendingSlip(): PendingSlip {
  return {
    id: 'demo-1',
    sourceMessageId: 'demo-msg-1',
    lineUserId: 'demo-user',
    imageUrl: '', // ว่าง → ฟอร์มแสดงกล่องพรีวิวแทน
    receivedAt: new Date().toISOString(),
  };
}
