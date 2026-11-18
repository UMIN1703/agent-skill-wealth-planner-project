// LINE Messaging API — ดาวน์โหลดรูปสลิป + ตอบกลับ (F009)
// ต้องมี Channel access token (Messaging API channel) — คนละตัวกับ secret
const CONTENT_URL = (messageId: string) => `https://api-data.line.me/v2/bot/message/${messageId}/content`;
const REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const PUSH_URL = 'https://api.line.me/v2/bot/message/push';

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

// ── ข้อความแบบปุ่ม/การ์ด (CR-WPN-005/007) — ปุ่มลิงก์ (uri) หรือปุ่มกดในแชต (postback) ──
export type LineUriAction = { label: string; uri: string };
export type LinePostbackAction = { label: string; data: string };
export type LineAction = LineUriAction | LinePostbackAction;

function toAction(a: LineAction) {
  const label = a.label.slice(0, 20);
  return 'uri' in a
    ? { type: 'uri', label, uri: a.uri }
    : { type: 'postback', label, data: a.data.slice(0, 300), displayText: a.label };
}

/** สร้าง buttons template (ตัดความยาวตามลิมิต LINE: text ≤160, label ≤20, ≤4 ปุ่ม) */
function buttonsMessage(text: string, actions: LineAction[], altText: string) {
  return {
    type: 'template',
    altText: altText.slice(0, 400),
    template: {
      type: 'buttons',
      text: text.slice(0, 160),
      actions: actions.slice(0, 4).map(toAction),
    },
  };
}

/** reply ด้วยข้อความ+ปุ่ม (ตอบทันทีหลังรับสลิป) */
export async function replyLineButtons(
  token: string, replyToken: string, text: string, actions: LineAction[], altText = text,
): Promise<void> {
  const res = await fetch(REPLY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyToken, messages: [buttonsMessage(text, actions, altText)] }),
  });
  if (!res.ok) throw new Error(`LINE reply ${res.status}: ${await res.text()}`);
}

/** push ข้อความ+ปุ่มไปหาผู้ใช้ (ใช้ตอนยืนยันบนเว็บเสร็จ — replyToken หมดอายุแล้ว)
 *  to = messaging userId (จาก source.userId ของ webhook / claim.u) */
export async function pushLineButtons(
  token: string, to: string, text: string, actions: LineAction[], altText = text,
): Promise<void> {
  const res = await fetch(PUSH_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, messages: [buttonsMessage(text, actions, altText)] }),
  });
  if (!res.ok) throw new Error(`LINE push ${res.status}: ${await res.text()}`);
}
