/* @module: BloodBankStep2Location — Blood bank address, GPS, and component storage capabilities */
import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface BloodBankStep2LocationProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const COMPONENTS = ['Whole Blood', 'Packed Red Blood Cells', 'Plasma', 'Platelets', 'Cryoprecipitate'];

export const BloodBankStep2Location: React.FC<BloodBankStep2LocationProps> = ({ formData, setFormData }) => {
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
          }));
          setIsLocating(false);
        },
        () => {
          setFormData((prev: any) => ({ ...prev, latitude: 40.7128, longitude: -74.006 }));
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const toggleComponent = (comp: string) => {
    const current = formData.componentsAvailable || [];
    setFormData({
      ...formData,
      componentsAvailable: current.includes(comp) ? current.filter((c: string) => c !== comp) : [...current, comp],
    });
  };

  return (
    <div className="space-y-3.5 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" />
          2. Location & Component Storage
        </h4>
        <p className="text-[11px] text-slate-500">Location and component cold-chain capabilities for emergency supply.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Full Facility Address *</label>
        <input
          type="text" required value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="e.g. 102 Lifeline Plaza, Cold Storage Wing"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input type="text" required value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="Area / Locality *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
        <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
        <input type="text" required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
        <input type="text" required value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })} placeholder="PIN Code *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
      </div>

      <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">Facility GPS Coordinates:</span>
        <button type="button" onClick={handleUseCurrentLocation} disabled={isLocating} className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5">
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
        </button>
      </div>

      {/* Storage Components Grid */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Components Stored & Handled</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-semibold text-slate-700">
          {COMPONENTS.map((comp) => (
            <label key={comp} className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
              <input type="checkbox" checked={(formData.componentsAvailable || []).includes(comp)} onChange={() => toggleComponent(comp)} />
              <span>{comp}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
