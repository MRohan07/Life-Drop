/* @module: RegisterStepLocation — City, locality and GPS geo-coordinate capture */
import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';

interface RegisterStepLocationProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const RegisterStepLocation: React.FC<RegisterStepLocationProps> = ({ formData, setFormData }) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev: any) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            location: prev.location || 'Current Verified Location',
          }));
          setIsLocating(false);
        },
        () => {
          // Fallback simulation coordinates for Metro Central
          setFormData((prev: any) => ({
            ...prev,
            latitude: 40.7128,
            longitude: -74.006,
            location: prev.location || 'Downtown Metro Area',
          }));
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-lifedrop-primary" />
          3. Location Details
        </h4>
        <p className="text-[11px] text-slate-500">LifeDrop matches you with emergency requests and nearby hospitals within your local radius.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
          <input
            type="text" required value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="e.g. Metropolis"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality *</label>
          <input
            type="text" required value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. Downtown Central"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Current Geo-Location</span>
          <button
            type="button" onClick={handleUseCurrentLocation} disabled={isLocating}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
          </button>
        </div>
        {formData.latitude ? (
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Coordinates captured: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</span>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500">
            For donor matching and navigation, current location coordinates are used to calculate real-time emergency distance.
          </p>
        )}
      </div>
    </div>
  );
};
