import React, { useState, useEffect } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodRequest } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DonorRankBadge } from '../common/DonorRankBadge';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { sanitizeUrl } from '../../utils/security';
import {
  Heart,
  Droplet,
  MapPin,
  Calendar,
  AlertTriangle,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Phone,
  Navigation,
  XCircle,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { isBloodCompatible } from '../../utils/compatibility';
import { formatDateTime, formatDate, formatPhone } from '../../utils/formatters';

interface UserDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    requests,
    campaigns,
    hospitals,
    donorRespond,
    donorCancelDonation,
    openFeedbackModal,
    hasUserSeenFeedbackPrompt,
    markFeedbackPromptAsSeen,
  } = useLifeDrop();

  // One-time post-donation feedback popup for User
  useEffect(() => {
    const hasCompleted =
      currentUser.totalDonations > 0 ||
      requests.some((r) =>
        r.donorContributions.some(
          (c) => c.donorId === currentUser.id && c.status === 'COMPLETED'
        )
      );

    if (hasCompleted && !hasUserSeenFeedbackPrompt(currentUser.id)) {
      const timer = setTimeout(() => {
        openFeedbackModal({
          triggerRole: 'USER',
          triggerUserId: currentUser.id,
          triggerUserName: currentUser.name,
          triggerUserBloodGroup: currentUser.bloodGroup,
          isPostDonation: true,
        });
        markFeedbackPromptAsSeen(currentUser.id);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [currentUser.id, currentUser.totalDonations, requests]);

  // Modals state
  const [declineModalReqId, setDeclineModalReqId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [donateConfirmReq, setDonateConfirmReq] = useState<BloodRequest | null>(null);
  const [navModalData, setNavModalData] = useState<{
    isOpen: boolean;
    destinationName: string;
    destinationAddress: string;
    destinationPhone: string;
    destinationType: 'Hospital' | 'Blood Bank';
    latitude: number;
    longitude: number;
    distanceKm?: number;
    services?: string[];
  }>({
    isOpen: false,
    destinationName: '',
    destinationAddress: '',
    destinationPhone: '',
    destinationType: 'Hospital',
    latitude: 0,
    longitude: 0,
  });

  // Active commitment request if any
  const activeCommitment = currentUser.activeCommitmentRequestId
    ? requests.find((r) => r.id === currentUser.activeCommitmentRequestId)
    : null;

  // Filter campaigns within 10 km
  const nearbyCampaigns = campaigns.filter((c) => (c.distanceKm || 0) <= 10);

  // Active emergency requests compatible with donor
  const activeEmergencyRequests = requests.filter(
    (r) =>
      (r.status === 'SEARCHING' || r.status === 'PARTIALLY_FULFILLED') &&
      r.remainingUnits > 0
  );

  const handleDeclineSubmit = () => {
    if (declineModalReqId) {
      donorRespond(declineModalReqId, 'DECLINE', declineReason);
      setDeclineModalReqId(null);
      setDeclineReason('');
    }
  };

  const handleCancelCommitmentSubmit = () => {
    if (currentUser.activeCommitmentRequestId) {
      donorCancelDonation(currentUser.activeCommitmentRequestId, cancelReason);
      setCancelModalOpen(false);
      setCancelReason('');
    }
  };

  const handleConfirmDonate = () => {
    if (!donateConfirmReq) return;
    const res = donorRespond(donateConfirmReq.id, 'ACCEPT');
    if (!res.success) {
      alert(res.message);
    }
    setDonateConfirmReq(null);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Personalized Header & 3D Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lifedrop-navy via-slate-900 to-[#1e293b] text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Verified Community Donor
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Good Morning, {currentUser.name}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Every drop makes an immediate difference. You are currently registered in{' '}
              <span className="font-semibold text-white">{currentUser.city}</span> ({currentUser.location}).
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15">
                Blood Group: <strong className="text-rose-400">{currentUser.bloodGroup}</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/15">
                ID: <strong className="font-mono text-slate-300">{currentUser.id}</strong>
              </span>
            </div>
          </div>

          {/* CTA Group: Donate Blood & History */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('user-transactions')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all duration-300"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Donation History</span>
            </button>
            <button
              onClick={() => onNavigateTab('user-donate')}
              className="group px-6 py-3.5 rounded-2xl bg-gradient-to-r from-lifedrop-primary to-rose-600 hover:from-rose-600 hover:to-lifedrop-primary text-white font-extrabold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2.5 border border-rose-400/30 flex-shrink-0"
            >
              <Heart className="w-4 h-4 text-white fill-white group-hover:scale-110 transition-transform" />
              <span>Donate Blood</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Statistics KPI Grid with Rank Plate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('user-transactions')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-3d-interactive flex items-center gap-4 cursor-pointer hover:border-rose-300 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-lifedrop-primary flex items-center justify-center font-extrabold text-xl">
            <Droplet className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Confirmed Donations</div>
            <div className="text-2xl font-extrabold text-lifedrop-navy mt-0.5">
              {currentUser.totalDonations}
            </div>
            <span className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 mt-0.5">
              <span>View History & Certificates</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-3d-interactive flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-xl ${
              currentUser.isEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Current Eligibility</div>
            <div
              className={`text-sm font-extrabold mt-0.5 ${
                currentUser.isEligible ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {currentUser.isEligible ? 'Eligible to Donate' : '90-Day Waiting'}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs card-3d-interactive flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-extrabold text-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Active Commitments</div>
            <div className="text-2xl font-extrabold text-lifedrop-navy mt-0.5">
              {currentUser.activeCommitmentRequestId ? '1 Active' : '0 None'}
            </div>
          </div>
        </div>

        <div>
          <DonorRankBadge
            rank={currentUser.rank}
            donationsCount={currentUser.totalDonations}
            showProgress={false}
            size="md"
          />
        </div>
      </div>

      {/* Active Commitment Highlight Banner (If Donor is committed to a request) */}
      {activeCommitment && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white shadow-2xl border-2 border-purple-400/40 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                MY ACTIVE COMMITMENT • REQUEST #{activeCommitment.id}
              </div>
              <h3 className="text-xl font-extrabold text-white">
                You committed 1 unit for {activeCommitment.patientName}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-300" />
                {activeCommitment.hospitalName} ({activeCommitment.hospitalAddress})
              </p>
              <p className="text-xs text-amber-300 font-medium">
                Please visit the hospital transfusion desk. Quote your Donor ID:{' '}
                <strong className="font-mono bg-white/10 px-2 py-0.5 rounded">{currentUser.id}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() =>
                  setNavModalData({
                    isOpen: true,
                    destinationName: activeCommitment.hospitalName,
                    destinationAddress: activeCommitment.hospitalAddress,
                    destinationPhone: activeCommitment.hospitalPhone,
                    destinationType: 'Hospital',
                    latitude: activeCommitment.hospitalLatitude,
                    longitude: activeCommitment.hospitalLongitude,
                    distanceKm: 2.1,
                  })
                }
                className="px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs shadow-lg inline-flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Navigation className="w-4 h-4 text-lifedrop-primary fill-current" />
                Navigate Hospital
              </button>

              <a
                href={`tel:${activeCommitment.hospitalPhone}`}
                className="px-4 py-3 rounded-2xl bg-purple-800/80 hover:bg-purple-700 text-white font-bold text-xs shadow-md inline-flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Desk
              </a>

              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-3 rounded-2xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 font-bold text-xs transition-colors inline-flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Cancel Donation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Blood Requests Section (Clean Full-Width Grid) */}
      <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-lifedrop-navy flex items-center gap-2">
                Emergency Blood Requests
                <span className="px-2 py-0.5 rounded-full bg-lifedrop-emergency/10 text-lifedrop-emergency text-xs font-bold">
                  {activeEmergencyRequests.length} Active
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Matches based on red-cell compatibility ({currentUser.bloodGroup}) and distance.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('user-requests')}
              className="text-xs font-bold text-lifedrop-primary hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeEmergencyRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No active emergency requests right now.</p>
              <p className="text-xs text-slate-400 mt-1">All hospital blood units are currently met in your area.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeEmergencyRequests.map((req) => {
                const isCompatible = isBloodCompatible(req.bloodGroup, currentUser.bloodGroup);
                const isCommittedToThis = currentUser.activeCommitmentRequestId === req.id;
                const isCommittedToOther =
                  currentUser.activeCommitmentRequestId && currentUser.activeCommitmentRequestId !== req.id;

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 card-3d-interactive space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge type="emergency" value={req.emergencyLevel} />
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{req.id}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-lifedrop-primary font-bold">
                            Needed: {req.bloodGroup}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-lifedrop-navy mt-2">
                          {req.patientName}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {req.hospitalName} • ~2.4 km away
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-lifedrop-primary">
                          {req.remainingUnits}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            of {req.requiredUnits} Units Needed
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          Needed by: {formatDateTime(req.requiredDateTime)}
                        </div>
                      </div>
                    </div>

                    {/* Compatibility notice */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Compatibility with your {currentUser.bloodGroup}:
                      </span>
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          isCompatible ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {isCompatible ? '✓ Red-Cell Compatible' : '✗ Incompatible'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() =>
                          setNavModalData({
                            isOpen: true,
                            destinationName: req.hospitalName,
                            destinationAddress: req.hospitalAddress,
                            destinationPhone: req.hospitalPhone,
                            destinationType: 'Hospital',
                            latitude: req.hospitalLatitude,
                            longitude: req.hospitalLongitude,
                            distanceKm: 2.4,
                          })
                        }
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5 text-slate-400" />
                        View Location
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setDeclineModalReqId(req.id);
                          }}
                          className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors"
                        >
                          Sorry, I Cannot
                        </button>

                        {isCommittedToThis ? (
                          <span className="px-4 py-2 rounded-xl bg-purple-100 text-purple-800 text-xs font-extrabold">
                            ✓ Currently Committed
                          </span>
                        ) : isCommittedToOther ? (
                          <span
                            title="You already have an active commitment to another request"
                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                          >
                            Committed to another request
                          </span>
                        ) : !currentUser.isEligible ? (
                          <span
                            title="You are currently not eligible under the 90-day safety cycle"
                            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-200 text-xs font-bold cursor-not-allowed"
                          >
                            Currently Ineligible
                          </span>
                        ) : !isCompatible ? (
                          <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed">
                            Group Incompatible
                          </span>
                        ) : (
                          <button
                            onClick={() => setDonateConfirmReq(req)}
                            className="px-5 py-2.5 rounded-xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white font-extrabold text-xs shadow-md transition-all hover:scale-105"
                          >
                            I Can Donate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Horizontal Campaigns Section (<10km Filtered) */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-lifedrop-navy flex items-center gap-2">
              Blood Donation Campaigns
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                Within 10 km
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Community drives organized by verified regional blood banks.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('user-campaigns')}
            className="text-xs font-bold text-lifedrop-primary hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {nearbyCampaigns.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
            No campaigns within 10 km at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 card-3d-interactive flex flex-col sm:flex-row"
              >
                <div className="sm:w-44 h-36 sm:h-auto relative flex-shrink-0">
                  <img
                    src={camp.image}
                    alt={camp.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-lifedrop-navy/80 backdrop-blur-md text-white text-[10px] font-bold">
                    {camp.distanceKm} km away
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                      {camp.bloodBankName}
                    </span>
                    <h4 className="text-sm font-extrabold text-lifedrop-navy line-clamp-1">
                      {camp.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {camp.description}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(camp.date)} • {camp.time}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {camp.location}
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={sanitizeUrl(camp.googleFormUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-lifedrop-navy hover:text-white text-slate-800 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      Register via Google Form
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decline Response Reason Modal */}
      {declineModalReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-lifedrop-navy">
              Decline Response (Optional Reason)
            </h3>
            <p className="text-xs text-slate-500">
              Letting the hospital know why you cannot donate helps the coordination engine search for other donors faster.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Reason (Optional):</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
              >
                <option value="">-- Select or skip --</option>
                <option value="Busy with work">Busy with work</option>
                <option value="Travelling out of city">Travelling out of city</option>
                <option value="Cannot reach hospital location">Cannot reach hospital location</option>
                <option value="Feeling unwell">Feeling unwell</option>
                <option value="Personal reasons">Personal reasons</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeclineModalReqId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineSubmit}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md"
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Donation Commitment Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-lifedrop-navy">
              Cancel Donation Response?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cancelling your commitment will instantly notify the hospital and reopen the emergency radar to find an alternative donor.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Reason (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Sudden emergency, unable to travel"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Keep Commitment
              </button>
              <button
                onClick={handleCancelCommitmentSubmit}
                className="px-5 py-2.5 rounded-xl bg-lifedrop-emergency hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {navModalData.isOpen && (
        <GoogleMapsModal {...navModalData} onClose={() => setNavModalData((prev) => ({ ...prev, isOpen: false }))} />
      )}

      {/* Donation Commitment Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!donateConfirmReq}
        onClose={() => setDonateConfirmReq(null)}
        onConfirm={handleConfirmDonate}
        title="Confirm Blood Donation Commitment"
        message={`Are you sure you can travel to ${donateConfirmReq?.hospitalName} to donate blood for patient ${donateConfirmReq?.patientName}?`}
        impactDetails="Confirming registers you as an active committed donor. The clinical team will be notified immediately to prepare for your arrival."
        confirmText="Yes, I Will Donate"
        cancelText="Not Right Now"
        variant="primary"
      />
    </div>
  );
};
