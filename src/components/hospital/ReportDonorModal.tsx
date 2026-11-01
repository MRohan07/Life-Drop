import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { UserReport } from '../../types';
import { ShieldAlert, X, AlertTriangle, UserCheck } from 'lucide-react';

interface ReportDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDonorId?: string;
  initialRequestId?: string;
  facilityType?: 'Hospital' | 'Blood Bank';
}

export const ReportDonorModal: React.FC<ReportDonorModalProps> = ({
  isOpen,
  onClose,
  initialDonorId = '',
  initialRequestId = '',
  facilityType = 'Hospital',
}) => {
  const { submitReport, users, requests, currentHospital } = useLifeDrop();

  const [donorId, setDonorId] = useState(initialDonorId);
  const [requestId, setRequestId] = useState(initialRequestId);
  const [reason, setReason] = useState<UserReport['reason']>('Repeated false acceptance');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync state if initial props change
  React.useEffect(() => {
    if (isOpen) {
      setDonorId(initialDonorId);
      setRequestId(initialRequestId);
      setDescription('');
      setIsSubmitted(false);
    }
  }, [isOpen, initialDonorId, initialRequestId]);

  if (!isOpen) return null;

  const targetDonor = users.find((u) => u.id === donorId);
  const hospitalRequests = requests.filter((r) => r.hospitalId === currentHospital?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorId.trim() || !description.trim()) {
      alert('Please fill out donor ID and detailed incident description.');
      return;
    }

    submitReport({
      reportedUserId: donorId.trim(),
      requestId: requestId.trim() || undefined,
      reason,
      description: description.trim(),
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-lifedrop-navy">
                File Incident Report
              </h3>
              <p className="text-[11px] text-slate-400">
                Formal complaint for state administrative oversight & disciplinary review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Incident Report Submitted</h4>
            <p className="text-xs text-slate-500">
              Admin team notified. Case has been added to the moderation ledger.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Donor Selection / Target */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Donor / User:</label>
              {initialDonorId ? (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block">
                      {targetDonor?.name || initialDonorId}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">ID: {initialDonorId}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Group: {targetDonor?.bloodGroup || 'N/A'}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={donorId}
                    onChange={(e) => setDonorId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="">-- Select Registered Donor or Enter ID below --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.bloodGroup}) — {u.id}
                      </option>
                    ))}
                  </select>
                  {!donorId && (
                    <input
                      type="text"
                      placeholder="Or manually type Donor ID (e.g. LD-DON-1049)"
                      value={donorId}
                      onChange={(e) => setDonorId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Linked Blood Request (Optional) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Linked Requisition / Request ID <span className="text-slate-400 font-normal">(Optional)</span>:
              </label>
              {initialRequestId ? (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-700">
                  #{initialRequestId}
                </div>
              ) : (
                <select
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="">None / General Misconduct (Not tied to single request)</option>
                  {hospitalRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      #{req.id} — Patient: {req.patientName} ({req.bloodGroup}, {req.requiredUnits} units)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Reason for Report */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason for Complaint:</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as UserReport['reason'])}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="Repeated false acceptance">Repeated false acceptance (Confirmed then No-Show)</option>
                <option value="Fraud">Fraud / Fake Identity / Payment Demanded</option>
                <option value="Fake details">Fake Blood Group Details or Fabricated Records</option>
                <option value="Suspicious activity">Suspicious Activity / Commercial Blood Selling</option>
                <option value="Misuse">Platform Misuse / Verbal Misconduct</option>
                <option value="Other">Other Disciplinary Issue</option>
              </select>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Objective Incident Log:</label>
              <textarea
                rows={3}
                required
                placeholder="State the facts clearly for administrative disciplinary action..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-900 flex items-start gap-2 text-[11px] leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Filing an incident report places the donor under formal administrative review. System administrators can issue formal cautions, deduct donor ranking points, or suspend system access.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-lifedrop-emergency hover:bg-rose-700 text-white font-extrabold shadow-md flex items-center gap-1.5 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                Submit Incident Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
