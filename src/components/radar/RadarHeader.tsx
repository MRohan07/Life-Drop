/* @module: RadarHeader — Top metrics and status bar for Emergency Radar */
import React from 'react';
import { Radio, CheckCircle2 } from 'lucide-react';
import { BloodRequest } from '../../types';

interface RadarHeaderProps {
  request: BloodRequest;
  isFulfilled: boolean;
}

export const RadarHeader: React.FC<RadarHeaderProps> = ({ request, isFulfilled }) => {
  return (
    <div className="w-full max-w-xl sm:max-w-2xl px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800/90 shadow-md flex items-center justify-between gap-2.5 text-white relative z-10">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-lifedrop-emergency/15 border border-lifedrop-emergency/30 flex items-center justify-center text-lifedrop-emergency flex-shrink-0">
          <Radio className={`w-3.5 h-3.5 ${!isFulfilled ? 'animate-pulse' : ''}`} strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold truncate">
              Radar Dispatch #{request.id.length > 12 ? request.id.slice(0, 8).toUpperCase() : request.id}
            </span>
            {isFulfilled ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[8px] font-bold border border-emerald-500/30 flex items-center gap-1 flex-shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" /> FULFILLED
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[8px] font-bold border border-rose-500/30 flex items-center gap-1 animate-pulse flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-lifedrop-emergency animate-ping" />
                ACTIVE 360° SCAN
              </span>
            )}
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
            {request.patientName} • {request.requiredUnits} Units ({request.bloodGroup})
          </h3>
        </div>
      </div>

      {/* 4-Metric quick counters */}
      <div className="flex items-center gap-2 sm:gap-2.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/10 text-xs flex-shrink-0">
        <div>
          <div className="text-[8px] text-slate-400 uppercase font-semibold">Req</div>
          <div className="text-xs font-bold text-white text-center">{request.requiredUnits}</div>
        </div>
        <div className="w-px h-3.5 bg-white/10" />
        <div>
          <div className="text-[8px] text-emerald-400 uppercase font-semibold">Conf</div>
          <div className="text-xs font-bold text-emerald-400 text-center">{request.confirmedUnits}</div>
        </div>
        <div className="w-px h-3.5 bg-white/10" />
        <div>
          <div className="text-[8px] text-purple-400 uppercase font-semibold">Alloc</div>
          <div className="text-xs font-bold text-purple-400 text-center">{request.allocatedUnits}</div>
        </div>
        <div className="w-px h-3.5 bg-white/10" />
        <div>
          <div className="text-[8px] text-rose-400 uppercase font-semibold">Rem</div>
          <div className="text-xs font-bold text-rose-400 text-center">{request.remainingUnits}</div>
        </div>
      </div>
    </div>
  );
};
