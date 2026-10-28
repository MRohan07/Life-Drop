/* @module: HospitalTrackingHub — Multi-request tracking & live radar operations hub */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { RequestTracker } from './RequestTracker';
import { StatusBadge } from '../common/StatusBadge';
import { ReportDonorModal } from './ReportDonorModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Activity,
  Radio,
  Clock,
  Users,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowLeft,
  Navigation,
  Trash2,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

interface HospitalTrackingHubProps {
  initialRequestId?: string | null;
  onNavigateTab: (tabId: string) => void;
}

export const HospitalTrackingHub: React.FC<HospitalTrackingHubProps> = ({
  initialRequestId = null,
  onNavigateTab,
}) => {
  const { currentHospital, requests, deleteBloodRequest } = useLifeDrop();

  const [selectedReqId, setSelectedReqId] = useState<string | null>(initialRequestId);
  const [deleteConfirmReqId, setDeleteConfirmReqId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'FULFILLED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    donorId: string;
    requestId: string;
  }>({
    isOpen: false,
    donorId: '',
    requestId: '',
  });

  const hospitalRequests = requests.filter((r) => r.hospitalId === currentHospital.id);

  // If a specific request is currently selected for tracking, render full RequestTracker
  if (selectedReqId) {
    return (
      <div className="space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setSelectedReqId(null)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to All Tracked Tickets</span>
          </button>
          <span className="text-xs font-mono font-bold text-slate-500">
            Active Tracking Ticket: #{selectedReqId.length > 12 ? selectedReqId.slice(0, 8).toUpperCase() : selectedReqId}
          </span>
        </div>

        <RequestTracker
          requestId={selectedReqId}
          onBack={() => setSelectedReqId(null)}
          onReportDonor={(donorId, reqId) =>
            setReportModalData({ isOpen: true, donorId, requestId: reqId })
          }
        />

        <ReportDonorModal
          isOpen={reportModalData.isOpen}
          onClose={() => setReportModalData({ isOpen: false, donorId: '', requestId: '' })}
          initialDonorId={reportModalData.donorId}
          initialRequestId={reportModalData.requestId}
        />
      </div>
    );
  }

  // Filter requests for the hub
  const filteredRequests = hospitalRequests.filter((req) => {
    if (filterMode === 'ACTIVE') {
      if (req.status === 'CLOSED' || req.status === 'CANCELLED' || req.status === 'FULFILLED') {
        return false;
      }
    } else if (filterMode === 'FULFILLED') {
      if (req.status !== 'FULFILLED' && req.status !== 'CLOSED') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = req.patientName.toLowerCase().includes(q);
      const matchId = req.id.toLowerCase().includes(q);
      const matchGroup = req.bloodGroup.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchGroup) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                Live Radar & Tracking Hub
              </span>
              <span className="text-xs font-mono text-slate-400">
                {currentHospital.name}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Transfusion Requisition Tracking
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Select any patient ticket below to launch real-time donor geospatial radar, monitor arrival ETAs, review blood bank reserves, and audit transfusion milestones.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('hosp-emergency')}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-2"
          >
            <span>Emergency Requests List</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets by Patient Name, ID (#LD1025), or Blood Group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto justify-center">
          <button
            onClick={() => setFilterMode('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'ACTIVE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Radar ({hospitalRequests.filter((r) => r.status !== 'CLOSED' && r.status !== 'CANCELLED' && r.status !== 'FULFILLED').length})
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tickets ({hospitalRequests.length})
          </button>
          <button
            onClick={() => setFilterMode('FULFILLED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'FULFILLED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fulfilled ({hospitalRequests.filter((r) => r.status === 'FULFILLED' || r.status === 'CLOSED').length})
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No requisitions available to track</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              There are currently no blood requisitions matching this filter for {currentHospital.name}.
            </p>
            <button
              onClick={() => onNavigateTab('hosp-emergency')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
            >
              Go to Emergency Requests
            </button>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const progressPercent = Math.min(
              100,
              Math.round((req.confirmedUnits / req.requiredUnits) * 100)
            );
            const activeDonorsOnWay = req.donorContributions.filter(
              (c) => c.status === 'ACCEPTED' || c.status === 'AWAITING_DONATION'
            ).length;

            return (
              <div
                key={req.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge type="emergency" value={req.emergencyLevel} />
                      <StatusBadge type="request" value={req.status} />
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{req.id.length > 12 ? req.id.slice(0, 8).toUpperCase() : req.id}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                      {req.patientName}
                    </h3>

                    <div className="text-xs text-slate-500 flex items-center gap-4">
                      <span>Required By: <strong>{formatDateTime(req.requiredDateTime)}</strong></span>
                      <span>•</span>
                      <span>Contact: {req.contactNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900">
                        {req.confirmedUnits} / {req.requiredUnits}{' '}
                        <span className="text-xs font-normal text-slate-500">Units</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-600">
                        {req.remainingUnits} units remaining
                      </div>
                    </div>

                    <div className="px-3.5 py-2.5 rounded-2xl bg-rose-50 text-rose-700 font-black text-xl border border-rose-200">
                      {req.bloodGroup}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Tracking stats & Launch button */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-600 font-semibold">
                    <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                      <Users className="w-3.5 h-3.5" />
                      {activeDonorsOnWay} Donors En Route
                    </span>
                    <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                      <Building2 className="w-3.5 h-3.5" />
                      {req.bloodBankContributions.length} Blood Banks Engaged
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReqId(req.id)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold inline-flex items-center gap-2 transition-all shadow-xs"
                    >
                      <Navigation className="w-4 h-4 text-blue-300" />
                      <span>Launch Live Radar & Audit Log</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {req.hospitalId === currentHospital.id && (
                      <button
                        onClick={() => setDeleteConfirmReqId(req.id)}
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all inline-flex items-center gap-1.5"
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

export default HospitalTrackingHub;
