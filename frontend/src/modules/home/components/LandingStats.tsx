/* @module: LandingStats — 3D interactive statistics and metrics cards */
import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Star } from 'lucide-react';
import { useLifeDrop } from '../../../context/LifeDropContext';

interface LandingStatsProps {
  donorCount: number;
  hospitalCount: number;
  bloodBankCount: number;
  livesSaved: number;
}

export const LandingStats: React.FC<LandingStatsProps> = ({
  donorCount,
  hospitalCount,
  bloodBankCount,
  livesSaved,
}) => {
  const { feedbacks } = useLifeDrop();
  const avgRating =
    feedbacks && feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : '5.0';
  const totalReviews = 500 + Math.max(0, (feedbacks?.length || 5) - 5);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-6 sm:pt-12 text-left">
      <Card isInteractive variant="glass" className="p-3.5 sm:p-5">
        <div className="text-2xl sm:text-3xl font-black text-lifedrop-navy">{donorCount * 120}+</div>
        <div className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Registered Donors</div>
      </Card>

      <Card isInteractive variant="glass" className="p-3.5 sm:p-5">
        <div className="text-2xl sm:text-3xl font-black text-blue-700">{hospitalCount}+</div>
        <div className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Verified Hospitals</div>
      </Card>

      <Card isInteractive variant="glass" className="p-3.5 sm:p-5">
        <div className="text-2xl sm:text-3xl font-black text-amber-700">{bloodBankCount}+</div>
        <div className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Verified Blood Banks</div>
      </Card>

      <Card isInteractive variant="glass" className="p-3.5 sm:p-5">
        <div className="text-2xl sm:text-3xl font-black text-emerald-700">{livesSaved * 45}+</div>
        <div className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Lives Supported</div>
      </Card>

      <div className="col-span-2 sm:col-span-1">
        <Card isInteractive variant="glass" className="p-3.5 sm:p-5 h-full">
          <div className="text-2xl sm:text-3xl font-black text-amber-500 flex items-center gap-1.5">
            <span>{avgRating}</span>
            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-400 inline shrink-0" />
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
            {totalReviews}+ Reviews
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LandingStats;
