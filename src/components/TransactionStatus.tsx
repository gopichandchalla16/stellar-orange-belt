'use client';
import { TxStatus } from '@/app/page';

interface Props {
  status: TxStatus;
  txHash?: string;
  onDismiss: () => void;
}

export default function TransactionStatus({ status, txHash, onDismiss }: Props) {
  if (status === 'idle') return null;

  const config = {
    pending: {
      icon: <div style={{ width: 32, height: 32, border: '3px solid rgba(249,115,22,0.3)', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />,
      title: 'Broadcasting Transaction...',
      subtitle: 'Signing and submitting to Stellar Testnet',
      borderColor: 'rgba(249,115,22,0.3)',
      bgColor: 'rgba(249,115,22,0.07)',
    },
    success: {
      icon: <span style={{ fontSize: 28 }}>✅</span>,
      title: 'Transaction Confirmed!',
      subtitle: 'Successfully recorded on Stellar Testnet',
      borderColor: 'rgba(52,211,153,0.3)',
      bgColor: 'rgba(52,211,153,0.07)',
    },
    error: {
      icon: <span style={{ fontSize: 28 }}>❌</span>,
      title: 'Transaction Failed',
      subtitle: 'Something went wrong. Please try again.',
      borderColor: 'rgba(248,113,113,0.3)',
      bgColor: 'rgba(248,113,113,0.07)',
    },
  }[status];

  if (!config) return null;

  return (
    <div className="animate-fade-in" style={{ borderRadius: 18, border: `1px solid ${config.borderColor}`, background: config.bgColor, padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {config.icon}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{config.title}</p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{config.subtitle}</p>
          {txHash && status === 'success' && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#F97316', fontFamily: 'monospace', marginTop: 6, display: 'block', wordBreak: 'break-all' }}>
              🔍 {txHash.slice(0, 32)}... ↗
            </a>
          )}
        </div>
        {status !== 'pending' && (
          <button onClick={onDismiss} style={{ color: '#64748B', cursor: 'pointer', fontSize: 16, background: 'none', border: 'none' }}>✕</button>
        )}
      </div>
    </div>
  );
}
