import React, { useState } from 'react';
import { ArrowLeft, Building2, Warehouse, FileCheck2, Search } from 'lucide-react';
import { LandingLoginCard } from '../home/components/LandingLoginCard';
import { LandingRoleButtons } from '../home/components/LandingRoleButtons';
import { useHome } from '../home/hooks/useHome';
import { UserRole } from '../../types';
import { FacilityRegistrationModal } from '../../components/facility/FacilityRegistrationModal';
import { ApplicationStatusModal } from '../../components/facility/ApplicationStatusModal';

interface AuthPageProps {
  onSuccess?: (role: UserRole) => void;
  onBack?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess = () => {},
  onBack,
}) => {
  const auth = useHome((role) => onSuccess((role as UserRole) || 'USER'));
  const [facilityRegOpen, setFacilityRegOpen] = useState(false);
  const [facilityRegType, setFacilityRegType] = useState<'HOSPITAL' | 'BLOOD_BANK'>('HOSPITAL');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const handleBackToHome = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleSelectRole = (role: UserRole) => {
    auth.setActiveRole(role);
    auth.setAuthMode('LOGIN');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFacilityReg = (type: 'HOSPITAL' | 'BLOOD_BANK') => {
    setFacilityRegType(type);
    setFacilityRegOpen(true);
  };

  return (
    <div className="min-h-[92vh] w-full bg-lifedrop-bg bg-dot-matrix flex flex-col items-center justify-center p-4 sm:p-8 space-y-6 animate-fadeIn">
      {/* Small Back to Landing Page Button */}
      <div className="w-full max-w-md flex justify-start">
        <button
          type="button"
          onClick={handleBackToHome}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-lifedrop-primary" />
          <span>Back to Landing Page</span>
        </button>
      </div>

      {/* Animated Header with Glowing Badge */}
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-lifedrop-primary text-xs font-black uppercase shadow-xs">
          <span className="w-2 h-2 rounded-full bg-lifedrop-emergency animate-ping" />
          Verified LifeDrop Authentication
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-lifedrop-navy tracking-tight">
          Secure Access Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Sign in to respond to live emergencies or register as an authorized healthcare coordinator.
        </p>
      </div>

      {/* Main Adaptive Login & Register Card */}
      <div className="w-full max-w-md mx-auto">
        <LandingLoginCard
          activeRole={auth.activeRole} setActiveRole={auth.setActiveRole}
          authMode={auth.authMode} setAuthMode={auth.setAuthMode}
          contact={auth.contact} setContact={auth.setContact}
          password={auth.password} setPassword={auth.setPassword}
          otpGenerated={auth.otpGenerated} isGeneratingOtp={auth.isGeneratingOtp}
          otpCode={auth.otpCode} setOtpCode={auth.setOtpCode}
          onGenerateOtp={auth.handleGenerateOtp} onLoginSubmit={auth.handleLoginSubmit}
          onGoogleSignIn={auth.handleGoogleSignIn}
          regName={auth.regName} setRegName={auth.setRegName}
          regPhone={auth.regPhone} setRegPhone={auth.setRegPhone}
          regBloodGroup={auth.regBloodGroup} setRegBloodGroup={auth.setRegBloodGroup}
          regCity={auth.regCity} setRegCity={auth.setRegCity}
          regLicense={auth.regLicense} setRegLicense={auth.setRegLicense}
          onRegisterSubmit={auth.handleRegisterSubmit}
          onOpenStatusModal={() => setStatusModalOpen(true)}
          onRegisterSuccess={() => onSuccess('USER')}
        />
      </div>

      {/* Institutional Facility Accreditation & Verification Desk */}
      <div className="w-full max-w-xl mx-auto p-4 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 text-left">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Hospital &amp; Blood Bank Registration Desk
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Official accreditation workflow with administrator review and direct account activation
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            id="auth-register-facility-btn"
            onClick={() => handleOpenFacilityReg(auth.activeRole === 'BLOOD_BANK' ? 'BLOOD_BANK' : 'HOSPITAL')}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-left transition-all hover:scale-102 active:scale-98 shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Apply for Access
              </span>
              <Building2 className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
            </div>
            <p className="text-xs font-bold text-white">Register Facility</p>
            <p className="text-[10px] text-slate-300">Submit Application with Password</p>
          </button>

          <button
            type="button"
            id="auth-track-status-btn"
            onClick={() => setStatusModalOpen(true)}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all hover:scale-102 active:scale-98 shadow-xs cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Status Lookup
              </span>
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-xs font-bold text-slate-800">Track Application</p>
            <p className="text-[10px] text-slate-500">With Email / ID &amp; Password</p>
          </button>
        </div>
      </div>

      {/* Institutional Role Selectors */}
      <div className="w-full max-w-xl mx-auto">
        <LandingRoleButtons onSelectRole={handleSelectRole} />
      </div>

      {/* Standalone Facility Modals */}
      <FacilityRegistrationModal
        isOpen={facilityRegOpen}
        onClose={() => setFacilityRegOpen(false)}
        initialType={facilityRegType}
        onSuccess={() => {
          setStatusModalOpen(true);
        }}
      />

      <ApplicationStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
      />
    </div>
  );
};

export default AuthPage;
