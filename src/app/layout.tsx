import type { Metadata } from 'next';
import { Playfair_Display, DM_Serif_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { UserProvider } from "@/context/UserContext";

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700']
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-dmserif',
  weight: ['400']
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmsans',
  weight: ['400', '500', '700']
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400']
});

export const metadata: Metadata = {
  title: 'intrst | Find Your People',
  description: 'Verified college students platform. Find your actual people.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSerif.variable} ${dmSans.variable} ${jetbrains.variable} font-dmsans bg-bg-base text-text-primary antialiased selection:bg-brand/30`}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
