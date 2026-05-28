// app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ChatBot from '@/components/chatBot/ChatBot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BizSmart - Business Management Platform',
  description: 'All-in-One Business Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/BizSmartLogo2.png" />
      </head>
      <body className={inter.className}>
        <Toaster position="top-right" />
        {children}
        <ChatBot />
      </body>
    </html>
  );
}