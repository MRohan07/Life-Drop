/* @module: BloodBankRegistrationWizard — 4-Step statutory blood bank facility registration wizard */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Warehouse, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { BloodBankStep1Info } from './BloodBankStep1Info';
import { BloodBankStep2Location } from './BloodBankStep2Location';
import { BloodBankStep3License } from './BloodBankStep3License';
import { BloodBankStep4Account } from './BloodBankStep4Account';
import { VerificationPendingCard } from './VerificationPendingCard';
import { BloodGroup } from '../../../types';
import { useLifeDrop } from '../../../context/LifeDropContext';

interface BloodBankRegistrationWizardProps {
  onCancel: () => void;
}

export const BloodBankRegistrationWizard: React.FC<BloodBankRegistrationWizardProps> = ({ onCancel }) => {
  const { pushNotification, fetchFacilityApplications } = useLifeDrop();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedBB, setSubmittedBB] = useState<{ id: string; name: string } | null>(null);

  const [formData, setFormData] = useState({
    id: `BB${Math.floor(1000 + Math.random() * 9000)}`,
    name: '', type: 'Hospital Blood Bank' as const, registrationNumber: '', phone: '', email: '',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80',
    address: '', area: '', city: 'Metropolis', state: 'Metro State', pinCode: '10001',
    latitude: 40.7128, longitude: -74.006, componentsAvailable: ['Whole Blood', 'Packed Red Blood Cells', 'Plasma'],
    emergencySupplyAvailable: true, is24x7Service: true, licenseNumber: '', issuingAuthority: 'State Drug Control Administration',
    licenseIssueDate: '2024-01-15', licenseExpiryDate: '2028-01-15', licenseDocUrl: 'bloodbank_license.pdf',
    registrationCertUrl: 'bloodbank_cert.pdf', authorizedPersonName: '', authorizedPersonDesignation: 'Blood Bank Officer',
    authorizedPersonPhone: '', authorizedPersonEmail: '', password: '', confirmPassword: '',
    agreeBelong: true, agreeGenuine: true, agreeTerms: true, agreeCoordination: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeBelong || !formData.agreeGenuine || !formData.agreeTerms || !formData.agreeCoordination) {
      alert('Please accept all verification and compliance declarations.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match. Please ensure both passwords match.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const randSuffix = Date.now().toString().slice(-6);
      const uniqueEmail = formData.email.trim() || `bloodbank.${randSuffix}@lifedrop.io`;
      const uniqueLicense = formData.licenseNumber.trim() || `BB-LIC-${randSuffix}`;
      const uniquePhone = formData.phone.trim() || `+1 (555) 019-${Math.floor(1000 + Math.random() * 9000)}`;

      const res: any = await api.facilityApplications.submit({
        facilityType: 'BLOOD_BANK',
        facilityName: formData.name.trim() || 'Metro Central Blood Bank',
        officialEmail: uniqueEmail,
        contactNumber: uniquePhone,
        address: formData.address.trim() || '102 Lifeline Plaza',
        city: formData.city.trim() || 'Metropolis',
        state: formData.state.trim() || 'Metro State',
        postalCode: formData.pinCode.trim() || '10001',
        licenseNumber: uniqueLicense,
        registrationNumber: formData.registrationNumber.trim() || undefined,
        password: formData.password.trim(),
        authorizedRepresentative: {
          name: formData.authorizedPersonName.trim() || 'Medical Officer',
          designation: formData.authorizedPersonDesignation.trim() || 'Blood Bank Officer',
          phone: formData.authorizedPersonPhone.trim() || uniquePhone,
          email: formData.authorizedPersonEmail.trim() || uniqueEmail,
        },
        documents: [
          { documentType: 'LICENSE', fileName: 'bloodbank_license.pdf', fileUrl: formData.licenseDocUrl || 'https://lifedrop.io/docs/bloodbank_license.pdf' },
          { documentType: 'REGISTRATION_CERTIFICATE', fileName: 'bloodbank_cert.pdf', fileUrl: formData.registrationCertUrl || 'https://lifedrop.io/docs/bloodbank_cert.pdf' }
        ]
      });

      const appData = (res && res.data) ? res.data : res;
      const refNumber = appData?.referenceNumber || appData?.id;
      const facilityName = appData?.facilityName || appData?.name || formData.name;

      if (refNumber) {
        setSubmittedBB({ id: refNumber, name: facilityName });
        pushNotification?.('ADMIN', 'New Blood Bank Registration Application', `${facilityName} (${refNumber}) submitted an accreditation application.`, 'info', 'admin', refNumber);
        fetchFacilityApplications?.();
      } else {
        setSubmitError(appData?.message || 'Failed to submit blood bank application.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error communicating with LifeDrop application service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedBB) {
    return <VerificationPendingCard id={submittedBB.id} name={submittedBB.name} role="BLOOD_BANK" onBackToLogin={onCancel} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
        <span className="font-extrabold text-amber-700">Blood Bank Onboarding — Step {step} of 4</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${step >= s ? 'w-6 bg-amber-600' : 'w-2 bg-slate-200'}`} />
          ))}
        </div>
      </div>

      {step === 1 && <BloodBankStep1Info formData={formData} setFormData={setFormData} />}
      {step === 2 && <BloodBankStep2Location formData={formData} setFormData={setFormData} />}
      {step === 3 && <BloodBankStep3License formData={formData} setFormData={setFormData} />}
      {step === 4 && <BloodBankStep4Account formData={formData} setFormData={setFormData} />}

      {submitError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-500 hover:underline">
            Cancel to Login
          </button>
        )}

        {step < 4 ? (
          <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md">
            <span>Continue</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <Warehouse className="w-4 h-4" />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default BloodBankRegistrationWizard;
