'use client';
import { useState } from 'react';
import { SUPPORTED_WALLETS, connectFreighter } from '@/lib/walletKit';

interface Props { onConnect: (a: string) => void; onError: (e: unknown) => void; onClose: () => void; }

export default function WalletModal({ onConnect, onError, onClose }: Props) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleClick = async (id: string, url: string) => {
    setConnecting(id);
    try {
      const address = await connectFreighter();
      onConnect(address);
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('not found') || msg.includes('install')) window.open(url, '_blank');
      onError(err);
    } finally { setConnecting(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(4,8,20,0.92)', backdropFilter: 'blur(20px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-fade-in rounded-3xl p-6"
        style={{ background: 'linear-gradient(145deg,#141B2D,#0F1525)', border: '1px solid rgba(249,115,22,0.35)', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Connect a Wallet</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Select your Stellar wallet</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {SUPPORTED_WALLETS.map(w => (
            <button key={w.id} onClick={() => handleClick(w.id, w.installUrl)} disabled={!!connecting}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting && connecting !== w.id ? 0.5 : 1, width: '100%', transition: 'all 0.15s' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{w.icon}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 2 }}>{w.name}</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>{w.desc}</p>
              </div>
              {connecting === w.id
                ? <div style={{ width: 18, height: 18, border: '2px solid #F97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <span style={{ color: '#475569' }}>→</span>}
            </button>
          ))}
        </div>
        <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#64748B' }}>No wallet? <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" style={{ color: '#F97316', fontWeight: 600, textDecoration: 'underline' }}>Install Freighter →</a></p>
        </div>
      </div>
    </div>
  );
}
