import React from 'react';
import { DonorRank } from '../../types';
import { Award, Shield, Crown, Sparkles } from 'lucide-react';

interface DonorRankBadgeProps {
  rank: DonorRank;
  donationsCount: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const DonorRankBadge: React.FC<DonorRankBadgeProps> = ({
  rank,
  donationsCount,
  showProgress = false,
  size = 'md',
}) => {
  const getRankDetails = (r: DonorRank) => {
    switch (r) {
      case 'Platinum':
        return {
          icon: Crown,
          bgGradient: 'from-slate-700 via-slate-800 to-indigo-950',
          textColor: 'text-indigo-200',
          borderColor: 'border-indigo-400/40',
          accent: '#A5B4FC',
          nextGoal: 10,
          label: 'Platinum Life Hero',
        };
      case 'Gold':
        return {
          icon: Sparkles,
          bgGradient: 'from-amber-500 via-amber-600 to-yellow-700',
          textColor: 'text-amber-100',
          borderColor: 'border-yellow-300/50',
          accent: '#FDE68A',
          nextGoal: 6,
          label: 'Gold Guardian',
        };
      case 'Silver':
        return {
          icon: Shield,
          bgGradient: 'from-slate-400 via-slate-500 to-slate-600',
          textColor: 'text-slate-100',
          borderColor: 'border-slate-300/40',
          accent: '#E2E8F0',
          nextGoal: 3,
          label: 'Silver Defender',
        };
      default:
        return {
          icon: Award,
          bgGradient: 'from-amber-700 via-orange-800 to-amber-900',
          textColor: 'text-amber-200',
          borderColor: 'border-amber-600/40',
          accent: '#FDBA74',
          nextGoal: 1,
          label: 'Bronze Donor',
        };
    }
  };

  const details = getRankDetails(rank);
  const Icon = details.icon;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${details.bgGradient} ${details.textColor} border ${details.borderColor} shadow-sm`}
      >
        <Icon className="w-3.5 h-3.5" />
        {rank}
      </span>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${details.bgGradient} text-white shadow-xl border ${details.borderColor} card-3d-interactive`}
    >
      {/* 3D Sheen Highlight */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/75 font-semibold">
              Donor Tier
            </div>
            <div className="text-lg font-extrabold flex items-center gap-2 text-white">
              {rank} Rank
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                {donationsCount} {donationsCount === 1 ? 'Donation' : 'Donations'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="mt-4 pt-3 border-t border-white/15">
          <div className="flex justify-between text-xs text-white/80 font-medium mb-1.5">
            <span>Progress to {rank === 'Platinum' ? 'Legend' : 'Next Tier'}</span>
            <span>
              {donationsCount} / {details.nextGoal} Donations
            </span>
          </div>
          <div className="w-full bg-black/25 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="bg-white h-full rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${Math.min(100, (donationsCount / details.nextGoal) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
