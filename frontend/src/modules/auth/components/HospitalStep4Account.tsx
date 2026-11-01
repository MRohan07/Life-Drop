/* @module: HospitalStep4Account — Authorized representative, credentials, and compliance declarations */
import React, { useState } from 'react';
import { UserCheck, Lock, Eye, EyeOff } from 'lucide-react';

interface HospitalStep4AccountProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const DESIGNATIONS = ['Hospital Administrator', 'Blood Bank Officer', 'Medical Officer', 'Emergency Coordinator', 'Other'];

export const HospitalStep4Account: React.FC<HospitalStep4AccountProps> = ({ formData, setFormData }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-3.5 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          4. Authorized Representative & Login
        </h4>
        <p className="text-[11px] text-slate-500">Assign designated account administrator and secure login credentials.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Person *</label>
          <input
            type="text" required value={formData.authorizedPersonName}
            onChange={(e) => setFormData({ ...formData, authorizedPersonName: e.target.value })}
            placeholder="Dr. Eleanor Vance"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Designation *</label>
          <select
            value={formData.authorizedPersonDesignation}
            onChange={(e) => setFormData({ ...formData, authorizedPersonDesignation: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-600 outline-none"
          >
            {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
          <input
            type="tel" required value={formData.authorizedPersonPhone}
            onChange={(e) => setFormData({ ...formData, authorizedPersonPhone: e.target.value })}
            placeholder="+1 (555) 019-2288"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
          <input
            type="email" required value={formData.authorizedPersonEmail}
            onChange={(e) => setFormData({ ...formData, authorizedPersonEmail: e.target.value })}
            placeholder="officer@hospital.org"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Hospital System ID *</label>
        <input
          type="text" required value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          placeholder="HOSP1025"
          className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 font-mono font-bold text-blue-900 bg-blue-50/40 text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} required value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold pr-8"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-3 text-slate-400">
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
          <input
            type={showPassword ? 'text' : 'password'} required value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
          />
        </div>
      </div>

      {/* 4 Checkbox Declarations */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" required checked={formData.agreeBelong} onChange={(e) => setFormData({ ...formData, agreeBelong: e.target.checked })} className="mt-0.5" />
          <span>I confirm that the information provided belongs to the registered hospital.</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" required checked={formData.agreeGenuine} onChange={(e) => setFormData({ ...formData, agreeGenuine: e.target.checked })} className="mt-0.5" />
          <span>I confirm that the license/registration documents submitted are genuine.</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" required checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} className="mt-0.5" />
          <span>I agree to LifeDrop's Terms and Conditions.</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" required checked={formData.agreeCoordination} onChange={(e) => setFormData({ ...formData, agreeCoordination: e.target.checked })} className="mt-0.5" />
          <span>I agree that LifeDrop may use the submitted information for verification and blood-request coordination.</span>
        </label>
      </div>
    </div>
  );
};
