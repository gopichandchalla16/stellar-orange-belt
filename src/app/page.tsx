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
  getXlmPrice,
  getWalletTransactions,
  CAMPAIGN_CONTRACT,
  StellarEvent,
  WalletTx,
} from '@/lib/stellar';
import CreateCampaign from '@/components/CreateCampaign';
import ContributeModal from '@/components/ContributeModal';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export interface Milestone {
  label: string;
  target: number; // XLM amount
  reached: boolean;
  votes: number;
  votedBy: string[];
}

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
  milestones: Milestone[];
  tags: string[];
  backerCount: number;
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
    tags: ['open-source', 'tutorials', 'onboarding'],
    backerCount: 23,
    milestones: [
      { label: 'Curriculum drafted', target: 500, reached: true, votes: 18, votedBy: [] },
      { label: 'Video series launched', target: 1000, reached: true, votes: 14, votedBy: [] },
      { label: 'Interactive labs live', target: 1500, reached: false, votes: 9, votedBy: [] },
      { label: 'Full platform release', target: 2000, reached: false, votes: 5, votedBy: [] },
    ],
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
    tags: ['typescript', 'CLI', 'SDK'],
    backerCount: 47,
    milestones: [
      { label: 'Alpha SDK released', target: 1000, reached: true, votes: 42, votedBy: [] },
      { label: 'Testing framework done', target: 2500, reached: true, votes: 38, votedBy: [] },
      { label: 'Deployment scripts', target: 3500, reached: true, votes: 31, votedBy: [] },
      { label: 'v1.0 stable release', target: 5000, reached: false, votes: 22, votedBy: [] },
    ],
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
    tags: ['AMM', 'liquidity', 'DeFi'],
    backerCount: 89,
    milestones: [
      { label: 'Smart contract audit', target: 2500, reached: true, votes: 88, votedBy: [] },
      { label: 'Testnet AMM live', target: 5000, reached: true, votes: 85, votedBy: [] },
      { label: 'Mainnet beta launch', target: 7500, reached: true, votes: 80, votedBy: [] },
      { label: 'Full liquidity live', target: 10000, reached: true, votes: 89, votedBy: [] },
    ],
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

const LEADERBOARD_SEED = [
  { address: 'GD4X...MNOP', total: 4820, count: 12, badge: '🥇' },
  { address: 'GC7K...QRST', total: 3200, count: 8, badge: '🥈' },
  { address: 'GB3Z...WAFO', total: 1950, count: 6, badge: '🥉' },
  { address: 'GA9R...LMXY', total: 1100, count: 4, badge: '⭐' },
  { address: 'GF2T...PQRS', total: 800, count: 3, badge: '⭐' },
];

type Tab = 'campaigns' | 'events' | 'analytics' | 'leaderboard' | 'wallet';

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
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: 'success' | 'error' | 'info' }>>([]);
  const [xlmPrice, setXlmPrice] = useState<{ price: number; change: number } | null>(null);
  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([]);
  const [leaderboard, setLeaderboard] = useState(LEADERBOARD_SEED);
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'raised' | 'pct' | 'deadline'>('raised');
  const toastId = useRef(0);

  useEffect(() => { isFreighterInstalled().then(setHasFreighter); }, []);
  useEffect(() => {
    getXlmPrice().then(setXlmPrice);
    const t = setInterval(() => getXlmPrice().then(setXlmPrice), 60000);
    return () => clearInterval(t);
  }, []);

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
      const txs = await getWalletTransactions(pub);
      setWalletTxs(txs);
      addToast('Wallet connected successfully!', 'success');
    } catch {
      const demoAddr = generateDemoAddress();
      setWallet(demoAddr);
      setIsDemoMode(true);
      setBalance('10000.0000');
      setWalletTxs([]);
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
          ? {
              ...p,
              raised: Math.min(p.raised + amount, p.goal),
              backerCount: p.backerCount + 1,
              milestones: p.milestones.map(m =>
                !m.reached && (p.raised + amount) >= m.target
                  ? { ...m, reached: true }
                  : m
              ),
            }
          : p
        )
      );
      // Update leaderboard
      setLeaderboard(prev => {
        const shortAddr = shortenKey(wallet);
        const existing = prev.find(l => l.address === shortAddr);
        if (existing) {
          return prev
            .map(l => l.address === shortAddr ? { ...l, total: l.total + amount, count: l.count + 1 } : l)
            .sort((a, b) => b.total - a.total)
            .map((l, i) => ({ ...l, badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐' }));
        }
        return [...prev, { address: shortAddr, total: amount, count: 1, badge: '⭐' }]
          .sort((a, b) => b.total - a.total)
          .map((l, i) => ({ ...l, badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐' }));
      });
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

  const handleVoteMilestone = (campaignId: number, milestoneIdx: number) => {
    if (!wallet) { handleConnect(); return; }
    setCampaigns(prev => prev.map(c => {
      if (c.id !== campaignId) return c;
      const ms = c.milestones.map((m, i) => {
        if (i !== milestoneIdx) return m;
        if (m.votedBy.includes(wallet)) return m;
        return { ...m, votes: m.votes + 1, votedBy: [...m.votedBy, wallet] };
      });
      return { ...c, milestones: ms };
    }));
    setEvents(prev => [{
      type: 'voted',
      campaignId,
      milestone: campaigns.find(c => c.id === campaignId)?.milestones[milestoneIdx]?.label,
      from: shortenKey(wallet),
      ts: Date.now(),
    }, ...prev]);
    addToast('Milestone vote recorded on-chain!', 'success');
  };

  const totalRaised = campaigns.reduce((a, c) => a + c.raised, 0);
  const totalBackers = campaigns.reduce((a, c) => a + c.backerCount, 0);
  const activeCount = campaigns.filter(c => daysLeft(c.deadline) > 0).length;
  const fundedCount = campaigns.filter(c => pct(c) >= 100).length;

  const categories = ['All', ...Array.from(new Set(campaigns.map(c => c.category)))];
  const filteredCampaigns = campaigns
    .filter(c => filterCategory === 'All' || c.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'raised') return b.raised - a.raised;
      if (sortBy === 'pct') return pct(b) - pct(a);
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  // Analytics data
  const analyticsData = [
    { label: 'Education', raised: 1450, goal: 2000, backers: 23, color: '#60A5FA' },
    { label: 'Dev Tools', raised: 3820, goal: 5000, backers: 47, color: '#A78BFA' },
    { label: 'DeFi', raised: 10000, goal: 10000, backers: 89, color: '#F97316' },
  ];
  const maxRaised = Math.max(...analyticsData.map(d => d.raised));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'campaigns', label: `🔥 Campaigns (${campaigns.length})` },
    { id: 'events', label: `📡 Live Events (${events.length})` },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'leaderboard', label: '🏆 Leaderboard' },
    { id: 'wallet', label: '👛 Wallet' },
  ];

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
            padding: '12px 18px', borderRadius: 14,
            background: t.type === 'success' ? 'rgba(52,211,153,0.15)' : t.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)',
            border: `1px solid ${ t.type === 'success' ? 'rgba(52,211,153,0.35)' : t.type === 'error' ? 'rgba(248,113,113,0.35)' : 'rgba(96,165,250,0.35)'}`,
            color: t.type === 'success' ? '#34D399' : t.type === 'error' ? '#F87171' : '#60A5FA',
            fontSize: 13, fontWeight: 600, backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', gap: 8,
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
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 20px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
              {xlmPrice && (
                <div style={{
                  marginLeft: 8, padding: '4px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>XLM</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>${xlmPrice.price.toFixed(4)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: xlmPrice.change >= 0 ? '#34D399' : '#F87171' }}>
                    {xlmPrice.change >= 0 ? '▲' : '▼'}{Math.abs(xlmPrice.change).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {wallet && (
                <button onClick={() => setShowCreate(true)} className="btn-secondary" style={{ fontSize: 13, padding: '9px 16px' }}>
                  + New Campaign
                </button>
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
                  {xlmPrice && <span style={{ fontSize: 11, color: '#475569' }}>(${(parseFloat(balance) * xlmPrice.price).toFixed(0)} USD)</span>}
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

          {error && (
            <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', color: '#FCA5A5', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="animate-fade-in">
              <span>⚠ {error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
          )}

          {txStatus !== 'idle' && (
            <div style={{
              marginBottom: 20, padding: '16px 20px', borderRadius: 16,
              border: `1px solid ${txStatus === 'pending' ? 'rgba(249,115,22,0.35)' : txStatus === 'success' ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
              background: txStatus === 'pending' ? 'rgba(249,115,22,0.07)' : txStatus === 'success' ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
              display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(12px)',
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
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 20 }}>×</button>
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
                Create campaigns, fund projects with XLM, vote on milestones, and track every transaction on the Stellar testnet — governed by on-chain Soroban smart contracts.
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 32 }}>
            {([
              ['🏆', campaigns.length, 'Total Campaigns', '#F97316'],
              ['🔥', activeCount, 'Active Campaigns', '#FB923C'],
              ['✅', fundedCount, 'Fully Funded', '#34D399'],
              ['💰', totalRaised.toLocaleString(), 'XLM Raised', '#60A5FA'],
              ['👥', totalBackers.toLocaleString(), 'Total Backers', '#A78BFA'],
              ['💵', xlmPrice ? `$${(totalRaised * xlmPrice.price).toFixed(0)}` : '…', 'USD Value', '#FCD34D'],
            ] as [string, number | string, string, string][]).map(([icon, val, label, color], i) => (
              <div key={label} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color, marginBottom: 4, animation: 'countUp 0.5s ease forwards' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ===== WALLET PROMPT ===== */}
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
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ===== CAMPAIGNS TAB ===== */}
          {activeTab === 'campaigns' && (
            <>
              {/* Filter + Sort */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {categories.map(cat => (
                    <button key={cat}
                      onClick={() => setFilterCategory(cat)}
                      style={{
                        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', border: '1px solid',
                        background: filterCategory === cat ? 'rgba(249,115,22,0.12)' : 'transparent',
                        borderColor: filterCategory === cat ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)',
                        color: filterCategory === cat ? '#F97316' : '#64748B',
                        transition: 'all 0.2s',
                      }}>{cat}</button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'raised' | 'pct' | 'deadline')}
                  style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                  <option value="raised">Sort: Most Raised</option>
                  <option value="pct">Sort: % Funded</option>
                  <option value="deadline">Sort: Deadline</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
                {filteredCampaigns.map((c, i) => {
                  const p = pct(c);
                  const days = daysLeft(c.deadline);
                  const isActive = days > 0;
                  const isFull = p >= 100;
                  const isExpanded = expandedCampaign === c.id;
                  const reachedMilestones = c.milestones.filter(m => m.reached).length;
                  return (
                    <div key={c.id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.08}s`, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                        <span className={`badge ${CATEGORY_COLOR[c.category] ?? 'badge-orange'}`}>{c.category}</span>
                        <span className={`badge ${isFull ? 'badge-green' : isActive ? 'badge-green' : 'badge-red'}`}>
                          {isFull ? '🎉 Funded' : isActive ? `${days}d left` : 'Ended'}
                        </span>
                      </div>

                      <h3 style={{ fontWeight: 800, fontSize: 16, color: '#F1F5F9', marginBottom: 6 }}>{c.title}</h3>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 12, flex: 1 }}>{c.description}</p>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                        {c.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>#{tag}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
                        <span style={{ fontSize: 11, color: '#475569' }}>by <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{c.creator}</span></span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>👥 {c.backerCount} backers</span>
                      </div>

                      {/* Milestone progress */}
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 10, color: '#475569' }}>Milestones {reachedMilestones}/{c.milestones.length}</span>
                          <span style={{ fontSize: 10, color: '#F97316' }}>{p}% funded</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${p}%` }} />
                        </div>
                        {/* Milestone markers */}
                        <div style={{ position: 'relative', height: 4, marginTop: 2 }}>
                          {c.milestones.map((m, idx) => (
                            <div key={idx} style={{
                              position: 'absolute',
                              left: `${(m.target / c.goal) * 100}%`,
                              transform: 'translateX(-50%)',
                              width: 6, height: 6, borderRadius: '50%',
                              background: m.reached ? '#34D399' : 'rgba(255,255,255,0.15)',
                              border: '1px solid rgba(255,255,255,0.2)',
                            }} title={m.label} />
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 14 }}>
                        <span style={{ color: '#94A3B8' }}>
                          <b style={{ color: '#F97316', fontSize: 15, fontWeight: 800 }}>{c.raised.toLocaleString()}</b>
                          <span style={{ color: '#334155' }}> / {c.goal.toLocaleString()} XLM</span>
                        </span>
                        {xlmPrice && <span style={{ fontSize: 11, color: '#475569' }}>(${(c.raised * xlmPrice.price).toFixed(0)} USD)</span>}
                      </div>

                      <button
                        onClick={() => {
                          if (!wallet) { handleConnect(); return; }
                          if (!isFull && isActive) setContributeTarget(c);
                        }}
                        disabled={txStatus === 'pending' || (isFull && !!wallet)}
                        className="btn-orange"
                        style={{ fontSize: 13, padding: '11px 16px', marginBottom: 10 }}
                      >
                        {txStatus === 'pending' ? '⏳ Processing...' : isFull ? '🎉 Fully Funded' : !wallet ? '▶ Connect to Fund' : '💰 Fund this Campaign'}
                      </button>

                      {/* Expand milestones */}
                      <button
                        onClick={() => setExpandedCampaign(isExpanded ? null : c.id)}
                        className="btn-ghost"
                        style={{ fontSize: 12, width: '100%' }}
                      >
                        {isExpanded ? '▲ Hide' : '▼ Show'} Milestones & Voting
                      </button>

                      {isExpanded && (
                        <div className="animate-fade-in" style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                          <p style={{ fontSize: 11, color: '#475569', marginBottom: 10, fontWeight: 600, letterSpacing: '0.05em' }}>MILESTONE VOTING</p>
                          {c.milestones.map((m, idx) => (
                            <div key={idx} style={{
                              padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                              background: m.reached ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${m.reached ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
                              display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                              <span style={{ fontSize: 14 }}>{m.reached ? '✅' : '⏳'}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: m.reached ? '#34D399' : '#94A3B8', marginBottom: 2 }}>{m.label}</p>
                                <p style={{ fontSize: 10, color: '#475569' }}>{m.target.toLocaleString()} XLM target · {m.votes} votes</p>
                              </div>
                              <button
                                onClick={() => handleVoteMilestone(c.id, idx)}
                                disabled={!wallet || m.votedBy.includes(wallet)}
                                style={{
                                  padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  border: '1px solid rgba(249,115,22,0.3)',
                                  background: m.votedBy.includes(wallet) ? 'rgba(52,211,153,0.1)' : 'rgba(249,115,22,0.08)',
                                  color: m.votedBy.includes(wallet) ? '#34D399' : '#F97316',
                                  cursor: !wallet || m.votedBy.includes(wallet) ? 'not-allowed' : 'pointer',
                                  opacity: !wallet ? 0.5 : 1,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {m.votedBy.includes(wallet) ? '✓ Voted' : '👍 Vote'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
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
                      {ev.type === 'contrib' ? '💰' : ev.type === 'created' ? '🚀' : ev.type === 'milestone' ? '🏁' : ev.type === 'voted' ? '👍' : '🏆'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                        {ev.type === 'contrib'
                          ? <><span style={{ color: '#F97316' }}>{ev.from}</span> funded <span style={{ color: '#34D399' }}>{ev.amount} XLM</span> → Campaign #{ev.campaignId}</>
                          : ev.type === 'created'
                          ? <>Campaign <span style={{ color: '#F97316' }}>&quot;{ev.title}&quot;</span> created</>
                          : ev.type === 'milestone'
                          ? <><span style={{ color: '#F97316' }}>{ev.from}</span> confirmed milestone: <span style={{ color: '#34D399' }}>{ev.milestone}</span></>
                          : ev.type === 'voted'
                          ? <><span style={{ color: '#F97316' }}>{ev.from}</span> voted on: <span style={{ color: '#A78BFA' }}>{ev.milestone}</span></>
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

          {/* ===== ANALYTICS TAB ===== */}
          {activeTab === 'analytics' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
                {/* Bar Chart — Raised vs Goal */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>📊 Raised vs Goal by Campaign</h3>
                  {analyticsData.map(d => (
                    <div key={d.label} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{d.label}</span>
                        <span style={{ fontSize: 12, color: d.color, fontWeight: 700 }}>{((d.raised / d.goal) * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <div style={{ flex: 1, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            height: '100%', width: `${(d.raised / d.goal) * 100}%`,
                            background: `linear-gradient(90deg, ${d.color}88, ${d.color})`,
                            borderRadius: 6,
                            transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                            display: 'flex', alignItems: 'center', paddingLeft: 8,
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{d.raised.toLocaleString()} XLM</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: '#334155', minWidth: 60, textAlign: 'right' }}>/ {d.goal.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Backers Distribution */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>👥 Backers Distribution</h3>
                  {analyticsData.map(d => {
                    const barW = (d.backers / Math.max(...analyticsData.map(x => x.backers))) * 100;
                    return (
                      <div key={d.label} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{d.label}</span>
                          <span style={{ fontSize: 12, color: d.color, fontWeight: 700 }}>{d.backers} backers</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: d.color, borderRadius: 5, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
                    <p style={{ fontSize: 12, color: '#F97316', fontWeight: 700 }}>Total: {totalBackers} unique backers across {campaigns.length} campaigns</p>
                    <p style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Average: {(totalBackers / campaigns.length).toFixed(0)} backers/campaign</p>
                  </div>
                </div>

                {/* Funding velocity */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>⚡ Funding Velocity</h3>
                  {analyticsData.map((d, i) => {
                    const h = (d.raised / maxRaised) * 120;
                    return (
                      <div key={d.label} style={{ display: 'inline-block', textAlign: 'center', marginRight: 24 }}>
                        <div style={{ width: 48, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', alignItems: 'flex-end', overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{
                            width: '100%', height: h,
                            background: `linear-gradient(180deg, ${d.color}, ${d.color}44)`,
                            borderRadius: '6px 6px 0 0',
                            transition: `height ${0.8 + i * 0.2}s cubic-bezier(0.16,1,0.3,1)`,
                          }} />
                        </div>
                        <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{d.label}</p>
                        <p style={{ fontSize: 11, color: d.color, fontWeight: 700 }}>{(d.raised / 1000).toFixed(1)}k</p>
                      </div>
                    );
                  })}
                </div>

                {/* XLM Price widget */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>💹 XLM Market Data</h3>
                  {xlmPrice ? (
                    <>
                      <div style={{ fontSize: 36, fontWeight: 900, color: '#F97316', marginBottom: 4 }}>${xlmPrice.price.toFixed(4)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: xlmPrice.change >= 0 ? '#34D399' : '#F87171' }}>
                          {xlmPrice.change >= 0 ? '▲' : '▼'} {Math.abs(xlmPrice.change).toFixed(2)}% (24h)
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: 12, color: '#475569' }}>Total XLM Raised</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>{totalRaised.toLocaleString()} XLM</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: 12, color: '#475569' }}>USD Equivalent</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>${(totalRaised * xlmPrice.price).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: 12, color: '#475569' }}>Network</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#F97316' }}>Stellar Testnet</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#475569' }}>Loading XLM price…</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== LEADERBOARD TAB ===== */}
          {activeTab === 'leaderboard' && (
            <div className="animate-fade-in">
              <div className="card-glass" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 24 }}>🏆</span>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F1F5F9' }}>Top Contributors Leaderboard</h2>
                </div>
                {leaderboard.map((l, i) => (
                  <div key={l.address} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 12, marginBottom: 10,
                    background: i === 0 ? 'rgba(249,115,22,0.08)' : i === 1 ? 'rgba(148,163,184,0.05)' : i === 2 ? 'rgba(180,130,60,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${i === 0 ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s',
                  }}>
                    <span style={{ fontSize: 22, minWidth: 32, textAlign: 'center' }}>{l.badge}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace', marginBottom: 2 }}>{l.address}</p>
                      <p style={{ fontSize: 11, color: '#475569' }}>{l.count} contributions</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? '#F97316' : '#94A3B8' }}>{l.total.toLocaleString()}</p>
                      <p style={{ fontSize: 10, color: '#334155' }}>XLM contributed</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#60A5FA', fontWeight: 600, marginBottom: 4 }}>Your rank updates live as you fund campaigns</p>
                <p style={{ fontSize: 12, color: '#334155' }}>Connect wallet and fund campaigns to join the leaderboard</p>
              </div>
            </div>
          )}

          {/* ===== WALLET TAB ===== */}
          {activeTab === 'wallet' && (
            <div className="animate-fade-in">
              {!wallet ? (
                <div className="card-glass" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>👛</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Connect your wallet</h3>
                  <p style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>Connect Freighter or use Demo Mode to view your wallet details and transaction history.</p>
                  <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '12px 28px' }}>
                    {loading ? '⏳' : '▶ Connect Wallet'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
                  <div className="card-glass">
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>👛 Wallet Overview</h3>
                    <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', marginBottom: 16 }}>
                      <p style={{ fontSize: 10, color: '#475569', letterSpacing: '0.05em', marginBottom: 4 }}>ADDRESS</p>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8', wordBreak: 'break-all', marginBottom: 2 }}>{wallet}</p>
                      {isDemoMode && <span className="badge badge-blue" style={{ fontSize: 10 }}>🎮 Demo Address</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#F97316' }}>{parseFloat(balance).toLocaleString()}</p>
                        <p style={{ fontSize: 10, color: '#475569' }}>XLM Balance</p>
                      </div>
                      <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#34D399' }}>${xlmPrice ? (parseFloat(balance) * xlmPrice.price).toFixed(2) : '...'}</p>
                        <p style={{ fontSize: 10, color: '#475569' }}>USD Value</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-glass">
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>📜 Transaction History</h3>
                    {isDemoMode ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#334155' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🎮</div>
                        <p style={{ fontSize: 13, color: '#475569' }}>Demo mode — real transactions appear here when you connect Freighter with a live testnet account.</p>
                        <p style={{ fontSize: 11, color: '#334155', marginTop: 8 }}>Fund campaigns above to see demo activity recorded in Live Events.</p>
                      </div>
                    ) : walletTxs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        <p style={{ fontSize: 13, color: '#475569' }}>No transactions found on testnet.</p>
                        <a href={`https://stellar.expert/explorer/testnet/account/${wallet}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: '#F97316', display: 'block', marginTop: 8 }}>View on Stellar Expert →</a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {walletTxs.map(tx => (
                          <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: 16 }}>{tx.from === wallet ? '📤' : '📥'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 1 }}>{tx.type}</p>
                              <p style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>{tx.hash?.slice(0, 20)}...</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: tx.from === wallet ? '#F87171' : '#34D399' }}>
                                {tx.from === wallet ? '-' : '+'}{tx.amount} XLM
                              </p>
                              <p style={{ fontSize: 10, color: '#334155' }}>{new Date(tx.ts).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card-glass">
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>🔗 Testnet Resources</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { icon: '🔍', label: 'View Account on Explorer', href: `https://stellar.expert/explorer/testnet/account/${wallet}` },
                        { icon: '🧪', label: 'Stellar Laboratory', href: 'https://laboratory.stellar.org' },
                        { icon: '💧', label: 'Friendbot — Get Test XLM', href: `https://friendbot.stellar.org/?addr=${wallet}` },
                        { icon: '📋', label: 'Contract on Explorer', href: `https://stellar.expert/explorer/testnet/contract/${CAMPAIGN_CONTRACT}` },
                      ].map(item => (
                        <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'all 0.2s', color: 'inherit' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.04)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                        >
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>{item.label}</span>
                          <span style={{ marginLeft: 'auto', color: '#334155', fontSize: 12 }}>→</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
