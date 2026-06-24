'use client';
import { StellarEvent } from '@/lib/stellar';

interface Props {
  events: StellarEvent[];
}

export default function EventFeed({ events }: Props) {
  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
        <p style={{ fontSize: 13 }}>Waiting for on-chain events...</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {events.map((ev, i) => (
        <div key={i} className="event-item">
          <span style={{ fontSize: 18, flexShrink: 0 }}>
            {ev.type === 'contrib' ? '💰' : ev.type === 'created' ? '🚀' : '🏆'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
              {ev.type === 'contrib'
                ? <><span style={{ color: '#F97316', fontWeight: 700 }}>{ev.from}</span> funded <span style={{ color: '#34D399', fontWeight: 700 }}>{ev.amount} XLM</span> → #{ev.campaignId}</>
                : ev.type === 'created'
                ? <>🚀 <span style={{ color: '#F97316' }}>"{ ev.title}"</span> launched</>
                : <>🏆 Campaign #{ev.campaignId} claimed</>}
            </p>
          </div>
          <span style={{ fontSize: 10, color: '#334155', flexShrink: 0 }}>{new Date(ev.ts).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
