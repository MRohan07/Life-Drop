/* @module: LandingRegisterForm — Multi-role registration forms for Donors, Hospitals, and Blood Banks */
import React from 'react';
import { UserPlus, Building2, Warehouse } from 'lucide-react';
import { BloodGroup, UserRole } from '../../../types';

interface LandingRegisterFormProps {
  role: UserRole;
  regName: string;
  setRegName: (val: string) => void;
  regPhone: string;
  setRegPhone: (val: string) => void;
  regBloodGroup: BloodGroup;
  setRegBloodGroup: (bg: BloodGroup) => void;
  regCity: string;
  setRegCity: (city: string) => void;
  regLicense: string;
  setRegLicense: (lic: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LandingRegisterForm: React.FC<LandingRegisterFormProps> = ({
  role, regName, setRegName, regPhone, setRegPhone,
  regBloodGroup, setRegBloodGroup, regCity, setRegCity,
  regLicense, setRegLicense, onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-3.5 text-left">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {role === 'HOSPITAL' ? 'Hospital / Institution Name' : role === 'BLOOD_BANK' ? 'Blood Bank Facility Name' : 'Full Name'}
        </label>
        <input
          type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
          placeholder={role === 'HOSPITAL' ? 'e.g. Government General Hospital (GGH)' : role === 'BLOOD_BANK' ? 'e.g. Indian Red Cross Blood Bank' : 'e.g. Hemendra Varma'}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
        />
      </div>

      {role === 'USER' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
            <select value={regBloodGroup} onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-slate-900 outline-none">
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input type="text" required value={regCity} onChange={(e) => setRegCity(e.target.value)} placeholder="Metropolis" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none" />
          </div>
        </div>
      )}

      {(role === 'HOSPITAL' || role === 'BLOOD_BANK') && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">License / Reg Number</label>
            <input type="text" required value={regLicense} onChange={(e) => setRegLicense(e.target.value)} placeholder="e.g. MED-REG-84920" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
            <input type="text" required value={regCity} onChange={(e) => setRegCity(e.target.value)} placeholder="Metropolis" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {role === 'HOSPITAL' ? 'Emergency Desk Contact / Phone' : role === 'BLOOD_BANK' ? 'Dispatch Phone / Hotline' : 'Email or Mobile Number'}
        </label>
        <input type="text" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+1 (555) 019-2834 or contact@org.com" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none" />
      </div>

      <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
        {role === 'HOSPITAL' ? <Building2 className="w-4 h-4 text-blue-400" /> : role === 'BLOOD_BANK' ? <Warehouse className="w-4 h-4 text-amber-400" /> : <UserPlus className="w-4 h-4 text-rose-400" />}
        <span>Register as {role === 'HOSPITAL' ? 'Hospital' : role === 'BLOOD_BANK' ? 'Blood Bank' : 'Blood Donor'} & Enter</span>
      </button>
    </form>
  );
};
