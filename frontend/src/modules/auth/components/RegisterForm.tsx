/* @module: RegisterForm — Donor onboarding registration UI form */
import React from 'react';
import { UserPlus } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { BloodGroup } from '../../../types';

interface RegisterFormProps {
  name: string;
  setName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  bloodGroup: BloodGroup;
  setBloodGroup: (val: BloodGroup) => void;
  city: string;
  setCity: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  name, setName, phone, setPhone, bloodGroup, setBloodGroup, city, setCity, onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-left">
      <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Hayes" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group</label>
          <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white">
            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <Input label="City" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Metropolis" />
      </div>
      <Input label="Mobile Number" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 839-2049" />
      <Button type="submit" variant="primary" leftIcon={<UserPlus className="w-4 h-4" />} className="w-full">
        Register as Donor & Enter
      </Button>
    </form>
  );
};
