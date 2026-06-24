'use client';
import { useState } from 'react';
import { Campaign } from '@/app/page';

interface Props {
  campaign: Campaign;
  walletBalance: number;
  onClose: () => void;
  onContribute: (amount: number) => void;
}

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

const pct = (c: Campaign) => Math.min(100, Math.round((c.raised / c.goal) * 100));

export default function ContributeModal({ campaign, walletBalance, onClose, onContribute }: Props) {
  const [amount, setAmount] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const remaining = campaign.goal - campaign.raised;
  const isValid = numAmount > 0 && numAmount <= Math.min(walletBalance, remaining) && numAmount >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 300));
    onContribute(Math.min(numAmount, remaining));
  };

  const p = pct(campaign);
  const afterPct = Math.min(100, Math.round(((campaign.raised + numAmount) / campaign.goal) * 100));

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-modal-in" style={{
        width: '100%', maxWidth: 460,
        background: 'linear-gradient(145deg,rgba(14,20,40,0.98),rgba(9,13,30,0.98))',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 24,
        padding: 28,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,115,22,0.05)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em' }}>Fund Campaign</h2>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>Powered by Soroban Smart Contract</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        {/* Campaign Preview */}
        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>{campaign.title}</p>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: `${numAmount > 0 ? afterPct : p}%`,
              background: 'linear-gradient(90deg,#F97316,#FB923C)',
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
            <span>{campaign.raised.toLocaleString()} / {campaign.goal.toLocaleString()} XLM</span>
            <span style={{ color: numAmount > 0 ? '#FB923C' : '#475569', fontWeight: 700 }}>
              {numAmount > 0 ? `→ ${afterPct}%` : `${p}%`}
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>Remaining: <b style={{ color: '#94A3B8' }}>{remaining.toLocaleString()} XLM</b></p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick amounts */}
          <div>
            <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>QUICK AMOUNTS</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 10,
                    border: `1px solid ${parseFloat(amount) === a ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.08)'}`,
                    background: parseFloat(amount) === a ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                    color: parseFloat(amount) === a ? '#F97316' : '#64748B',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >{a} XLM</button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>CUSTOM AMOUNT (XLM)</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                min="1"
                max={Math.min(walletBalance, remaining)}
                step="1"
                placeholder="Enter amount..."
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#475569', pointerEvents: 'none' }}>XLM</span>
            </div>
            <p style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>
              Your balance: <b style={{ color: numAmount > walletBalance ? '#F87171' : '#94A3B8' }}>{walletBalance.toLocaleString()} XLM</b>
            </p>
          </div>

          {/* Validation messages */}
          {numAmount > walletBalance && (
            <p style={{ fontSize: 12, color: '#F87171', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '8px 12px' }}>⚠ Insufficient balance</p>
          )}
          {numAmount > remaining && numAmount <= walletBalance && (
            <p style={{ fontSize: 12, color: '#FB923C', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, padding: '8px 12px' }}>ℹ Amount reduced to remaining: {remaining} XLM</p>
          )}

          <button type="submit" disabled={!isValid || submitting} className="btn-orange" style={{ marginTop: 4, fontSize: 15, padding: '14px 20px' }}>
            {submitting ? '⏳ Submitting...' : `💰 Fund ${numAmount > 0 ? numAmount.toLocaleString() : ''} XLM`}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#1E293B', textAlign: 'center', marginTop: 12 }}>
          Transaction will be submitted to Stellar Testnet via Soroban contract
        </p>
      </div>
    </div>
  );
}
