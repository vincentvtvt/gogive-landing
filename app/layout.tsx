import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoGive — Where AI meets human connection',
  description: 'AI goes. You give. Both earn. Share a name, AI closes the deal on WhatsApp, and everyone gets paid. Free forever.',
  keywords: 'referral program, AI sales, passive income, Malaysia, earn money, WhatsApp, GoGive',
  openGraph: {
    title: 'GoGive — Where AI meets human connection',
    description: 'AI goes. You give. Both earn. Your network is your income.',
    url: 'https://gogive.ai',
    siteName: 'GoGive.ai',
    type: 'website',
    locale: 'en_MY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoGive — Where AI meets human connection',
    description: 'AI goes. You give. Both earn.',
  },
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
