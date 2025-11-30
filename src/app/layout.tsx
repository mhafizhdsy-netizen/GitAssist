
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import FirebaseClientProvider from '@/firebase/client-provider';
import { BackButton } from '@/components/layout/BackButton';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GitAssist - Asisten GitHub Berbasis AI Anda',
  description:
    'Kelola repositori GitHub Anda dengan mudah menggunakan pesan commit berbasis AI, unggahan massal, dan banyak lagi. GitAssist menyederhanakan alur kerja Anda.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='6' cy='18' r='3' /%3e%3ccircle cx='6' cy='6' r='3' /%3e%3ccircle cx='18' cy='18' r='3' /%3e%3cpath d='M18 9a3 3 0 0 0-3-3H9' /%3e%3cpath d='M6 9v6' /%3e%3c/svg%3e" type="image/svg+xml" />
      </head>
      <body className={cn("font-sans antialiased", fontSans.variable, fontMono.variable)}>
        <FirebaseClientProvider>
          <div className="relative min-h-screen w-full">
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-background to-transparent animated-gradient-bg opacity-30 z-0"></div>
            <Header />
            <BackButton />
            <main className="relative z-10">{children}</main>
            <Footer />
            <Toaster />
          </div>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
