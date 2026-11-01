/* @module: RegisterStepSecurity — Password security, emergency alerts, and 3-point consent checkboxes */
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Bell, ShieldCheck } from 'lucide-react';

interface RegisterStepSecurityProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const RegisterStepSecurity: React.FC<RegisterStepSecurityProps> = ({ formData, setFormData }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-lifedrop-primary" />
          4. Security, Alerts & Consent
        </h4>
        <p className="text-[11px] text-slate-500">Secure your account and define emergency dispatch preferences.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} required value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none pr-8"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-700">
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-400">At least 8 characters, including a number and special character.</p>

      {/* Notification Preferences */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-rose-500" /> Receive Emergency Blood Alerts
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setFormData({ ...formData, receiveEmergencyAlerts: true })} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${formData.receiveEmergencyAlerts ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>Yes</button>
            <button type="button" onClick={() => setFormData({ ...formData, receiveEmergencyAlerts: false })} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${!formData.receiveEmergencyAlerts ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>No</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={formData.alertSms} onChange={(e) => setFormData({ ...formData, alertSms: e.target.checked })} /> SMS</label>
          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={formData.alertInApp} onChange={(e) => setFormData({ ...formData, alertInApp: e.target.checked })} /> In-App Radar</label>
          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={formData.alertEmail} onChange={(e) => setFormData({ ...formData, alertEmail: e.target.checked })} /> Email</label>
        </div>
      </div>

      {/* Terms & Consent Checkboxes */}
      <div className="space-y-2 pt-1 border-t border-slate-100 text-[11px] text-slate-600">
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" required checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} className="mt-0.5" />
          <span>I agree to the LifeDrop Terms and Conditions.</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" required checked={formData.agreeCoordination} onChange={(e) => setFormData({ ...formData, agreeCoordination: e.target.checked })} className="mt-0.5" />
          <span>I agree that my information may be used for blood-request coordination and donor matching.</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" required checked={formData.agreeDonationTerms} onChange={(e) => setFormData({ ...formData, agreeDonationTerms: e.target.checked })} className="mt-0.5" />
          <span>I understand that accepting a blood request means I am expressing my willingness to donate, and actual donation is confirmed by the hospital/blood bank.</span>
        </label>
      </div>
    </div>
  );
};
