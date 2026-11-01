import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { UserReportModal } from './UserReportModal';
import {
  ShieldAlert,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface UserReportsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const UserReportsView: React.FC<UserReportsViewProps> = () => {
  const { currentUser, reports = [] } = useLifeDrop();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Find reports filed by current user
  const userReports = reports.filter(
    (r) =>
      r.reporterHospitalId === currentUser.id ||
      r.reporterHospitalName?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      r.description?.includes('[Donor Report]')
  );

  const pendingCount = userReports.filter((r) => r.status === 'PENDING').length;
  const resolvedCount = userReports.filter((r) => r.status !== 'PENDING').length;

  const filteredReports = userReports.filter((rep) => {
    if (statusFilter === 'PENDING' && rep.status !== 'PENDING') return false;
    if (statusFilter === 'RESOLVED' && rep.status === 'PENDING') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesCase = rep.id.toLowerCase().includes(q);
      const matchesReason = rep.reason?.toLowerCase().includes(q);
      const matchesDesc = rep.description?.toLowerCase().includes(q);
      return matchesCase || matchesReason || matchesDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            Safety & Incident Support
          </div>
          <h2 className="text-2xl font-extrabold text-lifedrop-navy">
            Help & Incident Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Report fraudulent blood requests, payment solicitation, misconduct, or facility safety issues directly to platform administrators.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-lifedrop-emergency hover:bg-rose-700 text-white font-extrabold shadow-md flex items-center gap-2 transition-all shrink-0 text-xs"
        >
          <Plus className="w-4 h-4" />
          Report an Incident or Issue
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200/60 text-blue-900 text-xs flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-sm block">100% Confidential Incident Handling</span>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            All reports submitted by donors are handled confidentially by designated platform administrators. If anyone asks you to pay for blood or charges illegal processing fees, report them immediately.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'ALL', label: `My Reports (${userReports.length})` },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === f.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search my reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none w-full sm:w-64"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No Incident Reports Filed</p>
          <p className="text-[11px] max-w-md mx-auto">
            {userReports.length === 0
              ? 'You have not submitted any incident reports. If you encounter any fraudulent emergency requests or safety issues, click the button above to file a report.'
              : 'No reports found matching your current filter.'}
          </p>
          {userReports.length === 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
            >
              Report an Issue
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                      {rep.reason}
                    </span>
                    <span className="font-mono text-slate-400">Case #{rep.id}</span>
                    <span
                      className={`font-extrabold px-2 py-0.5 rounded-md text-[10px] ${
                        rep.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : rep.status === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-800'
                          : rep.status === 'WARNED'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rep.status === 'PENDING' ? '⏳ Under Review' : `✓ ${rep.status}`}
                    </span>
                  </div>

                  {rep.requestId && rep.requestId !== 'N/A' && (
                    <p className="text-slate-500 mt-1">
                      Related Blood Request: <span className="font-mono font-bold text-slate-700">#{rep.requestId}</span>
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-medium">{rep.createdAt}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-800 leading-relaxed border border-slate-100">
                <span className="font-bold text-slate-500 block mb-1">Your Report:</span>
                "{rep.description.replace('[Donor Report] ', '')}"
              </div>

              {rep.status !== 'PENDING' && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Investigation Outcome: </span>
                    {rep.status === 'SUSPENDED'
                      ? 'The administrator verified the violation and suspended the reported account.'
                      : rep.status === 'WARNED'
                      ? 'A formal disciplinary warning was issued.'
                      : 'The complaint was reviewed by oversight staff and resolved.'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* User Report Modal */}
      <UserReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default UserReportsView;

