/* @module: BloodBankRequestsView — Hospital emergency requisitions management & dispatch console */
import React, { useState, useEffect } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup, EmergencyLevel } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import {
  AlertTriangle,
  Building2,
  Clock,
  Droplet,
  Send,
  CheckCircle2,
  Search,
  Truck,
  X,
  Phone,
  Radio,
  Navigation,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

interface BloodBankRequestsViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const BloodBankRequestsView: React.FC<BloodBankRequestsViewProps> = ({
  onNavigateTab,
}) => {
  const { currentBloodBank, requests, bloodBankOfferUnits, bloodBankConfirmSupply, refreshRequests } = useLifeDrop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<'ALL' | EmergencyLevel>('ALL');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<'ALL' | BloodGroup>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reserve modal state
  const [selectedReqForSupply, setSelectedReqForSupply] = useState<string | null>(null);
  const [supplyBloodGroup, setSupplyBloodGroup] = useState<BloodGroup>('O+');
  const [unitsToSupply, setUnitsToSupply] = useState<number>(1);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Hospital Navigation Modal state
  const [navModal, setNavModal] = useState<{
    isOpen: boolean;
    hospitalName: string;
    hospitalAddress: string;
    hospitalPhone: string;
    latitude: number;
    longitude: number;
  }>({
    isOpen: false,
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    latitude: 16.3067,
    longitude: 80.4365,
  });

  // Automatically refresh requests on mount to reflect latest requisitions from hospitals
  useEffect(() => {
    if (refreshRequests) {
      refreshRequests();
    }
  }, [refreshRequests]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRequests?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Dispatch confirmation modal state
  const [dispatchConfirmReq, setDispatchConfirmReq] = useState<{
    reqId: string;
    hospitalName: string;
    bloodGroup: string;
    units: number;
  } | null>(null);

  const allBloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Active requests needing units or having allocations
  const activeRequests = requests.filter(
    (r) => r.status !== 'CLOSED' && r.status !== 'CANCELLED'
  );

  // Calculate pending requisitions by group for notification badges
  const pendingCountByGroup = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: 0 };
    activeRequests.forEach((req) => {
      const hasPending = req.bloodBankContributions.some(
        (c) => c.bloodBankId === currentBloodBank.id && c.status === 'PENDING'
      );
      if (hasPending) {
        counts.ALL = (counts.ALL || 0) + 1;
        counts[req.bloodGroup] = (counts[req.bloodGroup] || 0) + 1;
      }
    });
    return counts;
  }, [activeRequests, currentBloodBank.id]);

  // Filter requests
  const filteredRequests = activeRequests.filter((req) => {
    if (selectedUrgency !== 'ALL' && req.emergencyLevel !== selectedUrgency) {
      return false;
    }
    if (selectedBloodGroup !== 'ALL' && req.bloodGroup !== selectedBloodGroup) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchHosp = req.hospitalName.toLowerCase().includes(q);
      const matchPatient = req.patientName.toLowerCase().includes(q);
      const matchId = req.id.toLowerCase().includes(q);
      if (!matchHosp && !matchPatient && !matchId) return false;
    }
    return true;
  });

  // Sort requests: direct requisitions pending blood bank approval first, then newest
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aPending = a.bloodBankContributions.some(
      (c) => c.bloodBankId === currentBloodBank.id && c.status === 'PENDING'
    );
    const bPending = b.bloodBankContributions.some(
      (c) => c.bloodBankId === currentBloodBank.id && c.status === 'PENDING'
    );
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleOpenReserveModal = (reqId: string, group: BloodGroup, remainingNeeded: number) => {
    const availableInBank = currentBloodBank.inventory[group]?.available || 0;
    setSelectedReqForSupply(reqId);
    setSupplyBloodGroup(group);
    setUnitsToSupply(Math.min(remainingNeeded, Math.max(1, availableInBank)));
    setActionFeedback(null);
  };

  const handleSupplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForSupply) return;

    const res = bloodBankOfferUnits(selectedReqForSupply, supplyBloodGroup, unitsToSupply);
    if (res.success) {
      setActionFeedback({ message: res.message, isError: false });
      setTimeout(() => {
        setSelectedReqForSupply(null);
        setActionFeedback(null);
      }, 1500);
    } else {
      setActionFeedback({ message: res.message, isError: true });
    }
  };

  const handleOpenDispatchConfirm = (req: any) => {
    const contribution = req.bloodBankContributions.find(
      (c: any) => c.bloodBankId === currentBloodBank.id
    );
    const units = contribution?.allocatedUnits || contribution?.offeredUnits || req.remainingUnits || 1;
    setDispatchConfirmReq({
      reqId: req.id,
      hospitalName: req.hospitalName,
      bloodGroup: req.bloodGroup,
      units,
    });
  };

  const handleConfirmDispatchAction = () => {
    if (!dispatchConfirmReq) return;
    const res = bloodBankConfirmSupply(dispatchConfirmReq.reqId, currentBloodBank.id);
    alert(res.message);
    setDispatchConfirmReq(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Hospital Dispatch Desk
              </span>
              <span className="text-xs font-mono text-slate-400">
                Facility Node: {currentBloodBank.name}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hospital Emergency Requisitions & Dispatch Console
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Review real-time blood requirements broadcast by partner hospitals. Allocate and reserve units from cold vault inventory, initiate cold-chain transport, and track delivery confirmation.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('bb-inventory')}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>Check Inventory Matrix</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Hospital Name, Patient, or Ticket ID (#LD1025)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs flex-shrink-0"
              title="Refresh requisitions from hospital network"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {(['ALL', 'CRITICAL', 'URGENT', 'NORMAL'] as const).map((urg) => (
              <button
                key={urg}
                onClick={() => setSelectedUrgency(urg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedUrgency === urg
                    ? urg === 'CRITICAL'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : urg === 'URGENT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {urg === 'ALL' ? 'All Priorities' : urg}
              </button>
            ))}
          </div>
        </div>

        {/* Blood Group Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold whitespace-nowrap mr-1">Blood Group:</span>
          <button
            onClick={() => setSelectedBloodGroup('ALL')}
            className={`px-2.5 py-1 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
              selectedBloodGroup === 'ALL'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Groups</span>
            {(pendingCountByGroup.ALL || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {pendingCountByGroup.ALL}
              </span>
            )}
          </button>
          {allBloodGroups.map((bg) => (
            <button
              key={bg}
              onClick={() => setSelectedBloodGroup(bg)}
              className={`px-2.5 py-1 rounded-xl font-mono font-extrabold transition-all flex items-center gap-1.5 ${
                selectedBloodGroup === bg
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{bg}</span>
              {(pendingCountByGroup[bg] || 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Requisition pending approval" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Direct Requisitions Pending Approval Banner */}
      {(pendingCountByGroup.ALL || 0) > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950">
                {pendingCountByGroup.ALL} Inter-Facility Direct Requisition(s) Pending Your Review
              </h4>
              <p className="text-xs text-amber-800">
                Hospital coordinators have specifically requested blood unit transfers from your bank. Click "Approve &amp; Reserve Units" to allocate cold storage stock.
              </p>
            </div>
          </div>
          {selectedBloodGroup !== 'ALL' && (
            <button
              onClick={() => setSelectedBloodGroup('ALL')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs whitespace-nowrap shadow-xs cursor-pointer"
            >
              Show All Groups
            </button>
          )}
        </div>
      )}

      {/* Requisitions List */}
      <div className="space-y-4">
        {sortedRequests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No matching hospital requisitions</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              There are currently no active emergency requisitions matching your filters.
            </p>
          </div>
        ) : (
          sortedRequests.map((req) => {
            const availableInBank = currentBloodBank.inventory[req.bloodGroup]?.available || 0;
            const myContribution = req.bloodBankContributions.find(
              (c) => c.bloodBankId === currentBloodBank.id
            );
            const isPendingApprovalByMe = myContribution && myContribution.status === 'PENDING';
            const isReservedByMe = myContribution && myContribution.status === 'RESERVED';
            const isDelivered = myContribution && myContribution.status === 'CONFIRMED';

            return (
              <div
                key={req.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge type="emergency" value={req.emergencyLevel} />
                      <StatusBadge type="request" value={req.status} />
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{req.id}
                      </span>
                      {isPendingApprovalByMe ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold flex items-center gap-1 border border-amber-300 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Direct Requisition — Pending Approval
                        </span>
                      ) : (myContribution || req.patientName.includes(currentBloodBank.name) || req.notes?.includes(currentBloodBank.name)) ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold flex items-center gap-1 border border-blue-200">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          Direct Facility Requisition
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                      {req.hospitalName}
                    </h3>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Patient: <strong>{req.patientName}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Needed By: <strong>{formatDateTime(req.requiredDateTime)}</strong>
                      </span>
                      <span>•</span>
                      <span>Hospital Contact: {req.contactNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-2xl font-black text-rose-600">
                        {req.remainingUnits}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          of {req.requiredUnits} Units Still Needed
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 mt-0.5">
                        {req.confirmedUnits} Confirmed • {req.allocatedUnits} Reserved
                      </div>
                    </div>

                    <div className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 font-black text-2xl border border-rose-200">
                      {req.bloodGroup}
                    </div>
                  </div>
                </div>

                {/* Stock Status Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Droplet className="w-4 h-4 text-rose-600" />
                    <span>Your Blood Bank Inventory ({req.bloodGroup}):</span>
                    <strong className="font-mono text-slate-900">
                      {availableInBank} Packets Available
                    </strong>
                    {availableInBank === 0 && (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Depleted
                      </span>
                    )}
                  </div>

                  {myContribution && (
                    <div
                      className={`font-bold px-2.5 py-1 rounded-xl border ${
                        isPendingApprovalByMe
                          ? 'text-amber-800 bg-amber-50 border-amber-200'
                          : isReservedByMe
                          ? 'text-purple-700 bg-purple-50 border-purple-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {isPendingApprovalByMe
                        ? `Hospital requested ${myContribution.offeredUnits || req.requiredUnits} Units from your bank • Pending Your Approval`
                        : `Your Bank has ${myContribution.allocatedUnits} Units ${myContribution.status}`}
                    </div>
                  )}
                </div>

                {/* Action Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setNavModal({
                          isOpen: true,
                          hospitalName: req.hospitalName,
                          hospitalAddress: req.hospitalAddress,
                          hospitalPhone: req.contactNumber || req.hospitalPhone,
                          latitude: req.hospitalLatitude || 16.3067,
                          longitude: req.hospitalLongitude || 80.4365,
                        })
                      }
                      className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-medium text-[11px] transition-colors cursor-pointer text-left group"
                      title="Open GPS navigation to hospital"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="underline decoration-slate-300 group-hover:decoration-blue-500">
                        Hospital: {req.hospitalAddress || req.hospitalName}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setNavModal({
                          isOpen: true,
                          hospitalName: req.hospitalName,
                          hospitalAddress: req.hospitalAddress,
                          hospitalPhone: req.contactNumber || req.hospitalPhone,
                          latitude: req.hospitalLatitude || 16.3067,
                          longitude: req.hospitalLongitude || 80.4365,
                        })
                      }
                      className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs border border-blue-200 transition-all flex items-center gap-1.5 shadow-2xs"
                      title="Get directions & navigate directly to hospital"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600 fill-current" />
                      <span>Navigate to Hospital</span>
                    </button>

                    {isPendingApprovalByMe ? (
                      availableInBank === 0 ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                          Cannot approve — {req.bloodGroup} out of stock
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const unitsNeeded = myContribution.offeredUnits || req.remainingUnits || 1;
                            if (availableInBank >= unitsNeeded) {
                              const res = bloodBankOfferUnits(req.id, req.bloodGroup, unitsNeeded);
                              alert(res.message);
                            } else {
                              handleOpenReserveModal(req.id, req.bloodGroup, unitsNeeded);
                            }
                          }}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; Reserve Units</span>
                        </button>
                      )
                    ) : isReservedByMe ? (
                      <button
                        onClick={() => handleOpenDispatchConfirm(req)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Dispatch &amp; Confirm Delivery</span>
                      </button>
                    ) : isDelivered ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        ✓ Delivery Confirmed by Hospital
                      </span>
                    ) : availableInBank === 0 ? (
                      <span className="text-slate-400 italic font-semibold">
                        Cannot offer — {req.bloodGroup} out of stock
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenReserveModal(req.id, req.bloodGroup, req.remainingUnits)}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>Offer &amp; Reserve Stock</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Offer Units Modal */}
      {selectedReqForSupply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Hospital Requisition #{selectedReqForSupply}
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Reserve & Allocate {supplyBloodGroup} Units
                </h3>
              </div>
              <button
                onClick={() => setSelectedReqForSupply(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupplySubmit} className="p-6 space-y-4 text-xs">
              {actionFeedback && (
                <div
                  className={`p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 ${
                    actionFeedback.isError
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Blood Group:</label>
                <input
                  type="text"
                  disabled
                  value={`${supplyBloodGroup} (${currentBloodBank.inventory[supplyBloodGroup]?.available || 0} Packets in Storage)`}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Number of Units to Reserve & Dispatch:</label>
                <input
                  type="number"
                  min={1}
                  max={currentBloodBank.inventory[supplyBloodGroup]?.available || 1}
                  required
                  value={unitsToSupply}
                  onChange={(e) => setUnitsToSupply(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-slate-900 text-sm"
                />
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-purple-900 text-[11px] leading-relaxed">
                <strong>Cold Chain Protocol:</strong> Reserving units locks them in {currentBloodBank.name} inventory so they are dedicated for this patient. The hospital is instantly notified to prepare the transfusion wing.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReqForSupply(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirm Allocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!dispatchConfirmReq}
        onClose={() => setDispatchConfirmReq(null)}
        onConfirm={handleConfirmDispatchAction}
        title="Confirm Blood Packet Dispatch"
        message={`Confirm physical dispatch of ${dispatchConfirmReq?.units} packet(s) of ${dispatchConfirmReq?.bloodGroup} blood to ${dispatchConfirmReq?.hospitalName}?`}
        impactDetails="This will confirm the delivery handover, permanently deduct the reserved inventory, and inform the hospital transfusion wing that packets are in-transit / delivered."
        confirmText="Yes, Confirm Dispatch"
        cancelText="Cancel"
        variant="success"
      />

      {/* Hospital GPS Navigation Modal */}
      {navModal.isOpen && (
        <GoogleMapsModal
          isOpen={navModal.isOpen}
          onClose={() => setNavModal((prev) => ({ ...prev, isOpen: false }))}
          destinationName={navModal.hospitalName}
          destinationAddress={navModal.hospitalAddress}
          destinationPhone={navModal.hospitalPhone}
          destinationType="Hospital"
          latitude={navModal.latitude}
          longitude={navModal.longitude}
          isVerified={true}
          services={[
            'Emergency Trauma Center',
            '24/7 Transfusion Reception Desk',
            'Cold Chain Receiving Station',
          ]}
        />
      )}
    </div>
  );
};

export default BloodBankRequestsView;
