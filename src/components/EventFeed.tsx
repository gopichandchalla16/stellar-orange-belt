'use client';

interface StellarEvent {
  type: string;
  campaignId?: number;
  amount?: number;
  from?: string;
  title?: string;
  ts: number;
}

interface Props {
  events: StellarEvent[];
}

const timeAgo = (ts: number): string => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

export default function EventFeed({ events }: Props) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>&#128225; Live Events</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.length === 0 && (
          <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: '20px 0' }}>Waiting for on-chain events...</p>
        )}
        {events.map((e, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: e.type === 'contrib' ? '#34D399' : '#F97316' }}>
                {e.type === 'contrib' ? '&#128176; Contribution' : '&#127942; Campaign Created'}
              </span>
              <span style={{ fontSize: 10, color: '#475569' }}>{timeAgo(e.ts)}</span>
            </div>
            {e.type === 'contrib' && (
              <p style={{ fontSize: 12, color: '#94A3B8' }}>
                <b style={{ color: '#fff' }}>{e.amount} XLM</b> from {e.from} to Campaign #{e.campaignId}
              </p>
            )}
            {e.type === 'created' && (
              <p style={{ fontSize: 12, color: '#94A3B8' }}>&ldquo;{e.title}&rdquo;</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
