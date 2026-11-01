/* @module: HospitalStep1Info — Basic hospital identity and contact info */
import React from 'react';
import { Building2 } from 'lucide-react';

interface HospitalStep1InfoProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const HOSPITAL_TYPES = ['Government', 'Private', 'Trust / NGO', 'Other'] as const;

export const HospitalStep1Info: React.FC<HospitalStep1InfoProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-3.5 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          1. Hospital Basic Details
        </h4>
        <p className="text-[11px] text-slate-500">Provide verified institutional identity details.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Name *</label>
        <input
          type="text" required value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. St. Jude Memorial Hospital"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-600 outline-none"
          >
            {HOSPITAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Registration No. *</label>
          <input
            type="text" required value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            placeholder="e.g. HOSP-REG-84920"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Main Phone *</label>
          <input
            type="tel" required value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 019-3344"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">24/7 Emergency Transfusion Desk *</label>
          <input
            type="tel" required value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            placeholder="+1 (555) 019-9999 (Hotline)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-rose-600 outline-none text-rose-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Official Email *</label>
          <input
            type="email" required value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="desk@stjudememorial.org"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Website (Optional)</label>
          <input
            type="url" value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://stjudememorial.org"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Logo / Image URL</label>
        <input
          type="url" value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          placeholder="https://images.unsplash.com/..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
        />
      </div>
    </div>
  );
};
