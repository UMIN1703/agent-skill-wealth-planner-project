// LINE Messaging API — ดาวน์โหลดรูปสลิป + ตอบกลับ (F009)
// ต้องมี Channel access token (Messaging API channel) — คนละตัวกับ secret
const CONTENT_URL = (messageId: string) => `https://api-data.line.me/v2/bot/message/${messageId}/content`;
const REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

/** ดาวน์โหลด binary ของข้อความรูป (AC-01) */
export async function downloadLineContent(
  token: string, messageId: string,
): Promise<{ bytes: ArrayBuffer; mediaType: string }> {
  const res = await fetch(CONTENT_URL(messageId), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`LINE content ${res.status}: ${await res.text()}`);
  return { bytes: await res.arrayBuffer(), mediaType: res.headers.get('content-type') ?? 'image/jpeg' };
}

/** ตอบกลับผู้ใช้ด้วยข้อความ (ยืนยันรับสลิป / แจ้งไม่รองรับ) */
export async function replyLineText(token: string, replyToken: string, text: string): Promise<void> {
  const res = await fetch(REPLY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  });
  if (!res.ok) throw new Error(`LINE reply ${res.status}: ${await res.text()}`);
}
