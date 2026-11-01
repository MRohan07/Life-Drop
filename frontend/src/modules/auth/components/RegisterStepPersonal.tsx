/* @module: RegisterStepPersonal — Personal details & Contact with Mobile OTP verification */
import React from 'react';
import { User, Calendar, Phone, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface RegisterStepPersonalProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  otpSent: boolean;
  otpVerified: boolean;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
}

export const RegisterStepPersonal: React.FC<RegisterStepPersonalProps> = ({
  formData, setFormData, otpSent, otpVerified, onSendOtp, onVerifyOtp,
}) => {
  return (
    <div className="space-y-4 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-lifedrop-primary" />
          1. Personal & Contact Details
        </h4>
        <p className="text-[11px] text-slate-500">Provide your basic profile and verify your mobile number.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
        <input
          type="text" required value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Hemendra Varma"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
          <input
            type="date" required value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Gender (Optional)</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-slate-900 outline-none"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number * (For Emergency SMS)</label>
        <div className="flex gap-2">
          <input
            type="tel" required value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 019-2834"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
          />
          <button
            type="button" onClick={onSendOtp}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold whitespace-nowrap"
          >
            {otpSent ? 'Resend' : 'Generate OTP'}
          </button>
        </div>
      </div>

      {otpSent && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Enter OTP (Use <strong>123456</strong>):</span>
            {otpVerified && <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Verified</span>}
          </div>
          <div className="flex gap-2">
            <input
              type="text" maxLength={6} value={formData.otpInput}
              onChange={(e) => setFormData({ ...formData, otpInput: e.target.value })}
              placeholder="123456"
              className="w-32 px-3 py-1.5 rounded-xl border border-rose-300 text-xs font-mono font-bold tracking-widest text-center focus:ring-2 focus:ring-rose-500 outline-none"
            />
            <button
              type="button" onClick={onVerifyOtp}
              className="px-4 py-1.5 rounded-xl bg-lifedrop-primary text-white text-xs font-bold hover:bg-rose-700"
            >
              Verify OTP
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
        <input
          type="email" value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="alex.rivera@example.com"
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
        />
      </div>
    </div>
  );
};
