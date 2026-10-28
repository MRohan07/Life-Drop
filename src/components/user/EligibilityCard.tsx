import React from 'react';
import { checkEligibility } from '../../utils/compatibility';
import { formatDate } from '../../utils/formatters';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';

interface EligibilityCardProps {
  lastDonationDate: string | null;
  donorName: string;
  bloodGroup: string;
}

export const EligibilityCard: React.FC<EligibilityCardProps> = ({
  lastDonationDate,
  donorName,
  bloodGroup,
}) => {
  const { isEligible, nextEligibleDate, daysRemaining, progressPercent } =
    checkEligibility(lastDonationDate);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 card-3d-interactive border-2 ${
        isEligible
          ? 'bg-gradient-to-br from-white to-emerald-50/50 border-emerald-500 shadow-lg shadow-emerald-500/5'
          : 'bg-gradient-to-br from-white to-rose-50/50 border-lifedrop-emergency shadow-lg shadow-rose-500/5'
      }`}
    >
      {/* Top Banner */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isEligible
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {isEligible ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Eligible to Donate
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Currently Not Eligible
                </>
              )}
            </span>

            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold border border-slate-200">
              {bloodGroup} Blood Group
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-lifedrop-navy mt-3">
            {isEligible
              ? 'You are ready to save lives today!'
              : `Recovery period active (${daysRemaining} days remaining)`}
          </h3>

          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
            {isEligible
              ? 'Medical safety criteria met. You can respond to emergency blood requests or book a donation appointment.'
              : 'Under medical safety standards, donor eligibility is restored automatically 90 days after your last confirmed donation.'}
          </p>
        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg flex-shrink-0 shadow-md ${
            isEligible
              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
              : 'bg-lifedrop-emergency text-white shadow-rose-500/30'
          }`}
        >
          {isEligible ? '100%' : `${progressPercent}%`}
        </div>
      </div>

      {/* 90-Day Progress Bar */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            90-Day Eligibility Cycle
          </span>
          <span className={isEligible ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
            {isEligible ? 'Cycle Complete' : `${daysRemaining} Days to Unlock`}
          </span>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-700 shadow-sm ${
              isEligible
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : 'bg-gradient-to-r from-rose-400 to-lifedrop-emergency'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Date Milestones */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Last Confirmed Donation</div>
            <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {lastDonationDate ? formatDate(lastDonationDate) : 'No prior donation recorded'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Next Eligible Date</div>
            <div
              className={`font-bold mt-0.5 flex items-center gap-1.5 ${
                isEligible ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(nextEligibleDate)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
