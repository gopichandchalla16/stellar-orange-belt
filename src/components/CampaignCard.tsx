'use client';
import { Campaign } from '@/types/campaign';

interface Props {
  campaign: Campaign;
  onContribute: () => void;
  isLoading: boolean;
}

export default function CampaignCard({ campaign, onContribute, isLoading }: Props) {
  const pct = Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100);
  const isGoalMet = campaign.raised >= campaign.goal;
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000));

  return (
    <div className="card hover:border-orange-500/30 transition-all duration-300 animate-fade-in flex flex-col" data-testid="campaign-card">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{isGoalMet ? '\uD83C\uDF89' : '\uD83D\uDFE0'}</span>
        {isGoalMet
          ? <span className="badge-success">Goal Met!</span>
          : <span className="text-xs text-gray-500">{daysLeft}d left</span>
        }
      </div>
      <h3 className="font-bold text-white text-sm mb-1 flex-1">{campaign.title}</h3>
      <p className="text-xs text-gray-500 mb-4">by {campaign.creator}</p>

      <div className="progress-bar mb-2">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs mb-4">
        <span className="text-orange-400 font-bold">{campaign.raised.toLocaleString()} XLM</span>
        <span className="text-gray-500">{pct}% of {campaign.goal.toLocaleString()}</span>
      </div>

      <button
        onClick={onContribute}
        disabled={isLoading || campaign.claimed}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
          isGoalMet && !campaign.claimed
            ? 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
            : 'bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25'
        } disabled:opacity-40`}
      >
        {campaign.claimed ? '\u2705 Claimed' : isGoalMet ? '\uD83C\uDF89 Claim Funds' : '\uD83D\uDCB3 Contribute XLM'}
      </button>
    </div>
  );
}
