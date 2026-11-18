// หน้าเข้าสู่ระบบ (F008) — server component
// guard: ล็อกอินอยู่แล้ว → เด้งไปหน้าพอร์ต (/) (กันเห็นฟอร์ม login ซ้ำ + ย้อนกลับมาหน้านี้หลัง login)
// ฟอร์ม/ปุ่ม SSO เป็น client component แยก (LoginForm) เพราะต้องใช้ state + next-auth/react
import { redirect } from 'next/navigation';
import { auth } from '@/auth.ts';
import LoginForm from './LoginForm.tsx';

export const runtime = 'edge'; // Cloudflare Pages (next-on-pages) — ใช้ auth()/cookies → ต้องรันบน edge

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/'); // มี session แล้ว → ไปหน้าพอร์ต ไม่ต้องเห็นหน้า login

  return <LoginForm />;
}
