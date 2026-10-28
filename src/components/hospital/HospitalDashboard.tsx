/* @module: HospitalDashboard — Master operational overview of hospital blood transfusion operations */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { CreateRequestModal } from './CreateRequestModal';
import { RequestTracker } from './RequestTracker';
import { ReportDonorModal } from './ReportDonorModal';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  Building2,
  Radio,
  PlusCircle,
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Warehouse,
  ArrowRight,
  ShieldAlert,
  Trash2,
  Receipt,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

interface HospitalDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ onNavigateTab }) => {
  const { currentHospital, requests, bloodBanks, deleteBloodRequest } = useLifeDrop();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedReqIdForTracking, setSelectedReqIdForTracking] = useState<string | null>(null);
  const [deleteConfirmReqId, setDeleteConfirmReqId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const activeRequests = hospitalRequests.filter(
    (r) => r.status !== 'CLOSED' && r.status !== 'CANCELLED' && r.status !== 'FULFILLED'
  );
  const fulfilledRequests = hospitalRequests.filter((r) => r.status === 'FULFILLED' || r.status === 'CLOSED');

  const totalRequired = activeRequests.reduce((sum, r) => sum + r.remainingUnits, 0);
  const totalConfirmed = hospitalRequests.reduce((sum, r) => sum + r.confirmedUnits, 0);

  // En route donors count across active requests
  const enRouteDonorsCount = activeRequests.reduce(
    (sum, req) =>
      sum +
      req.donorContributions.filter(
        (c) => c.status === 'ACCEPTED' || c.status === 'AWAITING_DONATION'
      ).length,
    0
  );

  if (selectedReqIdForTracking) {
    return (
      <RequestTracker
        requestId={selectedReqIdForTracking}
        onBack={() => setSelectedReqIdForTracking(null)}
        onReportDonor={(donorId, reqId) =>
          setReportModalData({ isOpen: true, donorId, requestId: reqId })
        }
      />
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Hospital Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Hospital Node
              </span>
              <span className="text-xs font-mono text-slate-400">
                License: {currentHospital.licenseNumber}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentHospital.name}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Hospital Emergency Coordination Dashboard. Broadcast emergency blood requirements directly to compatible nearby donors and regional blood banks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('hosp-transactions')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all duration-200"
            >
              <Receipt className="w-4 h-4 text-rose-400" />
              <span>Transactions Ledger</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 border border-rose-400/30 flex-shrink-0 text-center"
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span>Raise Blood Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-extrabold">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Active Requests</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {activeRequests.length}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Units Still Needed</div>
            <div className="text-2xl font-extrabold text-rose-600 mt-0.5">
              {totalRequired}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-extrabold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Donors En Route</div>
            <div className="text-2xl font-extrabold text-purple-700 mt-0.5">
              {enRouteDonorsCount}
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('hosp-transactions')}
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Confirmed Units Received</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {totalConfirmed}
            </div>
            <span className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 mt-0.5">
              <span>View Full Ledger</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Hospital Emergency Requests Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              Active Hospital Blood Requests ({activeRequests.length})
            </h3>
            <p className="text-xs text-slate-500">
              Live emergency coordination tickets with real-time donor and blood bank responses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('hosp-emergency')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              View All Requisitions
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              New Emergency Request
            </button>
          </div>
        </div>

        {activeRequests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No active emergency requests</h4>
            <p className="text-xs text-slate-400 mt-1">
              All blood requirements for {currentHospital.name} have been fulfilled or closed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRequests.map((req) => (
              <div
                key={req.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="emergency" value={req.emergencyLevel} />
                      <StatusBadge type="request" value={req.status} />
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{req.id.length > 12 ? req.id.slice(0, 8).toUpperCase() : req.id}
                      </span>
                    </div>

                    <h4 className="text-lg font-extrabold text-slate-900 mt-2">
                      {req.patientName}
                    </h4>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Needed By: <strong>{formatDateTime(req.requiredDateTime)}</strong> • Contact: {req.contactNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
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

                    <span className="px-4 py-3 rounded-2xl bg-rose-50 text-rose-700 font-black text-xl border border-rose-200">
                      {req.bloodGroup}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (req.confirmedUnits / req.requiredUnits) * 100)}%`,
                    }}
                  />
                </div>

                {/* Responses Preview & Tracker Link */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="w-4 h-4 text-purple-600" />
                      {req.donorContributions.length} Donor Responses
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      {req.bloodBankContributions.length} Blood Banks Engaged
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateTab('hosp-donors')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                    >
                      Check Donors
                    </button>
                    <button
                      onClick={() => setSelectedReqIdForTracking(req.id)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all"
                    >
                      Open Live Radar & Tracking
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
            ))}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onRequestCreated={(id) => {
          setSelectedReqIdForTracking(id);
        }}
      />

      {/* Report Modal */}
      <ReportDonorModal
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData({ isOpen: false, donorId: '', requestId: '' })}
        initialDonorId={reportModalData.donorId}
        initialRequestId={reportModalData.requestId}
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

export default HospitalDashboard;
