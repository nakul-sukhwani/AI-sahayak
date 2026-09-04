import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Nagrik Seva — AI-Powered Civic Complaints',
    template: '%s — Nagrik Seva',
  },
  description:
    'File civic complaints with AI assistance. Track resolution from filing to verified completion. Nagrik Seva bridges citizens and municipal administration.',
  keywords: ['civic complaints', 'BBMP', 'pothole', 'garbage', 'Nagrik Seva', 'India'],
  openGraph: {
    title: 'Nagrik Seva — AI-Powered Civic Complaints',
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
    <html lang="en" className={inter.variable}>
      <head>
        {/* Material Symbols Outlined — required by Stitch design */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-[#f7f9fb] text-[#191c1e] antialiased font-sans">
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
