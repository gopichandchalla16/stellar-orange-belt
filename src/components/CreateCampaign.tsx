'use client';
import { useState } from 'react';
import { Campaign } from '@/app/page';

interface Props { walletAddress: string; onClose: () => void; onCreated: (c: Campaign) => void; }

export default function CreateCampaign({ walletAddress, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate tx
    const newCampaign: Campaign = {
      id: Date.now(),
      title,
      creator: walletAddress.slice(0,6) + '...' + walletAddress.slice(-4),
      goal: Number(goal),
      raised: 0,
      deadline,
      claimed: false,
    };
    onCreated(newCampaign);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(4,8,20,0.92)', backdropFilter: 'blur(20px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-fade-in rounded-3xl p-6"
        style={{ background: 'linear-gradient(145deg,#141B2D,#0F1525)', border: '1px solid rgba(249,115,22,0.35)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>🟠 Create Campaign</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Campaign Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Build a Stellar Tool"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Goal (XLM)</label>
            <input value={goal} onChange={e => setGoal(e.target.value)} required type="number" min="1" placeholder="e.g. 1000"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Deadline</label>
            <input value={deadline} onChange={e => setDeadline(e.target.value)} required type="date"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none' }} />
          </div>
          <button type="submit" disabled={isCreating}
            className="btn-orange" style={{ marginTop: 4 }}>
            {isCreating ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating..></>
            ) : '🚀 Launch Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
}
