/* @module: LandingLoginCard — Role-adaptive Login & Multi-role statutory registration wizard */
import React from 'react';
import { ArrowLeft, Building2, Warehouse, ShieldCheck } from 'lucide-react';
import { BloodGroup, UserRole } from '../../../types';
import { LandingLoginForm } from './LandingLoginForm';
import { LandingRegisterForm } from './LandingRegisterForm';
import { UserRegistrationWizard } from '../../auth/components/UserRegistrationWizard';
import { HospitalRegistrationWizard } from '../../auth/components/HospitalRegistrationWizard';
import { BloodBankRegistrationWizard } from '../../auth/components/BloodBankRegistrationWizard';

interface LandingLoginCardProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  authMode: 'LOGIN' | 'REGISTER';
  setAuthMode: (mode: 'LOGIN' | 'REGISTER') => void;
  contact: string;
  setContact: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  otpGenerated: boolean;
  isGeneratingOtp: boolean;
  otpCode: string;
  setOtpCode: (val: string) => void;
  onGenerateOtp: () => void;
  onLoginSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
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
  onRegisterSubmit: (e: React.FormEvent) => void;
  onOpenStatusModal?: () => void;
  onRegisterSuccess?: () => void;
}

export const LandingLoginCard: React.FC<LandingLoginCardProps> = (props) => {
  const { activeRole, setActiveRole, authMode, setAuthMode } = props;
  const roleTitles = { USER: 'User Account', HOSPITAL: 'Hospital Portal', BLOOD_BANK: 'Blood Bank Facility', ADMIN: 'System Admin' };
  const roleColors = { USER: 'text-slate-900', HOSPITAL: 'text-blue-600', BLOOD_BANK: 'text-amber-600', ADMIN: 'text-purple-600' };

  return (
    <div id="login-section" className="mt-2 max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-7 text-left card-3d-interactive space-y-4 scroll-mt-24">
      {/* Active Role Top Header */}
      {activeRole !== 'USER' && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {activeRole === 'HOSPITAL' && <Building2 className="w-4 h-4 text-blue-600" />}
            {activeRole === 'BLOOD_BANK' && <Warehouse className="w-4 h-4 text-amber-600" />}
            {activeRole === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-purple-600" />}
            <span className={`text-xs font-black uppercase tracking-wider ${roleColors[activeRole]}`}>
              {activeRole.replace('_', ' ')} PORTAL
            </span>
          </div>
          <button type="button" onClick={() => { setActiveRole('USER'); setAuthMode('LOGIN'); }} className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-3 h-3" /> Switch to User
          </button>
        </div>
      )}

      <div>
        <h3 className={`text-2xl font-black tracking-tight ${roleColors[activeRole]}`}>{roleTitles[activeRole]}</h3>
        <p className="text-xs text-slate-500 mt-1">
          {activeRole === 'ADMIN'
            ? 'Enter authorized administrator credentials to access platform governance.'
            : authMode === 'LOGIN'
            ? 'Sign in to access your coordination dashboard.'
            : `Complete your verified ${activeRole.toLowerCase()} registration.`}
        </p>
      </div>

      {authMode === 'LOGIN' || activeRole === 'ADMIN' ? (
        <LandingLoginForm {...props} onSwitchToRegister={() => setAuthMode('REGISTER')} />
      ) : activeRole === 'USER' ? (
        <UserRegistrationWizard
          onSuccess={() => {
            if (props.onRegisterSuccess) {
              props.onRegisterSuccess();
            } else {
              setAuthMode('LOGIN');
            }
          }}
          onCancel={() => setAuthMode('LOGIN')}
        />
      ) : activeRole === 'HOSPITAL' ? (
        <HospitalRegistrationWizard onCancel={() => setAuthMode('LOGIN')} />
      ) : (
        <BloodBankRegistrationWizard onCancel={() => setAuthMode('LOGIN')} />
      )}
    </div>
  );
};

export default LandingLoginCard;
