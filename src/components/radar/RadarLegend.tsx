/* @module: RadarLegend — Color and symbol legend for Emergency Radar */
import React from 'react';

export const RadarLegend: React.FC = () => {
  return (
    <div className="px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-center gap-4 shadow-lg">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-lifedrop-primary shadow-[0_0_8px_#e63946]" />
        <span>Hospital Center</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-400" />
        <span>Compatible Donors</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-400" />
        <span>Blood Banks</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
        <span>Confirmed / Accepted</span>
      </span>
      <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">
        • Radius: 15 km
      </span>
    </div>
  );
};
