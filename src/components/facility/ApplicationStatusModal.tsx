import React, { useState } from 'react';
import { api } from '../../lib/api/client';
import {
  Search,
  Building2,
  Warehouse,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  X,
  FileText,
  Send,
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/formatters';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActivation?: (token: string) => void;
}

export const ApplicationStatusModal: React.FC<ApplicationStatusModalProps> = ({
  isOpen,
  onClose,
  onOpenActivation,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any | null>(null);

  // Additional info response state
  const [responseNotes, setResponseNotes] = useState('');
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
  const [infoSuccessMsg, setInfoSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setErrorMsg(null);
    setIsLoading(true);
    setStatusData(null);
    setInfoSuccessMsg(null);

    try {
      const res: any = await api.facilityApplications.checkStatusWithCredentials({
        identifier: identifier.trim(),
        password: password.trim() || undefined,
      });
      const data = res?.data || res;
      if (data?.referenceNumber || data?.name) {
        setStatusData(data);
      } else {
        setErrorMsg('Application details not found.');
      }
    } catch (err: any) {
      console.error('Status check error:', err);
      setErrorMsg(err.message || 'No application found with the provided credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAdditionalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseNotes.trim() || !statusData) return;
    setIsSubmittingInfo(true);
    setErrorMsg(null);

    try {
      const res: any = await api.facilityApplications.submitAdditionalInfo(statusData.referenceNumber, {
        responseNotes: responseNotes.trim(),
      });
      setInfoSuccessMsg('Additional information submitted. Your application is now marked UNDER_REVIEW.');
      setStatusData((prev: any) => ({ ...prev, status: 'UNDER_REVIEW' }));
      setResponseNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit additional information.');
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Initial Review
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            Under Active Review
          </span>
        );
      case 'NEEDS_INFORMATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
            Additional Information Requested
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved • Ready for Activation
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Application Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
            Facility Suspended
          </span>
        );
      default:
        return <span className="text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 relative flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Facility Application Tracker</h2>
                <p className="text-xs text-slate-300">Check government review status and respond to queries</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Lookup Form */}
          <form onSubmit={handleSearch} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email, Phone, or Reference Number *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. director@facility.org, +91..., or APP-HOSP-..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Application Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password entered during registration"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-lifedrop-primary hover:bg-lifedrop-emergency text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Verifying & Checking Status...' : 'Track Application Status'}
              <Search className="w-4 h-4" />
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold">
              {errorMsg}
            </div>
          )}

          {infoSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold">
              {infoSuccessMsg}
            </div>
          )}

          {/* Result Card */}
          {statusData && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{statusData.name}</h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {statusData.facilityType === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'} • {statusData.city}
                  </div>
                </div>
                <div>{getStatusBadge(statusData.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Reference:</span>
                  <span className="font-mono font-bold text-slate-800">{statusData.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Submitted:</span>
                  <span className="font-semibold">{formatDate(statusData.submittedDate)}</span>
                </div>
              </div>

              {/* Status Specific Messages */}
              {statusData.status === 'PENDING' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                  Your application is currently queued for administrator approval. All system admins have been notified and can review and approve your registration.
                </div>
              )}

              {statusData.status === 'UNDER_REVIEW' && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 font-medium">
                  An administrator is actively reviewing your submitted license details and facility records.
                </div>
              )}

              {statusData.status === 'NEEDS_INFORMATION' && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-purple-900">Administrator Query:</div>
                      <div className="text-xs text-purple-800 mt-0.5 font-medium">
                        "{statusData.requestedInfoQuery}"
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitAdditionalInfo} className="space-y-2 pt-2 border-t border-purple-200">
                    <label className="block text-[11px] font-bold text-purple-900">
                      Submit Your Response:
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder="Provide the requested license clarification or hospital details..."
                      className="w-full p-2.5 rounded-xl border border-purple-300 text-xs font-medium focus:ring-2 focus:ring-purple-600 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingInfo}
                      className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmittingInfo ? 'Submitting Info...' : 'Send Information Back for Review'}
                    </button>
                  </form>
                </div>
              )}

              {statusData.status === 'APPROVED' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Congratulations! Your application has been approved.
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">
                    Your facility account is now active. You can log into the system immediately using your official email ({statusData.email}) and the password you set during registration.
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Go to Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {statusData.status === 'REJECTED' && (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-1">
                  <div className="text-xs font-bold text-rose-900">Application Rejection Reason:</div>
                  <div className="text-xs text-rose-800 font-medium">{statusData.rejectionReason}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
