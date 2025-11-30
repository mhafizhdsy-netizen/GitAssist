import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GitAssist - Your AI-Powered GitHub Companion',
  description:
    'Effortlessly manage your GitHub repositories with AI-powered commit messages, batch uploads, and more. GitAssist simplifies your workflow.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("font-sans antialiased", fontSans.variable, fontMono.variable)}>
        <Header />
        <main className="min-h-screen animated-gradient-bg">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
