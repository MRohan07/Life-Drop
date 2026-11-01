/* @module: HospitalStep2Location — Hospital physical address, GPS coordinates, and clinical services */
import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';

interface HospitalStep2LocationProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const ALL_SERVICES = [
  'Emergency / Trauma', 'Cardiology', 'Neurology', 'Neurosurgery',
  'Orthopedics', 'Ophthalmology', 'Dermatology', 'ENT',
  'General Medicine', 'General Surgery', 'ICU / Critical Care', 'Oncology',
];

export const HospitalStep2Location: React.FC<HospitalStep2LocationProps> = ({ formData, setFormData }) => {
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

  const toggleService = (srv: string) => {
    const current = formData.services || [];
    setFormData({
      ...formData,
      services: current.includes(srv) ? current.filter((s: string) => s !== srv) : [...current, srv],
    });
  };

  return (
    <div className="space-y-3.5 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          2. Hospital Address & Services
        </h4>
        <p className="text-[11px] text-slate-500">Location determines emergency radar radius and donor routing.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Full Street Address *</label>
        <input
          type="text" required value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="e.g. 500 Medical Center Drive, Suite 100"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input type="text" required value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="Area / Locality *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
        <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
        <input type="text" required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
        <input type="text" required value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })} placeholder="PIN Code *" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
      </div>

      <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">Hospital GPS Coordinates:</span>
        <button type="button" onClick={handleUseCurrentLocation} disabled={isLocating} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5">
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
        </button>
      </div>

      {/* Services Grid */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Clinical Services Available</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-semibold text-slate-700">
          {ALL_SERVICES.map((srv) => (
            <label key={srv} className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200">
              <input type="checkbox" checked={(formData.services || []).includes(srv)} onChange={() => toggleService(srv)} />
              <span>{srv}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
