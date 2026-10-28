/* @module: LandingRoleButtons — Compact institutional portal login trigger buttons */
import React from 'react';
import { Building2, Warehouse, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../../types';

interface LandingRoleButtonsProps {
  onSelectRole: (role: UserRole) => void;
}

export const LandingRoleButtons: React.FC<LandingRoleButtonsProps> = ({ onSelectRole }) => {
  return (
    <div className="mt-4 max-w-md mx-auto p-4 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-3 text-center">
      <div className="space-y-0.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Healthcare Institution & Governance Portals
        </span>
        <p className="text-[11px] text-slate-300">
          Are you a verified hospital coordinator, blood bank officer, or platform administrator?
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSelectRole('HOSPITAL')}
          className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 border border-blue-400/30 flex-1 min-w-[115px] justify-center"
        >
          <Building2 className="w-3.5 h-3.5" />
          Enter as Hospital
        </button>

        <button
          type="button"
          onClick={() => onSelectRole('BLOOD_BANK')}
          className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 border border-amber-400/30 flex-1 min-w-[115px] justify-center"
        >
          <Warehouse className="w-3.5 h-3.5" />
          Enter as Blood Bank
        </button>

        <button
          type="button"
          onClick={() => onSelectRole('ADMIN')}
          className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 border border-purple-400/30 flex-1 min-w-[115px] justify-center"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Enter as Admin
        </button>
      </div>
    </div>
  );
};
