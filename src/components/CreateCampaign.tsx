'use client';
import { useState } from 'react';
import { Campaign } from '@/app/page';
import { shortenKey } from '@/lib/stellar';

interface Props { walletAddress: string; onClose: () => void; onCreated: (c: Campaign) => void; }

export default function CreateCampaign({ walletAddress, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await new Promise(r => setTimeout(r, 1500));
    onCreated({ id: Date.now(), title, creator: shortenKey(walletAddress), goal: Number(goal), raised: 0, deadline, claimed: false });
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background:'rgba(4,8,20,0.92)',backdropFilter:'blur(20px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md animate-fade-in rounded-3xl p-6"
        style={{ background:'linear-gradient(145deg,#141B2D,#0F1525)',border:'1px solid rgba(249,115,22,0.35)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <h2 style={{ fontSize:18,fontWeight:800,color:'#fff' }}>&#127861; Create Campaign</h2>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:10,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'#CBD5E1',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>&#10005;</button>
        </div>
        <form onSubmit={handleCreate} style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {[{label:'Campaign Title',val:title,set:setTitle,ph:'e.g. Build a Stellar Tool',type:'text'},
            {label:'Goal (XLM)',val:goal,set:setGoal,ph:'e.g. 1000',type:'number'},
            {label:'Deadline',val:deadline,set:setDeadline,ph:'',type:'date'}].map(f=>(
            <div key={f.label}>
              <label style={{ fontSize:12,color:'#94A3B8',display:'block',marginBottom:6 }}>{f.label}</label>
              <input value={f.val} onChange={e=>f.set(e.target.value)} required type={f.type} placeholder={f.ph}
                style={{ width:'100%',padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff',fontSize:14,outline:'none' }} />
            </div>
          ))}
          <button type="submit" disabled={creating} className="btn-orange" style={{ marginTop:4 }}>
            {creating ? 'Creating...' : 'Launch Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
}
