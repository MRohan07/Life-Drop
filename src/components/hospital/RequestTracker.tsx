import React, { useState, useEffect } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodRequest } from '../../types';
import api from '../../lib/api/client';
import { transformBackendRequest } from '../../lib/api/transformers';
import { EmergencyRadar } from '../radar/EmergencyRadar';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import {
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Warehouse,
  ArrowLeft,
  Phone,
  AlertCircle,
  FileCheck2,
  ShieldAlert,
  Trash2,
  Navigation,
  MapPin,
} from 'lucide-react';
import { formatDateTime, formatPhone } from '../../utils/formatters';

interface RequestTrackerProps {
  requestId: string;
  onBack: () => void;
  onReportDonor?: (donorId: string, requestId: string) => void;
}

export const RequestTracker: React.FC<RequestTrackerProps> = ({
  requestId,
  onBack,
  onReportDonor,
}) => {
  const { requests, bloodBanks, closeRequest, deleteBloodRequest, currentHospital, currentRole } = useLifeDrop();
  const [confirmCloseModalOpen, setConfirmCloseModalOpen] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchedRequest, setFetchedRequest] = useState<BloodRequest | null>(null);
  const [navModal, setNavModal] = useState<{
    isOpen: boolean;
    name: string;
    address: string;
    phone: string;
    lat: number;
    lng: number;
  }>({
    isOpen: false,
    name: '',
    address: '',
    phone: '',
    lat: 16.3067,
    lng: 80.4365,
  });
  const [loading, setLoading] = useState(false);

  const request = requests.find((r) => r.id === requestId) || fetchedRequest;

  useEffect(() => {
    // If not found in memory context, fetch directly from PostgreSQL API backend
    if (requestId && !requests.find((r) => r.id === requestId)) {
      setLoading(true);
      api.requests
        .getById(requestId)
        .then((res: any) => {
          const raw = res?.request || res?.data?.request || res;
          if (raw && raw.id) {
            setFetchedRequest(transformBackendRequest(raw));
          }
        })
        .catch((err) => {
          console.warn('RequestTracker failed to fetch request by id:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [requestId, requests]);

  if (loading && !request) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <Activity className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">
          Loading Request #{requestId.length > 12 ? requestId.slice(0, 8).toUpperCase() : requestId}...
        </h3>
        <p className="text-xs text-slate-500 mt-1">Fetching live radar requisition state...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">
          Request #{requestId.length > 12 ? requestId.slice(0, 8).toUpperCase() : requestId} Not Found
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This blood request could not be located or may have been removed.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Back to List
        </button>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round((request.confirmedUnits / request.requiredUnits) * 100)
  );

  const isFulfilled = request.status === 'FULFILLED' || request.remainingUnits === 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests
        </button>

        <div className="flex items-center gap-3">
          <StatusBadge type="emergency" value={request.emergencyLevel} />
          <StatusBadge type="request" value={request.status} />

          {isFulfilled && request.status !== 'CLOSED' && (
            <button
              onClick={() => setConfirmCloseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
            >
              Close Request
            </button>
          )}

          {(request.hospitalId === currentHospital.id || currentRole === 'ADMIN') && (
            <button
              onClick={() => setConfirmDeleteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Requisition</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI & Progress Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
              Emergency Request #{request.id.length > 12 ? request.id.slice(0, 8).toUpperCase() : request.id}
            </div>
            <h2 className="text-2xl font-extrabold text-lifedrop-navy mt-1">
              {request.patientName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {request.hospitalName} • Needed by {formatDateTime(request.requiredDateTime)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-lifedrop-primary font-black text-lg">
              {request.bloodGroup} Blood Group
            </span>
          </div>
        </div>

        {/* 4-Metric Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Required</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {request.requiredUnits} <span className="text-xs font-normal text-slate-500">Units</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Confirmed Received</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {request.confirmedUnits} <span className="text-xs font-normal text-emerald-600">Units</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
            <div className="text-[10px] uppercase font-bold text-purple-700">Allocated / Reserved</div>
            <div className="text-2xl font-black text-purple-700 mt-0.5">
              {request.allocatedUnits} <span className="text-xs font-normal text-purple-600">Units</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
            <div className="text-[10px] uppercase font-bold text-rose-700">Remaining Needed</div>
            <div className="text-2xl font-black text-lifedrop-primary mt-0.5">
              {request.remainingUnits} <span className="text-xs font-normal text-rose-500">Units</span>
            </div>
          </div>
        </div>

        {/* Visual Fulfillment Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Overall Fulfillment Progress</span>
            <span className={isFulfilled ? 'text-emerald-700' : 'text-lifedrop-primary'}>
              {progressPercent}% Complete
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isFulfilled
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                  : 'bg-gradient-to-r from-lifedrop-primary to-rose-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Signature Emergency Radar UI Display */}
      <div className="space-y-3">
        <h3 className="text-lg font-extrabold text-lifedrop-navy flex items-center gap-2">
          <Activity className="w-5 h-5 text-lifedrop-primary" />
          Live Emergency Radar & Node Synchronization
        </h3>
        <EmergencyRadar request={request} />
      </div>

      {/* Contributions Breakdown (Blood Banks vs Donors) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Contributions Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-lifedrop-navy flex items-center gap-2">
              <Users className="w-4 h-4 text-lifedrop-primary" />
              Donor Responses & Arrivals
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {request.donorContributions.length} Responses
            </span>
          </div>

          {request.donorContributions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No individual donors have responded yet. Radar continues scanning.
            </div>
          ) : (
            <div className="space-y-3">
              {request.donorContributions.map((donor, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      {donor.donorName}
                      <span className="text-rose-600 font-bold text-xs">({donor.bloodGroup})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Phone: {formatPhone(donor.phone)} • Accepted: {donor.acceptedAt}
                    </div>
                    {donor.declineReason && (
                      <div className="text-[10px] text-slate-400 mt-1 italic">
                        Note: {donor.declineReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge type="donorResponse" value={donor.status} size="sm" />
                    {onReportDonor && donor.status === 'NO_SHOW' && (
                      <button
                        onClick={() => onReportDonor(donor.donorId, request.id)}
                        className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3 h-3" /> Report Donor
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blood Bank Contributions Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-lifedrop-navy flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-blue-600" />
              Blood Bank Supplies & Reservations
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {request.bloodBankContributions.length} Blood Banks
            </span>
          </div>

          {request.bloodBankContributions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No blood bank reservations for this request yet.
            </div>
          ) : (
            <div className="space-y-3">
              {request.bloodBankContributions.map((bb, idx) => {
                const matchedBB = bloodBanks.find((b) => b.id === bb.bloodBankId);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {bb.bloodBankName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Allocated: <strong>{bb.allocatedUnits} Units</strong> ({bb.bloodGroup})
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Reserved at: {bb.reservedAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setNavModal({
                            isOpen: true,
                            name: bb.bloodBankName,
                            address: matchedBB?.address || 'Certified Regional Blood Center',
                            phone: matchedBB?.phone || '',
                            lat: matchedBB?.latitude || 16.3067,
                            lng: matchedBB?.longitude || 80.4365,
                          })
                        }
                        className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all flex items-center gap-1"
                        title="Navigate to this blood bank"
                      >
                        <Navigation className="w-3 h-3 text-blue-600 fill-current" />
                        <span>Map</span>
                      </button>

                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          bb.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {bb.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Connected Audit Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-lifedrop-navy flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Request Event & Fulfillment Timeline
        </h3>

        <div className="relative pl-6 space-y-6 border-l-2 border-slate-200">
          {request.timeline.map((step, idx) => (
            <div key={idx} className="relative group">
              <div
                className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                  step.type === 'fulfilment'
                    ? 'bg-emerald-500'
                    : step.type === 'creation'
                    ? 'bg-lifedrop-primary'
                    : step.type === 'cancel'
                    ? 'bg-rose-500'
                    : 'bg-blue-500'
                }`}
              />
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-extrabold text-slate-800">{step.title}</h4>
                  <span className="text-[11px] text-slate-400">{step.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmCloseModalOpen}
        onClose={() => setConfirmCloseModalOpen(false)}
        onConfirm={() => {
          closeRequest(request.id);
          setConfirmCloseModalOpen(false);
        }}
        title={`Close Blood Requisition #${request.id.length > 12 ? request.id.slice(0, 8).toUpperCase() : request.id}`}
        message="Are you sure you want to close this emergency request? This marks the patient request as completed and stops active matching."
        impactDetails="All fulfilled units will be permanently archived into completed medical records."
        confirmText="Yes, Close Request"
        cancelText="Keep Open"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await deleteBloodRequest(request.id);
            setConfirmDeleteModalOpen(false);
            onBack();
          } finally {
            setIsDeleting(false);
          }
        }}
        title={`Delete Blood Requisition #${request.id.length > 12 ? request.id.slice(0, 8).toUpperCase() : request.id}`}
        message="Are you sure you want to permanently delete this requisition? This will stop all active donor matching and blood bank reservations."
        impactDetails="This action cannot be undone. All committed donors will be notified and released."
        confirmText="Yes, Delete Request"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Navigation Modal */}
      {navModal.isOpen && (
        <GoogleMapsModal
          isOpen={navModal.isOpen}
          onClose={() => setNavModal((prev) => ({ ...prev, isOpen: false }))}
          destinationName={navModal.name}
          destinationAddress={navModal.address}
          destinationPhone={navModal.phone}
          destinationType="Blood Bank"
          latitude={navModal.lat}
          longitude={navModal.lng}
          isVerified={true}
        />
      )}
    </div>
  );
};
