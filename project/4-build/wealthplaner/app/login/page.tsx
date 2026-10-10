'use client';

// หน้าเข้าสู่ระบบ + Single Sign-On (F008) — DSN-WPN-001 §5.x
// backend = Auth.js (NextAuth v5) · session เป็น JWT ไม่ผูก DB/Supabase
// provider ตาม spec PRD: Google + LINE (ใช้ได้จริงทั้งคู่)
//   • Google — AUTH_GOOGLE_ID/SECRET · LINE — AUTH_LINE_ID/SECRET · + AUTH_SECRET ใน .env.local
//   • อีเมล/รหัสผ่าน — UI มีแต่ยังไม่เปิด (ต้องมี Credentials provider + ที่เก็บผู้ใช้) จะแจ้งตรงๆ ไม่แกล้งสำเร็จ

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn as naSignIn } from 'next-auth/react';
import { Mail, Lock, Loader2 } from 'lucide-react';

type Provider = 'google' | 'line'; // id ตรงกับ provider id ของ NextAuth
type Notice = { kind: 'warn' | 'error'; text: string } | null;

const PROVIDERS: { id: Provider; label: string; Icon: () => JSX.Element }[] = [
  { id: 'google', label: 'ดำเนินการต่อด้วย Google', Icon: GoogleIcon },
  { id: 'line', label: 'ดำเนินการต่อด้วย LINE', Icon: LineIcon },
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState<string | null>(null); // provider/'email' ที่กำลังดำเนินการ
  const [notice, setNotice] = useState<Notice>(null);

  // NextAuth เด้งกลับมาพร้อม ?error=... เมื่อ login ไม่สำเร็จ (เช่น ยังไม่ตั้ง creds / redirect URI ผิด)
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error');
    if (err) setNotice({ kind: 'error', text: 'เข้าสู่ระบบไม่สำเร็จ (' + err + ') — ตรวจ creds + redirect URI ของ provider แล้วลองใหม่' });
  }, []);

  async function signIn(method: Provider | 'email') {
    setNotice(null);

    // อีเมล/รหัสผ่าน — ต้องมี Credentials provider + ที่เก็บผู้ใช้ (ยังไม่ได้ตั้ง)
    if (method === 'email') {
      setNotice({ kind: 'warn', text: 'ยังไม่เปิดล็อกอินด้วยอีเมล/รหัสผ่าน — ต้องเพิ่ม Credentials provider + ที่เก็บผู้ใช้ก่อน (ตอนนี้ใช้ Google หรือ LINE ได้)' });
      return;
    }

    // Google / LINE — method ตรงกับ provider id ของ NextAuth → เด้งไป provider แล้วกลับ /dashboard
    setPending(method);
    await naSignIn(method, { callbackUrl: '/dashboard' });
  }

  function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!emailRe.test(email.trim())) next.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (password.length < 8) next.password = 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      document.getElementById(next.email ? 'f-email' : 'f-pass')?.focus();
      return;
    }
    signIn('email');
  }

  const busy = (k: string) => pending === k;

  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l5-5 4 3 7-8" /><path d="M16 4h4v4" />
            </svg>
          </span>
          <h1>WealthPlaner</h1>
          <p>เข้าสู่ระบบเพื่อจัดการพอร์ตการลงทุนข้ามโบรก</p>
        </div>

        {/* ปุ่ม SSO 4 เจ้า */}
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
                {busy(id) ? <Loader2 size={18} className="spin" /> : <Icon />}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="auth-div">หรือเข้าสู่ระบบด้วยอีเมล</div>

        {/* ฟอร์มอีเมล/รหัสผ่าน */}
        <form className="auth-form" onSubmit={onEmailSubmit} noValidate>
          <div className={'field' + (errors.email ? ' has-error' : '')}>
            <label htmlFor="f-email">อีเมล</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} aria-hidden="true" style={iconInInput} />
              <input
                id="f-email" type="email" inputMode="email" autoComplete="email"
                className="input" placeholder="you@example.com" style={{ paddingLeft: 38 }}
                value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? 'f-email-err' : undefined}
              />
            </div>
            {errors.email && <span className="field-err" id="f-email-err" role="alert">{errors.email}</span>}
          </div>

          <div className={'field' + (errors.password ? ' has-error' : '')}>
            <div className="auth-row">
              <label htmlFor="f-pass">รหัสผ่าน</label>
              <button type="button" className="auth-link" onClick={() => signIn('email')}>ลืมรหัสผ่าน?</button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} aria-hidden="true" style={iconInInput} />
              <input
                id="f-pass" type="password" autoComplete="current-password"
                className="input" placeholder="อย่างน้อย 8 ตัวอักษร" style={{ paddingLeft: 38 }}
                value={password} onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }}
                aria-invalid={!!errors.password} aria-describedby={errors.password ? 'f-pass-err' : undefined}
              />
            </div>
            {errors.password && <span className="field-err" id="f-pass-err" role="alert">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={pending !== null}>
            {busy('email') ? <><Loader2 size={18} className="spin" /> กำลังเข้าสู่ระบบ…</> : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {notice && (
          <div className={'notice ' + notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}>
            {notice.text}
          </div>
        )}

        <p className="auth-foot">
          ยังไม่มีบัญชี? <Link href="/login" className="inlink">สมัครสมาชิก</Link>
        </p>
        <p className="auth-legal">
          เมื่อเข้าสู่ระบบ ถือว่ายอมรับ <a href="#">ข้อกำหนดการใช้งาน</a> และ <a href="#">นโยบายความเป็นส่วนตัว</a>
        </p>
      </div>
    </main>
  );
}

const iconInInput: React.CSSProperties = {
  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
  color: 'var(--muted-2)', pointerEvents: 'none',
};

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
