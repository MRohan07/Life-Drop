/* @module: SuspendedAccountView — Displayed when a user or donor account has been suspended by an administrator */
import React from 'react';
import { UserProfile } from '../../types';
import { ShieldAlert, AlertTriangle, LogOut, MessageSquare, Ban } from 'lucide-react';

interface SuspendedAccountViewProps {
  user: UserProfile;
  onLogout?: () => void;
  onContactSupport?: () => void;
}

export const SuspendedAccountView: React.FC<SuspendedAccountViewProps> = ({
  user,
  onLogout,
  onContactSupport,
}) => {
  return (
    <div className="max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border-2 border-rose-300 shadow-2xl space-y-6 text-left animate-fadeIn">
      {/* Top Banner Alert */}
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
          <Ban className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Account Suspended
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-rose-950 tracking-tight">
            Donor Account Access Revoked
          </h2>
          <p className="text-xs text-rose-800 font-medium leading-relaxed">
            This account has been formally suspended by the platform administration team due to disciplinary review, repeated unexcused non-attendance, or violation of community donation safety guidelines.
          </p>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Suspension Audit Record
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Account Name &amp; ID</span>
            <p className="font-extrabold text-slate-900">{user.name}</p>
            <p className="text-[11px] font-mono text-slate-500">{user.id}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Contact Credential</span>
            <p className="font-extrabold text-slate-900">{user.phone}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email || 'No email on file'}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Blood Group &amp; City</span>
            <p className="font-extrabold text-slate-900">{user.bloodGroup} • {user.city}</p>
            <p className="text-[11px] text-slate-500">{user.location}</p>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
            <span className="text-[10px] text-rose-700 font-bold uppercase block mb-0.5">Status &amp; Warnings</span>
            <p className="font-black text-rose-700 uppercase">SUSPENDED</p>
            <p className="text-[11px] text-rose-600 font-semibold">{user.warningCount || 0} Recorded Warnings</p>
          </div>
        </div>
      </div>

      {/* Operational Restrictions Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Operational Restrictions in Effect:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
            <li>Cannot respond to or accept emergency blood requests.</li>
            <li>Excluded from emergency radar scans and regional dispatching.</li>
            <li>Appointment bookings and walk-in donations cannot be scheduled.</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {onContactSupport ? (
          <button
            type="button"
            onClick={onContactSupport}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Appeal / Contact Administrator</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">
            State Transfusion Support: 1800-425-0012
          </span>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Account</span>
          </button>
        )}
      </div>
    </div>
  );
};
