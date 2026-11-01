/* @module: VerificationPendingCard — Pending Admin Verification status display */
import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, Building2, Warehouse, ArrowLeft } from 'lucide-react';

interface VerificationPendingCardProps {
  id: string;
  name: string;
  role: 'HOSPITAL' | 'BLOOD_BANK';
  onBackToLogin: () => void;
}

export const VerificationPendingCard: React.FC<VerificationPendingCardProps> = ({
  id, name, role, onBackToLogin,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white border border-amber-200/90 shadow-xl text-left space-y-4 animate-fadeIn max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
            🟡 Verification Pending
          </span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">{name}</h3>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            Application Reference:
          </span>
          <span className="font-mono font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300">
            {id}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status:</span>
          <span className="font-bold text-amber-700">Awaiting Administrator Approval</span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
        <p className="font-semibold text-slate-800">
          Your {role === 'HOSPITAL' ? 'hospital' : 'blood bank'} registration and submitted documents have been received successfully.
        </p>
        <p className="text-[11px] text-slate-500">
          Our administrative compliance team will review your licensing credentials and certificates within 24-48 hours.
        </p>
        <ul className="text-[11px] text-slate-600 space-y-1 pt-1 list-disc list-inside">
          <li>Cannot create emergency requests until verified</li>
          <li>Not visible on public donor radar maps</li>
          <li>Account credentials saved securely</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Login Portal</span>
      </button>
    </div>
  );
};

export default VerificationPendingCard;
