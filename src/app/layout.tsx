import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StellarFund — Decentralized Crowdfunding',
  description: 'Create and fund campaigns on Stellar Soroban Testnet. Level 3 Orange Belt — Rise In Stellar Journey to Mastery.',
  keywords: ['Stellar', 'Soroban', 'crowdfunding', 'dApp', 'blockchain'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#080C18" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', system-ui, sans-serif; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
