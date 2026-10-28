import React, { useState, useRef } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodBank, BloodGroup } from '../../types';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import {
  Warehouse,
  MapPin,
  Phone,
  Clock,
  Droplet,
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  X,
  Truck,
  ShieldCheck,
  Navigation,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { formatPhone } from '../../utils/formatters';

interface HospitalBloodBanksViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const HospitalBloodBanksView: React.FC<HospitalBloodBanksViewProps> = ({
  onNavigateTab,
}) => {
  const { bloodBanks, currentHospital, requests, hospitalRequestBloodTransfer, refreshBloodBanks } = useLifeDrop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroupFilter, setSelectedBloodGroupFilter] = useState<'ALL' | BloodGroup>('ALL');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedBB, setSelectedBB] = useState<BloodBank | null>(null);
  const [targetRequestId, setTargetRequestId] = useState<string>('');
  const [transferGroup, setTransferGroup] = useState<BloodGroup>('O+');
  const [transferUnits, setTransferUnits] = useState<number>(2);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const submittingTransferRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync blood bank directory on mount
  React.useEffect(() => {
    refreshBloodBanks().catch(() => {});
  }, [refreshBloodBanks]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBloodBanks();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const [navModal, setNavModal] = useState<{
    isOpen: boolean;
    bloodBank: BloodBank | null;
    distanceKm?: number;
  }>({
    isOpen: false,
    bloodBank: null,
  });

  const activeHospitalRequests = requests.filter(
    (r) => r.hospitalId === currentHospital.id && r.status !== 'CLOSED' && r.status !== 'CANCELLED'
  );

  // Eligible patient requests that actually require units (remainingUnits > 0)
  const eligibleHospitalRequests = activeHospitalRequests.filter(
    (r) => r.remainingUnits > 0 && r.status !== 'FULFILLED'
  );

  const allBloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Filter blood banks
  const filteredBloodBanks = bloodBanks.filter((bb) => {
    if (!bb.isVerified) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = bb.name.toLowerCase().includes(q);
      const matchAddress = bb.address.toLowerCase().includes(q);
      const matchLicense = bb.licenseNumber.toLowerCase().includes(q);
      if (!matchName && !matchAddress && !matchLicense) return false;
    }

    if (selectedBloodGroupFilter !== 'ALL') {
      const stock = bb.inventory[selectedBloodGroupFilter]?.available || 0;
      if (stock === 0) return false;
    }

    return true;
  });

  const handleOpenTransferModal = (bb: BloodBank, preselectedGroup?: BloodGroup) => {
    setSelectedBB(bb);

    // Pick preselectedGroup if available, or first group with stock > 0, or 'O+'
    let defaultGroup: BloodGroup = 'O+';
    if (preselectedGroup && (bb.inventory[preselectedGroup]?.available || 0) > 0) {
      defaultGroup = preselectedGroup;
    } else {
      const firstAvail = allBloodGroups.find((g) => (bb.inventory[g]?.available || 0) > 0);
      if (firstAvail) defaultGroup = firstAvail;
      else if (preselectedGroup) defaultGroup = preselectedGroup;
    }
    setTransferGroup(defaultGroup);

    // Always default targetRequestId to '' (General Emergency Reserve / Direct Inter-Facility Transfer)
    setTargetRequestId('');
    setTransferUnits(1);
    setTransferSuccess(false);
    submittingTransferRef.current = false;
    setTransferModalOpen(true);
    setFeedbackMessage(null);
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBB) return;
    if (isSubmittingTransfer || submittingTransferRef.current || transferSuccess) return;

    submittingTransferRef.current = true;
    setIsSubmittingTransfer(true);
    try {
      const res = await hospitalRequestBloodTransfer(
        selectedBB.id,
        targetRequestId,
        transferGroup,
        Number(transferUnits)
      );

      if (res.success) {
        setTransferSuccess(true);
        setFeedbackMessage({ text: res.message, isError: false });
        setTimeout(() => {
          setTransferModalOpen(false);
          setFeedbackMessage(null);
          setTransferSuccess(false);
          submittingTransferRef.current = false;
        }, 1200);
      } else {
        setFeedbackMessage({ text: res.message, isError: true });
        submittingTransferRef.current = false;
      }
    } catch (err: any) {
      setFeedbackMessage({ text: err?.message || 'Transfer requisition failed. Please try again.', isError: true });
      submittingTransferRef.current = false;
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5" />
                Inter-Facility Transfusion Network
              </span>
              <span className="text-xs font-mono text-slate-400">
                Hospital Node: {currentHospital.name}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Regional Blood Banks & Live Stock Directory
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time 8-group blood component inventory across certified regional blood banks. Initiate direct inter-hospital cold-chain stock requisitions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Refresh blood bank directory from live database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Directory'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('hosp-emergency')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all"
            >
              Active Hospital Tickets ({activeHospitalRequests.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search blood banks by facility name, address, or license number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <span className="text-slate-400 font-bold whitespace-nowrap">Filter Stock:</span>
            <select
              value={selectedBloodGroupFilter}
              onChange={(e) => setSelectedBloodGroupFilter(e.target.value as any)}
              className="px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700"
            >
              <option value="ALL">All Blood Groups</option>
              {allBloodGroups.map((g) => (
                <option key={g} value={g}>Has {g} Available</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Blood Banks List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredBloodBanks.map((bb, index) => {
          const estimatedDistanceKm = Number((1.8 + index * 1.5).toFixed(1));
          const estimatedTransitMins = Math.round(estimatedDistanceKm * 3.5 + 5);

          // Calculate total available units across all 8 groups
          const totalStock = Object.values(bb.inventory).reduce(
            (sum, item) => sum + (item.available || 0),
            0
          );

          return (
            <div
              key={bb.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* Top Banner Row */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      NABH / Drug Control Certified
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Lic #{bb.licenseNumber}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                    {bb.name}
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setNavModal({
                          isOpen: true,
                          bloodBank: bb,
                          distanceKm: estimatedDistanceKm,
                        })
                      }
                      className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer text-left group"
                      title="Click to view map & navigation"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="underline decoration-slate-300 group-hover:decoration-emerald-500">{bb.address}</span>
                    </button>
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      24/7 Dispatch: {formatPhone(bb.phone)}
                    </span>
                  </div>
                </div>

                {/* Logistics & Primary Action */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1 justify-end">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      {estimatedDistanceKm} km • ~{estimatedTransitMins} mins
                    </div>
                    <div className="text-sm font-black text-slate-800 mt-0.5">
                      {totalStock} Total Units in Cold Storage
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNavModal({
                        isOpen: true,
                        bloodBank: bb,
                        distanceKm: estimatedDistanceKm,
                      })
                    }
                    className="px-4 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs border border-blue-200 transition-all flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
                    title={`Open GPS navigation & map for ${bb.name}`}
                  >
                    <Navigation className="w-4 h-4 text-blue-600 fill-current" />
                    <span>Directions</span>
                  </button>

                  <button
                    onClick={() => handleOpenTransferModal(bb)}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Request Unit Transfer</span>
                  </button>
                </div>
              </div>

              {/* 8-Group Live Stock Matrix */}
              <div className="p-6 bg-slate-50/50">
                <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Live Blood Group Inventory Matrix</span>
                  <span className="text-[11px] font-normal text-slate-400">Click any group to requisition</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {allBloodGroups.map((group) => {
                    const item = bb.inventory[group];
                    const available = item?.available || 0;
                    const reserved = item?.reserved || 0;

                    let badgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                    let statusLabel = 'Available';

                    if (available === 0) {
                      badgeColor = 'bg-rose-50 border-rose-200 text-rose-800 opacity-60';
                      statusLabel = 'Depleted';
                    } else if (available < 5) {
                      badgeColor = 'bg-amber-50 border-amber-200 text-amber-800';
                      statusLabel = 'Low Reserve';
                    }

                    return (
                      <button
                        key={group}
                        onClick={() => handleOpenTransferModal(bb, group)}
                        disabled={available === 0}
                        className={`p-3 rounded-2xl border text-left transition-all ${badgeColor} ${
                          available > 0 ? 'hover:scale-105 cursor-pointer shadow-2xs' : 'cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black font-mono">{group}</span>
                          <span className="text-[10px] font-extrabold uppercase">{statusLabel}</span>
                        </div>
                        <div className="text-2xl font-black mt-1">
                          {available}{' '}
                          <span className="text-[10px] font-normal text-slate-500">units</span>
                        </div>
                        {reserved > 0 && (
                          <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {reserved} reserved
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Request Modal */}
      {transferModalOpen && selectedBB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                    Inter-Facility Requisition
                  </span>
                  <h3 className="text-lg font-extrabold text-white">
                    Request Units from {selectedBB.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setTransferModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="p-6 space-y-4 text-xs">
              {feedbackMessage && (
                <div
                  className={`p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 ${
                    feedbackMessage.isError
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{feedbackMessage.text}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assign to Hospital Emergency Requisition:
                </label>
                <select
                  value={targetRequestId}
                  onChange={(e) => {
                    const newTargetId = e.target.value;
                    setTargetRequestId(newTargetId);
                    if (newTargetId) {
                      const matchedReq = eligibleHospitalRequests.find((r) => r.id === newTargetId);
                      if (matchedReq) {
                        setTransferGroup(matchedReq.bloodGroup);
                        const maxAvail = selectedBB.inventory[matchedReq.bloodGroup]?.available || 1;
                        setTransferUnits(Math.min(matchedReq.remainingUnits, Math.max(1, maxAvail)));
                      }
                    }
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="">General Emergency Reserve (Direct Inter-Facility Transfer)</option>
                  {eligibleHospitalRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      #{req.id} — {req.patientName} ({req.bloodGroup}, {req.remainingUnits} units needed)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Blood Group:
                  </label>
                  <select
                    value={transferGroup}
                    onChange={(e) => {
                      const newGroup = e.target.value as BloodGroup;
                      setTransferGroup(newGroup);
                      // If assigned to a patient ticket whose blood group doesn't match the new group, reset to General Emergency Reserve
                      if (targetRequestId) {
                        const matched = eligibleHospitalRequests.find((r) => r.id === targetRequestId);
                        if (matched && matched.bloodGroup !== newGroup) {
                          setTargetRequestId('');
                        }
                      }
                      const maxAvail = selectedBB.inventory[newGroup]?.available || 1;
                      setTransferUnits((prev) => Math.min(prev, Math.max(1, maxAvail)));
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    {allBloodGroups.map((g) => {
                      const avail = selectedBB.inventory[g]?.available || 0;
                      return (
                        <option key={g} value={g} disabled={avail === 0}>
                          {g} ({avail} available)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Units to Transfer:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={
                      targetRequestId
                        ? Math.min(
                            eligibleHospitalRequests.find((r) => r.id === targetRequestId)?.remainingUnits || 10,
                            selectedBB.inventory[transferGroup]?.available || 10
                          )
                        : selectedBB.inventory[transferGroup]?.available || 10
                    }
                    value={transferUnits}
                    onChange={(e) => setTransferUnits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800 text-[11px] leading-relaxed">
                <strong>Cold Chain Protocol:</strong> Direct requisition will alert the coordinator at {selectedBB.name}. Upon blood bank approval, units will be reserved and cold-chain dispatch confirmation will be initiated.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransferModalOpen(false);
                    setTransferSuccess(false);
                    submittingTransferRef.current = false;
                  }}
                  disabled={isSubmittingTransfer || transferSuccess}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer || transferSuccess}
                  className={`px-5 py-2.5 rounded-xl font-extrabold shadow-sm transition-all flex items-center gap-2 ${
                    transferSuccess
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60 disabled:cursor-not-allowed'
                  }`}
                >
                  {transferSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Requisition Submitted!</span>
                    </>
                  ) : isSubmittingTransfer ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      <span>Submitting Requisition...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Requisition</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Maps Navigation Modal for Blood Bank */}
      {navModal.isOpen && navModal.bloodBank && (
        <GoogleMapsModal
          isOpen={navModal.isOpen}
          onClose={() => setNavModal({ isOpen: false, bloodBank: null })}
          destinationName={navModal.bloodBank.name}
          destinationAddress={navModal.bloodBank.address}
          destinationPhone={navModal.bloodBank.phone}
          destinationType="Blood Bank"
          latitude={navModal.bloodBank.latitude || 16.3067}
          longitude={navModal.bloodBank.longitude || 80.4365}
          distanceKm={navModal.distanceKm}
          isVerified={navModal.bloodBank.isVerified}
          services={
            navModal.bloodBank.componentsAvailable || [
              'Whole Blood',
              'Packed Red Blood Cells',
              'Platelets',
              'Fresh Frozen Plasma (FFP)',
            ]
          }
        />
      )}
    </div>
  );
};

export default HospitalBloodBanksView;
