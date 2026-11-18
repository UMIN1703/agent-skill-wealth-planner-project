import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Providers from './providers';
import BottomNav from '../src/components/BottomNav.tsx';
import '../src/styles/tokens.css';
import './globals.css';

// LINE Seed Sans TH (self-host woff2) — ฟอนต์ระบบ · คงชื่อตัวแปร --font-plex ให้ CSS เดิมใช้ต่อได้
const plex = localFont({
  src: [
    { path: '../public/fonts/lineseed/LINESeedSansTH-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/lineseed/LINESeedSansTH-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/lineseed/LINESeedSansTH-ExtraBold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WealthPlaner',
  description: 'รวมพอร์ตการลงทุนข้ามโบรกไว้ที่เดียว',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={plex.variable}>
      <body><Providers>{children}<BottomNav /></Providers></body>
    </html>
  );
}
