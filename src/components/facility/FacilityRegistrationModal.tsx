import React, { useState } from 'react';
import { api } from '../../lib/api/client';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  Building2,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  AlertCircle,
  Copy,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  User,
  KeyRound,
} from 'lucide-react';

interface FacilityRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'HOSPITAL' | 'BLOOD_BANK';
  initialType?: 'HOSPITAL' | 'BLOOD_BANK';
  onSuccess?: (app: any) => void;
}

export const FacilityRegistrationModal: React.FC<FacilityRegistrationModalProps> = ({
  isOpen,
  onClose,
  defaultType,
  initialType,
  onSuccess,
}) => {
  const { pushNotification, fetchFacilityApplications } = useLifeDrop();
  const effectiveDefault = initialType || defaultType || 'HOSPITAL';
  const [facilityType, setFacilityType] = useState<'HOSPITAL' | 'BLOOD_BANK'>(effectiveDefault);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Private');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Guntur');
  const [state, setState] = useState('Andhra Pradesh');
  const [pinCode, setPinCode] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('State Blood Transfusion Council / Drug Controller');
  const [licenseDocUrl, setLicenseDocUrl] = useState('');
  
  // Authorized Representative
  const [authorizedPersonName, setAuthorizedPersonName] = useState('');
  const [authorizedPersonDesignation, setAuthorizedPersonDesignation] = useState('');
  const [authorizedPersonPhone, setAuthorizedPersonPhone] = useState('');
  const [authorizedPersonEmail, setAuthorizedPersonEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<{
    referenceNumber: string;
    name: string;
    facilityType: string;
    submittedAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords match.');
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        facilityType,
        name: name.trim(),
        category,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        area: area.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim() || undefined,
        licenseNumber: licenseNumber.trim(),
        registrationNumber: registrationNumber.trim() || undefined,
        issuingAuthority: issuingAuthority.trim() || undefined,
        licenseDocUrl: licenseDocUrl.trim() || undefined,
        authorizedPersonName: authorizedPersonName.trim(),
        authorizedPersonDesignation: authorizedPersonDesignation.trim(),
        authorizedPersonPhone: authorizedPersonPhone.trim(),
        authorizedPersonEmail: authorizedPersonEmail.trim().toLowerCase(),
        emergencyContact: emergencyContact.trim() || undefined,
        password: password.trim() || undefined,
        services:
          facilityType === 'HOSPITAL'
            ? ['Emergency Transfusion & Critical Care', '24x7 Trauma Center']
            : undefined,
        componentsAvailable:
          facilityType === 'BLOOD_BANK'
            ? ['Red Blood Cells', 'Platelets', 'Plasma', 'Whole Blood']
            : undefined,
      };

      const res: any = await api.facilityApplications.submit(payload);
      const appData = (res && res.data) ? res.data : res;
      if (appData?.referenceNumber || appData?.id) {
        setSubmittedApp(appData);
        pushNotification?.(
          'ADMIN',
          `New ${facilityType === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'} Application`,
          `${appData.name || name} (${appData.referenceNumber || appData.id}) submitted an accreditation application awaiting review.`,
          'info',
          'admin',
          appData.referenceNumber || appData.id
        );
        fetchFacilityApplications?.();
        onSuccess?.(appData);
      } else {
        setErrorMsg(appData?.message || 'Failed to submit application. Please verify details.');
      }
    } catch (err: any) {
      console.error('Facility application error:', err);
      setErrorMsg(err.message || 'Failed to submit application. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (submittedApp?.referenceNumber) {
      navigator.clipboard.writeText(submittedApp.referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setSubmittedApp(null);
    setErrorMsg(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setLicenseNumber('');
    setAuthorizedPersonName('');
    setAuthorizedPersonPhone('');
    setAuthorizedPersonEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-lifedrop-navy to-rose-950 text-white p-6 relative flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                {facilityType === 'HOSPITAL' ? (
                  <Building2 className="w-5 h-5 text-rose-400" />
                ) : (
                  <Warehouse className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  {facilityType === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'} Accreditation Application
                </h2>
                <p className="text-xs text-slate-300">
                  Government-verified institutional registration with administrative review
                </p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Facility Type Switcher */}
          {!submittedApp && (
            <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={() => setFacilityType('HOSPITAL')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  facilityType === 'HOSPITAL'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Hospital Registration</span>
              </button>
              <button
                type="button"
                onClick={() => setFacilityType('BLOOD_BANK')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  facilityType === 'BLOOD_BANK'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Warehouse className="w-4 h-4" />
                <span>Blood Bank Registration</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {submittedApp ? (
            /* Success State */
            <div className="text-center py-6 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                  Application Submitted
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  Awaiting Administrator Approval
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Your application for <strong>{submittedApp.name}</strong> has been saved in the registry. In accordance with clinical governance protocols, an administrator will verify your license before account activation.
                </p>
              </div>

              {/* Reference Number Card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Application Reference Number
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono font-black text-lifedrop-navy">
                    {submittedApp.referenceNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200">
                  Save this number to check your accreditation progress or submit requested information.
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Done & Return
                </button>
              </div>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Section 1: Facility Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-1">
                  <FileText className="w-3.5 h-3.5 text-lifedrop-primary" />
                  1. Facility Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Legal Facility Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={facilityType === 'HOSPITAL' ? 'e.g. City Life Hospital' : 'e.g. Red Cross Blood Bank'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary bg-white"
                    >
                      <option value="Private">Private / Corporate</option>
                      <option value="Government">Government / Public</option>
                      <option value="Trust / Charitable">Trust / Charitable NGO</option>
                      <option value="Teaching / College">Teaching Hospital & Medical College</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State Medical License Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. HOSP-AP-2026-9011"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Institutional Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="director@facility.org"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08632234050 or +919848011223"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Facility Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Landmark, Area"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Guntur"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Andhra Pradesh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Authorized Representative */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-1">
                  <User className="w-3.5 h-3.5 text-lifedrop-primary" />
                  2. Authorized Institutional Representative
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Representative Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={authorizedPersonName}
                      onChange={(e) => setAuthorizedPersonName(e.target.value)}
                      placeholder="Dr. K. Venkatesh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={authorizedPersonDesignation}
                      onChange={(e) => setAuthorizedPersonDesignation(e.target.value)}
                      placeholder="Medical Superintendent / Director"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Representative Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={authorizedPersonPhone}
                      onChange={(e) => setAuthorizedPersonPhone(e.target.value)}
                      placeholder="+919848012345"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Representative Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={authorizedPersonEmail}
                      onChange={(e) => setAuthorizedPersonEmail(e.target.value)}
                      placeholder="k.venkatesh@facility.org"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Facility Account Password */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-1">
                  <KeyRound className="w-3.5 h-3.5 text-lifedrop-primary" />
                  3. Facility Portal Login Password
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  This password will be used to track your application and immediately sign into your verified portal upon administrative approval.
                </p>
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800 font-medium">
                <strong>Governance Policy:</strong> Facility applications are reviewed by authorized LifeDrop administrators. Once approved, you can immediately log in using your registered email and password.
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white text-xs font-black shadow-lg shadow-lifedrop-primary/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application for Review'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
