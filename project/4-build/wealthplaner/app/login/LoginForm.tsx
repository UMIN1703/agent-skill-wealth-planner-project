'use client';

// ฟอร์มเข้าสู่ระบบ (F008) — Single Sign-On เท่านั้น: Google + LINE
// client component · session guard อยู่ที่ page.tsx (server) · backend = Auth.js (NextAuth v5), session เป็น JWT
//   • Google — AUTH_GOOGLE_ID/SECRET · LINE — AUTH_LINE_ID/SECRET · + AUTH_SECRET ใน .env.local
// (เอาอีเมล/รหัสผ่าน + สมัครสมาชิกออก — แอปใช้ SSO อย่างเดียว · CR-WPN-015)

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn as naSignIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

type Provider = 'google' | 'line'; // id ตรงกับ provider id ของ NextAuth
type Notice = { kind: 'warn' | 'error'; text: string } | null;

const PROVIDERS: { id: Provider; label: string; Icon: () => JSX.Element }[] = [
  { id: 'google', label: 'ดำเนินการต่อด้วย Google', Icon: GoogleIcon },
  { id: 'line', label: 'ดำเนินการต่อด้วย LINE', Icon: LineIcon },
];

export default function LoginForm() {
  const [pending, setPending] = useState<string | null>(null); // provider ที่กำลังดำเนินการ
  const [notice, setNotice] = useState<Notice>(null);

  // NextAuth เด้งกลับมาพร้อม ?error=... เมื่อ login ไม่สำเร็จ (เช่น redirect URI ผิด)
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error');
    if (err) setNotice({ kind: 'error', text: 'เข้าสู่ระบบไม่สำเร็จ (' + err + ') — ตรวจ creds + redirect URI ของ provider แล้วลองใหม่' });
  }, []);

  async function signIn(method: Provider) {
    setNotice(null);
    setPending(method);
    // callbackUrl จาก query (เช่น /slips?claim=...) ถ้ามี, ไม่งั้นไปหน้าพอร์ต (/)
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';
    await naSignIn(method, { callbackUrl });
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo" aria-hidden="true">
            <img src="/brand-w.png" alt="" width={46} height={46} style={{ objectFit: 'contain' }} />
          </span>
          <h1>WealthPlanner</h1>
          <p>เข้าสู่ระบบเพื่อจัดการพอร์ตการลงทุนข้ามโบรก</p>
        </div>

        {/* ปุ่ม SSO */}
        <div className="sso-list">
          {PROVIDERS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className="sso-btn"
              onClick={() => signIn(id)}
              disabled={pending !== null}
              aria-label={label}
            >
              <span className="ic" aria-hidden="true">
                {pending === id ? <Loader2 size={18} className="spin" /> : <Icon />}
              </span>
              {label}
            </button>
          ))}
        </div>

        {notice && (
          <div className={'notice ' + notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}>
            {notice.text}
          </div>
        )}

        <p className="auth-legal">
          เมื่อเข้าสู่ระบบ ถือว่ายอมรับ <Link href="/terms" className="inlink">ข้อกำหนดการใช้งาน</Link> และ <Link href="/privacy" className="inlink">นโยบายความเป็นส่วนตัว</Link>
        </p>
      </div>
    </main>
  );
}

/* ── โลโก้แบรนด์ (inline SVG — lucide ไม่มี brand icon) ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.74z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}
function LineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#06C755" d="M12 2C6.48 2 2 5.64 2 10.13c0 4.02 3.55 7.39 8.35 8.03.33.07.77.22.88.5.1.26.07.66.03.92l-.14.85c-.04.26-.2.99.87.54 1.07-.45 5.76-3.39 7.86-5.81C21.26 13.5 22 11.9 22 10.13 22 5.64 17.52 2 12 2z" />
      <path fill="#fff" d="M9.3 8.5H8.1a.16.16 0 0 0-.16.16v3.68c0 .09.07.16.16.16h1.2a.16.16 0 0 0 .16-.16V8.66a.16.16 0 0 0-.16-.16zM6.9 11.2H5.3V8.66a.16.16 0 0 0-.16-.16h-1.2a.16.16 0 0 0-.16.16v3.68c0 .09.07.16.16.16h2.96a.16.16 0 0 0 .16-.16v-1.14a.16.16 0 0 0-.16-.16zm12.98-2.7h-2.96a.16.16 0 0 0-.16.16v3.68c0 .09.07.16.16.16h2.96a.16.16 0 0 0 .16-.16v-1.14a.16.16 0 0 0-.16-.16h-1.6v-.46h1.6a.16.16 0 0 0 .16-.16v-1.14a.16.16 0 0 0-.16-.16h-1.6v-.46h1.6a.16.16 0 0 0 .16-.16V8.66a.16.16 0 0 0-.16-.16zm-4.2 0h-1.2a.16.16 0 0 0-.16.16v2.18l-1.68-2.27a.16.16 0 0 0-.13-.07h-1.2a.16.16 0 0 0-.16.16v3.68c0 .09.07.16.16.16h1.2a.16.16 0 0 0 .16-.16v-2.18l1.69 2.28c.03.04.08.06.12.06h1.2a.16.16 0 0 0 .16-.16V8.66a.16.16 0 0 0-.16-.16z" />
    </svg>
  );
}
