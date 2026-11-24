// หน้าแบบประเมินความเสี่ยง (F007) — หน้าแยกเต็ม (CR-WPN-015)
import { redirect } from 'next/navigation';
import { auth } from '@/auth.ts';
import { getPrefs, resolveUserKey } from '@/lib/supabase.ts';
import RiskForm from '@/components/RiskForm.tsx';
import type { RiskResult } from '@/lib/risk.ts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function RiskPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile/risk');
  const userKey = await resolveUserKey(session);
  const prefs = userKey ? await getPrefs(userKey) : null;
  return <RiskForm initial={(prefs?.risk ?? null) as RiskResult | null} />;
}
