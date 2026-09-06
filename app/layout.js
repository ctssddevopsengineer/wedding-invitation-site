import localFont from 'next/font/local';
import './globals.css';
import './phase2b.css';
import './responsive-layout.css';
import './languages.css';
import './blush-front.css';
import './classic-front.css';
import './device-hardening.css';
import './mobile-overlap-fixes.css';
import './royal-navy-mobile-monogram-fix.css';

const bengali = localFont({ src: './fonts/noto-serif-bengali.ttf', variable: '--font-bengali', display: 'swap', preload: false });
const devanagari = localFont({ src: './fonts/noto-serif-devanagari.ttf', variable: '--font-devanagari', display: 'swap', preload: false });

export const metadata = {
  title: 'Wedding Reception Invitation',
  description: 'A Celebration of Two Cultures, One Beautiful Journey',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Wedding Reception Invitation',
    description: 'A Celebration of Two Cultures, One Beautiful Journey',
    type: 'website'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${bengali.variable} ${devanagari.variable}`}>{children}</body>
    </html>
  );
}
