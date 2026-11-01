/* @module: RegisterStepBlood — Blood group selection and donation history tracking */
import React from 'react';
import { Droplet, HeartHandshake, Info } from 'lucide-react';
import { BloodGroup } from '../../../types';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface RegisterStepBloodProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const RegisterStepBlood: React.FC<RegisterStepBloodProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-4 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Droplet className="w-4 h-4 text-lifedrop-primary" />
          2. Blood Details & History
        </h4>
        <p className="text-[11px] text-slate-500">Your blood type is essential for real-time emergency compatibility matching.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">Blood Group *</label>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_GROUPS.map((bg) => (
            <button
              key={bg} type="button"
              onClick={() => setFormData({ ...formData, bloodGroup: bg })}
              className={`py-2 rounded-xl text-xs font-black font-mono transition-all border ${
                formData.bloodGroup === bg
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                  : 'bg-white hover:bg-rose-50 text-slate-800 border-slate-200'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold text-slate-700 mb-2">Have you donated blood before? *</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, hasDonatedBefore: true })}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
              formData.hasDonatedBefore
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-lifedrop-primary" />
            <span>Yes, I have</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, hasDonatedBefore: false, lastDonationDate: '' })}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
              !formData.hasDonatedBefore
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>No, First Time</span>
          </button>
        </div>
      </div>

      {formData.hasDonatedBefore && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 animate-fadeIn">
          <label className="block text-xs font-bold text-slate-700">Last Blood Donation Date</label>
          <input
            type="date" value={formData.lastDonationDate}
            onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none bg-white"
          />
          <p className="text-[10px] text-slate-500">Helps us calculate your next safe donation eligibility window (90 days interval).</p>
        </div>
      )}

      {!formData.hasDonatedBefore && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>You are marked as immediately eligible for local emergency donation calls!</span>
        </div>
      )}
    </div>
  );
};
