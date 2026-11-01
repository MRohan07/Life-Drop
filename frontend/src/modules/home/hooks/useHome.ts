/* @module: useHome — State and actions for multi-role landing home */
import { useState } from 'react';
import { useLifeDrop } from '../../../context/LifeDropContext';
import { BloodGroup, UserRole } from '../../../types';
import { api } from '../../../lib/api/client';

export const useHome = (onEnterPlatform: (role?: string) => void) => {
  const {
    users, hospitals, bloodBanks, requests,
    login, registerUser,
  } = useLifeDrop();

  const [activeRole, setActiveRole] = useState<UserRole>('USER');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');
  const [regCity, setRegCity] = useState('Guntur');
  const [regLicense, setRegLicense] = useState('');
  const [institutionalModalRole, setInstitutionalModalRole] = useState<UserRole | null>(null);

  const handleGenerateOtp = () => {
    if (!contact.trim()) { alert('Please enter contact info.'); return; }
    setIsGeneratingOtp(true);
    setErrorMessage(null);
    setTimeout(() => { setIsGeneratingOtp(false); setOtpGenerated(true); setOtpCode('123456'); }, 300);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const passToUse = password || (activeRole === 'ADMIN' ? 'Admin@123' : 'LifeDrop@2026!');
    const res = await login(contact, passToUse, activeRole);
    if (res.success) {
      onEnterPlatform(res.role || activeRole);
    } else {
      setErrorMessage(res.message || 'Authentication failed. Please verify credentials.');
      alert(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    alert('Google Single Sign-On (SSO) integration is coming soon. Please sign in using your registered mobile number or email.');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    setErrorMessage(null);
    if (activeRole === 'USER') {
      const res = await registerUser({ name: regName.trim(), phone: regPhone.trim(), bloodGroup: regBloodGroup, city: regCity.trim() });
      if (res.success) {
        onEnterPlatform('USER');
      } else {
        setErrorMessage(res.message || 'Registration failed');
        alert(res.message || 'Registration failed');
      }
    } else if (activeRole === 'HOSPITAL' || activeRole === 'BLOOD_BANK') {
      try {
        const randSuffix = Date.now().toString().slice(-6);
        const res: any = await api.facilityApplications.submit({
          facilityType: activeRole,
          name: regName.trim(),
          category: activeRole === 'HOSPITAL' ? 'Private' : 'Charitable',
          phone: regPhone.trim(),
          email: `${activeRole.toLowerCase()}.${randSuffix}@lifedrop.io`,
          address: `${regCity.trim()} Main Facility`,
          city: regCity.trim(),
          licenseNumber: regLicense.trim() || `${activeRole === 'HOSPITAL' ? 'HOSP' : 'BB'}-LIC-${randSuffix}`,
          authorizedPersonName: regName.trim(),
          authorizedPersonDesignation: activeRole === 'HOSPITAL' ? 'Hospital Medical Director' : 'Blood Bank Officer',
          authorizedPersonPhone: regPhone.trim(),
          authorizedPersonEmail: `director.${randSuffix}@lifedrop.io`,
          password: password || 'LifeDrop@2026!',
        });

        const appData = (res && res.data) ? res.data : res;
        const refNumber = appData?.referenceNumber || appData?.id;
        const facilityName = appData?.name || appData?.facilityName || regName.trim();

        if (refNumber) {
          alert(`Application Submitted Successfully!\n\nReference Number: ${refNumber}\nFacility: ${facilityName}\n\nYour application has been delivered to all platform administrators for review. You can check your status or sign in with your email and password.`);
          setAuthMode('LOGIN');
        } else {
          setErrorMessage(appData?.message || 'Failed to submit facility application.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error submitting application.');
        alert(err.message || 'Error submitting application.');
      }
    }
  };

  return {
    users, hospitals, bloodBanks, requests,
    activeRole, setActiveRole, authMode, setAuthMode,
    contact, setContact, password, setPassword,
    otpGenerated, isGeneratingOtp, otpCode, setOtpCode,
    errorMessage,
    regName, setRegName, regPhone, setRegPhone, regBloodGroup, setRegBloodGroup,
    regCity, setRegCity, regLicense, setRegLicense,
    institutionalModalRole, setInstitutionalModalRole,
    handleGenerateOtp, handleLoginSubmit, handleGoogleSignIn,
    handleRegisterSubmit,
  };
};

export default useHome;
