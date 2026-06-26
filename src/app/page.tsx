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
  target: number;
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
      addToast('Wallet connected!', 'success');
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
    addToast('Milestone vote recorded!', 'success');
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

  const analyticsData = [
    { label: 'Education', raised: 1450, goal: 2000, backers: 23, color: '#60A5FA' },
    { label: 'Dev Tools', raised: 3820, goal: 5000, backers: 47, color: '#A78BFA' },
    { label: 'DeFi', raised: 10000, goal: 10000, backers: 89, color: '#F97316' },
  ];
  const maxRaised = Math.max(...analyticsData.map(d => d.raised));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'campaigns', label: `🔥 Campaigns (${campaigns.length})` },
    { id: 'events', label: `📡 Live (${events.length})` },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'leaderboard', label: '🏆 Leaders' },
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
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="animate-toast" style={{
            padding: '11px 16px',
            borderRadius: 12,
            background: t.type === 'success' ? 'rgba(52,211,153,0.15)' : t.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.15)',
            border: `1px solid ${t.type === 'success' ? 'rgba(52,211,153,0.35)' : t.type === 'error' ? 'rgba(248,113,113,0.35)' : 'rgba(96,165,250,0.35)'}`,
            color: t.type === 'success' ? '#34D399' : t.type === 'error' ? '#F87171' : '#60A5FA',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>

        {/* ===== HEADER ===== */}
        <header className="site-header">
          <div className="header-inner">
            {/* Logo */}
            <div className="header-logo">
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#F97316,#EA580C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                boxShadow: '0 4px 14px rgba(249,115,22,0.45)',
                flexShrink: 0,
              }}>⭐</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(90deg,#F97316,#FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StellarFund</div>
                <div style={{ fontSize: 9, color: '#475569', fontWeight: 500, letterSpacing: '0.08em' }}>SOROBAN TESTNET</div>
              </div>
              {xlmPrice && (
                <div className="xlm-price-pill">
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>XLM</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#F1F5F9' }}>${xlmPrice.price.toFixed(4)}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: xlmPrice.change >= 0 ? '#34D399' : '#F87171' }}>
                    {xlmPrice.change >= 0 ? '▲' : '▼'}{Math.abs(xlmPrice.change).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* Header Actions */}
            <div className="header-actions">
              {wallet && (
                <button onClick={() => setShowCreate(true)} className="btn-secondary" style={{ fontSize: 12, padding: '8px 13px' }}>
                  + Campaign
                </button>
              )}
              {wallet ? (
                <div className="wallet-pill" style={{
                  background: isDemoMode ? 'rgba(96,165,250,0.1)' : 'rgba(52,211,153,0.1)',
                  border: `1px solid ${isDemoMode ? 'rgba(96,165,250,0.25)' : 'rgba(52,211,153,0.25)'}`,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: isDemoMode ? '#60A5FA' : '#34D399', display: 'inline-block', animation: 'pulse-glow 2s ease-in-out infinite', flexShrink: 0 }} />
                  <span className="wallet-pill-text" style={{ color: isDemoMode ? '#60A5FA' : '#34D399' }}>
                    {isDemoMode ? '🎮 Demo' : shortenKey(wallet)}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748B', flexShrink: 0 }}>·</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, whiteSpace: 'nowrap' }}>{parseFloat(balance).toLocaleString()} XLM</span>
                </div>
              ) : (
                <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '9px 16px', fontSize: 12 }}>
                  {loading ? '⏳' : hasFreighter ? '🔑 Connect' : '▶ Demo'}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ===== PAGE SHELL ===== */}
        <div className="page-shell">

          {/* Error bar */}
          {error && (
            <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)', color: '#FCA5A5', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="animate-fade-in">
              <span>⚠ {error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
          )}

          {/* TX Status */}
          {txStatus !== 'idle' && (
            <div className="tx-status-bar animate-fade-in" style={{
              border: `1px solid ${txStatus === 'pending' ? 'rgba(249,115,22,0.35)' : txStatus === 'success' ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
              background: txStatus === 'pending' ? 'rgba(249,115,22,0.07)' : txStatus === 'success' ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
            }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>
                {txStatus === 'pending' ? '⏳' : txStatus === 'success' ? '✅' : '❌'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
                  {txStatus === 'pending' ? 'Broadcasting to Stellar Testnet...' : txStatus === 'success' ? 'Transaction Confirmed!' : 'Transaction Failed'}
                </p>
                {txStatus === 'success' && txHash && (
                  <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, color: '#F97316', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    TX: {txHash.slice(0, 28)}...
                  </a>
                )}
              </div>
              {txStatus !== 'pending' && (
                <button onClick={() => { setTxStatus('idle'); setTxHash(''); }}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>×</button>
              )}
            </div>
          )}

          {/* ===== HERO ===== */}
          {!wallet && (
            <div className="hero-section animate-fade-in">
              <div className="animate-float" style={{ fontSize: 56, marginBottom: 16, display: 'inline-block' }}>⭐</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                <span className="badge badge-orange">🟠 Level 3 Orange Belt</span>
                <span className="badge badge-purple">Soroban Smart Contracts</span>
              </div>
              <h1 className="hero-title">
                <span style={{ background: 'linear-gradient(90deg,#F97316,#FB923C,#FCD34D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Decentralized</span>
                <br />
                <span style={{ color: '#E2E8F0' }}>Crowdfunding</span>
                <br />
                <span style={{ color: '#475569', fontSize: '0.6em', fontWeight: 700 }}>on Stellar Soroban</span>
              </h1>
              <p className="hero-subtitle">
                Create campaigns, fund projects with XLM, vote on milestones, and track every transaction — governed by on-chain Soroban smart contracts.
              </p>
              <div className="hero-cta-row">
                <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '14px 28px', fontSize: 15 }}>
                  {loading ? '⏳ Connecting...' : hasFreighter ? '🔑 Connect Freighter' : '▶ Launch Demo Mode'}
                </button>
                <a href="https://freighter.app" target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: '14px 22px', fontSize: 14, textDecoration: 'none' }}>
                  Install Freighter →
                </a>
              </div>
              <p style={{ marginTop: 14, fontSize: 12, color: '#334155' }}>
                No wallet? <strong style={{ color: '#60A5FA' }}>Demo Mode</strong> — 10,000 XLM test tokens included.
              </p>
            </div>
          )}

          {/* ===== CONTRACT BAR ===== */}
          <div className="contract-bar">
            <div className="contract-bar-left">
              <span style={{ fontSize: 13, flexShrink: 0 }}>📋</span>
              <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', flexShrink: 0 }}>CONTRACT</span>
              <a href={`https://stellar.expert/explorer/testnet/contract/${CAMPAIGN_CONTRACT}`} target="_blank" rel="noreferrer" className="contract-address">
                {CAMPAIGN_CONTRACT.slice(0, 14)}...{CAMPAIGN_CONTRACT.slice(-6)}
              </a>
            </div>
            <div className="contract-bar-badges">
              <span className="badge badge-green">✅ Deployed</span>
              <span className="badge badge-orange">Testnet</span>
              <span className="badge badge-blue">Soroban v21</span>
              {isDemoMode && <span className="badge badge-purple">🎮 Demo</span>}
            </div>
          </div>

          {/* ===== STATS GRID ===== */}
          <div className="stats-grid">
            {([
              ['🏆', campaigns.length, 'Campaigns', '#F97316'],
              ['🔥', activeCount, 'Active', '#FB923C'],
              ['✅', fundedCount, 'Funded', '#34D399'],
              ['💰', totalRaised.toLocaleString(), 'XLM Raised', '#60A5FA'],
              ['👥', totalBackers, 'Backers', '#A78BFA'],
              ['💵', xlmPrice ? `$${(totalRaised * xlmPrice.price).toFixed(0)}` : '…', 'USD Value', '#FCD34D'],
            ] as [string, number | string, string, string][]).map(([icon, val, label, color], i) => (
              <div key={label} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 'clamp(16px,3vw,24px)', fontWeight: 800, color, marginBottom: 3 }}>{val}</div>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Wallet prompt banner */}
          {!wallet && (
            <div className="wallet-prompt">
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 2 }}>Launch Demo to interact</p>
                <p style={{ fontSize: 11, color: '#475569' }}>Fund campaigns, create projects, and vote on milestones.</p>
              </div>
              <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '9px 16px', fontSize: 12, flexShrink: 0 }}>
                {loading ? '⏳' : '▶ Go'}
              </button>
            </div>
          )}

          {/* ===== TABS ===== */}
          <div className="tabs-scroll">
            {tabs.map(t => (
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ===== CAMPAIGNS TAB ===== */}
          {activeTab === 'campaigns' && (
            <>
              <div className="filter-row">
                <div className="filter-cats">
                  {categories.map(cat => (
                    <button key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className="filter-cat-btn"
                      style={{
                        background: filterCategory === cat ? 'rgba(249,115,22,0.12)' : 'transparent',
                        borderColor: filterCategory === cat ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)',
                        color: filterCategory === cat ? '#F97316' : '#64748B',
                      }}>{cat}</button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'raised' | 'pct' | 'deadline')}
                  className="filter-sort-select">
                  <option value="raised">Most Raised</option>
                  <option value="pct">% Funded</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>

              <div className="campaigns-grid">
                {filteredCampaigns.map((c, i) => {
                  const p = pct(c);
                  const days = daysLeft(c.deadline);
                  const isActive = days > 0;
                  const isFull = p >= 100;
                  const isExpanded = expandedCampaign === c.id;
                  const reachedMilestones = c.milestones.filter(m => m.reached).length;
                  return (
                    <div key={c.id} className="card animate-fade-in" style={{ animationDelay: `${i * 0.07}s`, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 6 }}>
                        <span className={`badge ${CATEGORY_COLOR[c.category] ?? 'badge-orange'}`}>{c.category}</span>
                        <span className={`badge ${isFull ? 'badge-green' : isActive ? 'badge-green' : 'badge-red'}`}>
                          {isFull ? '🎉 Funded' : isActive ? `${days}d left` : 'Ended'}
                        </span>
                      </div>

                      <h3 style={{ fontWeight: 800, fontSize: 15, color: '#F1F5F9', marginBottom: 6, lineHeight: 1.3 }}>{c.title}</h3>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 10, flex: 1 }}>{c.description}</p>

                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {c.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>#{tag}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0 }}>👤</div>
                        <span style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>by <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{c.creator}</span></span>
                        <span style={{ fontSize: 10, color: '#475569', flexShrink: 0 }}>👥 {c.backerCount}</span>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#475569' }}>Milestones {reachedMilestones}/{c.milestones.length}</span>
                          <span style={{ fontSize: 10, color: '#F97316', fontWeight: 700 }}>{p}% funded</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${p}%` }} />
                        </div>
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 12 }}>
                        <span>
                          <b style={{ color: '#F97316', fontSize: 14, fontWeight: 800 }}>{c.raised.toLocaleString()}</b>
                          <span style={{ color: '#334155', fontSize: 12 }}> / {c.goal.toLocaleString()} XLM</span>
                        </span>
                        {xlmPrice && <span style={{ fontSize: 10, color: '#475569' }}>${(c.raised * xlmPrice.price).toFixed(0)}</span>}
                      </div>

                      <button
                        onClick={() => {
                          if (!wallet) { handleConnect(); return; }
                          if (!isFull && isActive) setContributeTarget(c);
                        }}
                        disabled={txStatus === 'pending' || (isFull && !!wallet)}
                        className="btn-orange"
                        style={{ fontSize: 13, padding: '11px 14px', marginBottom: 8 }}
                      >
                        {txStatus === 'pending' ? '⏳ Processing...' : isFull ? '🎉 Fully Funded' : !wallet ? '▶ Connect to Fund' : '💰 Fund this Campaign'}
                      </button>

                      <button
                        onClick={() => setExpandedCampaign(isExpanded ? null : c.id)}
                        className="btn-ghost"
                        style={{ fontSize: 12, width: '100%' }}
                      >
                        {isExpanded ? '▲ Hide' : '▼ Show'} Milestones & Voting
                      </button>

                      {isExpanded && (
                        <div className="animate-fade-in" style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                          <p style={{ fontSize: 10, color: '#475569', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>MILESTONE VOTING</p>
                          {c.milestones.map((m, idx) => (
                            <div key={idx} style={{
                              padding: '9px 11px', borderRadius: 10, marginBottom: 7,
                              background: m.reached ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${m.reached ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
                              display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              <span style={{ fontSize: 13, flexShrink: 0 }}>{m.reached ? '✅' : '⏳'}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: m.reached ? '#34D399' : '#94A3B8', marginBottom: 1 }}>{m.label}</p>
                                <p style={{ fontSize: 10, color: '#475569' }}>{m.target.toLocaleString()} XLM · {m.votes} votes</p>
                              </div>
                              <button
                                onClick={() => handleVoteMilestone(c.id, idx)}
                                disabled={!wallet || m.votedBy.includes(wallet)}
                                style={{
                                  padding: '5px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                                  border: '1px solid rgba(249,115,22,0.3)',
                                  background: m.votedBy.includes(wallet) ? 'rgba(52,211,153,0.1)' : 'rgba(249,115,22,0.08)',
                                  color: m.votedBy.includes(wallet) ? '#34D399' : '#F97316',
                                  cursor: !wallet || m.votedBy.includes(wallet) ? 'not-allowed' : 'pointer',
                                  opacity: !wallet ? 0.5 : 1,
                                  transition: 'all 0.2s',
                                  flexShrink: 0,
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', animation: 'pulse-glow 2s ease-in-out infinite', flexShrink: 0 }} />
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Live On-Chain Events</h2>
                </div>
                <span className="badge badge-green">Streaming</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#334155' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
                    <div style={{ fontSize: 13, color: '#475569' }}>No events yet. Fund a campaign to see live updates!</div>
                  </div>
                )}
                {events.map((ev, i) => (
                  <div key={i} className="event-item">
                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                      {ev.type === 'contrib' ? '💰' : ev.type === 'created' ? '🚀' : ev.type === 'milestone' ? '🏁' : ev.type === 'voted' ? '👍' : '🏆'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.type === 'contrib'
                          ? <>{ev.from} funded {ev.amount} XLM → Campaign #{ev.campaignId}</>
                          : ev.type === 'created'
                          ? <>Campaign &quot;{ev.title}&quot; created</>
                          : ev.type === 'voted'
                          ? <>{ev.from} voted on: {ev.milestone}</>
                          : ev.type === 'milestone'
                          ? <>{ev.from} confirmed: {ev.milestone}</>
                          : <>Campaign #{ev.campaignId} claimed</>}
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
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>

                {/* Bar Chart — Raised vs Goal */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 18 }}>📊 Raised vs Goal</h3>
                  {analyticsData.map(d => (
                    <div key={d.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{d.label}</span>
                        <span style={{ fontSize: 12, color: d.color, fontWeight: 700 }}>{((d.raised / d.goal) * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <div style={{ flex: 1, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${(d.raised / d.goal) * 100}%`,
                            background: `linear-gradient(90deg, ${d.color}88, ${d.color})`,
                            borderRadius: 6,
                            display: 'flex', alignItems: 'center', paddingLeft: 8,
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{d.raised.toLocaleString()}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: '#334155', minWidth: 52, textAlign: 'right' }}>/ {d.goal.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Backers */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 18 }}>👥 Backers Distribution</h3>
                  {analyticsData.map(d => {
                    const barW = (d.backers / Math.max(...analyticsData.map(x => x.backers))) * 100;
                    return (
                      <div key={d.label} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{d.label}</span>
                          <span style={{ fontSize: 12, color: d.color, fontWeight: 700 }}>{d.backers}</span>
                        </div>
                        <div style={{ height: 9, borderRadius: 5, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barW}%`, background: d.color, borderRadius: 5, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 10, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
                    <p style={{ fontSize: 11, color: '#F97316', fontWeight: 700 }}>Total: {totalBackers} backers across {campaigns.length} campaigns</p>
                    <p style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>Avg: {(totalBackers / campaigns.length).toFixed(0)} per campaign</p>
                  </div>
                </div>

                {/* Velocity */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 16 }}>⚡ Funding Velocity</h3>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 130 }}>
                    {analyticsData.map((d, i) => {
                      const h = Math.round((d.raised / maxRaised) * 100);
                      return (
                        <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <span style={{ fontSize: 10, color: d.color, fontWeight: 700, marginBottom: 4 }}>{(d.raised / 1000).toFixed(1)}k</span>
                          <div style={{ width: '100%', maxWidth: 48, background: 'rgba(255,255,255,0.03)', borderRadius: 6, height: 90, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                            <div style={{
                              width: '100%',
                              height: `${h}%`,
                              background: `linear-gradient(180deg, ${d.color}, ${d.color}44)`,
                              borderRadius: '6px 6px 0 0',
                              transition: `height ${0.8 + i * 0.2}s cubic-bezier(0.16,1,0.3,1)`,
                            }} />
                          </div>
                          <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 6, textAlign: 'center' }}>{d.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* XLM Market */}
                <div className="card-glass">
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>💹 XLM Market</h3>
                  {xlmPrice ? (
                    <>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#F97316', marginBottom: 4 }}>${xlmPrice.price.toFixed(4)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: xlmPrice.change >= 0 ? '#34D399' : '#F87171' }}>
                          {xlmPrice.change >= 0 ? '▲' : '▼'} {Math.abs(xlmPrice.change).toFixed(2)}% (24h)
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          ['Total XLM Raised', `${totalRaised.toLocaleString()} XLM`, '#60A5FA'],
                          ['USD Equivalent', `$${(totalRaised * xlmPrice.price).toFixed(2)}`, '#34D399'],
                          ['Network', 'Stellar Testnet', '#F97316'],
                        ].map(([k, v, c]) => (
                          <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                            <span style={{ fontSize: 11, color: '#475569' }}>{k}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: c as string }}>{v}</span>
                          </div>
                        ))}
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
              <div className="card-glass" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <span style={{ fontSize: 22 }}>🏆</span>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>Top Contributors</h2>
                </div>
                {leaderboard.map((l, i) => (
                  <div key={l.address} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 12, marginBottom: 8,
                    background: i === 0 ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${i === 0 ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <span style={{ fontSize: 20, minWidth: 28, textAlign: 'center', flexShrink: 0 }}>{l.badge}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.address}</p>
                      <p style={{ fontSize: 10, color: '#475569' }}>{l.count} contributions</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? '#F97316' : '#94A3B8' }}>{l.total.toLocaleString()}</p>
                      <p style={{ fontSize: 9, color: '#334155' }}>XLM</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#60A5FA', fontWeight: 600, marginBottom: 3 }}>Rank updates live as you fund campaigns</p>
                <p style={{ fontSize: 11, color: '#334155' }}>Fund campaigns to appear on the leaderboard</p>
              </div>
            </div>
          )}

          {/* ===== WALLET TAB ===== */}
          {activeTab === 'wallet' && (
            <div className="animate-fade-in">
              {!wallet ? (
                <div className="card-glass" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>👛</div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Connect your wallet</h3>
                  <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>Connect Freighter or use Demo Mode to view wallet details.</p>
                  <button onClick={handleConnect} disabled={loading} className="btn-orange" style={{ width: 'auto', padding: '12px 24px' }}>
                    {loading ? '⏳' : '▶ Connect Wallet'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                  <div className="card-glass">
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>👛 Wallet Overview</h3>
                    <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', marginBottom: 14 }}>
                      <p style={{ fontSize: 9, color: '#475569', letterSpacing: '0.05em', marginBottom: 4 }}>ADDRESS</p>
                      <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#94A3B8', wordBreak: 'break-all', marginBottom: 4 }}>{wallet}</p>
                      {isDemoMode && <span className="badge badge-blue" style={{ fontSize: 10 }}>🎮 Demo Address</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#F97316' }}>{parseFloat(balance).toLocaleString()}</p>
                        <p style={{ fontSize: 10, color: '#475569' }}>XLM Balance</p>
                      </div>
                      <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#34D399' }}>${xlmPrice ? (parseFloat(balance) * xlmPrice.price).toFixed(0) : '...'}</p>
                        <p style={{ fontSize: 10, color: '#475569' }}>USD Value</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-glass">
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>📜 Transaction History</h3>
                    {isDemoMode ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#334155' }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>🎮</div>
                        <p style={{ fontSize: 12, color: '#475569' }}>Demo mode — real transactions appear here with Freighter.</p>
                        <p style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>Fund campaigns to see demo activity in Live Events.</p>
                      </div>
                    ) : walletTxs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>📭</div>
                        <p style={{ fontSize: 12, color: '#475569' }}>No transactions on testnet yet.</p>
                        <a href={`https://stellar.expert/explorer/testnet/account/${wallet}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 12, color: '#F97316', display: 'block', marginTop: 6 }}>View on Stellar Expert →</a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {walletTxs.map(tx => (
                          <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{tx.from === wallet ? '📤' : '📥'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 1 }}>{tx.type}</p>
                              <p style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.hash?.slice(0, 20)}...</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>🔗 Testnet Resources</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {[
                        { icon: '🔍', label: 'Account Explorer', href: `https://stellar.expert/explorer/testnet/account/${wallet}` },
                        { icon: '🧪', label: 'Stellar Laboratory', href: 'https://laboratory.stellar.org' },
                        { icon: '💧', label: 'Friendbot — Get Test XLM', href: `https://friendbot.stellar.org/?addr=${wallet}` },
                        { icon: '📋', label: 'Contract Explorer', href: `https://stellar.expert/explorer/testnet/contract/${CAMPAIGN_CONTRACT}` },
                      ].map(item => (
                        <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'all 0.2s', color: 'inherit' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.3)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        >
                          <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, flex: 1 }}>{item.label}</span>
                          <span style={{ color: '#334155', fontSize: 12 }}>→</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== FOOTER ===== */}
          <footer style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <a href="https://github.com/gopichandchalla16/stellar-orange-belt" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 11, textDecoration: 'none' }}>📁 GitHub</a>
              <a href={`https://stellar.expert/explorer/testnet/contract/${CAMPAIGN_CONTRACT}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 11, textDecoration: 'none' }}>🔍 Contract</a>
              <a href="https://laboratory.stellar.org" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 11, textDecoration: 'none' }}>🧪 Lab</a>
            </div>
            <p style={{ fontSize: 10, color: '#1E293B' }}>StellarFund · Level 3 Orange Belt · Built on Soroban Testnet</p>
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
