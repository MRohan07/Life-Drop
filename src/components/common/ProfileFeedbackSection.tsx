/* @module: ProfileFeedbackSection — Glassmorphic profile feedback manager for User, Hospital & Blood Bank */
import React from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  Star,
  MessageSquarePlus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  Heart,
  Building2,
  Warehouse,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

interface ProfileFeedbackSectionProps {
  role: UserRole;
  targetId: string;
  targetName: string;
  targetBloodGroup?: string;
}

export const ProfileFeedbackSection: React.FC<ProfileFeedbackSectionProps> = ({
  role,
  targetId,
  targetName,
  targetBloodGroup,
}) => {
  const { feedbacks, openFeedbackModal } = useLifeDrop();

  // Filter feedback submitted by or associated with this profile
  const userFeedbacks = feedbacks.filter((f) => f.userId === targetId);

  // Compute average rating if any
  const avgRating =
    userFeedbacks.length > 0
      ? (userFeedbacks.reduce((acc, f) => acc + f.rating, 0) / userFeedbacks.length).toFixed(1)
      : '5.0';

  const handleOpenModal = () => {
    openFeedbackModal({
      triggerRole: role,
      triggerUserId: targetId || (role === 'USER' ? 'LD-DON-1045' : role === 'HOSPITAL' ? 'LD-HOSP-01' : 'LD-BB-01'),
      triggerUserName: targetName || (role === 'USER' ? 'Donor' : role === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'),
      triggerUserBloodGroup: targetBloodGroup,
      isPostDonation: false,
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/20 text-lifedrop-primary flex items-center justify-center">
            {role === 'USER' && <Heart className="w-5 h-5 fill-lifedrop-primary/20" />}
            {role === 'HOSPITAL' && <Building2 className="w-5 h-5" />}
            {role === 'BLOOD_BANK' && <Warehouse className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-lifedrop-navy flex items-center gap-2">
              <span>Feedback & Coordination Reviews</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {role === 'USER'
                ? 'Your voluntary donor feedback on hospitals, phlebotomy, and coordination.'
                : role === 'HOSPITAL'
                ? 'Institutional evaluations of donor turnaround and emergency matching.'
                : 'Blood bank cold-chain and walk-in donation experience ledger.'}
            </p>
          </div>
        </div>

        {role !== 'ADMIN' && (
          <button
            type="button"
            id="profile-write-feedback-btn"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-lifedrop-primary to-rose-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto cursor-pointer active:scale-95"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write Feedback</span>
          </button>
        )}
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Submissions
            </div>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {userFeedbacks.length} Review{userFeedbacks.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-xs">
            {userFeedbacks.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Satisfaction Score
            </div>
            <div className="text-xl font-black text-amber-500 flex items-center gap-1 mt-0.5">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{avgRating}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Community Status
            </div>
            <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Active Contributor</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Feedbacks List */}
      {userFeedbacks.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-lifedrop-primary mx-auto flex items-center justify-center">
            <MessageSquarePlus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Feedback Submitted Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Share your perspective on blood donation or hospital logistics to help improve our life-saving coordination.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 py-2 rounded-xl bg-lifedrop-navy hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Submit First Review
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {userFeedbacks.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Star Rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= item.rating
                            ? 'text-lifedrop-primary fill-lifedrop-primary'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-xs font-bold text-slate-800">
                    {item.rating}.0 / 5.0
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.createdAt}</span>
                </div>
              </div>

              {/* Feedback Comment */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                "{item.comments}"
              </p>

              {/* Official Admin Reply / Resolution */}
              {item.adminReply && (
                <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50/50 border border-purple-200 shadow-2xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-purple-950">
                          LifeDrop Administration Reply
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {item.adminReply.status === 'RESOLVED' ? 'Issue Solved' : 'Under Investigation'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-600">
                      {item.adminReply.repliedAt}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-purple-950 font-medium leading-relaxed pl-8">
                    "{item.adminReply.message}"
                  </p>

                  <div className="text-[11px] text-purple-700 font-semibold pl-8 flex items-center gap-1.5 pt-0.5 border-t border-purple-200/50">
                    <span>Official resolution by:</span>
                    <strong className="text-purple-900">{item.adminReply.adminName}</strong>
                    {item.adminReply.adminEmail && (
                      <span className="text-purple-500 font-normal">({item.adminReply.adminEmail})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
