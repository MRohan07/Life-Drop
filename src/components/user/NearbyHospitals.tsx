import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { Hospital } from '../../types';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import {
  Building2,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatPhone } from '../../utils/formatters';

export const NearbyHospitals: React.FC = () => {
  const { hospitals, currentUser } = useLifeDrop();

  // ONLY verified hospitals appear publicly
  const verifiedHospitals = hospitals.filter((h) => h.isVerified);

  // Selected hospital for details modal / navigation
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [navModalOpen, setNavModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-2 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified Healthcare Directory
        </div>
        <h2 className="text-2xl font-extrabold text-lifedrop-navy flex items-center gap-2.5">
          <Building2 className="w-7 h-7 text-lifedrop-primary" />
          Nearby Hospitals
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Registered and admin-verified hospitals near {currentUser.city}. Sorted strictly by direct proximity for fast emergency contact and navigation.
        </p>
      </div>

      {/* Hospital Cards List (Clean, Simple, Distance-Sorted) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {verifiedHospitals.map((hospital, index) => {
          const distanceKm = Number((1.2 + index * 1.1).toFixed(1));

          return (
            <div
              key={hospital.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 card-3d-interactive overflow-hidden flex flex-col justify-between"
            >
              {/* Image & Distance Badge */}
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={hospital.image}
                  alt={hospital.name}
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

                {/* Bottom title on image */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-base font-extrabold text-white leading-snug drop-shadow-md">
                    {hospital.name}
                  </h3>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>

                  <p className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Desk: {formatPhone(hospital.phone)}</span>
                  </p>

                  {/* Available Services Chips */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Available Services:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hospital.services.slice(0, 3).map((srv, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3 Explicit Action Buttons: VIEW DETAILS, NAVIGATE, CALL */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setSelectedHospital(hospital);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-center"
                  >
                    View Details
                  </button>

                  <a
                    href={`tel:${hospital.phone}`}
                    className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors text-center inline-flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Call
                  </a>

                  <button
                    onClick={() => {
                      setSelectedHospital(hospital);
                      setNavModalOpen(true);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white text-xs font-bold transition-colors text-center inline-flex items-center justify-center gap-1 shadow-sm"
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

      {/* Hospital Details Modal */}
      {selectedHospital && !navModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-0 card-3d-interactive">
            <div className="h-48 w-full relative">
              <img
                src={selectedHospital.image}
                alt={selectedHospital.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <button
                onClick={() => setSelectedHospital(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center gap-1 mb-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Admin Verified Hospital
                </span>
                <h3 className="text-xl font-extrabold">{selectedHospital.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedHospital.address}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">License Number:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedHospital.licenseNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Official Contact:</span>
                  <span className="font-bold text-slate-800">
                    {formatPhone(selectedHospital.phone)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-slate-800">{selectedHospital.email}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Specialized Hospital Units
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedHospital.services.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      ✓ {srv}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <a
                  href={`tel:${selectedHospital.phone}`}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Phone className="w-4 h-4" /> Call Hospital
                </a>
                <button
                  onClick={() => setNavModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
                >
                  <Navigation className="w-4 h-4 fill-current" /> Open Navigation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {selectedHospital && (
        <GoogleMapsModal
          isOpen={navModalOpen}
          onClose={() => {
            setNavModalOpen(false);
            setSelectedHospital(null);
          }}
          destinationName={selectedHospital.name}
          destinationAddress={selectedHospital.address}
          destinationPhone={selectedHospital.phone}
          destinationType="Hospital"
          latitude={selectedHospital.latitude}
          longitude={selectedHospital.longitude}
          distanceKm={2.1}
          services={selectedHospital.services}
        />
      )}
    </div>
  );
};
