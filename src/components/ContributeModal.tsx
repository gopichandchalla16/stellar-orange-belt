'use client';
import { useState } from 'react';
import { Campaign, TxStatus } from '@/app/page';

interface Props { campaign: Campaign; txStatus: TxStatus; onContribute: (id: number, amount: number) => void; onClose: () => void; }

export default function ContributeModal({ campaign, txStatus, onContribute, onClose }: Props) {
  const [amount, setAmount] = useState('10');
  const isPending = txStatus === 'pending';
  const pct = Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(4,8,20,0.92)', backdropFilter: 'blur(20px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-fade-in rounded-3xl p-6"
        style={{ background: 'linear-gradient(145deg,#141B2D,#0F1525)', border: '1px solid rgba(249,115,22,0.35)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>💳 Contribute XLM</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{campaign.title}</p>
          <div className="progress-bar mb-2"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8' }}>
            <span className="text-orange-400 font-bold">{campaign.raised.toLocaleString()} XLM raised</span>
            <span>{pct}% of {campaign.goal.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Amount (XLM)</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="1" step="1"
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(249,115,22,0.3)', color: '#fff', fontSize: 18, fontWeight: 700, outline: 'none', textAlign: 'center' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[10, 50, 100, 250].map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 10, background: amount === String(v) ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${amount === String(v) ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.1)'}`, color: amount === String(v) ? '#F97316' : '#94A3B8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onContribute(campaign.id, Number(amount))} disabled={isPending}
          className="btn-orange">
          {isPending ? (<><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Broadcasting...</>) : `💳 Contribute ${amount} XLM`}
        </button>
      </div>
    </div>
  );
}
