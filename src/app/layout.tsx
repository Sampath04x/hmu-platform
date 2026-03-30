import type { Metadata } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import './globals.css';

import { UserProvider } from "@/context/UserContext";

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '600', '700']
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmsans',
  weight: ['400', '500', '700']
});

export const metadata: Metadata = {
  title: 'HMU | Find Your People',
  description: 'Verified college students platform. Find your actual people.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${sora.variable} ${dmSans.variable} font-dmsans bg-background text-foreground antialiased selection:bg-indigo-500/30`}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
