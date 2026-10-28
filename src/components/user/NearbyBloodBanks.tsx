import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodBank } from '../../types';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import {
  Warehouse,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { formatPhone } from '../../utils/formatters';

export const NearbyBloodBanks: React.FC = () => {
  const { bloodBanks, currentUser } = useLifeDrop();

  // ONLY verified blood banks appear publicly
  const verifiedBloodBanks = bloodBanks.filter((b) => b.isVerified);

  const [selectedBB, setSelectedBB] = useState<BloodBank | null>(null);
  const [navModalOpen, setNavModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-2 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified Blood Centers
        </div>
        <h2 className="text-2xl font-extrabold text-lifedrop-navy flex items-center gap-2.5">
          <Warehouse className="w-7 h-7 text-lifedrop-primary" />
          Nearby Blood Banks
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Registered and certified blood storage facilities near {currentUser.city}. Stock availability is checked dynamically during emergency matching.
        </p>
      </div>

      {/* Blood Banks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {verifiedBloodBanks.map((bb, index) => {
          const distanceKm = Number((1.8 + index * 1.4).toFixed(1));

          return (
            <div
              key={bb.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 card-3d-interactive overflow-hidden flex flex-col justify-between"
            >
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={bb.image}
                  alt={bb.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Distance Badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-lifedrop-navy/80 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  {distanceKm} km away
                </div>

                {/* Verified Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </div>

                {/* Bottom title */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-base font-extrabold text-white leading-snug drop-shadow-md">
                    {bb.name}
                  </h3>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{bb.address}</span>
                  </p>

                  <p className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Contact: {formatPhone(bb.phone)}</span>
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>License Certification:</span>
                    <span className="font-mono font-bold text-slate-700">{bb.licenseNumber}</span>
                  </div>
                </div>

                {/* Actions: Navigate, Call */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${bb.phone}`}
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Call Blood Bank
                  </a>

                  <button
                    onClick={() => {
                      setSelectedBB(bb);
                      setNavModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white text-xs font-bold transition-colors text-center inline-flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                    Navigate
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Modal */}
      {selectedBB && (
        <GoogleMapsModal
          isOpen={navModalOpen}
          onClose={() => {
            setNavModalOpen(false);
            setSelectedBB(null);
          }}
          destinationName={selectedBB.name}
          destinationAddress={selectedBB.address}
          destinationPhone={selectedBB.phone}
          destinationType="Blood Bank"
          latitude={selectedBB.latitude}
          longitude={selectedBB.longitude}
          distanceKm={2.4}
        />
      )}
    </div>
  );
};
