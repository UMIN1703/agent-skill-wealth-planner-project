import type { Metadata } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';
import Providers from './providers';
import '../src/styles/tokens.css';
import './globals.css';

const plex = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
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
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
