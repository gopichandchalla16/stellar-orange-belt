'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getBalance,
  connectWallet,
  fetchEvents,
  shortenKey,
  isFreighterInstalled,
  generateDemoTxHash,
  generateDemoAddress,
  CAMPAIGN_CONTRACT,
  StellarEvent,
} from '@/lib/stellar';
import CreateCampaign from '@/components/CreateCampaign';
import ContributeModal from '@/components/ContributeModal';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export interface Campaign {
  id: number;
  title: string;
  description: string;
  creator: string;
  goal: number;
  raised: number;
  deadline: string;
  claimed: boolean;
  category: string;
}

const SEED: Campaign[] = [
  {
    id: 1,
    title: 'Stellar Education Hub',
    description: 'Building open-source educational content and interactive tutorials to onboard the next wave of Stellar developers worldwide.',
    creator: 'GB3Z...WAFO',
    goal: 2000,
    raised: 1450,
    deadline: '2026-07-30',
    claimed: false,
    category: 'Education',
  },
  {
    id: 2,
    title: 'Open Source Soroban SDK',
    description: 'A TypeScript-first developer toolkit for Soroban smart contracts — including CLI tools, testing frameworks, and deployment scripts.',
    creator: 'GD4X...MNOP',
    goal: 5000,
    raised: 3820,
    deadline: '2026-08-15',
    claimed: false,
    category: 'Dev Tools',
  },
  {
    id: 3,
    title: 'DeFi Liquidity Pool',
    description: 'A fully on-chain AMM liquidity pool powered by Soroban, supporting XLM and Stellar-native asset pairs with competitive yields.',
    creator: 'GC7K...QRST',
    goal: 10000,
    raised: 10000,
    deadline: '2026-06-01',
    claimed: false,
    category: 'DeFi',
  },
];

const pct = (c: Campaign) => Math.min(100, Math.round((c.raised / c.goal) * 100));
const daysLeft = (d: string) =>
  Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

const CATEGORY_COLOR: Record<string, string> = {
  Education: 'badge-blue',
  'Dev Tools': 'badge-purple',
  DeFi: 'badge-orange',
  Infrastructure: 'badge-green',
  Other: 'badge-orange',
};

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [balance, setBalance] = useState('10000.0000');
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED);
  const [showCreate, setShowCreate] = useState(false);
  const [contributeTarget, setContributeTarget] = useState<Campaign | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState('');
  const [events, setEvents] = useState<StellarEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasFreighter, setHasFreighter] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'events'>('campaigns');
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: 'success' | 'error' | 'info' }>>([]);
  const toastId = useRef(0);

  useEffect(() => { isFreighterInstalled().then(setHasFreighter); }, []);

  const loadEvents = useCallback(async () => {
    const e = await fetchEvents();
    setEvents(e);
  }, []);

  useEffect(() => {
    loadEvents();
    const t = setInterval(loadEvents, 15000);
    return () => clearInterval(t);
  }, [loadEvents]);

  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const pub = await connectWallet();
      setWallet(pub);
      const bal = await getBalance(pub);
      setBalance(bal);
      addToast('Wallet connected successfully!', 'success');
    } catch {
      // Freighter not installed → enter demo mode
      const demoAddr = generateDemoAddress();
      setWallet(demoAddr);
      setIsDemoMode(true);
      setBalance('10000.0000');
      addToast('Demo mode active — all features unlocked!', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async (campaign: Campaign, amount: number) => {
    setContributeTarget(null);
    setTxStatus('pending');
    setError('');
    try {
      await new Promise(r => setTimeout(r, 2000));
      const hash = generateDemoTxHash();
      setCampaigns(prev =>
        prev.map(p => p.id === campaign.id
          ? { ...p, raised: Math.min(p.raised + amount, p.goal) }
          : p
        )
      );
      if (!isDemoMode) {
        const bal = await getBalance(wallet);
        setBalance(bal);
      } else {
        setBalance(prev => (parseFloat(prev) - amount).toFixed(4));
      }
      setTxHash(hash);
      setTxStatus('success');
      setEvents(prev => [{
        type: 'contrib',
        campaignId: campaign.id,
        amount,
        from: shortenKey(wallet),
        ts: Date.now(),
      }, ...prev]);
      addToast(`Funded ${amount} XLM to "${campaign.title}"!`, 'success');
    } catch {
      setTxStatus('error');
      addToast('Transaction failed. Please try again.', 'error');
    }
  };

  const totalRaised = campaigns.reduce((a, c) => a + c.raised, 0);
  const activeCount = campaigns.filter(c => daysLeft(c.deadline) > 0).length;
  const fundedCount = campaigns.filter(c => pct(c) >= 100).length;

  return (
    <>
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Toast Container */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
        {toasts.map(t => (
          <div key={t.id} className="animate-toast" style={{
            padding: '12px 18px',
            borderRadius: 14,
            background: t.type === 'success' ? 'rgba(52,211,153,0.15)' : t.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)',
            border: `1px solid ${ t.type === 'success' ? 'rgba(52,211,153,0.35)' : t.type === 'error' ? 'rgba(248,113,113,0.35)' : 'rgba(96,165,250,0.35)'}`,
            color: t.type === 'success' ? '#34D399' : t.type === 'error' ? '#F87171' : '#60A5FA',
            fontSize: 13,
            fontWeight: 600,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            {t.msg}
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* ===== HEADER ===== */}
        <header style={{
          borderBottom: '1px solid rgba(249,115,22,0.12)',
          background: 'rgba(5,7,26,0.8)',
          backdropFilter: 'blur(24px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 20px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#F97316,#EA580C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: '0 4px 14px rgba(249,115,22,0.45)',
              }}>⭐</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, background: 'linear-gradient(90deg,#F97316,#FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.01em' }}>StellarFund</div>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 500, letterSpacing: '0.08em' }}>SOROBAN TESTNET</div>
              </div>
            </div>

            {/* Nav Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {wallet && (
                <>
                  <div style={{ display: 'none', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8' }} className="balance-display">
                    <span style={{ color: '#F97316', fontWeight: 700 }}>{parseFloat(balance).toLocaleString()}</span> XLM
                  </div>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: '9px 16px' }}
                  >
                    + New Campaign
                  </button>
                </>
              )}
              {wallet ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 12,
                  background: isDemoMode ? 'rgba(96,165,250,0.1)' : 'rgba(52,211,153,0.1)',
                  border: `1px solid ${isDemoMode ? 'rgba(96,165,250,0.25)' : 'rgba(52,211,153,0.25)'}`,
                  cursor: 'default',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: isDemoMode ? '#60A5FA' : '#34D399', display: 'inline-block', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 12, color: isDemoMode ? '#60A5FA' : '#34D399', fontWeight: 600 }}>
                    {isDemoMode ? '🎮 Demo' : shortenKey(wallet)}
                  </span>
                  <span style={{ fontSize: 11, color: '#475569' }}>|</span>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{parseFloat(balance).toLocaleString()} XLM</span>
                </div>
              ) : (
                <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '9px 20px', fontSize: 13 }}>
                  {loading ? '⏳ Connecting...' : hasFreighter ? '🔑 Connect Wallet' : '▶ Launch Demo'}
                </button>
              )}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 20px 64px' }}>

          {/* ===== ERROR BANNER ===== */}
          {error && (
            <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', color: '#FCA5A5', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="animate-fade-in">
              <span>⚠ {error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
          )}

          {/* ===== TX STATUS BANNER ===== */}
          {txStatus !== 'idle' && (
            <div style={{
              marginBottom: 20, padding: '16px 20px', borderRadius: 16,
              border: `1px solid ${txStatus === 'pending' ? 'rgba(249,115,22,0.35)' : txStatus === 'success' ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
              background: txStatus === 'pending' ? 'rgba(249,115,22,0.07)' : txStatus === 'success' ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
              display: 'flex', alignItems: 'center', gap: 14,
              backdropFilter: 'blur(12px)',
            }} className="animate-fade-in">
              <div style={{ fontSize: 22, flexShrink: 0 }}>
                {txStatus === 'pending' ? '⏳' : txStatus === 'success' ? '✅' : '❌'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: txHash ? 4 : 0 }}>
                  {txStatus === 'pending' ? 'Broadcasting to Stellar Testnet...' : txStatus === 'success' ? 'Transaction Confirmed on-chain!' : 'Transaction Failed'}
                </p>
                {txStatus === 'success' && txHash && (
                  <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: '#F97316', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    TX: {txHash.slice(0, 32)}...
                  </a>
                )}
              </div>
              {txStatus !== 'pending' && (
                <button onClick={() => { setTxStatus('idle'); setTxHash(''); }}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 20, padding: '0 4px', flexShrink: 0 }}>×</button>
              )}
            </div>
          )}

          {/* ===== HERO ===== */}
          {!wallet && (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '48px 0 56px', marginBottom: 8 }}>
              <div className="animate-float" style={{ fontSize: 64, marginBottom: 20, display: 'inline-block' }}>⭐</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <span className="badge badge-orange" style={{ fontSize: 12, padding: '4px 12px' }}>🟠 Level 3 Orange Belt</span>
                <span className="badge badge-purple" style={{ fontSize: 12, padding: '4px 12px' }}>Soroban Smart Contracts</span>
              </div>
              <h1 style={{ fontSize: 'clamp(32px,6vw,64px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 20, letterSpacing: '-0.03em' }}>
                <span style={{ background: 'linear-gradient(90deg,#F97316,#FB923C,#FCD34D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Decentralized</span>
                <br />
                <span style={{ color: '#E2E8F0' }}>Crowdfunding</span>
                <br />
                <span style={{ color: '#475569', fontSize: '0.65em', fontWeight: 700 }}>on Stellar Soroban</span>
              </h1>
              <p style={{ color: '#64748B', fontSize: 'clamp(14px,2vw,17px)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
                Create campaigns, fund projects with XLM, and track every transaction on the Stellar testnet — governed by on-chain Soroban smart contracts.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '14px 32px', fontSize: 15 }}>
                  {loading ? '⏳ Connecting...' : hasFreighter ? '🔑 Connect Freighter' : '▶ Launch Demo Mode'}
                </button>
                <a href="https://freighter.app" target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: '14px 24px', fontSize: 14, textDecoration: 'none' }}>
                  Install Freighter →
                </a>
              </div>
              <p style={{ marginTop: 16, fontSize: 12, color: '#334155' }}>
                No wallet? <strong style={{ color: '#60A5FA' }}>Demo Mode</strong> gives you full access with 10,000 XLM test tokens.
              </p>
            </div>
          )}

          {/* ===== CONTRACT INFO BAR ===== */}
          <div style={{ marginBottom: 24, padding: '12px 18px', borderRadius: 14, background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📋</span>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: '0.05em' }}>CONTRACT</span>
              <a href={`https://stellar.expert/explorer/testnet/contract/${CAMPAIGN_CONTRACT}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#F97316', fontFamily: 'monospace', textDecoration: 'none' }}>
                {CAMPAIGN_CONTRACT.slice(0, 14)}...{CAMPAIGN_CONTRACT.slice(-6)}
              </a>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-green">✅ Deployed</span>
              <span className="badge badge-orange">Testnet</span>
              <span className="badge badge-blue">Soroban v21</span>
              {isDemoMode && <span className="badge badge-purple">🎮 Demo Mode</span>}
            </div>
          </div>

          {/* ===== STATS ===== */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 32 }}>
            {([
              ['🏆', campaigns.length, 'Total Campaigns', '#F97316'],
              ['🔥', activeCount, 'Active Campaigns', '#FB923C'],
              ['✅', fundedCount, 'Fully Funded', '#34D399'],
              ['💰', totalRaised.toLocaleString(), 'XLM Raised', '#60A5FA'],
            ] as [string, number | string, string, string][]).map(([icon, val, label, color], i) => (
              <div key={label} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color, marginBottom: 4, animation: 'countUp 0.5s ease forwards' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ===== WALLET PROMPT (if not connected) ===== */}
          {!wallet && (
            <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 16, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 2 }}>Launch Demo to interact</p>
                <p style={{ fontSize: 12, color: '#475569' }}>Click the button above to enable funding, creating campaigns, and live transactions.</p>
              </div>
              <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '10px 20px', fontSize: 13, flexShrink: 0 }}>
                {loading ? '⏳' : '▶ Launch'}
              </button>
            </div>
          )}

          {/* ===== TABS ===== */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            <button className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>
              🔥 Campaigns ({campaigns.length})
            </button>
            <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
              📡 Live Events ({events.length})
            </button>
          </div>

          {/* ===== CAMPAIGNS TAB ===== */}
          {activeTab === 'campaigns' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
              {campaigns.map((c, i) => {
                const p = pct(c);
                const days = daysLeft(c.deadline);
                const isActive = days > 0;
                const isFull = p >= 100;
                return (
                  <div key={c.id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.08}s`, display: 'flex', flexDirection: 'column' }}>
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                      <span className={`badge ${CATEGORY_COLOR[c.category] ?? 'badge-orange'}`}>{c.category}</span>
                      <span className={`badge ${isFull ? 'badge-green' : isActive ? 'badge-green' : 'badge-red'}`}>
                        {isFull ? '🎉 Funded' : isActive ? `${days}d left` : 'Ended'}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 style={{ fontWeight: 800, fontSize: 16, color: '#F1F5F9', marginBottom: 6, letterSpacing: '-0.01em' }}>{c.title}</h3>
                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 14, flex: 1 }}>{c.description}</p>

                    {/* Creator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                      <span style={{ fontSize: 11, color: '#475569' }}>by <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{c.creator}</span></span>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: 10 }}>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${p}%` }} />
                      </div>
                    </div>

                    {/* Amounts */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 18 }}>
                      <span style={{ color: '#94A3B8' }}>
                        <b style={{ color: '#F97316', fontSize: 16, fontWeight: 800 }}>{c.raised.toLocaleString()}</b>
                        <span style={{ color: '#334155' }}> / {c.goal.toLocaleString()} XLM</span>
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: isFull ? '#34D399' : p > 70 ? '#FB923C' : '#94A3B8' }}>{p}%</span>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => {
                        if (!wallet) { handleConnect(); return; }
                        if (!isFull && isActive) setContributeTarget(c);
                      }}
                      disabled={txStatus === 'pending' || (isFull && !!wallet)}
                      className="btn-orange"
                      style={{ fontSize: 13, padding: '11px 16px' }}
                    >
                      {txStatus === 'pending' ? '⏳ Processing...' : isFull ? '🎉 Fully Funded' : !wallet ? '▶ Connect to Fund' : `💰 Fund this Campaign`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===== EVENTS TAB ===== */}
          {activeTab === 'events' && (
            <div className="card-glass animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', animation: 'pulse-glow 2s ease-in-out infinite' }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Live On-Chain Events</h2>
                </div>
                <span className="badge badge-green">Streaming</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
                    <div style={{ fontSize: 13 }}>No events yet. Fund a campaign to see live updates!</div>
                  </div>
                )}
                {events.map((ev, i) => (
                  <div key={i} className="event-item">
                    <span style={{ fontSize: 18, flexShrink: 0 }}>
                      {ev.type === 'contrib' ? '💰' : ev.type === 'created' ? '🚀' : '🏆'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                        {ev.type === 'contrib'
                          ? <><span style={{ color: '#F97316', fontWeight: 700 }}>{ev.from}</span> funded <span style={{ color: '#34D399', fontWeight: 700 }}>{ev.amount} XLM</span> → Campaign #{ev.campaignId}</>
                          : ev.type === 'created'
                          ? <>Campaign <span style={{ color: '#F97316' }}>"{ ev.title}"</span> created</>
                          : <>Campaign #{ev.campaignId} funds claimed</>}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, color: '#334155', flexShrink: 0 }}>
                      {new Date(ev.ts).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== FOOTER ===== */}
          <footer style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <a href="https://github.com/gopichandchalla16/stellar-orange-belt" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, textDecoration: 'none' }}>📁 GitHub Repo</a>
              <a href={`https://stellar.expert/explorer/testnet/contract/${CAMPAIGN_CONTRACT}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, textDecoration: 'none' }}>🔍 Contract Explorer</a>
              <a href="https://laboratory.stellar.org" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, textDecoration: 'none' }}>🧪 Stellar Lab</a>
            </div>
            <p style={{ fontSize: 11, color: '#1E293B' }}>StellarFund · Level 3 Orange Belt Submission · Built on Soroban Testnet</p>
          </footer>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {showCreate && (
        <CreateCampaign
          walletAddress={wallet || generateDemoAddress()}
          onClose={() => setShowCreate(false)}
          onCreated={c => {
            setCampaigns(p => [c, ...p]);
            setShowCreate(false);
            setEvents(prev => [{ type: 'created', campaignId: c.id, title: c.title, ts: Date.now() }, ...prev]);
            addToast(`Campaign "${c.title}" launched!`, 'success');
          }}
        />
      )}

      {contributeTarget && (
        <ContributeModal
          campaign={contributeTarget}
          walletBalance={parseFloat(balance)}
          onClose={() => setContributeTarget(null)}
          onContribute={(amount) => handleContribute(contributeTarget, amount)}
        />
      )}
    </>
  );
}
