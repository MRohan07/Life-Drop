import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { DonorRankBadge } from '../common/DonorRankBadge';
import { EligibilityCard } from './EligibilityCard';
import { ProfileFeedbackSection } from '../common/ProfileFeedbackSection';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Award,
  ChevronRight,
} from 'lucide-react';
import { formatPhone, formatDate } from '../../utils/formatters';

interface UserProfileViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onNavigateTab }) => {
  const { currentUser, updateUserProfile } = useLifeDrop();

  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    city: currentUser.city,
    location: currentUser.location,
    dob: currentUser.dob,
  });

  // OTP State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [pendingFieldChanges, setPendingFieldChanges] = useState<Partial<typeof formData> | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isSensitiveChanged =
      formData.phone !== currentUser.phone || formData.email !== currentUser.email;

    if (isSensitiveChanged) {
      setPendingFieldChanges(formData);
      setOtpModalOpen(true);
      setOtpSent(true);
      setEnteredOtp('');
    } else {
      updateUserProfile(formData);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 4000);
    }
  };

  const handleOtpVerify = () => {
    if (enteredOtp === '1234' || enteredOtp.length === 4) {
      if (pendingFieldChanges) {
        updateUserProfile(pendingFieldChanges);
      }
      setOtpModalOpen(false);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 4000);
    } else {
      alert('Invalid OTP. Use test code 1234.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-lifedrop-navy flex items-center gap-2.5">
          <User className="w-7 h-7 text-lifedrop-primary" />
          Donor Profile & Verification
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details. Medical records and donation statistics are verified and locked by LifeDrop protocol.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile details updated successfully.</span>
        </div>
      )}

      {/* Grid: Profile Form + System Protected Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Editable Profile Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-lifedrop-navy">
              Personal Information
            </h3>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
              ID: {currentUser.id}
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> OTP Protected
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> OTP Protected
                  </span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Local Area / District</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-lifedrop-navy hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right: System-Controlled Locked Records */}
        <div className="lg:col-span-5 space-y-6">
          {/* Locked System Fields Notice */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Lock className="w-4 h-4 text-slate-400" />
              System-Controlled Medical Credentials
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              The following fields are strictly controlled by hospital-confirmed donation records and cannot be edited manually.
            </p>

            <div className="space-y-2.5 pt-2 border-t border-slate-200/80 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Blood Group:</span>
                <span className="font-extrabold text-lifedrop-primary text-sm">
                  {currentUser.bloodGroup} (Verified)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Confirmed Donations:</span>
                <span className="font-extrabold text-lifedrop-navy text-sm">
                  {currentUser.totalDonations} Lives Saved
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Donor Rank:</span>
                <span className="font-extrabold text-amber-700 text-sm">
                  {currentUser.rank} Tier
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Last Confirmed Donation:</span>
                <span className="font-bold text-slate-700">
                  {currentUser.lastDonationDate ? formatDate(currentUser.lastDonationDate) : 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">90-Day Next Eligibility:</span>
                <span className="font-bold text-emerald-700">
                  {formatDate(currentUser.nextEligibleDate)}
                </span>
              </div>
            </div>
          </div>

          <DonorRankBadge
            rank={currentUser.rank}
            donationsCount={currentUser.totalDonations}
            showProgress={true}
          />

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('user-transactions')}
              className="w-full p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-extrabold text-xs flex items-center justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-600" />
                <div className="text-left">
                  <div className="font-extrabold">Official Donation Certificates</div>
                  <div className="text-[11px] text-amber-800 font-normal">
                    View verified records &amp; life-saving ledger
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Donor Feedback & Community Reviews Ledger */}
      <ProfileFeedbackSection
        role="USER"
        targetId={currentUser.id}
        targetName={currentUser.name}
        targetBloodGroup={currentUser.bloodGroup}
      />

      {/* OTP Verification Modal for Sensitive Changes */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-lifedrop-navy">
              Security OTP Verification
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              A 4-digit verification code was simulated to your phone (
              <strong className="text-slate-800">{formData.phone}</strong>) to confirm this sensitive change.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 text-[11px] font-mono text-slate-600 border border-slate-200">
              Verification Code: <strong className="text-lifedrop-primary">1234</strong>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Enter 4-Digit OTP:</label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-center text-lg tracking-widest font-mono font-bold bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setOtpModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleOtpVerify}
                className="px-5 py-2.5 rounded-xl bg-lifedrop-primary hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Verify & Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
