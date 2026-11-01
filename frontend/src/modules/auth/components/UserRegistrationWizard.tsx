/* @module: UserRegistrationWizard — 4-Step / 7-Section User Registration Wizard */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';
import { useLifeDrop } from '../../../context/LifeDropContext';
import { RegisterStepPersonal } from './RegisterStepPersonal';
import { RegisterStepBlood } from './RegisterStepBlood';
import { RegisterStepLocation } from './RegisterStepLocation';
import { RegisterStepSecurity } from './RegisterStepSecurity';

interface UserRegistrationWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const UserRegistrationWizard: React.FC<UserRegistrationWizardProps> = ({ onSuccess, onCancel }) => {
  const { registerUser } = useLifeDrop();
  const [step, setStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', dob: '1998-05-14', gender: 'Prefer not to say', phone: '', otpInput: '',
    email: '', bloodGroup: 'O+' as any, hasDonatedBefore: false, lastDonationDate: '',
    city: '', location: '', latitude: 0, longitude: 0, password: '', confirmPassword: '',
    receiveEmergencyAlerts: true, alertSms: true, alertInApp: true, alertEmail: false,
    agreeTerms: true, agreeCoordination: true, agreeDonationTerms: true,
  });

  const handleSendOtp = () => setOtpSent(true);
  const handleVerifyOtp = () => { if (formData.otpInput === '123456' || formData.otpInput.length === 6) setOtpVerified(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (!formData.name || formData.name.trim().length < 2) {
      alert('Please enter your full name (minimum 2 characters).');
      setStep(1);
      return;
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Please enter a valid mobile number (minimum 10 digits).');
      setStep(1);
      return;
    }

    if (!formData.city || formData.city.trim().length < 2) {
      alert('Please enter your city (minimum 2 characters).');
      setStep(3);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert('Password must be at least 6 characters.');
      setStep(4);
      return;
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please ensure both passwords match.');
      setStep(4);
      return;
    }

    if (!formData.agreeTerms || !formData.agreeCoordination || !formData.agreeDonationTerms) {
      alert('Please accept all Terms & Consent checkboxes to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUser({
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email && formData.email.trim() !== '' ? formData.email.trim() : undefined,
        bloodGroup: formData.bloodGroup,
        city: formData.city.trim(),
        location: formData.location ? formData.location.trim() : `${formData.city.trim()} Central District`,
        dob: formData.dob || '1998-05-14',
        latitude: formData.latitude || 16.3067,
        longitude: formData.longitude || 80.4365,
        lastDonationDate: formData.hasDonatedBefore && formData.lastDonationDate ? formData.lastDonationDate : null,
        password: formData.password || 'LifeDrop@2026!',
      });

      if (!result.success) {
        alert(result.message || 'Registration failed. Please check your information.');
        return;
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Progress Bar Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
        <span className="font-extrabold text-slate-900">Step {step} of 4</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${step >= s ? 'w-6 bg-lifedrop-primary' : 'w-2 bg-slate-200'}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <RegisterStepPersonal
          formData={formData} setFormData={setFormData}
          otpSent={otpSent} otpVerified={otpVerified}
          onSendOtp={handleSendOtp} onVerifyOtp={handleVerifyOtp}
        />
      )}
      {step === 2 && <RegisterStepBlood formData={formData} setFormData={setFormData} />}
      {step === 3 && <RegisterStepLocation formData={formData} setFormData={setFormData} />}
      {step === 4 && <RegisterStepSecurity formData={formData} setFormData={setFormData} />}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-500 hover:underline">
            Back to Sign in
          </button>
        )}

        {step < 4 ? (
          <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md">
            <span>Next Step</span> <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-lifedrop-primary hover:bg-rose-700 disabled:opacity-50 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
          </button>
        )}
      </div>
    </form>
  );
};
