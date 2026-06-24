'use client';
import { useState, useEffect } from 'react';

interface FeedEvent {
  id: number;
  type: 'contrib' | 'created' | 'claimed';
  message: string;
  time: string;
}

const INITIAL_EVENTS: FeedEvent[] = [
  { id: 1, type: 'contrib', message: 'GB3Z...WAFO contributed 100 XLM to campaign #1', time: '30s ago' },
  { id: 2, type: 'contrib', message: 'GC4A...XYZ1 contributed 250 XLM to campaign #2', time: '2m ago' },
  { id: 3, type: 'created', message: 'New campaign created: Stellar Education Hub', time: '5m ago' },
  { id: 4, type: 'claimed', message: 'GD5D...MNO2 claimed 2000 XLM from campaign #2', time: '12m ago' },
];

export default function EventFeed({ walletAddress }: { walletAddress: string }) {
  const [events, setEvents] = useState<FeedEvent[]>(INITIAL_EVENTS);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const random = Math.random();
      const newEvent: FeedEvent = {
        id: Date.now(),
        type: random > 0.7 ? 'created' : 'contrib',
        message: random > 0.7
          ? 'New campaign created on-chain'
          : `${walletAddress ? walletAddress.slice(0,6)+'...'+walletAddress.slice(-4) : 'G'+Math.random().toString(36).slice(2,8).toUpperCase()+'...'+Math.random().toString(36).slice(2,6).toUpperCase()} contributed ${Math.floor(Math.random()*200+10)} XLM`,
        time: 'just now',
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 6)]);
    }, 8000);
    return () => clearInterval(interval);
  }, [isLive, walletAddress]);

  const iconMap = { contrib: '💳', created: '🚀', claimed: '✅' };

  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <h3 className="text-sm font-bold text-white">Live Contract Events</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-live">Streaming</span>
          <button onClick={() => setIsLive(!isLive)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              isLive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}>
            {isLive ? '⏸ Pause' : '▶ Resume'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
        {events.map(event => (
          <div key={event.id} className="animate-fade-in"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span>{iconMap[event.type]}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#E2E8F0' }}>{event.message}</p>
              <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{event.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
