/* @module: useAuth — Authentication state and actions hook */
import { useState } from 'react';
import { useLifeDrop } from '../../../context/LifeDropContext';
import { UserRole, BloodGroup } from '../../../types';

export const useAuth = (onSuccess: (role: UserRole) => void) => {
  const {
    users, hospitals, bloodBanks, setCurrentRole,
    setCurrentUserId, setCurrentHospitalId, setCurrentBloodBankId, registerUser,
  } = useLifeDrop();

  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('USER');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [city, setCity] = useState('Metropolis');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLogin = (role: UserRole, id: string) => {
    setCurrentRole(role);
    if (role === 'USER') setCurrentUserId(id);
    if (role === 'HOSPITAL') setCurrentHospitalId(id);
    if (role === 'BLOOD_BANK') setCurrentBloodBankId(id);
    onSuccess(role);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setOtpSent(true); }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (activeRoleTab === 'USER') {
        const matched = users.find((u) => u.phone === phone.replace(/\D/g, '')) || users[0];
        setCurrentRole('USER');
        setCurrentUserId(matched.id);
      } else if (activeRoleTab === 'HOSPITAL') {
        setCurrentRole('HOSPITAL');
        setCurrentHospitalId(hospitals[0]?.id || 'LD-HOSP-01');
      } else if (activeRoleTab === 'BLOOD_BANK') {
        setCurrentRole('BLOOD_BANK');
        setCurrentBloodBankId(bloodBanks[0]?.id || 'LD-BB-01');
      } else {
        setCurrentRole('ADMIN');
      }
      onSuccess(activeRoleTab);
    }, 400);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const res = await registerUser({ name: name.trim(), phone: phone.trim(), bloodGroup, city: city.trim() });
    if (res.success) {
      onSuccess('USER');
    } else {
      alert(res.message || 'Registration failed');
    }
  };

  return {
    activeRoleTab, setActiveRoleTab, authMode, setAuthMode,
    phone, setPhone, name, setName, bloodGroup, setBloodGroup,
    city, setCity, otpSent, otpCode, setOtpCode, isSubmitting,
    users, hospitals, bloodBanks, handleQuickLogin, handleSendOtp,
    handleVerifyOtp, handleRegister,
  };
};
