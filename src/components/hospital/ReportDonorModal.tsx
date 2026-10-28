import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { UserReport } from '../../types';
import { ShieldAlert, X } from 'lucide-react';

interface ReportDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDonorId?: string;
  initialRequestId?: string;
}

export const ReportDonorModal: React.FC<ReportDonorModalProps> = ({
  isOpen,
  onClose,
  initialDonorId = '',
  initialRequestId = '',
}) => {
  const { submitReport, users } = useLifeDrop();

  const [donorId, setDonorId] = useState(initialDonorId);
  const [requestId, setRequestId] = useState(initialRequestId);
  const [reason, setReason] = useState<UserReport['reason']>('Repeated false acceptance');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorId || !requestId || !description) {
      alert('Please fill out all fields.');
      return;
    }

    submitReport({
      reportedUserId: donorId,
      requestId,
      reason,
      description,
    });

    alert('Report submitted to LifeDrop Admin for formal review.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-lifedrop-navy">
              Report Donor / Misuse
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Donor ID:</label>
            <input
              type="text"
              required
              placeholder="e.g. LD-DON-1045"
              value={donorId}
              onChange={(e) => setDonorId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Emergency Request ID:</label>
            <input
              type="text"
              required
              placeholder="e.g. LD1025"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Report:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as UserReport['reason'])}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="Repeated false acceptance">Repeated false acceptance</option>
              <option value="Fraud">Fraud / Fake Identity</option>
              <option value="Fake details">Fake Blood Group Details</option>
              <option value="Suspicious activity">Suspicious Activity</option>
              <option value="Misuse">Platform Misuse</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Detailed Description:</label>
            <textarea
              rows={3}
              required
              placeholder="Describe the incident objectively for the administrator..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            />
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
              className="px-5 py-2.5 rounded-xl bg-lifedrop-emergency hover:bg-rose-700 text-white font-extrabold shadow-md"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
