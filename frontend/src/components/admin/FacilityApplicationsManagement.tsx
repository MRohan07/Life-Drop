import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api/client';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  Building2,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  FileText,
  Filter,
  Check,
  RotateCcw,
  ShieldAlert,
  Send,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  KeyRound,
  Copy,
  X,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/formatters';

interface FacilityApplicationsManagementProps {
  onNavigateTab?: (tabId: string) => void;
}

export const FacilityApplicationsManagement: React.FC<FacilityApplicationsManagementProps> = ({
  onNavigateTab,
}) => {
  const { fetchFacilityApplications: refreshGlobalApps } = useLifeDrop();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected application for full detail inspection
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Action Modals State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'REVIEW' | 'REQUEST_INFO' | 'APPROVE' | 'REJECT' | 'SUSPEND' | null;
    appId?: string;
    appName?: string;
    inputText: string;
  }>({
    isOpen: false,
    type: null,
    inputText: '',
  });

  const [actionResultMsg, setActionResultMsg] = useState<{
    type: 'success' | 'error';
    message: string;
    activationToken?: string;
  } | null>(null);

  const [copiedToken, setCopiedToken] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.facilityApplications.list({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        facilityType: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: searchTerm.trim() || undefined,
        limit: 50,
      });
      const apps = res?.applications || res?.data?.applications || (Array.isArray(res) ? res : []);
      if (Array.isArray(apps)) {
        setApplications(apps);
      }
    } catch (err) {
      console.error('Error fetching facility applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, typeFilter]);

  const handleOpenDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const res: any = await api.facilityApplications.getById(id);
      const app = res?.application || res?.data?.application || res;
      if (app && (app.id || app.referenceNumber)) {
        setSelectedApp(app);
      }
    } catch (err) {
      console.error('Failed to load application detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal.appId || !actionModal.type) return;

    try {
      let res: any;
      if (actionModal.type === 'REVIEW') {
        res = await api.facilityApplications.markUnderReview(
          actionModal.appId,
          actionModal.inputText.trim() || undefined
        );
        setActionResultMsg({ type: 'success', message: 'Application marked as UNDER_REVIEW.' });
      } else if (actionModal.type === 'REQUEST_INFO') {
        if (!actionModal.inputText.trim()) {
          alert('Please enter the information required from the applicant.');
          return;
        }
        res = await api.facilityApplications.requestInfo(
          actionModal.appId,
          actionModal.inputText.trim()
        );
        setActionResultMsg({ type: 'success', message: 'Information requested from applicant.' });
      } else if (actionModal.type === 'APPROVE') {
        res = await api.facilityApplications.approve(
          actionModal.appId,
          actionModal.inputText.trim() || undefined
        );
        setActionResultMsg({
          type: 'success',
          message: 'Application approved! Facility account has been successfully created and activated. The facility can now log in immediately.',
        });
      } else if (actionModal.type === 'REJECT') {
        if (!actionModal.inputText.trim()) {
          alert('Rejection reason is mandatory.');
          return;
        }
        res = await api.facilityApplications.reject(
          actionModal.appId,
          actionModal.inputText.trim()
        );
        setActionResultMsg({ type: 'success', message: 'Application rejected.' });
      } else if (actionModal.type === 'SUSPEND') {
        if (!actionModal.inputText.trim()) {
          alert('Suspension reason is mandatory.');
          return;
        }
        res = await api.facilityApplications.suspend(
          actionModal.appId,
          actionModal.inputText.trim()
        );
        setActionResultMsg({ type: 'success', message: 'Facility suspended and operational access revoked.' });
      }

      setActionModal({ isOpen: false, type: null, inputText: '' });
      fetchApplications();
      refreshGlobalApps?.();
      if (selectedApp && selectedApp.id === actionModal.appId) {
        handleOpenDetail(actionModal.appId);
      }
    } catch (err: any) {
      console.error('Action error:', err);
      setActionResultMsg({ type: 'error', message: err.message || 'Action failed.' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold">
            <Search className="w-3 h-3 text-blue-600" />
            Under Review
          </span>
        );
      case 'NEEDS_INFORMATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-extrabold">
            <AlertTriangle className="w-3 h-3 text-purple-600" />
            Needs Info
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-extrabold">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-extrabold">
            <ShieldAlert className="w-3 h-3 text-slate-600" />
            Suspended
          </span>
        );
      default:
        return <span className="text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Stats */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-rose-950 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-300">
              State Transfusion Accreditation Council
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Facility Accreditation Applications</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Review, verify licenses, and approve hospital trauma centers and accredited blood banks before operational access is granted.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchApplications()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>
      </div>

      {actionResultMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-start justify-between gap-3 ${
            actionResultMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div>
            <div>{actionResultMsg.message}</div>
            {actionResultMsg.activationToken && (
              <div className="mt-2 p-2.5 bg-white rounded-xl border border-emerald-300 flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Activation Token:</span>
                <code className="text-xs font-mono font-black text-lifedrop-navy break-all">
                  {actionResultMsg.activationToken}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(actionResultMsg.activationToken!);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {copiedToken ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setActionResultMsg(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="NEEDS_INFORMATION">Needs Information</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
          >
            <option value="ALL">All Facility Types</option>
            <option value="HOSPITAL">Hospitals Only</option>
            <option value="BLOOD_BANK">Blood Banks Only</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchApplications()}
              placeholder="Search reference, name, city..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
            />
          </div>
          <button
            onClick={() => fetchApplications()}
            className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">
            Loading facility applications queue...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No Applications Found</div>
            <p className="text-xs text-slate-400">
              There are no facility registration applications matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Reference & Facility</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">State License</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] font-black text-lifedrop-navy">
                        {app.referenceNumber}
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs mt-0.5">{app.name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{app.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {app.facilityType === 'HOSPITAL' ? (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-rose-600" />
                            Hospital
                          </>
                        ) : (
                          <>
                            <Warehouse className="w-3.5 h-3.5 text-amber-600" />
                            Blood Bank
                          </>
                        )}
                      </span>
                      <div className="text-[10px] text-slate-400">{app.category}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{app.city}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{app.address}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-700">{app.licenseNumber}</span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(app.status)}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(app.id)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>

                      {app.status !== 'APPROVED' && app.status !== 'REJECTED' && (
                        <>
                          <button
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                type: 'APPROVE',
                                appId: app.id,
                                appName: app.name,
                                inputText: '',
                              })
                            }
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                type: 'REJECT',
                                appId: app.id,
                                appName: app.name,
                                inputText: '',
                              })
                            }
                            className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Detail Inspection Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 relative flex-shrink-0 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-rose-300">
                    {selectedApp.referenceNumber}
                  </span>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <h3 className="text-xl font-black tracking-tight mt-1">{selectedApp.name}</h3>
                <div className="text-xs text-slate-300 mt-0.5">
                  {selectedApp.facilityType} • {selectedApp.category} • Submitted on {formatDateTime(selectedApp.createdAt)}
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Section 1: Facility Information */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Facility & Licensing Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Official Email</span>
                    <span className="font-bold text-slate-800">{selectedApp.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Official Phone</span>
                    <span className="font-bold text-slate-800">{selectedApp.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">License Number</span>
                    <span className="font-mono font-bold text-slate-800">{selectedApp.licenseNumber}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Address</span>
                    <span className="font-semibold text-slate-800">{selectedApp.address}, {selectedApp.city}, {selectedApp.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Issuing Authority</span>
                    <span className="font-semibold text-slate-700">{selectedApp.issuingAuthority || 'State Medical Council'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Authorized Representative */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Authorized Institutional Representative
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Name</span>
                    <span className="font-bold text-slate-900">{selectedApp.authorizedPersonName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Designation</span>
                    <span className="font-bold text-slate-800">{selectedApp.authorizedPersonDesignation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact</span>
                    <span className="font-bold text-slate-800">{selectedApp.authorizedPersonPhone}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Email</span>
                    <span className="font-semibold text-slate-800">{selectedApp.authorizedPersonEmail}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Activation Status */}
              {selectedApp.status === 'APPROVED' && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-emerald-900">
                      Approved by {selectedApp.approvedByAdmin?.name || 'Administrator'} on {formatDateTime(selectedApp.approvedAt)}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                      Account Activated
                    </span>
                  </div>
                </div>
              )}

              {/* Section 4: Audit & Review History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Accreditation Timeline & Audit Log
                </h4>
                {selectedApp.reviews?.length === 0 ? (
                  <div className="text-xs text-slate-400 font-medium">No review events recorded.</div>
                ) : (
                  <div className="space-y-2">
                    {selectedApp.reviews.map((rev: any) => (
                      <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-lifedrop-navy">{rev.action}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(rev.createdAt)}</span>
                        </div>
                        {rev.notes && <p className="text-slate-600 font-medium">{rev.notes}</p>}
                        {rev.admin && (
                          <div className="text-[10px] text-slate-400 font-semibold">
                            Reviewed by: {rev.admin.name} ({rev.admin.email})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedApp.status === 'PENDING' && (
                  <button
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        type: 'REVIEW',
                        appId: selectedApp.id,
                        appName: selectedApp.name,
                        inputText: '',
                      })
                    }
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Mark Under Review
                  </button>
                )}

                {selectedApp.status !== 'APPROVED' && selectedApp.status !== 'REJECTED' && (
                  <>
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'REQUEST_INFO',
                          appId: selectedApp.id,
                          appName: selectedApp.name,
                          inputText: '',
                        })
                      }
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Request Info
                    </button>

                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'REJECT',
                          appId: selectedApp.id,
                          appName: selectedApp.name,
                          inputText: '',
                        })
                      }
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'APPROVE',
                          appId: selectedApp.id,
                          appName: selectedApp.name,
                          inputText: '',
                        })
                      }
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Approve & Activate Account
                    </button>
                  </>
                )}

                {selectedApp.status === 'APPROVED' && !selectedApp.isSuspended && (
                  <button
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        type: 'SUSPEND',
                        appId: selectedApp.id,
                        appName: selectedApp.name,
                        inputText: '',
                      })
                    }
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Suspend Facility
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Input Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              {actionModal.type === 'APPROVE' && 'Approve Facility Application'}
              {actionModal.type === 'REJECT' && 'Reject Facility Application'}
              {actionModal.type === 'REQUEST_INFO' && 'Request Additional Information'}
              {actionModal.type === 'REVIEW' && 'Mark Application Under Review'}
              {actionModal.type === 'SUSPEND' && 'Suspend Facility Operational Access'}
            </h3>

            <p className="text-xs text-slate-500 font-medium">
              Target Facility: <strong>{actionModal.appName}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {actionModal.type === 'REJECT'
                  ? 'Mandatory Rejection Reason *'
                  : actionModal.type === 'REQUEST_INFO'
                  ? 'Details Required from Applicant *'
                  : actionModal.type === 'SUSPEND'
                  ? 'Mandatory Suspension Reason *'
                  : 'Administrative Notes (Optional)'}
              </label>
              <textarea
                rows={3}
                required={actionModal.type === 'REJECT' || actionModal.type === 'REQUEST_INFO' || actionModal.type === 'SUSPEND'}
                value={actionModal.inputText}
                onChange={(e) => setActionModal({ ...actionModal, inputText: e.target.value })}
                placeholder="Enter notes for audit log..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal({ isOpen: false, type: null, inputText: '' })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className="px-5 py-2 rounded-xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white text-xs font-black shadow-md cursor-pointer"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
