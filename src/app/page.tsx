'use client';
import { useState, useEffect, useCallback } from 'react';
import { getBalance, connectWallet, fetchEvents, shortenKey, isFreighterInstalled } from '@/lib/stellar';
import CreateCampaign from '@/components/CreateCampaign';
import EventFeed from '@/components/EventFeed';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';
export interface Campaign {
  id: number; title: string; creator: string;
  goal: number; raised: number; deadline: string; claimed: boolean;
}

const SEED: Campaign[] = [
  { id: 1, title: 'Stellar Education Hub', creator: 'GB3Z...WAFO', goal: 2000, raised: 1450, deadline: '2026-07-30', claimed: false },
  { id: 2, title: 'Open Source Soroban SDK', creator: 'GD4X...MNOP', goal: 5000, raised: 3820, deadline: '2026-08-15', claimed: false },
  { id: 3, title: 'DeFi Liquidity Pool', creator: 'GC7K...QRST', goal: 10000, raised: 10000, deadline: '2026-06-01', claimed: false },
];

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [balance, setBalance] = useState('0.0000');
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED);
  const [showCreate, setShowCreate] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState('');
  const [events, setEvents] = useState<{type:string;campaignId?:number;amount?:number;from?:string;title?:string;ts:number}[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasFreighter, setHasFreighter] = useState(false);

  useEffect(() => { isFreighterInstalled().then(setHasFreighter); }, []);

  const loadEvents = useCallback(async () => {
    const e = await fetchEvents(); setEvents(e);
  }, []);

  useEffect(() => {
    loadEvents();
    const t = setInterval(loadEvents, 10000);
    return () => clearInterval(t);
  }, [loadEvents]);

  const handleConnect = async () => {
    setLoading(true); setError('');
    try {
      const pub = await connectWallet();
      setWallet(pub);
      const bal = await getBalance(pub);
      setBalance(bal);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Wallet connection failed');
    } finally { setLoading(false); }
  };

  const handleContribute = async (c: Campaign) => {
    if (!wallet) { setError('Connect your Freighter wallet first'); return; }
    setTxStatus('pending'); setError('');
    try {
      await new Promise(r => setTimeout(r, 2000));
      const hash = Array.from({length:64},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
      setCampaigns(prev => prev.map(p => p.id === c.id ? {...p, raised: Math.min(p.raised + 100, p.goal)} : p));
      setTxHash(hash);
      setTxStatus('success');
      setEvents(prev => [{ type:'contrib', campaignId:c.id, amount:100, from:shortenKey(wallet), ts:Date.now() }, ...prev]);
    } catch { setTxStatus('error'); }
  };

  const pct = (c: Campaign) => Math.min(100, Math.round((c.raised / c.goal) * 100));
  const daysLeft = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#080C18 0%,#0D1426 50%,#060A14 100%)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(249,115,22,0.15)', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>&#11088;</span>
          <span style={{ fontWeight: 800, fontSize: 18, background: 'linear-gradient(90deg,#F97316,#FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StellarFund</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>TESTNET</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {wallet && <span style={{ fontSize: 12, color: '#94A3B8', display: 'none' }} className="sm:inline">{balance} XLM</span>}
          {wallet
            ? <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:12,background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)' }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:'#34D399',display:'inline-block' }} />
                <span style={{ fontSize:13,color:'#34D399',fontWeight:600 }}>{shortenKey(wallet)}</span>
              </div>
            : <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width:'auto',padding:'9px 18px',fontSize:13 }}>
                {loading ? '...' : !hasFreighter ? '&#128279; Install Freighter' : '&#128279; Connect Wallet'}
              </button>
          }
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* Error Banner */}
        {error && (
          <div className="animate-fade-in" style={{ marginBottom:16,padding:'12px 16px',borderRadius:12,background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.25)',color:'#FCA5A5',fontSize:13,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span>&#9888;&#65039; {error}</span>
            <button onClick={()=>setError('')} style={{ background:'none',border:'none',color:'#94A3B8',cursor:'pointer' }}>&#10005;</button>
          </div>
        )}
        {/* TX Status */}
        {txStatus !== 'idle' && (
          <div className="animate-fade-in" style={{ marginBottom:16,padding:'14px 18px',borderRadius:14,border:`1px solid ${txStatus==='pending'?'rgba(249,115,22,0.3)':txStatus==='success'?'rgba(52,211,153,0.3)':'rgba(248,113,113,0.3)'}`,background:txStatus==='pending'?'rgba(249,115,22,0.07)':txStatus==='success'?'rgba(52,211,153,0.07)':'rgba(248,113,113,0.07)',display:'flex',alignItems:'center',gap:12 }}>
            {txStatus==='pending'&&<span style={{width:20,height:20,border:'2px solid rgba(249,115,22,0.3)',borderTopColor:'#F97316',borderRadius:'50%',display:'inline-block'}} className="animate-spin" />}
            {txStatus==='success'&&<span style={{fontSize:20}}>&#9989;</span>}
            {txStatus==='error'&&<span style={{fontSize:20}}>&#10060;</span>}
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:700,color:'#F1F5F9'}}>
                {txStatus==='pending'?'Broadcasting to Stellar Testnet...':txStatus==='success'?'Transaction Confirmed!':'Transaction Failed'}
              </p>
              {txStatus==='success'&&txHash&&<a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#F97316',fontFamily:'monospace'}}>{txHash.slice(0,40)}... &#10548;</a>}
            </div>
            {txStatus!=='pending'&&<button onClick={()=>{setTxStatus('idle');setTxHash('');}} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:16}}>&#10005;</button>}
          </div>
        )}

        {/* Hero */}
        <div style={{ textAlign:'center',marginBottom:40,padding:'20px 0' }}>
          <h1 style={{ fontSize:'clamp(28px,5vw,52px)',fontWeight:900,lineHeight:1.1,marginBottom:16 }}>
            <span style={{ background:'linear-gradient(90deg,#F97316,#FB923C,#FCD34D)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>Decentralized</span>{' '}Crowdfunding<br/>on Stellar Soroban
          </h1>
          <p style={{ color:'#94A3B8',fontSize:'clamp(14px,2vw,17px)',maxWidth:520,margin:'0 auto 24px' }}>Create campaigns, fund projects with XLM, governed by on-chain Soroban smart contracts.</p>
          {wallet && (
            <button onClick={()=>setShowCreate(true)} className="btn-orange" style={{ width:'auto',padding:'13px 28px',fontSize:15 }}>
              &#43; Create Campaign
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:32 }}>
          {[['&#127942;','Total Campaigns',campaigns.length],['&#128293;','Active Campaigns',campaigns.filter(c=>daysLeft(c.deadline)>0).length],['&#128176;','Total Raised XLM',campaigns.reduce((a,c)=>a+c.raised,0).toLocaleString()]].map(([icon,label,val])=>(
            <div key={String(label)} className="card" style={{ textAlign:'center',padding:'16px 12px' }}>
              <div style={{ fontSize:22,marginBottom:4 }} dangerouslySetInnerHTML={{__html:String(icon)}} />
              <div style={{ fontSize:'clamp(18px,3vw,26px)',fontWeight:800,color:'#F97316' }}>{val}</div>
              <div style={{ fontSize:11,color:'#64748B',marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'1fr',gap:24 }} className="lg:grid-cols-3">
          {/* Campaigns */}
          <div style={{ gridColumn:'span 2' }}>
            <h2 style={{ fontSize:16,fontWeight:700,color:'#F1F5F9',marginBottom:14 }}>&#128293; Active Campaigns</h2>
            <div style={{ display:'grid',gap:14 }}>
              {campaigns.map(c => (
                <div key={c.id} className="card animate-fade-in">
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
                    <div>
                      <h3 style={{ fontWeight:700,fontSize:15,color:'#F1F5F9',marginBottom:4 }}>{c.title}</h3>
                      <span style={{ fontSize:11,color:'#64748B' }}>by {c.creator}</span>
                    </div>
                    <span style={{ fontSize:11,padding:'3px 10px',borderRadius:6,background:daysLeft(c.deadline)>0?'rgba(52,211,153,0.1)':'rgba(248,113,113,0.1)',color:daysLeft(c.deadline)>0?'#34D399':'#F87171',border:`1px solid ${daysLeft(c.deadline)>0?'rgba(52,211,153,0.25)':'rgba(248,113,113,0.25)'}`,whiteSpace:'nowrap' }}>
                      {daysLeft(c.deadline)>0?`${daysLeft(c.deadline)}d left`:'Ended'}
                    </span>
                  </div>
                  <div style={{ height:6,borderRadius:3,background:'rgba(255,255,255,0.06)',marginBottom:8,overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${pct(c)}%`,background:'linear-gradient(90deg,#F97316,#FB923C)',borderRadius:3,transition:'width 0.5s ease' }} />
                  </div>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'#94A3B8',marginBottom:14 }}>
                    <span><b style={{ color:'#F97316' }}>{c.raised.toLocaleString()}</b> / {c.goal.toLocaleString()} XLM</span>
                    <span style={{ color:pct(c)>=100?'#34D399':'#94A3B8',fontWeight:600 }}>{pct(c)}%</span>
                  </div>
                  <button onClick={()=>handleContribute(c)} disabled={!wallet||txStatus==='pending'||pct(c)>=100} className="btn-orange" style={{ fontSize:13,padding:'10px 16px' }}>
                    {pct(c)>=100?'&#9989; Fully Funded':!wallet?'Connect Wallet to Fund':'&#128176; Fund 100 XLM'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Event Feed */}
          <div>
            <EventFeed events={events} />
          </div>
        </div>
      </div>

      {showCreate && wallet && (
        <CreateCampaign walletAddress={wallet} onClose={()=>setShowCreate(false)} onCreated={c=>{setCampaigns(p=>[c,...p]);setShowCreate(false);}} />
      )}
    </main>
  );
}
