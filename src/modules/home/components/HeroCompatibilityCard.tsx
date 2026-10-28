/* @module: HeroCompatibilityCard — Interactive blood group compatibility selector card */
import React, { useState } from 'react';
import { Droplet, Sparkles } from 'lucide-react';
import { BloodGroup } from '../../../types';
import { RED_CELL_COMPATIBILITY } from '../../../utils/compatibility';

const ALL_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const getCanDonateTo = (donor: BloodGroup): BloodGroup[] => {
  return ALL_GROUPS.filter((recipient) =>
    (RED_CELL_COMPATIBILITY[recipient] || []).includes(donor)
  );
};

export const HeroCompatibilityCard: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O-');
  const canGiveTo = getCanDonateTo(selectedGroup);

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-slate-200/90 shadow-xl text-left card-3d-interactive space-y-3.5 max-w-sm mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-lifedrop-primary">
            <Droplet className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Blood Match Matrix</h4>
            <p className="text-[10px] text-slate-500">Select group to test compatibility</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-extrabold flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> Instant
        </span>
      </div>

      {/* 8 Blood Groups Quick Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {ALL_GROUPS.map((bg) => (
          <button
            key={bg}
            type="button"
            onClick={() => setSelectedGroup(bg)}
            className={`py-1.5 rounded-xl font-mono text-xs font-black transition-all ${
              selectedGroup === bg
                ? 'bg-slate-900 text-white shadow-md scale-105'
                : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border border-slate-200/70'
            }`}
          >
            {bg}
          </button>
        ))}
      </div>

      {/* Compatibility Output */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
          <span>{selectedGroup} Can Donate To:</span>
          <span className="text-[10px] font-extrabold text-rose-600">
            {selectedGroup === 'O-' ? 'Universal (8/8 Groups)' : `${canGiveTo.length} Compatible Groups`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {canGiveTo.map((target: BloodGroup) => (
            <span
              key={target}
              className="px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-700 text-[10px] font-mono font-bold shadow-2xs"
            >
              {target}
            </span>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
        <span>1 Donation saves up to <strong>3 lives</strong></span>
        <span className="text-emerald-600 font-bold">100% Verified</span>
      </div>
    </div>
  );
};
