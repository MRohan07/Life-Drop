/* @module: AdminDashboard — Platform administration, facility accreditation & clinical oversight console */
import React, { useState, useEffect } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShieldCheck,
  Building2,
  Warehouse,
  Users,
  User,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Clock,
  Eye,
  Search,
  ExternalLink,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Globe,
  Award,
  Droplet,
  Layers,
  Check,
  RotateCcw,
  ArrowRight,
  Filter,
  UserCheck,
  Star,
  MessageSquare,
  Heart,
  Trash2,
} from 'lucide-react';
import { formatDateTime, formatDate, formatPhone } from '../../utils/formatters';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { maskPhoneNumber, sanitizeUrl } from '../../utils/security';
import { BloodGroup, Hospital, BloodBank } from '../../types';

import { AdminReviewsManagement } from './AdminReviewsManagement';
import { FacilityApplicationsManagement } from './FacilityApplicationsManagement';

interface AdminDashboardProps {
  onNavigateTab: (tabId: string) => void;
  subTab?: 'overview' | 'hospitals' | 'bloodbanks' | 'users' | 'requests' | 'reports' | 'audit' | 'reviews' | 'applications';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  subTab = 'overview',
}) => {
  const {
    users,
    hospitals,
    bloodBanks,
    requests,
    reports,
    auditLogs,
    feedbacks,
    openFeedbackModal,
    adminApproveHospital,
    adminRejectHospital,
    adminApproveBloodBank,
    adminRejectBloodBank,
    adminUpdateUserStatus,
    adminResolveReport,
    deleteBloodRequest,
    facilityApplications = [],
    fetchFacilityApplications,
  } = useLifeDrop();

  const [deleteReqConfirmId, setDeleteReqConfirmId] = useState<string | null>(null);
  const [isDeletingReq, setIsDeletingReq] = useState(false);

  // Active view driven directly by parent subTab prop (single source of truth)
  const activeTab = subTab;

  useEffect(() => {
    fetchFacilityApplications?.();
  }, [activeTab]);

  // Search & Filter state for sections
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalStatusFilter, setHospitalStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');

  const [bloodBankSearch, setBloodBankSearch] = useState('');
  const [bloodBankStatusFilter, setBloodBankStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userBloodGroupFilter, setUserBloodGroupFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'WARNED' | 'SUSPENDED'>('ALL');

  const [requestUrgencyFilter, setRequestUrgencyFilter] = useState<string>('ALL');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('ALL');

  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [auditFilter, setAuditFilter] = useState('');

  // Privacy phone reveals set
  const [revealedPhoneIds, setRevealedPhoneIds] = useState<Set<string>>(new Set());

  // Second Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary' | 'success';
    impactDetails?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const toggleRevealPhone = (id: string) => {
    setRevealedPhoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Facility Confirmation Handlers ---

  const handleApproveHospitalWithConfirm = (hosp: Hospital) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Hospital Accreditation',
      message: `Approve and verify medical facility "${hosp.name}" (License: ${hosp.licenseNumber})?`,
      impactDetails: 'This hospital will be publicly listed as verified and authorized to initiate emergency blood requests.',
      confirmText: 'Approve & Publish',
      variant: 'success',
      onConfirm: () => adminApproveHospital(hosp.id),
    });
  };

  const handleRejectHospitalWithConfirm = (hosp: Hospital) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Hospital Verification',
      message: `Are you sure you want to reject verification for "${hosp.name}" (${hosp.id})?`,
      impactDetails: 'This facility will be marked as rejected and hidden from the public directory.',
      confirmText: 'Reject Facility',
      variant: 'danger',
      onConfirm: () => adminRejectHospital(hosp.id),
    });
  };

  const handleRevokeHospitalWithConfirm = (hosp: Hospital) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Hospital Verification',
      message: `Revoke verified status for "${hosp.name}" (${hosp.id})?`,
      impactDetails: 'Active verification will be suspended and this hospital will be moved to rejected status pending compliance review.',
      confirmText: 'Revoke Verification',
      variant: 'danger',
      onConfirm: () => adminRejectHospital(hosp.id),
    });
  };

  const handleApproveBloodBankWithConfirm = (bb: BloodBank) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Blood Bank Certification',
      message: `Approve and activate regional blood bank "${bb.name}" (License: ${bb.licenseNumber})?`,
      impactDetails: 'This blood bank will be published in the public registry and eligible to fulfill hospital requisitions.',
      confirmText: 'Approve & Activate',
      variant: 'success',
      onConfirm: () => adminApproveBloodBank(bb.id),
    });
  };

  const handleRejectBloodBankWithConfirm = (bb: BloodBank) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Blood Bank Certification',
      message: `Reject certification for "${bb.name}" (${bb.id})?`,
      impactDetails: 'This facility will be marked as rejected and cannot receive emergency blood requisitions.',
      confirmText: 'Reject Facility',
      variant: 'danger',
      onConfirm: () => adminRejectBloodBank(bb.id),
    });
  };

  const handleRevokeBloodBankWithConfirm = (bb: BloodBank) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Blood Bank Certification',
      message: `Revoke active certification for "${bb.name}" (${bb.id})?`,
      impactDetails: 'This blood bank will be suspended from the regional supply network pending audit.',
      confirmText: 'Revoke Certification',
      variant: 'danger',
      onConfirm: () => adminRejectBloodBank(bb.id),
    });
  };

  const handleWarnUserWithConfirm = (user: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Issue Disciplinary Warning',
      message: `Issue an official warning caution to donor "${user.name}" (${user.id})?`,
      impactDetails: 'A disciplinary record will be attached to this donor account.',
      confirmText: 'Issue Warning',
      variant: 'warning',
      onConfirm: () => adminUpdateUserStatus(user.id, 'WARNED'),
    });
  };

  const handleToggleSuspendUserWithConfirm = (user: any) => {
    const isSuspending = user.status !== 'SUSPENDED';
    setConfirmModal({
      isOpen: true,
      title: isSuspending ? 'Suspend Donor Account' : 'Reactivate Donor Account',
      message: isSuspending
        ? `Are you sure you want to suspend account access for "${user.name}" (${user.id})?`
        : `Reactivate platform access for "${user.name}" (${user.id})?`,
      impactDetails: isSuspending
        ? 'The user will be blocked from responding to emergency requests or participating in blood drives.'
        : 'The user will regain standard active access to LifeDrop.',
      confirmText: isSuspending ? 'Suspend Account' : 'Reactivate Account',
      variant: isSuspending ? 'danger' : 'success',
      onConfirm: () => adminUpdateUserStatus(user.id, isSuspending ? 'SUSPENDED' : 'ACTIVE'),
    });
  };

  const handleResolveReportWithConfirm = (
    repId: string,
    action: 'DISMISSED' | 'WARNED' | 'SUSPENDED',
    userName: string
  ) => {
    const actionLabel =
      action === 'DISMISSED' ? 'Dismiss Report' : action === 'WARNED' ? 'Issue Warning' : 'Suspend User';
    setConfirmModal({
      isOpen: true,
      title: `Resolve Incident Report #${repId}`,
      message: `Confirm resolution for report against ${userName} with action "${actionLabel}"?`,
      impactDetails:
        action === 'SUSPENDED'
          ? 'The reported user will be suspended immediately and the case will be closed.'
          : action === 'WARNED'
          ? 'A formal disciplinary caution will be logged on the user profile.'
          : 'The report will be dismissed with no penalty to the donor.',
      confirmText: actionLabel,
      variant: action === 'SUSPENDED' ? 'danger' : action === 'WARNED' ? 'warning' : 'primary',
      onConfirm: () => adminResolveReport(repId, action),
    });
  };

  // --- Statistics Calculation ---
  const pendingHospitals = hospitals.filter((h) => !h.isVerified);
  const verifiedHospitals = hospitals.filter((h) => h.isVerified);
  const rejectedHospitals = hospitals.filter((h) => h.status === 'REJECTED');

  const pendingBloodBanks = bloodBanks.filter((b) => !b.isVerified);
  const verifiedBloodBanks = bloodBanks.filter((b) => b.isVerified);
  const rejectedBloodBanks = bloodBanks.filter((b) => b.status === 'REJECTED');

  const pendingHospitalApplications = (facilityApplications || []).filter(
    (app) => app.facilityType === 'HOSPITAL' && (app.status === 'PENDING' || app.status === 'UNDER_REVIEW')
  );
  const pendingBloodBankApplications = (facilityApplications || []).filter(
    (app) => app.facilityType === 'BLOOD_BANK' && (app.status === 'PENDING' || app.status === 'UNDER_REVIEW')
  );
  const totalPendingFacilityApps = pendingHospitalApplications.length + pendingBloodBankApplications.length;

  const activeRequests = requests.filter((r) => r.status === 'SEARCHING' || r.status === 'PARTIALLY_FULFILLED');
  const fulfilledRequests = requests.filter((r) => r.status === 'FULFILLED');
  const totalDonations = users.reduce((sum, u) => sum + u.totalDonations, 0);
  const openReports = reports.filter((r) => r.status === 'PENDING');
  const avgFeedbackRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : '5.0';

  // --- Filtered Datasets ---
  const filteredHospitals = hospitals.filter((hosp) => {
    const matchesSearch =
      !hospitalSearch ||
      hosp.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      hosp.city.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      hosp.licenseNumber.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      (hosp.registrationNumber && hosp.registrationNumber.toLowerCase().includes(hospitalSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (hospitalStatusFilter === 'PENDING') return !hosp.isVerified && hosp.status !== 'REJECTED';
    if (hospitalStatusFilter === 'VERIFIED') return hosp.isVerified;
    if (hospitalStatusFilter === 'REJECTED') return hosp.status === 'REJECTED';
    return true;
  });

  const filteredBloodBanks = bloodBanks.filter((bb) => {
    const matchesSearch =
      !bloodBankSearch ||
      bb.name.toLowerCase().includes(bloodBankSearch.toLowerCase()) ||
      bb.city.toLowerCase().includes(bloodBankSearch.toLowerCase()) ||
      bb.licenseNumber.toLowerCase().includes(bloodBankSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (bloodBankStatusFilter === 'PENDING') return !bb.isVerified && bb.status !== 'REJECTED';
    if (bloodBankStatusFilter === 'VERIFIED') return bb.isVerified;
    if (bloodBankStatusFilter === 'REJECTED') return bb.status === 'REJECTED';
    return true;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.city.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch);

    const matchesGroup = userBloodGroupFilter === 'ALL' || u.bloodGroup === userBloodGroupFilter;
    const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const filteredRequests = requests.filter((req) => {
    const matchesUrgency = requestUrgencyFilter === 'ALL' || req.emergencyLevel === requestUrgencyFilter;
    const matchesStatus = requestStatusFilter === 'ALL' || req.status === requestStatusFilter;
    return matchesUrgency && matchesStatus;
  });

  const filteredReports = reports.filter((rep) => {
    if (reportStatusFilter === 'PENDING') return rep.status === 'PENDING';
    if (reportStatusFilter === 'RESOLVED') return rep.status !== 'PENDING';
    return true;
  });

  const filteredAuditLogs = auditLogs.filter(
    (log) =>
      !auditFilter ||
      log.eventType.toLowerCase().includes(auditFilter.toLowerCase()) ||
      log.description.toLowerCase().includes(auditFilter.toLowerCase()) ||
      log.actor.toLowerCase().includes(auditFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* ============================================================ */}
      {/* 1. OVERVIEW DASHBOARD                                         */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lifedrop-navy via-slate-900 to-purple-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Platform Administration &amp; Facility Oversight
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Administrator Operations Console
                </h2>
                <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Supervise accredited hospitals, certified regional blood banks, real-time blood allocations, and community donor safety.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="admin-banner-applications-btn"
                  onClick={() => onNavigateTab('admin-applications')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Facility Applications</span>
                  {totalPendingFacilityApps > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black animate-pulse">
                      {totalPendingFacilityApps}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  id="admin-banner-profile-btn"
                  onClick={() => onNavigateTab('admin-profile')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <User className="w-3.5 h-3.5 text-purple-300" />
                  <span>Admin Profile</span>
                </button>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Clinical Network: <strong>Active &amp; Logged</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Pending Facility Applications Alert Banner */}
          {totalPendingFacilityApps > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <span>{totalPendingFacilityApps} Institutional Application{totalPendingFacilityApps > 1 ? 's' : ''} Awaiting Review</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black uppercase">Action Needed</span>
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {pendingHospitalApplications.length > 0 && `${pendingHospitalApplications.length} Hospital(s)`}
                    {pendingHospitalApplications.length > 0 && pendingBloodBankApplications.length > 0 && ' and '}
                    {pendingBloodBankApplications.length > 0 && `${pendingBloodBankApplications.length} Blood Bank(s)`}
                    {' '}submitted accreditation documents for government statutory verification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('admin-applications')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Open Review Queue ({totalPendingFacilityApps})
              </button>
            </div>
          )}

          {/* Interactive Metric Cards Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <button
              onClick={() => onNavigateTab('admin-applications')}
              className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-all text-left group ${
                totalPendingFacilityApps > 0
                  ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-amber-50/70 border-amber-200/90'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-700">
                <span>Applications</span>
                {totalPendingFacilityApps > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                ) : (
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                )}
              </div>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {totalPendingFacilityApps > 0 ? `${totalPendingFacilityApps} Pending` : 'Accredit'}
              </div>
              <div className="text-[10px] text-amber-700 font-bold mt-1">
                {totalPendingFacilityApps > 0
                  ? `${pendingHospitalApplications.length} Hosp • ${pendingBloodBankApplications.length} Blood Bank`
                  : 'Hospital & Blood Bank'}
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('admin-users')}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-lifedrop-primary hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Total Donors</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-lifedrop-primary" />
              </div>
              <div className="text-2xl font-black text-lifedrop-navy mt-1">{users.length}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">
                {users.filter((u) => u.isEligible).length} Eligible Now
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('admin-hospitals')}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Hospitals</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-700 mt-1">{hospitals.length}</div>
              <div className="text-[10px] text-amber-600 font-bold mt-1">
                {pendingHospitalApplications.length > 0
                  ? `${pendingHospitalApplications.length} Pending Review`
                  : `${pendingHospitals.length} Pending Approval`}
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('admin-bloodbanks')}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Blood Banks</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">{bloodBanks.length}</div>
              <div className="text-[10px] text-amber-600 font-bold mt-1">
                {pendingBloodBankApplications.length > 0
                  ? `${pendingBloodBankApplications.length} Pending Review`
                  : `${pendingBloodBanks.length} Pending Approval`}
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('admin-requests')}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-lifedrop-primary hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Active Requests</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-lifedrop-primary" />
              </div>
              <div className="text-2xl font-black text-lifedrop-primary mt-1">
                {activeRequests.length}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold mt-1">
                {fulfilledRequests.length} Fulfilled
              </div>
            </button>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Donations</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{totalDonations}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">Confirmed Units</div>
            </div>

            <button
              onClick={() => onNavigateTab('admin-reports')}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Open Reports</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">{openReports.length}</div>
              <div className="text-[10px] text-rose-500 font-bold mt-1">Require Review</div>
            </button>

            <button
              onClick={() => onNavigateTab('admin-reviews')}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-purple-500 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Platform Feedback</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600" />
              </div>
              <div className="text-2xl font-black text-amber-500 flex items-center gap-1 mt-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{avgFeedbackRating}</span>
              </div>
              <div className="text-[10px] text-purple-600 font-bold mt-1">
                {feedbacks.length} Reviews • Moderate →
              </div>
            </button>
          </div>

          {/* Pending Action Alerts */}
          {(pendingHospitals.length > 0 || pendingBloodBanks.length > 0 || openReports.length > 0) && (
            <div className="p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-200 text-amber-950 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Action Required: Pending Facility Verifications &amp; Incident Reports
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                You have <strong>{pendingHospitals.length} hospital(s)</strong>, <strong>{pendingBloodBanks.length} blood bank(s)</strong> awaiting statutory review, and <strong>{openReports.length} safety report(s)</strong> awaiting investigation. Unverified facilities are withheld from public search.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {pendingHospitals.length > 0 && (
                  <button
                    onClick={() => onNavigateTab('admin-hospitals')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Review Hospitals ({pendingHospitals.length})
                  </button>
                )}
                {pendingBloodBanks.length > 0 && (
                  <button
                    onClick={() => onNavigateTab('admin-bloodbanks')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Warehouse className="w-3.5 h-3.5" />
                    Review Blood Banks ({pendingBloodBanks.length})
                  </button>
                )}
                {openReports.length > 0 && (
                  <button
                    onClick={() => onNavigateTab('admin-reports')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Investigate Reports ({openReports.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Blood Coordination Requests Overview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-lifedrop-navy">
                  Recent Blood Coordination Requests
                </h3>
                <p className="text-xs text-slate-500">Live requisitions monitored across hospitals</p>
              </div>
              <button
                onClick={() => onNavigateTab('admin-requests')}
                className="text-xs font-bold text-lifedrop-primary hover:underline flex items-center gap-1"
              >
                View Full Tracking <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {requests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-100/70 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">#{req.id}</span>
                      <StatusBadge type="emergency" value={req.emergencyLevel} size="sm" />
                      <StatusBadge type="request" value={req.status} size="sm" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 mt-1">
                      {req.hospitalName} • Patient: {req.patientName}
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Required: {req.requiredUnits} units ({req.bloodGroup}) • Timeline: {formatDateTime(req.requiredDateTime)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-lifedrop-primary text-sm">
                      {req.confirmedUnits} / {req.requiredUnits} Units ({req.bloodGroup})
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Created: {req.createdAt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Feedback & Quality Oversight */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-lifedrop-navy">
                    Platform Feedback Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quality reviews submitted by voluntary donors, accredited hospitals, and blood banks.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Avg: {avgFeedbackRating} / 5.0</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('admin-reviews')}
                  className="text-xs px-3 py-1 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Reviews Console (3 Categories)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {feedbacks.slice(0, 5).map((fb) => (
                <div key={fb.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{fb.userName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fb.userRole === 'USER'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : fb.userRole === 'HOSPITAL'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {fb.userRole}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 italic">"{fb.comments}"</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 block">{fb.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. HOSPITAL FACILITIES MANAGEMENT                            */}
      {/* ============================================================ */}
      {activeTab === 'hospitals' && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2 border border-blue-200">
                <Building2 className="w-3.5 h-3.5" />
                Accredited Medical Facilities
              </div>
              <h2 className="text-2xl font-extrabold text-lifedrop-navy">
                Hospital Facilities Management
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify hospital registrations, inspect statutory medical establishment licenses, and manage clinical facility access.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold">
                {verifiedHospitals.length} Verified
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${
                (pendingHospitalApplications.length + pendingHospitals.length) > 0
                  ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {pendingHospitalApplications.length + pendingHospitals.length} Pending Approval
              </span>
            </div>
          </div>

          {/* Pending Hospital Accreditation Applications from PostgreSQL */}
          {pendingHospitalApplications.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-50/80 border-2 border-amber-300 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                      <span>Pending Hospital Accreditation Applications ({pendingHospitalApplications.length})</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black uppercase">
                        Awaiting Verification
                      </span>
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      These medical facilities have submitted formal registration applications awaiting government statutory review.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('admin-applications')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <span>Open Full Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingHospitalApplications.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3 hover:border-amber-400 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">{app.name}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono font-bold text-amber-700 mt-0.5">{app.referenceNumber}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">City / State</span>
                        <span className="font-bold text-slate-800">{app.city}, {app.state || 'AP'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Statutory License</span>
                        <span className="font-bold font-mono text-slate-800">{app.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Medical Representative</span>
                        <span className="font-bold text-slate-800">{app.authorizedPersonName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Contact Phone</span>
                        <span className="font-bold text-slate-800">{app.phone}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                        {app.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('admin-applications')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Review &amp; Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search hospitals by name, city, license, or registration number..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: `All (${hospitals.length})` },
                  { id: 'PENDING', label: `Pending (${pendingHospitals.length + pendingHospitalApplications.length})` },
                  { id: 'VERIFIED', label: `Verified (${verifiedHospitals.length})` },
                  { id: 'REJECTED', label: `Rejected (${rejectedHospitals.length})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setHospitalStatusFilter(f.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    hospitalStatusFilter === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hospitals List */}
          {filteredHospitals.length === 0 ? (
            pendingHospitalApplications.length > 0 && hospitalStatusFilter === 'PENDING' ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm text-amber-950">
                        {pendingHospitalApplications.length} Pending Hospital Registration{pendingHospitalApplications.length > 1 ? 's' : ''} Awaiting Review
                      </span>
                      <p className="text-[11px] text-amber-800">
                        Medical facilities that submitted registration applications awaiting statutory accreditation.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-applications')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <span>Full Applications Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingHospitalApplications.map((app) => (
                    <div key={app.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3 hover:border-amber-400 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{app.name}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                              {app.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono font-bold text-amber-700 mt-0.5">{app.referenceNumber}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">City / State</span>
                          <span className="font-bold text-slate-800">{app.city}, {app.state || 'AP'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Statutory License</span>
                          <span className="font-bold font-mono text-slate-800">{app.licenseNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Medical Representative</span>
                          <span className="font-bold text-slate-800">{app.authorizedPersonName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Contact Phone</span>
                          <span className="font-bold text-slate-800">{app.phone}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                          {app.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab('admin-applications')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Review &amp; Approve</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">No hospitals match your search criteria.</p>
                <p className="text-[11px]">Try adjusting your search query or status filter.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filteredHospitals.map((hosp) => {
                const linkedRequests = requests.filter((r) => r.hospitalId === hosp.id);
                const activeLinkedRequests = linkedRequests.filter((r) => r.status === 'SEARCHING' || r.status === 'PARTIALLY_FULFILLED');

                return (
                  <div
                    key={hosp.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-5"
                  >
                    {/* Facility Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <img
                          src={hosp.image}
                          alt={hosp.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              type="verification"
                              value={hosp.isVerified ? 'VERIFIED' : hosp.status === 'REJECTED' ? 'REJECTED' : 'PENDING'}
                            />
                            {hosp.type && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {hosp.type}
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              24/7 Emergency Care
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              ID: {hosp.id}
                            </span>
                          </div>

                          <h3 className="text-lg font-black text-lifedrop-navy mt-1">
                            {hosp.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              {hosp.address}, {hosp.city}
                            </span>
                            {hosp.website && (
                              <a
                                href={sanitizeUrl(hosp.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                {hosp.website.replace(/^https?:\/\//, '')}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                        <a
                          href={`tel:${hosp.emergencyContact || hosp.phone}`}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          Call Facility
                        </a>

                        {hosp.isVerified ? (
                          <button
                            onClick={() => handleRevokeHospitalWithConfirm(hosp)}
                            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                          >
                            Revoke Verification
                          </button>
                        ) : hosp.status === 'REJECTED' ? (
                          <button
                            onClick={() => handleApproveHospitalWithConfirm(hosp)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Re-Approve Facility
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectHospitalWithConfirm(hosp)}
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveHospitalWithConfirm(hosp)}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve &amp; Verify
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Facility Inspection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Award className="w-3 h-3 text-blue-600" />
                          Statutory License Accreditation
                        </div>
                        <div className="font-mono font-bold text-slate-800">
                          {hosp.licenseNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Authority: {hosp.issuingAuthority || 'State Medical Council'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-600" />
                          Facility Administration
                        </div>
                        <div className="font-bold text-slate-800">
                          {hosp.authorizedPersonName || 'Medical Superintendent'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {hosp.authorizedPersonDesignation || 'Chief Medical Officer'} • {formatPhone(hosp.phone)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-lifedrop-primary" />
                          Coordination Activity
                        </div>
                        <div className="font-extrabold text-slate-800">
                          {activeLinkedRequests.length} Active Blood Request(s)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {linkedRequests.length} Total Emergency Cases Logged
                        </div>
                      </div>
                    </div>

                    {/* Clinical Services Offered */}
                    {hosp.services && hosp.services.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Services:
                        </span>
                        {hosp.services.map((srv, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. BLOOD BANK FACILITIES MANAGEMENT                          */}
      {/* ============================================================ */}
      {activeTab === 'bloodbanks' && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-2 border border-amber-200">
                <Warehouse className="w-3.5 h-3.5" />
                Regional Blood Banks &amp; Centers
              </div>
              <h2 className="text-2xl font-extrabold text-lifedrop-navy">
                Blood Bank Facilities Management
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Oversee certified blood banks, inspect Form 28C drug licenses, cold chain compliance, and live 8-group stock availability.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold">
                {verifiedBloodBanks.length} Certified
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${
                (pendingBloodBankApplications.length + pendingBloodBanks.length) > 0
                  ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {pendingBloodBankApplications.length + pendingBloodBanks.length} Pending Review
              </span>
            </div>
          </div>

          {/* Pending Blood Bank Certification Applications from PostgreSQL */}
          {pendingBloodBankApplications.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-50/80 border-2 border-amber-300 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold shrink-0">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                      <span>Pending Blood Bank Certification Applications ({pendingBloodBankApplications.length})</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black uppercase">
                        Awaiting Inspection
                      </span>
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      These regional blood centers have submitted statutory Form 28C licensing applications awaiting administrative approval.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('admin-applications')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <span>Open Full Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingBloodBankApplications.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3 hover:border-amber-400 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">{app.name}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono font-bold text-amber-700 mt-0.5">{app.referenceNumber}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">City / State</span>
                        <span className="font-bold text-slate-800">{app.city}, {app.state || 'AP'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Drug License (28C)</span>
                        <span className="font-bold font-mono text-slate-800">{app.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Authorized Officer</span>
                        <span className="font-bold text-slate-800">{app.authorizedPersonName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Dispatch Phone</span>
                        <span className="font-bold text-slate-800">{app.phone}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                        {app.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('admin-applications')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Review &amp; Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search blood banks by name, city, or Form 28C license number..."
                value={bloodBankSearch}
                onChange={(e) => setBloodBankSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: `All (${bloodBanks.length})` },
                  { id: 'PENDING', label: `Pending (${pendingBloodBanks.length + pendingBloodBankApplications.length})` },
                  { id: 'VERIFIED', label: `Verified (${verifiedBloodBanks.length})` },
                  { id: 'REJECTED', label: `Rejected (${rejectedBloodBanks.length})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setBloodBankStatusFilter(f.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    bloodBankStatusFilter === f.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blood Banks List */}
          {filteredBloodBanks.length === 0 ? (
            pendingBloodBankApplications.length > 0 && bloodBankStatusFilter === 'PENDING' ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm text-amber-950">
                        {pendingBloodBankApplications.length} Pending Blood Bank Registration{pendingBloodBankApplications.length > 1 ? 's' : ''} Awaiting Review
                      </span>
                      <p className="text-[11px] text-amber-800">
                        Regional blood banks that submitted licensing applications awaiting statutory certification.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-applications')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <span>Full Applications Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingBloodBankApplications.map((app) => (
                    <div key={app.id} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3 hover:border-amber-400 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{app.name}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                              {app.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono font-bold text-amber-700 mt-0.5">{app.referenceNumber}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">City / State</span>
                          <span className="font-bold text-slate-800">{app.city}, {app.state || 'AP'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Drug License (28C)</span>
                          <span className="font-bold font-mono text-slate-800">{app.licenseNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Authorized Officer</span>
                          <span className="font-bold text-slate-800">{app.authorizedPersonName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">Contact Phone</span>
                          <span className="font-bold text-slate-800">{app.phone}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                          {app.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab('admin-applications')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Review &amp; Approve</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
                <Warehouse className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">No blood banks match your search criteria.</p>
                <p className="text-[11px]">Try adjusting your search query or status filter.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filteredBloodBanks.map((bb) => {
                // Calculate total available units across 8 groups
                const totalStock = bb.inventory
                  ? Object.values(bb.inventory).reduce((acc, curr) => acc + (curr.available || 0), 0)
                  : 0;
                const totalReserved = bb.inventory
                  ? Object.values(bb.inventory).reduce((acc, curr) => acc + (curr.reserved || 0), 0)
                  : 0;

                return (
                  <div
                    key={bb.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-5"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <img
                          src={bb.image}
                          alt={bb.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              type="verification"
                              value={bb.isVerified ? 'VERIFIED' : bb.status === 'REJECTED' ? 'REJECTED' : 'PENDING'}
                            />
                            {bb.type && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {bb.type}
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Cold Chain Verified
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              ID: {bb.id}
                            </span>
                          </div>

                          <h3 className="text-lg font-black text-lifedrop-navy mt-1">
                            {bb.name}
                          </h3>

                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {bb.address}, {bb.city} • Contact: {formatPhone(bb.phone)}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                        <a
                          href={`tel:${bb.phone}`}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          Call Desk
                        </a>

                        {bb.isVerified ? (
                          <button
                            onClick={() => handleRevokeBloodBankWithConfirm(bb)}
                            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                          >
                            Revoke Certification
                          </button>
                        ) : bb.status === 'REJECTED' ? (
                          <button
                            onClick={() => handleApproveBloodBankWithConfirm(bb)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Re-Certify Facility
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectBloodBankWithConfirm(bb)}
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveBloodBankWithConfirm(bb)}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve &amp; Activate
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Facility details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-600" />
                          CDSCO / Form 28C License
                        </div>
                        <div className="font-mono font-bold text-slate-800">
                          {bb.licenseNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Regulatory Authority: {bb.issuingAuthority || 'Central Drugs Standard Control Org.'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-purple-600" />
                          Technical In-Charge
                        </div>
                        <div className="font-bold text-slate-800">
                          {bb.authorizedPersonName || 'Medical Officer (Transfusion Medicine)'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {bb.authorizedPersonDesignation || 'Head of Blood Transfusion Services'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-lifedrop-primary" />
                          Cold Chain Inventory Status
                        </div>
                        <div className="font-extrabold text-slate-900">
                          {totalStock} Available Units • {totalReserved} Reserved
                        </div>
                        <div className="text-[11px] text-slate-500">
                          All 8 ABO/Rh blood groups stored
                        </div>
                      </div>
                    </div>

                    {/* Live 8-Blood-Group Stock Summary */}
                    {bb.inventory && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Droplet className="w-3.5 h-3.5 text-lifedrop-primary" />
                            Live Blood Group Units in Cold Storage:
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">PRBC +4°C</span>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((grp) => {
                            const item = bb.inventory[grp];
                            const avail = item?.available || 0;
                            const isLow = avail < 3;
                            return (
                              <div
                                key={grp}
                                className={`p-2 rounded-xl border text-center transition-all ${
                                  isLow
                                    ? 'bg-rose-50/50 border-rose-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="font-black text-xs text-lifedrop-primary">{grp}</div>
                                <div className="text-sm font-extrabold text-slate-900 mt-0.5">{avail}</div>
                                <div className="text-[9px] text-slate-400">units</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. USERS & DONOR MANAGEMENT                                   */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2 border border-purple-200">
                <Users className="w-3.5 h-3.5" />
                Community Donor Registry
              </div>
              <h2 className="text-2xl font-extrabold text-lifedrop-navy">
                Donors &amp; User Accounts Directory
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Inspect registered voluntary donors, track eligibility cycles, privacy phone masking, and manage account discipline.
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
              {users.length} Registered Accounts
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Filter by donor name, ID, city, or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={userBloodGroupFilter}
                onChange={(e) => setUserBloodGroupFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
              >
                <option value="ALL">All Groups</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
              >
                <option value="ALL">All Account Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="WARNED">Warned</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Donor Details</th>
                    <th className="p-4">Blood Group</th>
                    <th className="p-4">City</th>
                    <th className="p-4">90-Day Safety</th>
                    <th className="p-4">Donations</th>
                    <th className="p-4">Badge Rank</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{user.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">ID: {user.id}</div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>{revealedPhoneIds.has(user.id) ? user.phone : maskPhoneNumber(user.phone)}</span>
                          <button
                            type="button"
                            onClick={() => toggleRevealPhone(user.id)}
                            className="text-[10px] text-blue-600 hover:underline font-bold"
                          >
                            {revealedPhoneIds.has(user.id) ? 'Hide' : 'Reveal'}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-black text-lifedrop-primary text-sm">{user.bloodGroup}</td>
                      <td className="p-4 font-semibold text-slate-600">{user.city}</td>
                      <td className="p-4">
                        <StatusBadge
                          type="eligibility"
                          value={user.isEligible ? 'true' : 'false'}
                          size="sm"
                        />
                      </td>
                      <td className="p-4 font-bold text-slate-900">{user.totalDonations} Lives Saved</td>
                      <td className="p-4 font-bold text-amber-700">{user.rank}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : user.status === 'WARNED'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleWarnUserWithConfirm(user)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors"
                        >
                          Warn
                        </button>
                        <button
                          onClick={() => handleToggleSuspendUserWithConfirm(user)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                            user.status === 'SUSPENDED'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                          }`}
                        >
                          {user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. LIVE BLOOD REQUESTS MONITORING                            */}
      {/* ============================================================ */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2 border border-rose-200">
                <Activity className="w-3.5 h-3.5" />
                Live Blood Coordination
              </div>
              <h2 className="text-2xl font-extrabold text-lifedrop-navy">
                Live Blood Requests &amp; Requisitions
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Track real-time emergency hospital requisitions, units fulfillment, and donor responses across the network.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-bold">
                {activeRequests.length} Active Seeking
              </span>
              <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                {fulfilledRequests.length} Fulfilled
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter By:
            </span>

            <select
              value={requestUrgencyFilter}
              onChange={(e) => setRequestUrgencyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
            >
              <option value="ALL">All Urgency Levels</option>
              <option value="CRITICAL">Critical Emergency</option>
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>

            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="SEARCHING">Searching</option>
              <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-500">
                      #{req.id.length > 12 ? req.id.slice(0, 8).toUpperCase() : req.id}
                    </span>
                    <StatusBadge type="emergency" value={req.emergencyLevel} size="sm" />
                    <StatusBadge type="request" value={req.status} size="sm" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base mt-1">
                    {req.hospitalName} • Patient: {req.patientName}
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    Required: {req.requiredUnits} Units ({req.bloodGroup}) • Remaining Needed: {req.remainingUnits}
                  </p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Venue: {req.hospitalAddress} • Emergency Hotline: {formatPhone(req.contactNumber)}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-black text-emerald-700 text-sm">
                      {req.confirmedUnits} Confirmed / {req.allocatedUnits} Allocated
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {req.donorContributions.length} Donors Accepted • {req.bloodBankContributions.length} Blood Banks Assigned
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteReqConfirmId(req.id)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold transition-all inline-flex items-center gap-1.5"
                    title="Delete Requisition as Admin"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. INCIDENT & SAFETY REPORTS                                 */}
      {/* ============================================================ */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2 border border-rose-200">
                <ShieldAlert className="w-3.5 h-3.5" />
                Facility Incident Investigations
              </div>
              <h2 className="text-2xl font-extrabold text-lifedrop-navy">
                Hospital Incident &amp; Misuse Reports
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review misconduct or no-show complaints reported by hospital medical desks against registered donor profiles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-bold">
                {openReports.length} Open Review
              </span>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            {(
              [
                { id: 'ALL', label: `All Reports (${reports.length})` },
                { id: 'PENDING', label: `Pending Review (${openReports.length})` },
                { id: 'RESOLVED', label: `Resolved (${reports.length - openReports.length})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setReportStatusFilter(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  reportStatusFilter === f.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-700">No reports found in this category.</p>
              <p className="text-[11px]">All reported cases have been successfully reviewed and resolved.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          {rep.reason}
                        </span>
                        <span className="font-mono text-slate-400">Case #{rep.id}</span>
                        <span
                          className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                            rep.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-base mt-2">
                        Reported Donor: <strong>{rep.reportedUserName}</strong> (ID: {rep.reportedUserId})
                      </h4>

                      <p className="text-slate-500 mt-0.5">
                        Filing Hospital: <strong>{rep.reporterHospitalName}</strong> • Linked Requisition: #{rep.requestId}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400">{rep.createdAt}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-800 leading-relaxed border border-slate-100">
                    <span className="font-bold text-slate-500 block mb-1">Hospital Note:</span>
                    "{rep.description}"
                  </div>

                  {rep.status === 'PENDING' && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleResolveReportWithConfirm(rep.id, 'DISMISSED', rep.reportedUserName)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                      >
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => handleResolveReportWithConfirm(rep.id, 'WARNED', rep.reportedUserName)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors"
                      >
                        Issue Warning
                      </button>
                      <button
                        onClick={() => handleResolveReportWithConfirm(rep.id, 'SUSPENDED', rep.reportedUserName)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors"
                      >
                        Suspend User
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. SYSTEM ACTIVITY AUDIT LOGS                                */}
      {/* ============================================================ */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold mb-2 border border-slate-200">
                <FileText className="w-3.5 h-3.5" />
                Administrative Records
              </div>
              <h2 className="text-2xl font-extrabold text-lifedrop-navy">
                System Activity &amp; Audit Trail
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verified, non-repudiable audit logs of facility approvals, account actions, and administrative operations.
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
              {auditLogs.length} Events Logged
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search audit trail by event type, description, or administrator..."
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Event Type</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Operational Description</th>
                    <th className="p-4">Target Facility / User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono font-bold text-[10px] text-slate-800 border border-slate-200">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                        {log.actor}
                      </td>
                      <td className="p-4 text-slate-700">{log.description}</td>
                      <td className="p-4 font-mono text-slate-400">{log.targetId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. REVIEWS & FEEDBACK MANAGEMENT (3 Categories & Replies)   */}
      {/* ============================================================ */}
      {activeTab === 'reviews' && (
        <AdminReviewsManagement onNavigateTab={onNavigateTab} />
      )}

      {/* ============================================================ */}
      {/* 9. FACILITY APPLICATIONS & STATUTORY ACCREDITATION          */}
      {/* ============================================================ */}
      {activeTab === 'applications' && (
        <FacilityApplicationsManagement onNavigateTab={onNavigateTab} />
      )}

      {/* ============================================================ */}
      {/* Universal Second Confirmation Modal (Item 8 Safety)          */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        impactDetails={confirmModal.impactDetails}
      />

      {/* Delete Blood Requisition Modal (Admin Override) */}
      <ConfirmationModal
        isOpen={!!deleteReqConfirmId}
        onClose={() => setDeleteReqConfirmId(null)}
        onConfirm={async () => {
          if (!deleteReqConfirmId) return;
          setIsDeletingReq(true);
          try {
            await deleteBloodRequest(deleteReqConfirmId);
            setDeleteReqConfirmId(null);
          } finally {
            setIsDeletingReq(false);
          }
        }}
        title={`Delete Blood Requisition #${deleteReqConfirmId ? (deleteReqConfirmId.length > 12 ? deleteReqConfirmId.slice(0, 8).toUpperCase() : deleteReqConfirmId) : ''}`}
        message="Are you sure you want to permanently delete this blood requisition as system administrator? This will stop active matching and cancel radar dispatches."
        impactDetails="All committed donors and reserved blood bank units will be automatically released."
        confirmText="Yes, Delete Requisition"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingReq}
      />
    </div>
  );
};
