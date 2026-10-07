import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import Script from 'next/script';
import AppShell from '@/components/AppShell';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hunger Truck',
  description: 'Өлсөлт, мацаг, эрүүл мэндийн хувийн тэмдэглэл',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'Hunger', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#111113' },
  ],
};

// Runs before paint so the stored theme never flashes.
const themeScript = `(function(){try{var p='system';var r=localStorage.getItem('hungertruck.v2');if(r){p=(JSON.parse(r).profile||{}).theme||'system'}var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={montserrat.variable} suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {/*
          THESIS: A personal health space that feels native on an iPhone: one living fasting hero, a tactile hunger
          action, today's body signals as small widgets, and the hunger-by-hour pattern as the app's signature.
          Refuses the flat settings-form look of v2 and the generic analytics dashboard.
          OWN-WORLD: Soft canvas #f5f5f7 / charcoal #111113; white grouped surfaces (L2) and a lifted hero (L3).
          Montserrat; light numerals as anchors. Metric hues: fasting green, hunger amber, water blue, sleep
          indigo, weight teal. iOS-grade controls: green switches, sliding segmented thumb, floating material tab bar.
          STORY: Open → see where the fast stands → log hunger with a thumb → glance at today's widgets → learn the
          hours hunger peaks.
          FIRST VIEWPORT: Large title + date; fasting hero card with 68px timer, green progress, remaining and
          start→end, full-width green action; hunger card with amber action directly below.
          FORM: brief-pinned iOS-inspired health app (no roll; user brief fixed the world).
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict,
          DESIGN.md, and every shipping raster carrying its provenance
        */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
