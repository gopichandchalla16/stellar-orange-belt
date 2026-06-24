'use client';
import { useState } from 'react';
import { Campaign } from '@/app/page';
import { shortenKey } from '@/lib/stellar';

interface Props {
  walletAddress: string;
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}

const CATEGORIES = ['Education', 'Dev Tools', 'DeFi', 'Infrastructure', 'Other'];

export default function CreateCampaign({ walletAddress, onClose, onCreated }: Props) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [goal,        setGoal]        = useState('');
  const [deadline,    setDeadline]    = useState('');
  const [category,    setCategory]    = useState('Other');
  const [creating,    setCreating]    = useState(false);
  const [step,        setStep]        = useState(1);

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await new Promise(r => setTimeout(r, 1800));
    onCreated({
      id:          Date.now(),
      title,
      description: description || `A ${category.toLowerCase()} project on Stellar Soroban.`,
      creator:     shortenKey(walletAddress),
      goal:        Number(goal),
      raised:      0,
      deadline,
      claimed:     false,
      category,
    });
    setCreating(false);
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-modal-in" style={{
        width: '100%', maxWidth: 480,
        background: 'linear-gradient(145deg,rgba(14,20,40,0.98),rgba(9,13,30,0.98))',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 24,
        padding: 28,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em' }}>Launch Campaign</h2>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>Deploy to Soroban Testnet · Step {step}/2</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? 'linear-gradient(90deg,#F97316,#FB923C)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 1 && (
            <>
              <div>
                <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>CAMPAIGN TITLE *</label>
                <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} required type="text" placeholder="e.g. Open Source Stellar Wallet" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>DESCRIPTION</label>
                <textarea
                  className="input-field"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your project, goals, and milestones..."
                  rows={3}
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>CATEGORY</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => setCategory(cat)} style={{
                      padding: '7px 14px', borderRadius: 10, border: `1px solid ${category === cat ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.08)'}`,
                      background: category === cat ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                      color: category === cat ? '#F97316' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}>{cat}</button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={!title.trim()}
                onClick={() => setStep(2)}
                className="btn-orange"
                style={{ marginTop: 4 }}
              >
                Next: Set Goal & Deadline →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.12)', fontSize: 13, color: '#94A3B8' }}>
                📝 <b style={{ color: '#F1F5F9' }}>{title}</b> · {category}
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>FUNDING GOAL (XLM) *</label>
                <input className="input-field" value={goal} onChange={e => setGoal(e.target.value)} required type="number" min="1" placeholder="e.g. 5000" />
                {goal && <p style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>${(parseFloat(goal) * 0.11).toFixed(0)} USD approx.</p>}
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>DEADLINE *</label>
                <input className="input-field" value={deadline} onChange={e => setDeadline(e.target.value)} required type="date" min={minDate} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1 }}>← Back</button>
                <button type="submit" disabled={creating || !goal || !deadline} className="btn-orange" style={{ flex: 2 }}>
                  {creating ? '🚀 Deploying to Soroban...' : '🚀 Launch Campaign'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
