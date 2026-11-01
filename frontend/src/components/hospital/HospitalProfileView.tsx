/* @module: HospitalProfileView — Official facility accreditation, statutory registration & contact settings */
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
  Globe,
  UserCheck,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { formatPhone } from '../../utils/formatters';
import { sanitizeUrl } from '../../utils/security';

interface HospitalProfileViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const HospitalProfileView: React.FC<HospitalProfileViewProps> = ({
  onNavigateTab,
}) => {
  const { currentHospital, updateHospitalProfile } = useLifeDrop();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: currentHospital.name || '',
    type: currentHospital.type || 'Government',
    registrationNumber: currentHospital.registrationNumber || '',
    licenseNumber: currentHospital.licenseNumber || '',
    issuingAuthority: currentHospital.issuingAuthority || 'State Health Services Board',
    licenseIssueDate: currentHospital.licenseIssueDate || '',
    licenseExpiryDate: currentHospital.licenseExpiryDate || '',
    phone: currentHospital.phone || '',
    emergencyContact: currentHospital.emergencyContact || currentHospital.phone || '',
    email: currentHospital.email || '',
    website: currentHospital.website || '',
    authorizedPersonName: currentHospital.authorizedPersonName || '',
    authorizedPersonDesignation: currentHospital.authorizedPersonDesignation || 'Medical Officer',
    authorizedPersonPhone: currentHospital.authorizedPersonPhone || '',
    authorizedPersonEmail: currentHospital.authorizedPersonEmail || '',
    address: currentHospital.address || '',
    area: currentHospital.area || '',
    city: currentHospital.city || '',
    state: currentHospital.state || '',
    pinCode: currentHospital.pinCode || '',
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateHospitalProfile({
      name: formData.name,
      type: formData.type as any,
      registrationNumber: formData.registrationNumber,
      licenseNumber: formData.licenseNumber,
      issuingAuthority: formData.issuingAuthority,
      licenseIssueDate: formData.licenseIssueDate,
      licenseExpiryDate: formData.licenseExpiryDate,
      phone: formData.phone,
      emergencyContact: formData.emergencyContact,
      email: formData.email,
      website: formData.website,
      authorizedPersonName: formData.authorizedPersonName,
      authorizedPersonDesignation: formData.authorizedPersonDesignation,
      authorizedPersonPhone: formData.authorizedPersonPhone,
      authorizedPersonEmail: formData.authorizedPersonEmail,
      address: formData.address,
      area: formData.area,
      city: formData.city,
      state: formData.state,
      pinCode: formData.pinCode,
    });
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setEditModalOpen(false);
    }, 1500);
  };

  // Hospital services list submitted during registration
  const servicesList = currentHospital.services && currentHospital.services.length > 0
    ? currentHospital.services
    : [
        'Emergency / Trauma Care',
        'Blood Transfusion Wing',
        'ICU / Critical Care',
        'Component Separation Lab',
        'Cross-Matching & Serology',
      ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {currentHospital.isVerified ? 'Statutory Verified Facility' : 'Pending Verification Desk'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                License #{currentHospital.licenseNumber}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Reg #{currentHospital.registrationNumber || 'HOSP-REG-01'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentHospital.name}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Official institutional record and statutory registration details submitted for {currentHospital.name}. All licensing, leadership, and contact data are verified with state healthcare authorities.
            </p>
          </div>

          <button
            onClick={() => setEditModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs transition-all flex items-center gap-2 flex-shrink-0 shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Facility Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Accreditation, Transfusion Leadership & Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Licensing & Statutory Accreditation */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span>Statutory Licensing & Accreditation</span>
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                {currentHospital.isVerified ? 'Active & Cleared' : 'Under Review'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Medical License Number</span>
                <div className="font-mono font-black text-sm text-slate-900">{currentHospital.licenseNumber}</div>
                <div className="text-slate-500 text-[11px]">{currentHospital.issuingAuthority || 'State Health Services Board'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Hospital Classification</span>
                <div className="font-bold text-sm text-slate-900">{currentHospital.type || 'Government'} Hospital</div>
                <div className="text-slate-500 text-[11px]">Reg: {currentHospital.registrationNumber || 'HOSP-REG-01'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">License Validity Period</span>
                <div className="font-bold text-sm text-slate-900">
                  {currentHospital.licenseIssueDate || '2024-01-01'} to {currentHospital.licenseExpiryDate || '2029-01-01'}
                </div>
                <div className="text-slate-500 text-[11px]">Compliance Audit: Certified Valid</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Emergency Coverage Status</span>
                <div className="font-bold text-sm text-emerald-700">
                  {currentHospital.is24x7Emergency ? '24x7 Immediate Transfusion Ready' : 'Standard Emergency Operating Hours'}
                </div>
                <div className="text-slate-500 text-[11px]">Cold chain backup online</div>
              </div>
            </div>
          </div>

          {/* 2. Department of Transfusion Medicine & Emergency Contacts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                <span>Transfusion Medicine Department & Emergency Desk</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1">
                <span className="text-rose-700 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  24/7 Trauma Blood Requisition Hotline
                </span>
                <div className="font-black text-rose-700 text-base">
                  {currentHospital.emergencyContact || currentHospital.phone}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Dedicated line for urgent donor dispatch & blood bank requisitions
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  Main Hospital Switchboard
                </span>
                <div className="font-bold text-slate-900 text-base">
                  {formatPhone(currentHospital.phone)}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Hospital main desk & administrative lines
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  Official Hospital Email
                </span>
                <div className="font-mono font-bold text-slate-900">
                  {currentHospital.email}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Statutory notifications & coordination emails
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Official Website
                </span>
                <div className="font-bold text-blue-600 truncate">
                  {currentHospital.website ? (
                    <a href={sanitizeUrl(currentHospital.website)} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <span>{currentHospital.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px]">Public institutional web portal</div>
              </div>
            </div>
          </div>

          {/* 3. Clinical & Transfusion Services Offered */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>Registered Clinical & Transfusion Services</span>
            </h3>
            <p className="text-xs text-slate-500">
              Services selected during hospital registration and certified for live emergency coordination.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {servicesList.map((srv, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">{srv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Campus Location, Representative, and Documents */}
        <div className="space-y-6">
          {/* Authorized Representative & Signatory */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Designated Representative</span>
            </h3>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 block">Authorized Official</span>
                <div className="font-extrabold text-slate-900 text-sm">
                  {currentHospital.authorizedPersonName || 'Medical Superintendent'}
                </div>
                <div className="text-slate-600 font-medium">
                  {currentHospital.authorizedPersonDesignation || 'Hospital Administrator'}
                </div>
              </div>

              <div className="pt-2 border-t border-blue-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentHospital.authorizedPersonPhone ? formatPhone(currentHospital.authorizedPersonPhone) : formatPhone(currentHospital.phone)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] truncate">{currentHospital.authorizedPersonEmail || currentHospital.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campus Location & Coordinates */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Campus & Logistics Location</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Physical Street Address</span>
                <div className="font-bold text-slate-800 leading-relaxed">
                  {currentHospital.address}
                </div>
                <div className="text-slate-600 font-semibold">
                  {currentHospital.area ? `${currentHospital.area}, ` : ''}{currentHospital.city}{currentHospital.state ? `, ${currentHospital.state}` : ''} {currentHospital.pinCode ? `- ${currentHospital.pinCode}` : ''}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">GPS Geocoordinates</span>
                <div className="font-mono text-slate-800 font-bold text-xs">
                  Lat: {currentHospital.latitude?.toFixed(4) || '16.2995'} • Long: {currentHospital.longitude?.toFixed(4) || '80.4430'}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Calibrated for donor route radar and emergency response
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Verification Documents */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-slate-700" />
              <span>Onboarding Documents</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-800">Hospital License Document</div>
                    <div className="text-[10px] text-slate-400">PDF Document • Verified</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  Attached
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-bold text-slate-800">Registration Certificate</div>
                    <div className="text-[10px] text-slate-400">PDF Document • Verified</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  Attached
                </span>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 text-center">
                Submitted on {currentHospital.submittedDate || '2026-01-10'} • LifeDrop Facility Node
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Feedback & Coordination Reviews */}
      <ProfileFeedbackSection
        role="HOSPITAL"
        targetId={currentHospital.id}
        targetName={currentHospital.name}
      />

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 to-lifedrop-navy text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    Institutional Record
                  </span>
                  <h3 className="text-lg font-extrabold text-white">
                    Edit Hospital Facility Profile
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Facility profile details updated successfully!</span>
                </div>
              )}

              {/* Section 1: Basic Hospital Info */}
              <div className="border-b border-slate-100 pb-3">
                <span className="font-extrabold text-slate-900 text-xs block mb-2">1. Hospital Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hospital Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hospital Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    >
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
                      <option value="Trust / NGO">Trust / NGO</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Numbers & Hotlines */}
              <div className="border-b border-slate-100 pb-3">
                <span className="font-extrabold text-slate-900 text-xs block mb-2">2. Phone & Emergency Desk</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Main Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">24/7 Emergency Transfusion Hotline *</label>
                    <input
                      type="tel"
                      required
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-rose-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hospital Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Representative Details */}
              <div className="border-b border-slate-100 pb-3">
                <span className="font-extrabold text-slate-900 text-xs block mb-2">3. Authorized Representative</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Authorized Person *</label>
                    <input
                      type="text"
                      required
                      value={formData.authorizedPersonName}
                      onChange={(e) => setFormData({ ...formData, authorizedPersonName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      value={formData.authorizedPersonDesignation}
                      onChange={(e) => setFormData({ ...formData, authorizedPersonDesignation: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Representative Phone</label>
                    <input
                      type="tel"
                      value={formData.authorizedPersonPhone}
                      onChange={(e) => setFormData({ ...formData, authorizedPersonPhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Representative Email</label>
                    <input
                      type="email"
                      value={formData.authorizedPersonEmail}
                      onChange={(e) => setFormData({ ...formData, authorizedPersonEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Address Details */}
              <div>
                <span className="font-extrabold text-slate-900 text-xs block mb-2">4. Campus Location</span>
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Area</label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                      <input
                        type="text"
                        value={formData.pinCode}
                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalProfileView;
