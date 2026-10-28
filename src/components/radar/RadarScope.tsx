/* @module: RadarScope — Perfect circular 360-degree radar scope with realistic natural blip distribution */
import React from 'react';
import { Building2, Users, Warehouse } from 'lucide-react';
import { BloodRequest, UserProfile, BloodBank } from '../../types';

interface RadarScopeProps {
  request: BloodRequest;
  isFulfilled: boolean;
  donors: UserProfile[];
  bloodBanks: BloodBank[];
  currentUserId: string;
  onSelectNode: (node: any) => void;
}

// Realistic natural polar angle distribution across all 4 quadrants
const DONOR_OFFSETS = [
  { angle: 32, dist: 38, km: '2.4 km' },
  { angle: 145, dist: 39, km: '3.8 km' },
  { angle: 215, dist: 38, km: '5.2 km' },
  { angle: 320, dist: 37, km: '1.8 km' },
  { angle: 85, dist: 43, km: '7.1 km' },
];

const BB_OFFSETS = [
  { angle: 175, dist: 26, km: '2.9 km' },
  { angle: 270, dist: 26, km: '3.5 km' },
  { angle: 20, dist: 24, km: '4.2 km' },
];

const toCoord = (deg: number, radiusPercent: number) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: 50 + radiusPercent * Math.cos(rad),
    y: 50 + radiusPercent * Math.sin(rad),
  };
};

export const RadarScope: React.FC<RadarScopeProps> = ({
  request, isFulfilled, donors, bloodBanks, currentUserId, onSelectNode,
}) => {
  return (
    <div className="relative my-2 w-[290px] h-[290px] min-[360px]:w-[325px] min-[360px]:h-[325px] min-[390px]:w-[350px] min-[390px]:h-[350px] sm:w-[440px] sm:h-[440px] md:w-[480px] md:h-[480px] lg:w-[500px] lg:h-[500px] max-w-[calc(100vw-32px)] aspect-square rounded-full mx-auto flex items-center justify-center select-none overflow-hidden bg-slate-950/95 shadow-[0_0_50px_rgba(230,57,70,0.2),inset_0_0_80px_rgba(230,57,70,0.15)] border border-rose-500/35 ring-1 ring-rose-500/20">
      {/* Tactical Compass Bearings */}
      <span className="absolute top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tracking-widest text-rose-300/80 z-10">000° N</span>
      <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tracking-widest text-rose-300/80 z-10">180° S</span>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold tracking-widest text-rose-300/80 z-10">090° E</span>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold tracking-widest text-rose-300/80 z-10">270° W</span>

      {/* Concentric Circular Distance Rings */}
      <div className="absolute inset-0 rounded-full border border-rose-500/25" />
      <div className="absolute inset-[15%] rounded-full border border-rose-500/20 border-dashed" />
      <div className="absolute inset-[30%] rounded-full border border-rose-500/25" />
      <div className="absolute inset-[48%] rounded-full border border-rose-500/30 border-dashed" />
      <div className="absolute inset-[66%] rounded-full border border-rose-500/35" />

      {/* Central Expanding Sonar Ripple Waves */}
      {!isFulfilled && (
        <>
          <div className="absolute w-28 h-28 rounded-full border border-rose-500/50 blip-sonar-ring pointer-events-none" />
          <div
            className="absolute w-28 h-28 rounded-full border border-rose-400/40 blip-sonar-ring pointer-events-none"
            style={{ animationDelay: '1.2s' }}
          />
        </>
      )}

      {/* Crosshair Grids with Ticks */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-rose-500/20" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-rose-500/20" />
      <div className="absolute inset-0 rotate-45 border-t border-b border-rose-500/10 pointer-events-none" />
      <div className="absolute inset-0 -rotate-45 border-t border-b border-rose-500/10 pointer-events-none" />

      {/* Range Ring Labels */}
      <span className="absolute top-[16%] left-1/2 translate-x-1.5 text-[8px] font-mono text-rose-400/80 font-bold">10 km</span>
      <span className="absolute top-[31%] left-1/2 translate-x-1.5 text-[8px] font-mono text-rose-400/80 font-bold">5 km</span>

      {/* Rotating Radar Phosphor Sweep with Leading Laser Needle */}
      {!isFulfilled && (
        <div className="absolute inset-0 rounded-full radar-sweep-beam pointer-events-none">
          {/* Glowing scanner needle leading edge */}
          <div
            className="absolute top-1/2 left-1/2 h-[2px] w-1/2 origin-left bg-gradient-to-r from-rose-500/40 via-rose-300 to-white shadow-[0_0_8px_#ffffff,0_0_15px_#e63946]"
            style={{ transform: 'translateY(-50%)' }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff,0_0_15px_#e63946]" />
          </div>
        </div>
      )}

      {/* SVG Connecting Vector Lines with Animated Signal Flow */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {donors.slice(0, 5).map((d, i) => {
          const { x, y } = toCoord(DONOR_OFFSETS[i % DONOR_OFFSETS.length].angle, DONOR_OFFSETS[i % DONOR_OFFSETS.length].dist);
          const contrib = request.donorContributions.find((c) => c.donorId === d.id);
          const isAccepted = contrib?.status === 'ACCEPTED' || contrib?.status === 'COMPLETED';
          return (
            <line
              key={`dl-${d.id}`}
              x1="50%"
              y1="50%"
              x2={`${x}%`}
              y2={`${y}%`}
              stroke={isAccepted ? '#10B981' : '#E63946'}
              strokeWidth={isAccepted ? '1.5' : '1'}
              strokeDasharray={isAccepted ? '5 5' : '3 4'}
              className={isAccepted ? 'radar-signal-flow' : ''}
              opacity={isAccepted ? '0.9' : '0.25'}
            />
          );
        })}
        {bloodBanks.slice(0, 3).map((bb, i) => {
          const { x, y } = toCoord(BB_OFFSETS[i % BB_OFFSETS.length].angle, BB_OFFSETS[i % BB_OFFSETS.length].dist);
          const contrib = request.bloodBankContributions.find((c) => c.bloodBankId === bb.id);
          const isReserved = contrib?.status === 'RESERVED' || contrib?.status === 'CONFIRMED';
          return (
            <line
              key={`bbl-${bb.id}`}
              x1="50%"
              y1="50%"
              x2={`${x}%`}
              y2={`${y}%`}
              stroke={isReserved ? '#A855F7' : '#3B82F6'}
              strokeWidth={isReserved ? '1.5' : '1'}
              strokeDasharray={isReserved ? '5 5' : '3 4'}
              className={isReserved ? 'radar-signal-flow' : ''}
              opacity={isReserved ? '0.9' : '0.25'}
            />
          );
        })}
      </svg>

      {/* Center Node: Hospital Emergency Command */}
      <div className="absolute z-20 flex flex-col items-center justify-center">
        {/* Pulsating Beacon Rings */}
        <div className="absolute -inset-2 rounded-full border border-rose-500/30 animate-ping pointer-events-none" />
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border border-white/40 ring-2 ring-rose-500/30 shadow-[0_0_20px_rgba(230,57,70,0.6)] transition-all ${isFulfilled ? 'bg-emerald-600' : 'bg-gradient-to-tr from-rose-700 to-rose-500 pulse-emergency'}`}>
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={1.25} />
        </div>
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-950/90 text-[8.5px] font-bold text-rose-100 border border-rose-500/40 shadow-sm">
          {request.hospitalName.split(' ')[0]} (Hospital)
        </div>
      </div>

      {/* Donor Blips scattered naturally in all quadrants */}
      {donors.slice(0, 5).map((donor, idx) => {
        const offset = DONOR_OFFSETS[idx % DONOR_OFFSETS.length];
        const { x, y } = toCoord(offset.angle, offset.dist);
        const contrib = request.donorContributions.find((c) => c.donorId === donor.id);
        const isAccepted = contrib?.status === 'ACCEPTED' || contrib?.status === 'COMPLETED';
        return (
          <div
            key={donor.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelectNode({ type: 'donor', id: donor.id, name: donor.name, bloodGroup: donor.bloodGroup, status: contrib?.status || (donor.isEligible ? 'NOTIFIED' : 'INELIGIBLE'), distance: offset.km })}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            {/* Blip Sonar Ping Ripple */}
            <div
              className={`absolute -inset-1 rounded-full blip-sonar-ring pointer-events-none ${
                isAccepted ? 'bg-emerald-500/30 border border-emerald-400/50' : 'bg-rose-500/20 border border-rose-400/30'
              }`}
            />
            <div className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center border transition-all transform group-hover:scale-115 shadow-md ${isAccepted ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-500/50' : donor.id === currentUserId ? 'bg-amber-500 border-yellow-200 text-white animate-bounce' : 'bg-slate-900/95 border-rose-500/70 text-rose-300 hover:border-white shadow-rose-950/80'}`}>
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-slate-950/95 text-[8px] font-semibold text-slate-200 border border-slate-700/80 pointer-events-none shadow-sm flex items-center gap-1">
              <span>{donor.name.split(' ')[0]}</span>
              <span className="text-rose-400 font-bold">({donor.bloodGroup})</span>
              <span className="text-slate-400 text-[7.5px]">• {offset.km}</span>
            </div>
          </div>
        );
      })}

      {/* Blood Bank Blips scattered naturally */}
      {bloodBanks.slice(0, 3).map((bb, idx) => {
        const offset = BB_OFFSETS[idx % BB_OFFSETS.length];
        const { x, y } = toCoord(offset.angle, offset.dist);
        const contrib = request.bloodBankContributions.find((c) => c.bloodBankId === bb.id);
        const isConfirmed = contrib?.status === 'CONFIRMED';
        return (
          <div
            key={bb.id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelectNode({ type: 'bloodBank', id: bb.id, name: bb.name, bloodGroup: request.bloodGroup, status: contrib?.status || 'AVAILABLE_FOR_DISPATCH', distance: offset.km })}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
          >
            {/* Blip Sonar Ping Ripple */}
            <div
              className={`absolute -inset-1 rounded-xl blip-sonar-ring pointer-events-none ${
                isConfirmed ? 'bg-emerald-500/30 border border-emerald-400/50' : 'bg-blue-500/20 border border-blue-400/30'
              }`}
            />
            <div className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl flex items-center justify-center border transition-all transform group-hover:scale-115 shadow-md ${isConfirmed ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-500/50' : 'bg-slate-900/95 border-sky-400/70 text-sky-200 hover:border-white shadow-sky-950/80'}`}>
              <Warehouse className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-slate-950/95 text-[8px] font-semibold text-sky-200 border border-sky-900/60 pointer-events-none shadow-sm flex items-center gap-1">
              <span>{bb.name.split(' ')[0]}</span>
              <span className="text-sky-400 font-bold">(BB)</span>
              <span className="text-slate-400 text-[7.5px]">• {offset.km}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};


