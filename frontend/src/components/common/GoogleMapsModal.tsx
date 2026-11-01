import React from 'react';
import { X, Navigation, Phone, ExternalLink, MapPin, CheckCircle2 } from 'lucide-react';
import { formatPhone } from '../../utils/formatters';

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName: string;
  destinationAddress: string;
  destinationPhone: string;
  destinationType: 'Hospital' | 'Blood Bank';
  latitude: number;
  longitude: number;
  distanceKm?: number;
  services?: string[];
  isVerified?: boolean;
}

export const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({
  isOpen,
  onClose,
  destinationName,
  destinationAddress,
  destinationPhone,
  destinationType,
  latitude,
  longitude,
  distanceKm,
  services,
  isVerified = true,
}) => {
  if (!isOpen) return null;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destinationName + ', ' + destinationAddress
  )}&destination_place_id=${latitude},${longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden card-3d-interactive">
        {/* Header with visual map preview header */}
        <div className="bg-gradient-to-br from-lifedrop-navy to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lifedrop-primary/30 text-rose-200 text-xs font-semibold uppercase tracking-wider mb-2 border border-rose-400/30">
            <MapPin className="w-3.5 h-3.5" />
            {destinationType} Navigation
          </div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {destinationName}
            {isVerified && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            )}
          </h3>
          <p className="text-sm text-slate-300 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
            {destinationAddress}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Distance & ETA estimation */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <div className="text-xs text-slate-500 font-medium">Estimated Distance</div>
              <div className="text-xl font-bold text-lifedrop-navy mt-0.5">
                {distanceKm ? `${distanceKm} km` : '2.4 km'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Driving Time</div>
              <div className="text-xl font-bold text-lifedrop-primary mt-0.5">
                ~{distanceKm ? Math.ceil(distanceKm * 2.5) : 8} mins
              </div>
            </div>
          </div>

          {/* Contact Direct Call */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">
                  Emergency Desk Contact
                </div>
                <div className="text-base font-bold text-slate-800">
                  {formatPhone(destinationPhone)}
                </div>
              </div>
            </div>
            <a
              href={`tel:${destinationPhone}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </div>

          {/* Available Services */}
          {services && services.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Available Facilities & Services
              </div>
              <div className="flex flex-wrap gap-1.5">
                {services.map((srv, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                  >
                    ✓ {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
              Back
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3.5 rounded-2xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4 fill-current" />
              Open Live GPS Navigation
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
