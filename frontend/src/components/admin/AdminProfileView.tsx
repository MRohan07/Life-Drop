/* @module: AdminProfileView — Minimalist administrator profile, details management & credential security */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  ShieldCheck,
  User,
  Star,
  ArrowRight,
  Mail,
  Phone,
  Building2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Smartphone,
  Shield,
  Clock,
  Laptop,
} from 'lucide-react';

interface AdminProfileViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({ onNavigateTab }) => {
  const { currentAdmin, updateAdminProfile, changeAdminPassword, toggleAdmin2FA } = useLifeDrop();

  // Profile Details Edit State
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const [detailsForm, setDetailsForm] = useState({
    name: currentAdmin.name,
    email: currentAdmin.email,
    phone: currentAdmin.phone,
    department: currentAdmin.department,
    designation: currentAdmin.designation,
  });
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Handle Save Details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);

    if (!detailsForm.name.trim()) {
      setDetailsError('Full Name is required.');
      return;
    }
    if (!detailsForm.email.trim() || !detailsForm.email.includes('@')) {
      setDetailsError('A valid official email is required.');
      return;
    }
    if (!detailsForm.phone.trim()) {
      setDetailsError('Contact phone is required.');
      return;
    }

    const res = updateAdminProfile({
      name: detailsForm.name.trim(),
      email: detailsForm.email.trim(),
      phone: detailsForm.phone.trim(),
      department: detailsForm.department.trim(),
      designation: detailsForm.designation.trim(),
    });

    if (res.success) {
      setDetailsSuccess('Admin profile details updated successfully.');
      setIsEditingDetails(false);
      setTimeout(() => setDetailsSuccess(null), 4000);
    }
  };

  const handleCancelEdit = () => {
    setDetailsForm({
      name: currentAdmin.name,
      email: currentAdmin.email,
      phone: currentAdmin.phone,
      department: currentAdmin.department,
      designation: currentAdmin.designation,
    });
    setDetailsError(null);
    setIsEditingDetails(false);
  };

  // Handle Password Change
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password cannot be identical to current password.');
      return;
    }

    const res = changeAdminPassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccess('Password updated successfully. Keep your credentials secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(null);
        setIsPasswordModalOpen(false);
      }, 2000);
    } else {
      setPasswordError(res.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Banner / Executive Profile Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Super Admin Avatar with Purple Glow */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 border-2 border-white ring-4 ring-purple-100 shrink-0">
              <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentAdmin.name}
                </h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                  Super Administrator
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active & Verified
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {currentAdmin.designation} • {currentAdmin.department}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                  ID: {currentAdmin.id}
                </span>
                <span>•</span>
                <span>Badge: {currentAdmin.employeeId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {!isEditingDetails ? (
              <button
                type="button"
                id="admin-edit-profile-btn"
                onClick={() => setIsEditingDetails(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Edit Details</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>
        </div>

        {detailsSuccess && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{detailsSuccess}</span>
          </div>
        )}
      </div>

      {/* 2. Core Profile Details & Security Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admin Details (2 Cols wide) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Administrator Credentials & Details
                </h3>
                <p className="text-xs text-slate-400">
                  Official identification required for state clinical audits and operations.
                </p>
              </div>
            </div>
          </div>

          {detailsError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{detailsError}</span>
            </div>
          )}

          {isEditingDetails ? (
            /* Edit Form */
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    value={detailsForm.name}
                    onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Official Email *</label>
                  <input
                    type="email"
                    value={detailsForm.email}
                    onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="name@lifedrop.io"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Contact Phone *</label>
                  <input
                    type="text"
                    value={detailsForm.phone}
                    onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={detailsForm.designation}
                    onChange={(e) => setDetailsForm({ ...detailsForm, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="Director of Operations"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Department / Council</label>
                  <input
                    type="text"
                    value={detailsForm.department}
                    onChange={(e) => setDetailsForm({ ...detailsForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    placeholder="State Blood Transfusion Council (SBTC), AP"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            /* Minimal Read-Only Display */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>Full Legal Name</span>
                </div>
                <div className="text-sm font-black text-slate-800">{currentAdmin.name}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Official Email</span>
                </div>
                <div className="text-sm font-bold text-slate-800 break-all">{currentAdmin.email}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Emergency Phone</span>
                </div>
                <div className="text-sm font-bold text-slate-800">{currentAdmin.phone}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Department</span>
                </div>
                <div className="text-sm font-bold text-slate-800 truncate" title={currentAdmin.department}>
                  {currentAdmin.department}
                </div>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Authority & Designation
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    {currentAdmin.designation}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold">
                    Emp ID: {currentAdmin.employeeId}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Security & Authentication Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-lifedrop-primary flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Security & Access
              </h3>
              <p className="text-xs text-slate-400">
                Credential authentication and two-factor safety.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Password Item */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-extrabold text-slate-800">Admin Password</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Changed: {currentAdmin.lastPasswordChange}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Regularly changing your root administrative password protects platform records and patient telemetry.
              </p>

              <button
                type="button"
                id="admin-change-password-btn"
                onClick={() => {
                  setIsPasswordModalOpen(true);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 text-slate-700 text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>

            {/* 2FA Security Control */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-slate-800">Two-Factor Auth (2FA)</span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    currentAdmin.twoFactorEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {currentAdmin.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Mandatory multi-factor authentication requires SMS code or Authenticator token for clinical approvals.
              </p>

              <button
                type="button"
                onClick={toggleAdmin2FA}
                className={`w-full py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentAdmin.twoFactorEnabled
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs'
                }`}
              >
                {currentAdmin.twoFactorEnabled ? '2FA Active (Click to Toggle)' : 'Enable 2FA Protection'}
              </button>
            </div>

            {/* Session Parameters */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Current Session Info</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-[11px] flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-400" /> Guntur, AP
                </span>
                <span className="text-[11px] font-mono text-emerald-600 font-bold">Encrypted TLS 1.3</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Last login: {currentAdmin.lastLogin}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Platform Reviews & Feedback Oversight Card */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-purple-100/30 rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <Star className="w-6 h-6 fill-purple-600/30 text-purple-700" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-lifedrop-navy flex items-center gap-2">
              <span>Platform Reviews &amp; Feedback Console</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Oversight
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators moderate and inspect reviews across Donors, Hospitals, and Blood Banks, and publish official issue resolutions.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('admin-reviews')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all self-start sm:self-auto cursor-pointer active:scale-95"
          >
            <span>Open Reviews &amp; Feedback</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. Change Password Modal */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPasswordModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative text-slate-800 space-y-5 animate-scaleUp">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 pr-6">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update root security credentials for Dr. Rajesh Varma
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700">
                    New Password *
                  </label>
                  <span className="text-[11px] text-slate-400">Min 6 characters</span>
                </div>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-purple-600 bg-slate-50 focus:bg-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <div className="text-[11px] font-medium pt-0.5">
                    {confirmPassword === newPassword ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500 font-bold">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfileView;
