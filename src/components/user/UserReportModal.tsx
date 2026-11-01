import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { UserReport } from '../../types';
import { ShieldAlert, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UserReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRequestId?: string;
  targetFacilityName?: string;
  targetFacilityId?: string;
}

export const UserReportModal: React.FC<UserReportModalProps> = ({
  isOpen,
  onClose,
  targetRequestId = '',
  targetFacilityName = '',
  targetFacilityId = '',
}) => {
  const { submitReport, requests, hospitals, bloodBanks } = useLifeDrop();

  const [requestId, setRequestId] = useState(targetRequestId);
  const [reason, setReason] = useState<UserReport['reason']>('Fraud');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<'REQUEST' | 'FACILITY' | 'OTHER'>(
    targetRequestId ? 'REQUEST' : targetFacilityName ? 'FACILITY' : 'REQUEST'
  );
  const [selectedFacilityId, setSelectedFacilityId] = useState(targetFacilityId);
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setRequestId(targetRequestId);
      setSelectedFacilityId(targetFacilityId);
      setDescription('');
      setIsSubmitted(false);
      setTargetType(targetRequestId ? 'REQUEST' : targetFacilityName ? 'FACILITY' : 'REQUEST');
    }
  }, [isOpen, targetRequestId, targetFacilityName, targetFacilityId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please provide details explaining the incident or violation.');
      return;
    }

    let reportedId = 'UNKNOWN';
    if (targetType === 'REQUEST' && requestId) {
      const req = requests.find((r) => r.id === requestId);
      reportedId = req?.hospitalId || requestId;
    } else if (targetType === 'FACILITY' && selectedFacilityId) {
      reportedId = selectedFacilityId;
    } else {
      reportedId = 'GENERAL_REPORT';
    }

    submitReport({
      reportedUserId: reportedId,
      requestId: requestId || undefined,
      reason,
      description: `[Donor Report] ${description.trim()}`,
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
                Report Issue or Suspicious Activity
              </h3>
              <p className="text-[11px] text-slate-400">
                Help keep the LifeDrop emergency blood network safe and scam-free
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
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Report Submitted</h4>
            <p className="text-xs text-slate-500">
              Thank you for keeping our platform secure. Our moderation team has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Target Type Selector */}
            {!targetRequestId && !targetFacilityName && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">What are you reporting?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'REQUEST', label: 'Blood Request' },
                    { id: 'FACILITY', label: 'Hospital / Blood Bank' },
                    { id: 'OTHER', label: 'Other Misconduct' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetType(t.id as any)}
                      className={`p-2 rounded-xl font-bold border transition-all text-center ${
                        targetType === t.id
                          ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Target Details */}
            {targetRequestId ? (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">Reporting Emergency Request:</span>
                <span className="font-mono font-black text-rose-600">#{targetRequestId}</span>
              </div>
            ) : targetType === 'REQUEST' ? (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Blood Request:</label>
                <select
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="">-- Choose request or leave blank --</option>
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} - {r.hospitalName} ({r.bloodGroup}, Patient: {r.patientName})
                    </option>
                  ))}
                </select>
              </div>
            ) : targetType === 'FACILITY' ? (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Hospital or Blood Bank:</label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="">-- Choose Facility --</option>
                  <optgroup label="Hospitals">
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.city})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Blood Banks">
                    {bloodBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ) : null}

            {/* Reason */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason for Report:</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as UserReport['reason'])}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="Fraud">Payment Demanded for Blood (Commercial Sale / Extortion)</option>
                <option value="Fake details">Fake Patient Details or Inaccurate Medical Need</option>
                <option value="Suspicious activity">Suspicious Activity / Harassment</option>
                <option value="Misuse">Platform Misuse / Inappropriate Communication</option>
                <option value="Other">Other Safety Violation</option>
              </select>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Describe What Happened:</label>
              <textarea
                rows={3}
                required
                placeholder="Explain the incident with relevant details (e.g. money demanded, rude behavior, wrong address)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-900 flex items-start gap-2 text-[11px] leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Blood donation is 100% voluntary and free by law. Commercial trading or extortion is strictly prohibited and immediately investigated by state platform moderators.
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
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

