import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoGive.ai — Refer. AI Sells. You Earn.',
  description: 'Your personal AI sales agent handles the entire conversation. No product knowledge needed. Just connect people — and earn together.',
  keywords: 'referral program, AI sales, passive income, Malaysia, earn money, WhatsApp',
  openGraph: {
    title: 'GoGive.ai — Refer. AI Sells. You Earn.',
    description: 'Share a name. Your AI closes the deal. You both earn.',
    url: 'https://gogive.ai',
    siteName: 'GoGive.ai',
    type: 'website',
    locale: 'en_MY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoGive.ai — Refer. AI Sells. You Earn.',
    description: 'Share a name. Your AI closes the deal. You both earn.',
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
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
