import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { ReportDonorModal } from './ReportDonorModal';
import {
  ShieldAlert,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserX,
  FileCheck2,
} from 'lucide-react';

interface HospitalReportsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const HospitalReportsView: React.FC<HospitalReportsViewProps> = () => {
  const { currentHospital, reports = [] } = useLifeDrop();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Hospital's filed reports (or all if current hospital matches)
  const hospitalReports = reports.filter(
    (r) =>
      r.reporterHospitalId === currentHospital.id ||
      r.reporterHospitalName?.toLowerCase().includes(currentHospital.name.toLowerCase())
  );

  const pendingCount = hospitalReports.filter((r) => r.status === 'PENDING').length;
  const resolvedCount = hospitalReports.filter((r) => r.status !== 'PENDING').length;
  const suspendedCount = hospitalReports.filter((r) => r.status === 'SUSPENDED').length;

  const filteredReports = hospitalReports.filter((rep) => {
    if (statusFilter === 'PENDING' && rep.status !== 'PENDING') return false;
    if (statusFilter === 'RESOLVED' && rep.status === 'PENDING') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesDonor = rep.reportedUserName?.toLowerCase().includes(q) || rep.reportedUserId?.toLowerCase().includes(q);
      const matchesCase = rep.id.toLowerCase().includes(q);
      const matchesReason = rep.reason?.toLowerCase().includes(q);
      const matchesDesc = rep.description?.toLowerCase().includes(q);
      return matchesDonor || matchesCase || matchesReason || matchesDesc;
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
            Clinical Discipline & Oversight
          </div>
          <h2 className="text-2xl font-extrabold text-lifedrop-navy">
            Hospital Incident & Misuse Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Formal reports submitted by {currentHospital.name} for state administrator review and disciplinary enforcement.
          </p>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-lifedrop-emergency hover:bg-rose-700 text-white font-extrabold shadow-md flex items-center gap-2 transition-all shrink-0 text-xs"
        >
          <Plus className="w-4 h-4" />
          File New Incident Report
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Filed Reports</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{hospitalReports.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Hospital disciplinary cases</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting state admin resolution</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600">Resolved Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Investigations concluded</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600">Disciplinary Sanctions</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{suspendedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Suspended profiles</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'ALL', label: `All Reports (${hospitalReports.length})` },
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
            placeholder="Search by donor, ID, or reason..."
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
          <p className="font-bold text-slate-700 text-sm">No Incident Reports</p>
          <p className="text-[11px] max-w-md mx-auto">
            {hospitalReports.length === 0
              ? 'No clinical misconduct reports have been filed by your hospital. If a donor violates donation guidelines or commits fraud, file a report using the button above.'
              : 'No reports match your current filter criteria.'}
          </p>
          {hospitalReports.length === 0 && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
            >
              File First Report
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
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

                  <h4 className="font-black text-slate-900 text-base mt-2">
                    Reported Donor: <strong>{rep.reportedUserName}</strong> (ID: {rep.reportedUserId})
                  </h4>

                  {rep.requestId && rep.requestId !== 'N/A' && (
                    <p className="text-slate-500 mt-0.5">
                      Linked Blood Requisition: <span className="font-mono font-bold text-slate-700">#{rep.requestId}</span>
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-medium">{rep.createdAt}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-800 leading-relaxed border border-slate-100">
                <span className="font-bold text-slate-500 block mb-1">Incident Report Details:</span>
                "{rep.description}"
              </div>

              {rep.status !== 'PENDING' && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Administrative Resolution: </span>
                    {rep.status === 'SUSPENDED'
                      ? 'The administrator verified the complaint and suspended the donor account from platform access.'
                      : rep.status === 'WARNED'
                      ? 'A formal disciplinary warning was issued to the donor profile.'
                      : 'The complaint was reviewed and dismissed by platform oversight.'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Report Modal */}
      <ReportDonorModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        facilityType="Hospital"
      />
    </div>
  );
};

export default HospitalReportsView;

