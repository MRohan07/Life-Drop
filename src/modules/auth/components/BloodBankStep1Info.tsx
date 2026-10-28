/* @module: BloodBankStep1Info — Basic blood bank identity details */
import React from 'react';
import { Warehouse } from 'lucide-react';

interface BloodBankStep1InfoProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const BB_TYPES = ['Government', 'Private', 'Hospital Blood Bank', 'NGO / Trust', 'Other'] as const;

export const BloodBankStep1Info: React.FC<BloodBankStep1InfoProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-3.5 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-amber-600" />
          1. Blood Bank Basic Details
        </h4>
        <p className="text-[11px] text-slate-500">Provide official blood banking facility credentials.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Blood Bank Name *</label>
        <input
          type="text" required value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Metro Life Blood Center"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Facility Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-amber-600 outline-none"
          >
            {BB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Registration No. *</label>
          <input
            type="text" required value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            placeholder="e.g. BB-REG-77410"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Phone *</label>
          <input
            type="tel" required value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 019-7788"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
          <input
            type="email" required value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="dispatch@metroblood.org"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Facility Logo / Image URL</label>
        <input
          type="url" value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          placeholder="https://images.unsplash.com/..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
        />
      </div>
    </div>
  );
};
