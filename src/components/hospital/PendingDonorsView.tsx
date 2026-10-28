/* @module: PendingDonorsView — Clinical Donor Verification, Arrival Check-In & Transfusion Receipt */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { UserProfile, BloodRequest } from '../../types';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  XCircle,
  ShieldCheck,
  FileCheck2,
  X,
  Phone,
} from 'lucide-react';
import { formatDate, formatPhone } from '../../utils/formatters';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PendingDonorsViewProps {
  onSelectRequest?: (requestId: string) => void;
}

export const PendingDonorsView: React.FC<PendingDonorsViewProps> = ({ onSelectRequest }) => {
  const {
    users,
    requests,
    currentHospital,
    hospitalConfirmDonation,
    hospitalMarkNoShow,
    hospitalMarkNotCompleted,
  } = useLifeDrop();

  const [searchDonorId, setSearchDonorId] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<UserProfile | null>(null);
  const [targetRequestId, setTargetRequestId] = useState<string>('');
  const [unitsToConfirm, setUnitsToConfirm] = useState<number>(1);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [noShowConfirmData, setNoShowConfirmData] = useState<{ donorId: string; reqId: string; donorName: string } | null>(null);

  // Incomplete / Deferral modal state
  const [incompleteModalOpen, setIncompleteModalOpen] = useState(false);
  const [incompleteDonorData, setIncompleteDonorData] = useState<{ donorId: string; reqId: string } | null>(null);
  const [deferralReason, setDeferralReason] = useState<string>('Low Hemoglobin (< 12.5 g/dL)');

  const handleConfirmNoShow = () => {
    if (!noShowConfirmData) return;
    const res = hospitalMarkNoShow(noShowConfirmData.reqId, noShowConfirmData.donorId);
    if (res.success) {
      setActionSuccessMsg(`Donor commitment released. Requisition #${noShowConfirmData.reqId} radar search resumed.`);
      setSelectedDonor(null);
    }
    setNoShowConfirmData(null);
  };

  // Find all active requests for current hospital
  const hospitalRequests = requests.filter((r) => r.hospitalId === currentHospital.id);

  // Collect all committed donors across hospital requests
  const activeCommittedDonors = hospitalRequests.flatMap((req) =>
    req.donorContributions
      .filter((c) => c.status === 'ACCEPTED' || c.status === 'AWAITING_DONATION')
      .map((c) => {
        const user = users.find((u) => u.id === c.donorId);
        return {
          contribution: c,
          request: req,
          user,
        };
      })
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchDonorId.trim()) return;

    const donor = users.find(
      (u) =>
        u.id.toLowerCase() === searchDonorId.trim().toLowerCase() ||
        u.phone === searchDonorId.trim() ||
        u.name.toLowerCase().includes(searchDonorId.trim().toLowerCase())
    );

    if (donor) {
      setSelectedDonor(donor);
      const matchingReq = hospitalRequests.find(
        (r) =>
          r.id === donor.activeCommitmentRequestId ||
          r.donorContributions.some((c) => c.donorId === donor.id)
      );
      if (matchingReq) {
        setTargetRequestId(matchingReq.id);
      } else if (hospitalRequests.length > 0) {
        setTargetRequestId(hospitalRequests[0].id);
      }
    } else {
      alert(`Donor "${searchDonorId}" not found in system registry.`);
    }
  };

  const handleConfirmDonation = () => {
    if (!selectedDonor || !targetRequestId) {
      alert('Please select target patient requisition.');
      return;
    }

    const res = hospitalConfirmDonation(targetRequestId, selectedDonor.id, unitsToConfirm);
    if (res.success) {
      setActionSuccessMsg(
        `Clinical receipt generated: ${unitsToConfirm} unit(s) of ${selectedDonor.bloodGroup} collected from ${selectedDonor.name} and credited to Requisition #${targetRequestId}.`
      );
      setSelectedDonor(null);
      setSearchDonorId('');
    } else {
      alert(res.message);
    }
  };

  const handleNoShow = (donorId: string, reqId: string) => {
    const res = hospitalMarkNoShow(reqId, donorId);
    if (res.success) {
      setActionSuccessMsg(`Donor commitment released. Requisition #${reqId} radar search resumed.`);
      setSelectedDonor(null);
    }
  };

  const handleOpenIncompleteModal = (donorId: string, reqId: string) => {
    setIncompleteDonorData({ donorId, reqId });
    setIncompleteModalOpen(true);
  };

  const handleConfirmNotCompleted = () => {
    if (!incompleteDonorData) return;
    const res = hospitalMarkNotCompleted(
      incompleteDonorData.reqId,
      incompleteDonorData.donorId,
      deferralReason
    );
    if (res.success) {
      setActionSuccessMsg(
        `Clinical deferral recorded: ${deferralReason}. Donor released with no penalty.`
      );
      setIncompleteModalOpen(false);
      setIncompleteDonorData(null);
      setSelectedDonor(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            Transfusion Arrival Desk
          </span>
          <span className="text-xs font-mono text-slate-400">
            {currentHospital.name}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Donor Arrival Check-In & Transfusion Verification
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Verify arrived donors at the transfusion reception desk, screen identification and eligibility, collect blood units, and update patient requisition records.
        </p>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Donor Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          <span>Lookup Arrived Donor (LifeDrop ID, Name, or Phone)</span>
        </h3>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. LD-DON-1045, Hemendra, or phone 9848012345"
              value={searchDonorId}
              onChange={(e) => setSearchDonorId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all sm:w-auto"
          >
            Lookup Donor
          </button>
        </form>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span>Registered donor test IDs:</span>
          <button
            onClick={() => setSearchDonorId('LD-DON-1045')}
            className="font-mono text-blue-600 font-bold hover:underline"
          >
            LD-DON-1045 (Hemendra)
          </button>
          <span>•</span>
          <button
            onClick={() => setSearchDonorId('LD-DON-1047')}
            className="font-mono text-blue-600 font-bold hover:underline"
          >
            LD-DON-1047 (Sahith)
          </button>
        </div>
      </div>

      {/* Selected Donor Verification & Confirmation Card */}
      {selectedDonor && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-600 shadow-md space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                Transfusion Candidate Verified
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                {selectedDonor.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {selectedDonor.id} • Phone: {formatPhone(selectedDonor.phone)} • City: {selectedDonor.city}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 font-black text-2xl border border-rose-200 shadow-2xs">
                {selectedDonor.bloodGroup}
              </span>
            </div>
          </div>

          {/* Clinical Screening Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Eligibility Check</span>
              <div
                className={`font-extrabold text-sm ${
                  selectedDonor.isEligible ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {selectedDonor.isEligible ? '✓ Screened & Eligible' : '⚠️ Waiting Period Active'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Last Donation Date</span>
              <div className="font-bold text-slate-800 text-sm">
                {selectedDonor.lastDonationDate ? formatDate(selectedDonor.lastDonationDate) : 'First Time Donor'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Lifetime Units Donated</span>
              <div className="font-black text-slate-900 text-sm">
                {selectedDonor.totalDonations} Verified Units
              </div>
            </div>
          </div>

          {/* Transfusion Allocation Link */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Allocate Blood Units to Patient Requisition
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Patient Requisition:</label>
                <select
                  value={targetRequestId}
                  onChange={(e) => setTargetRequestId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                >
                  {hospitalRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} - {r.patientName} ({r.remainingUnits} units needed, {r.bloodGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Number of Units Collected:</label>
                <input
                  type="number"
                  min={1}
                  max={2}
                  value={unitsToConfirm}
                  onChange={(e) => setUnitsToConfirm(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white font-black text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNoShowConfirmData({ donorId: selectedDonor.id, reqId: targetRequestId, donorName: selectedDonor.name })}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
              >
                Mark No-Show
              </button>
              <button
                onClick={() => handleOpenIncompleteModal(selectedDonor.id, targetRequestId)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              >
                Clinical Deferral / Incomplete
              </button>
            </div>

            <button
              onClick={handleConfirmDonation}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Transfusion & Generate Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* Committed Donors En Route */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Committed Donors En Route to Hospital ({activeCommittedDonors.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Donors who confirmed an emergency call and are currently traveling to {currentHospital.name}.
          </p>
        </div>

        {activeCommittedDonors.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-xs shadow-xs">
            No donors currently marked en route. Emergency broadcast is active.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCommittedDonors.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                        En Route to Hospital
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1.5">
                        {item.contribution.donorName}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        Donor ID: {item.contribution.donorId} • Phone: {formatPhone(item.contribution.phone)}
                      </p>
                    </div>

                    <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-black text-base">
                      {item.contribution.bloodGroup}
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="text-slate-700">
                      Assigned Ticket: <strong>#{item.request.id}</strong> ({item.request.patientName})
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Committed At: {item.contribution.acceptedAt}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (item.user) {
                        setSelectedDonor(item.user);
                        setTargetRequestId(item.request.id);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all"
                  >
                    Arrived: Check-In & Verify
                  </button>

                  <button
                    onClick={() => setNoShowConfirmData({ donorId: item.contribution.donorId, reqId: item.request.id, donorName: item.contribution.donorName })}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                  >
                    No-Show
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Deferral Modal */}
      {incompleteModalOpen && incompleteDonorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Record Clinical Deferral</h3>
              </div>
              <button
                onClick={() => setIncompleteModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Specify the clinical reason why donation could not be completed on-site. The donor's commitment will be released and the emergency search will continue.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Deferral:</label>
                <select
                  value={deferralReason}
                  onChange={(e) => setDeferralReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="Low Hemoglobin (< 12.5 g/dL)">Low Hemoglobin (&lt; 12.5 g/dL)</option>
                  <option value="Vein Access Difficulty / Collapse">Vein Access Difficulty / Collapse</option>
                  <option value="Vaso-Vagal Reaction / Dizziness">Vaso-Vagal Reaction / Dizziness</option>
                  <option value="Recent Medication / Transient Deferral">Recent Medication / Transient Deferral</option>
                  <option value="Blood Pressure Out of Range">Blood Pressure Out of Range</option>
                  <option value="Donor Requested Discontinuation">Donor Requested Discontinuation</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIncompleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmNotCompleted}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
                >
                  Confirm Deferral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No-Show Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!noShowConfirmData}
        onClose={() => setNoShowConfirmData(null)}
        onConfirm={handleConfirmNoShow}
        title="Mark Donor as No-Show"
        message={`Are you sure you want to record ${noShowConfirmData?.donorName} as a No-Show for Requisition #${noShowConfirmData?.reqId}?`}
        impactDetails="This will release their active commitment, log an attendance incident against this profile, and automatically restart search radar to find replacement donors."
        confirmText="Yes, Mark No-Show"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default PendingDonorsView;
