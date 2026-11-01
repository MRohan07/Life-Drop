/* @module: HospitalRegistrationWizard — 4-Step statutory hospital registration wizard */
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api/client';
import { HospitalStep1Info } from './HospitalStep1Info';
import { HospitalStep2Location } from './HospitalStep2Location';
import { HospitalStep3License } from './HospitalStep3License';
import { HospitalStep4Account } from './HospitalStep4Account';
import { VerificationPendingCard } from './VerificationPendingCard';
import { useLifeDrop } from '../../../context/LifeDropContext';

interface HospitalRegistrationWizardProps {
  onCancel: () => void;
}

export const HospitalRegistrationWizard: React.FC<HospitalRegistrationWizardProps> = ({ onCancel }) => {
  const { pushNotification, fetchFacilityApplications } = useLifeDrop();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedHospital, setSubmittedHospital] = useState<{ id: string; name: string } | null>(null);

  const [formData, setFormData] = useState({
    id: `HOSP${Math.floor(1000 + Math.random() * 9000)}`,
    name: '', type: 'Private' as const, registrationNumber: '', phone: '', email: '',
    website: '', image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300&auto=format&fit=crop&q=80',
    address: '', area: '', city: 'Metropolis', state: 'Metro State', pinCode: '10001',
    latitude: 40.7128, longitude: -74.006, services: ['Emergency / Trauma', 'ICU / Critical Care'],
    licenseNumber: '', issuingAuthority: 'State Health Services Board', licenseIssueDate: '2024-01-15',
    licenseExpiryDate: '2028-01-15', licenseDocUrl: 'hospital_license.pdf', registrationCertUrl: 'hospital_cert.pdf',
    authorizedPersonName: '', authorizedPersonDesignation: 'Hospital Administrator',
    authorizedPersonPhone: '', authorizedPersonEmail: '', emergencyContact: '',
    emergencyServiceAvailable: true, is24x7Emergency: true, password: '', confirmPassword: '',
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
      const uniqueEmail = formData.email.trim() || `hospital.${randSuffix}@lifedrop.io`;
      const uniqueLicense = formData.licenseNumber.trim() || `MED-LIC-${randSuffix}`;
      const uniquePhone = formData.phone.trim() || `+1 (555) 019-${Math.floor(1000 + Math.random() * 9000)}`;

      const res: any = await api.facilityApplications.submit({
        facilityType: 'HOSPITAL',
        facilityName: formData.name.trim() || 'Metropolitan Hospital',
        officialEmail: uniqueEmail,
        contactNumber: uniquePhone,
        address: formData.address.trim() || '500 Medical Center Drive',
        city: formData.city.trim() || 'Metropolis',
        state: formData.state.trim() || 'Metro State',
        postalCode: formData.pinCode.trim() || '10001',
        licenseNumber: uniqueLicense,
        registrationNumber: formData.registrationNumber.trim() || undefined,
        password: formData.password.trim(),
        authorizedRepresentative: {
          name: formData.authorizedPersonName.trim() || 'Medical Officer',
          designation: formData.authorizedPersonDesignation.trim() || 'Hospital Administrator',
          phone: formData.authorizedPersonPhone.trim() || uniquePhone,
          email: formData.authorizedPersonEmail.trim() || uniqueEmail,
        },
        documents: [
          { documentType: 'LICENSE', fileName: 'license.pdf', fileUrl: formData.licenseDocUrl || 'https://lifedrop.io/docs/hospital_license.pdf' },
          { documentType: 'REGISTRATION_CERTIFICATE', fileName: 'registration.pdf', fileUrl: formData.registrationCertUrl || 'https://lifedrop.io/docs/registration_cert.pdf' }
        ]
      });

      const appData = (res && res.data) ? res.data : res;
      const refNumber = appData?.referenceNumber || appData?.id;
      const facilityName = appData?.facilityName || appData?.name || formData.name;

      if (refNumber) {
        setSubmittedHospital({ id: refNumber, name: facilityName });
        pushNotification?.('ADMIN', 'New Hospital Registration Application', `${facilityName} (${refNumber}) submitted an accreditation application.`, 'info', 'admin', refNumber);
        fetchFacilityApplications?.();
      } else {
        setSubmitError(appData?.message || 'Failed to submit hospital application.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error communicating with LifeDrop application service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedHospital) {
    return <VerificationPendingCard id={submittedHospital.id} name={submittedHospital.name} role="HOSPITAL" onBackToLogin={onCancel} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
        <span className="font-extrabold text-blue-700">Hospital Onboarding — Step {step} of 4</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${step >= s ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`} />
          ))}
        </div>
      </div>

      {step === 1 && <HospitalStep1Info formData={formData} setFormData={setFormData} />}
      {step === 2 && <HospitalStep2Location formData={formData} setFormData={setFormData} />}
      {step === 3 && <HospitalStep3License formData={formData} setFormData={setFormData} />}
      {step === 4 && <HospitalStep4Account formData={formData} setFormData={setFormData} />}

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
          <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md">
            <span>Continue</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default HospitalRegistrationWizard;
