/* @module: HospitalEmergencyView — Dedicated clinical emergency blood requisition console */
import React, { useState, useMemo } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { CreateRequestModal } from './CreateRequestModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { StatusBadge } from '../common/StatusBadge';
import { BloodGroup, EmergencyLevel, RequestStatus } from '../../types';
import {
  Radio,
  PlusCircle,
  Search,
  Filter,
  Users,
  Building2,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Phone,
  Bed,
  Trash2,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

interface HospitalEmergencyViewProps {
  onNavigateTab: (tabId: string) => void;
  onTrackRequest?: (requestId: string) => void;
}

export const HospitalEmergencyView: React.FC<HospitalEmergencyViewProps> = ({
  onNavigateTab,
  onTrackRequest,
}) => {
  const { currentHospital, requests, closeRequest, deleteBloodRequest } = useLifeDrop();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [closeConfirmReqId, setCloseConfirmReqId] = useState<string | null>(null);
  const [deleteConfirmReqId, setDeleteConfirmReqId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<'ALL' | EmergencyLevel>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'FULFILLED' | 'CLOSED'>('ALL');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<'ALL' | BloodGroup>('ALL');

  const handleConfirmCloseTicket = () => {
    if (!closeConfirmReqId) return;
    closeRequest(closeConfirmReqId);
    setCloseConfirmReqId(null);
  };

  // Filter requests belonging to this hospital
  const hospitalRequests = useMemo(() => {
    return requests.filter((r) => r.hospitalId === currentHospital.id);
  }, [requests, currentHospital.id]);

  // Filter based on search and selected filters
  const filteredRequests = useMemo(() => {
    return hospitalRequests.filter((req) => {
      // Search query match (patient name, id, notes, phone, blood group)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = req.patientName.toLowerCase().includes(q);
        const matchesId = req.id.toLowerCase().includes(q);
        const matchesGroup = req.bloodGroup.toLowerCase().includes(q);
        const matchesNotes = req.notes?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesId && !matchesGroup && !matchesNotes) {
          return false;
        }
      }

      // Urgency filter
      if (selectedUrgency !== 'ALL' && req.emergencyLevel !== selectedUrgency) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'ACTIVE') {
        if (req.status === 'CLOSED' || req.status === 'CANCELLED' || req.status === 'FULFILLED') {
          return false;
        }
      } else if (selectedStatus === 'FULFILLED') {
        if (req.status !== 'FULFILLED') return false;
      } else if (selectedStatus === 'CLOSED') {
        if (req.status !== 'CLOSED' && req.status !== 'CANCELLED') return false;
      }

      // Blood group filter
      if (selectedBloodGroup !== 'ALL' && req.bloodGroup !== selectedBloodGroup) {
        return false;
      }

      return true;
    });
  }, [hospitalRequests, searchQuery, selectedUrgency, selectedStatus, selectedBloodGroup]);

  // Aggregate metrics
  const activeCount = hospitalRequests.filter(
    (r) => r.status !== 'CLOSED' && r.status !== 'CANCELLED' && r.status !== 'FULFILLED'
  ).length;
  const criticalCount = hospitalRequests.filter(
    (r) => r.emergencyLevel === 'CRITICAL' && r.status !== 'CLOSED' && r.status !== 'CANCELLED'
  ).length;
  const totalUnitsNeeded = hospitalRequests
    .filter((r) => r.status !== 'CLOSED' && r.status !== 'CANCELLED')
    .reduce((sum, r) => sum + r.remainingUnits, 0);
  const totalUnitsConfirmed = hospitalRequests.reduce((sum, r) => sum + r.confirmedUnits, 0);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-extrabold uppercase tracking-wider">
                Emergency Requisitions Console
              </span>
              <span className="text-xs font-mono text-slate-400">
                Facility ID: {currentHospital.id}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Emergency Blood Requisitions
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time clinical transfusion tickets for {currentHospital.name}. Broadcast immediate requirements to verified local donors and regional partner blood banks.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2.5 flex-shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Raise Emergency Blood Request</span>
          </button>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 font-semibold">Active Requisitions</div>
            <div className="text-xl font-black text-white mt-1">{activeCount}</div>
          </div>
          <div className="bg-rose-950/40 p-3.5 rounded-2xl border border-rose-900/50">
            <div className="text-rose-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Critical Immediate (&lt;1h)
            </div>
            <div className="text-xl font-black text-rose-200 mt-1">{criticalCount}</div>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 font-semibold">Units Still Required</div>
            <div className="text-xl font-black text-amber-400 mt-1">{totalUnitsNeeded}</div>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 font-semibold">Confirmed Received Units</div>
            <div className="text-xl font-black text-emerald-400 mt-1">{totalUnitsConfirmed}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient Name, Ward/Bed info, Request ID (#LD1025)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
            />
          </div>

          {/* Urgency Filter Tabs */}
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

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {(['ALL', 'ACTIVE', 'FULFILLED', 'CLOSED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStatus === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Blood Group Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold whitespace-nowrap mr-1">Blood Group:</span>
          <button
            onClick={() => setSelectedBloodGroup('ALL')}
            className={`px-2.5 py-1 rounded-xl font-extrabold transition-all ${
              selectedBloodGroup === 'ALL'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Groups
          </button>
          {bloodGroups.map((bg) => (
            <button
              key={bg}
              onClick={() => setSelectedBloodGroup(bg)}
              className={`px-2.5 py-1 rounded-xl font-mono font-extrabold transition-all ${
                selectedBloodGroup === bg
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No matching blood requisitions</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No emergency blood requests match your active filters. Clear search or filters to see all tickets.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedUrgency('ALL');
                setSelectedStatus('ALL');
                setSelectedBloodGroup('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isCompleted = req.status === 'FULFILLED' || req.status === 'CLOSED';
            const progressPercent = Math.min(
              100,
              Math.round((req.confirmedUnits / req.requiredUnits) * 100)
            );

            return (
              <div
                key={req.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Top Row: Meta, Patient & Blood Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge type="emergency" value={req.emergencyLevel} />
                      <StatusBadge type="request" value={req.status} />
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{req.id.length > 12 ? req.id.slice(0, 8).toUpperCase() : req.id}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                      <span>{req.patientName}</span>
                    </h3>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Transfusion Deadline: <strong>{formatDateTime(req.requiredDateTime)}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Contact: {req.contactNumber}
                      </span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block mt-1">
                        Clinical Notes: {req.notes}
                      </p>
                    )}
                  </div>

                  {/* Blood Group & Units */}
                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-2xl font-black text-rose-600">
                        {req.remainingUnits}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          of {req.requiredUnits} Units Needed
                        </span>
                      </div>
                      <div className="text-xs font-bold text-emerald-600 mt-0.5">
                        {req.confirmedUnits} Confirmed • {req.allocatedUnits} Reserved
                      </div>
                    </div>

                    <div className="px-4 py-3 rounded-2xl bg-rose-50 text-rose-700 font-black text-2xl border border-rose-200 shadow-2xs flex items-center justify-center min-w-[70px]">
                      {req.bloodGroup}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Transfusion Fulfillment Progress</span>
                    <span>{progressPercent}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-600 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      {req.donorContributions.length} Donor Responses
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      {req.bloodBankContributions.length} Blood Banks Engaged
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onTrackRequest) {
                          onTrackRequest(req.id);
                        } else {
                          onNavigateTab('hosp-tracking');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold inline-flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Open Live Radar & Tracking</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onNavigateTab('hosp-donors')}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1 transition-all"
                    >
                      <span>Check Donors</span>
                    </button>

                    {req.status === 'FULFILLED' && (
                      <button
                        onClick={() => setCloseConfirmReqId(req.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-all"
                      >
                        Close Ticket
                      </button>
                    )}

                    {req.hospitalId === currentHospital.id && (
                      <button
                        onClick={() => setDeleteConfirmReqId(req.id)}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                        title="Delete Requisition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onRequestCreated={(id) => {
          if (onTrackRequest) onTrackRequest(id);
          else onNavigateTab('hosp-tracking');
        }}
      />

      {/* Close Ticket Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!closeConfirmReqId}
        onClose={() => setCloseConfirmReqId(null)}
        onConfirm={handleConfirmCloseTicket}
        title={`Close Blood Requisition #${closeConfirmReqId}`}
        message="Are you sure you want to close this emergency ticket? This marks the patient request as completed and archives active donor matching."
        impactDetails="All fulfilled units will be marked as complete and recorded in hospital logs."
        confirmText="Yes, Close Ticket"
        cancelText="Keep Open"
        variant="warning"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirmReqId}
        onClose={() => setDeleteConfirmReqId(null)}
        onConfirm={async () => {
          if (!deleteConfirmReqId) return;
          setIsDeleting(true);
          try {
            await deleteBloodRequest(deleteConfirmReqId);
            setDeleteConfirmReqId(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        title={`Delete Blood Requisition #${deleteConfirmReqId ? (deleteConfirmReqId.length > 12 ? deleteConfirmReqId.slice(0, 8).toUpperCase() : deleteConfirmReqId) : ''}`}
        message="Are you sure you want to permanently delete this blood requisition? This will stop active matching and cancel radar dispatches."
        impactDetails="All committed donors and reserved blood bank units will be automatically released."
        confirmText="Yes, Delete Requisition"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default HospitalEmergencyView;
