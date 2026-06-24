import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StellarFund — Decentralized Crowdfunding on Stellar',
  description: 'Create and fund campaigns on Stellar Soroban Testnet. Rise In Level 3 Orange Belt.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
