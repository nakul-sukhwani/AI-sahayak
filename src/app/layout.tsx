import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/components/ui/toast';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: {
    default: 'Nagrik Seva — Civic Grievance Portal',
    template: '%s — Nagrik Seva',
  },
  description:
    'Government of Jharkhand. File and track civic complaints with AI-powered analysis and verified resolution. Nagrik Seva bridges citizens and municipal administration.',
  keywords: ['civic complaints', 'Jharkhand', 'pothole', 'garbage', 'Nagrik Seva', 'India', 'government portal'],
  openGraph: {
    title: 'Nagrik Seva — Civic Grievance Portal',
    description: 'File and track civic complaints with AI-powered analysis and verified resolution.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={notoSans.variable}>
      <head>
        {/* Material Symbols Outlined */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Noto Sans', system-ui, sans-serif" }}>
        <LanguageProvider>
          <SupabaseProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SupabaseProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
