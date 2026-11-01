/* @module: BloodBankProfileView — Blood Bank statutory accreditation, cold chain credentials & facility settings */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { ProfileFeedbackSection } from '../common/ProfileFeedbackSection';
import {
  Building2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Edit3,
  CheckCircle2,
  Save,
  X,
  FileText,
  Activity,
  Award,
  Layers,
  Thermometer,
  UserCheck,
  FileCheck,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import { formatPhone } from '../../utils/formatters';

interface BloodBankProfileViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const BloodBankProfileView: React.FC<BloodBankProfileViewProps> = ({
  onNavigateTab,
}) => {
  const { currentBloodBank, updateBloodBankProfile } = useLifeDrop();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: currentBloodBank.name || '',
    type: currentBloodBank.type || 'Hospital Blood Bank',
    registrationNumber: currentBloodBank.registrationNumber || 'BB-REG-2024-8891',
    licenseNumber: currentBloodBank.licenseNumber || 'DL-AP-28C-00892',
    issuingAuthority: currentBloodBank.issuingAuthority || 'Drugs Control Administration / CDSCO',
    licenseIssueDate: currentBloodBank.licenseIssueDate || '2023-01-15',
    licenseExpiryDate: currentBloodBank.licenseExpiryDate || '2028-01-14',
    phone: currentBloodBank.phone || '+91 863 2233445',
    email: currentBloodBank.email || 'bloodbank.guntur@redcross.org.in',
    authorizedPersonName: currentBloodBank.authorizedPersonName || 'Dr. S. K. Murthy, MD (Pathology)',
    authorizedPersonDesignation: currentBloodBank.authorizedPersonDesignation || 'Chief Medical Officer & Blood Bank In-Charge',
    authorizedPersonPhone: currentBloodBank.authorizedPersonPhone || '+91 94401 23456',
    authorizedPersonEmail: currentBloodBank.authorizedPersonEmail || 'dr.skmurthy@redcross.org.in',
    address: currentBloodBank.address || 'Collectorate Road, Near Old Bus Stand',
    area: currentBloodBank.area || 'Nagarampalem',
    city: currentBloodBank.city || 'Guntur',
    state: currentBloodBank.state || 'Andhra Pradesh',
    pinCode: currentBloodBank.pinCode || '522004',
    emergencySupplyAvailable: currentBloodBank.emergencySupplyAvailable ?? true,
    is24x7Service: currentBloodBank.is24x7Service ?? true,
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBloodBankProfile({
      name: formData.name,
      type: formData.type as any,
      registrationNumber: formData.registrationNumber,
      licenseNumber: formData.licenseNumber,
      issuingAuthority: formData.issuingAuthority,
      licenseIssueDate: formData.licenseIssueDate,
      licenseExpiryDate: formData.licenseExpiryDate,
      phone: formData.phone,
      email: formData.email,
      authorizedPersonName: formData.authorizedPersonName,
      authorizedPersonDesignation: formData.authorizedPersonDesignation,
      authorizedPersonPhone: formData.authorizedPersonPhone,
      authorizedPersonEmail: formData.authorizedPersonEmail,
      address: formData.address,
      area: formData.area,
      city: formData.city,
      state: formData.state,
      pinCode: formData.pinCode,
      emergencySupplyAvailable: formData.emergencySupplyAvailable,
      is24x7Service: formData.is24x7Service,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setEditModalOpen(false);
    }, 1400);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Facility Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-8 h-8 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  CDSCO Licensed &amp; Verified
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                  {currentBloodBank.type || 'Hospital Blood Bank'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-lifedrop-navy tracking-tight">
                {currentBloodBank.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>Facility ID: <strong className="font-mono text-slate-700">{currentBloodBank.id}</strong></span>
                <span>•</span>
                <span>Drug License: <strong className="font-mono text-slate-700">{currentBloodBank.licenseNumber}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-lifedrop-navy hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-102"
            >
              <Edit3 className="w-4 h-4" />
              Edit Facility Profile
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Operating Mode</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              24/7 Emergency Dispatch
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Component Separation</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Form 28C Licensed
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Phlebotomist In-Charge</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              {currentBloodBank.authorizedPersonName ? currentBloodBank.authorizedPersonName.split(',')[0] : 'Dr. S. K. Murthy'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Cold Chain Standard</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Thermometer className="w-3.5 h-3.5 text-rose-600" />
              -80°C to 22°C Agitation
            </span>
          </div>
        </div>
      </div>

      {/* 2. Three Column Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Statutory & Licensing Credentials */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-lifedrop-navy">
                Statutory License &amp; Accreditation
              </h3>
              <p className="text-[11px] text-slate-400">CDSCO &amp; State Drug Control Department</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Drug Control License No.</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {currentBloodBank.licenseNumber}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Form Schedule Endorsement</span>
              <span className="font-semibold text-slate-800">
                Form 28C (Collection, Storage &amp; Processing of Whole Blood &amp; Blood Components)
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Issuing Authority</span>
              <span className="font-semibold text-slate-800">
                {currentBloodBank.issuingAuthority || 'Drugs Control Administration, Andhra Pradesh'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Issue Date</span>
                <span className="font-bold text-slate-700">
                  {currentBloodBank.licenseIssueDate || '15 Jan 2023'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Valid Thru / Renewal</span>
                <span className="font-bold text-emerald-700">
                  {currentBloodBank.licenseExpiryDate || '14 Jan 2028'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Certificate Copy</span>
              <span className="text-xs font-bold text-lifedrop-primary flex items-center gap-1 cursor-pointer hover:underline">
                <FileText className="w-3.5 h-3.5" />
                View Verification Doc
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Clinical Facilities & Cold Chain */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-lifedrop-navy">
                Cold Chain &amp; Separation Units
              </h3>
              <p className="text-[11px] text-slate-400">Certified Storage Regimes</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">PRBC Walk-In Cold Room</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                  +4°C &plusmn; 2°C
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Continuous circular chart temperature recorder with diesel generator backup.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Plasma Deep Freezers</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                  -80°C / -40°C
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Dedicated fresh frozen plasma (FFP) and cryoprecipitate vault.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Platelet Agitator &amp; Incubator</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                  22°C (60 RPM)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Continuous horizontal agitation to prevent aggregation during storage.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Medical Officer & Contact */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-lifedrop-navy">
                Authorized Personnel &amp; Helpline
              </h3>
              <p className="text-[11px] text-slate-400">Clinical Oversight &amp; 24/7 Desk</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Chief Medical Officer (CMO)</span>
              <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                {currentBloodBank.authorizedPersonName || 'Dr. S. K. Murthy, MD (Pathology)'}
              </span>
              <span className="text-slate-500 text-[11px]">
                {currentBloodBank.authorizedPersonDesignation || 'Blood Bank In-Charge'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Nodal Tel: {currentBloodBank.authorizedPersonPhone || '+91 94401 23456'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Nodal Email: {currentBloodBank.authorizedPersonEmail || 'dr.skmurthy@redcross.org.in'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-slate-400 block font-medium mb-1">Facility Address</span>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {currentBloodBank.address}, {currentBloodBank.area && `${currentBloodBank.area}, `}
                  {currentBloodBank.city} - {currentBloodBank.pinCode || '522004'}, {currentBloodBank.state || 'Andhra Pradesh'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-[11px] flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>24/7 Emergency Dispatch Helpline: {currentBloodBank.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blood Bank Feedback & Cold Chain Review Ledger */}
      <ProfileFeedbackSection
        role="BLOOD_BANK"
        targetId={currentBloodBank.id}
        targetName={currentBloodBank.name}
      />

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  Facility Settings
                </span>
                <h3 className="text-xl font-extrabold text-lifedrop-navy mt-1.5">
                  Edit Blood Bank Facility Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Update statutory credentials, facility contact numbers, and phlebotomy in-charge details.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Facility details saved and synchronized successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Facility Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Facility Category:
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Government">Government Blood Bank</option>
                    <option value="Hospital Blood Bank">Hospital Blood Bank</option>
                    <option value="NGO / Trust">NGO / Trust (e.g. Red Cross)</option>
                    <option value="Private">Private Facility</option>
                  </select>
                </div>
              </div>

              {/* License Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Drug License No:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseNumber: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    License Issue Date:
                  </label>
                  <input
                    type="date"
                    value={formData.licenseIssueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseIssueDate: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    License Expiry Date:
                  </label>
                  <input
                    type="date"
                    value={formData.licenseExpiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseExpiryDate: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Contact numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    24/7 Helpline Phone:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Official Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Authorized In-Charge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Medical Officer In-Charge:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.authorizedPersonName}
                    onChange={(e) =>
                      setFormData({ ...formData, authorizedPersonName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Designation:
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedPersonDesignation}
                    onChange={(e) =>
                      setFormData({ ...formData, authorizedPersonDesignation: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Street Address:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City:</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State:</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Postal PIN Code:</label>
                    <input
                      type="text"
                      required
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-lifedrop-navy hover:bg-slate-800 text-white font-extrabold flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
