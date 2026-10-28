/* @module: HospitalTransactionsView — Complete hospital blood requisitions, donor fulfillments & blood bought/transfer ledger */
import React, { useState, useMemo } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileText,
  Radio,
  Warehouse,
  Users,
  Search,
  Calendar,
  Clock,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Receipt,
  Layers,
  Phone,
  ShieldCheck,
  Activity,
  Heart,
} from 'lucide-react';
import { formatDateTime, formatDate, formatPhone } from '../../utils/formatters';

interface HospitalTransactionsViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const HospitalTransactionsView: React.FC<HospitalTransactionsViewProps> = ({
  onNavigateTab,
}) => {
  const { currentHospital, requests, bloodBanks } = useLifeDrop();

  const [activeTab, setActiveTab] = useState<'ALL' | 'EMERGENCY' | 'BLOOD_BANK_TRANSFERS' | 'FULFILLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<'ALL' | BloodGroup>('ALL');

  // Filter requests belonging to this hospital
  const hospitalRequests = useMemo(() => {
    return requests.filter((r) => r.hospitalId === currentHospital.id);
  }, [requests, currentHospital.id]);

  // Aggregate metrics
  const totalRequisitions = hospitalRequests.length;
  const totalUnitsRequired = hospitalRequests.reduce((sum, r) => sum + r.requiredUnits, 0);

  // Units fulfilled by voluntary donors
  const unitsFromDonors = hospitalRequests.reduce((sum, r) => {
    const donorUnits = r.donorContributions
      .filter((c) => c.status === 'COMPLETED')
      .reduce((s, c) => s + (c.units || 1), 0);
    return sum + donorUnits;
  }, 0);

  // Units bought / acquired from blood banks
  const unitsFromBloodBanks = hospitalRequests.reduce((sum, r) => {
    const bbUnits = r.bloodBankContributions
      .filter((c) => c.status === 'CONFIRMED' || c.status === 'RESERVED')
      .reduce((s, c) => s + (c.allocatedUnits || c.offeredUnits || 0), 0);
    return sum + bbUnits;
  }, 0);

  const totalFulfilled = hospitalRequests.reduce(
    (sum, r) => sum + (r.confirmedUnits || 0),
    0
  );

  const fulfillmentRate =
    totalUnitsRequired > 0
      ? Math.min(100, Math.round(((unitsFromDonors + unitsFromBloodBanks) / totalUnitsRequired) * 100))
      : 100;

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return hospitalRequests.filter((req) => {
      const isDirectBB =
        req.bloodBankContributions.length > 0 ||
        req.patientName.includes('Inter-Facility') ||
        req.patientName.includes('Requisition');

      if (activeTab === 'EMERGENCY' && isDirectBB) return false;
      if (activeTab === 'BLOOD_BANK_TRANSFERS' && !isDirectBB) return false;
      if (activeTab === 'FULFILLED' && req.status !== 'FULFILLED' && req.status !== 'CLOSED') {
        return false;
      }

      if (selectedBloodGroup !== 'ALL' && req.bloodGroup !== selectedBloodGroup) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPatient = req.patientName.toLowerCase().includes(q);
        const matchId = req.id.toLowerCase().includes(q);
        const matchNotes = (req.notes || '').toLowerCase().includes(q);
        const matchBB = req.bloodBankContributions.some((c) =>
          c.bloodBankName.toLowerCase().includes(q)
        );
        return matchPatient || matchId || matchNotes || matchBB;
      }

      return true;
    });
  }, [hospitalRequests, activeTab, selectedBloodGroup, searchQuery]);

  const allGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-rose-400" />
                Hospital Clinical Transfusion Ledger
              </span>
              <span className="text-xs font-mono text-slate-400">
                Facility ID: {currentHospital.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Requisitions & Blood Acquisition Ledger</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Complete audit ledger tracking all emergency patient requests broadcasted to community donors, and blood units bought / transferred from licensed blood banks.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('hosp-emergency')}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/40 transition-all shrink-0"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Create Emergency Requisition</span>
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
              Total Units Requisitioned
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-1 flex items-baseline gap-1">
              <span>{totalUnitsRequired}</span>
              <span className="text-xs text-rose-400 font-sans font-bold">Units Total</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across {totalRequisitions} clinical tickets
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
              Fulfilled by Donors
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 mt-1 flex items-baseline gap-1">
              <span>{unitsFromDonors}</span>
              <span className="text-xs text-emerald-300 font-sans font-bold">Units Donated</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Direct hospital transfusions</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
              Acquired from Blood Banks
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-blue-400 mt-1 flex items-baseline gap-1">
              <span>{unitsFromBloodBanks}</span>
              <span className="text-xs text-blue-300 font-sans font-bold">Units Transferred</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cold chain unit dispatch</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
              Fulfillment Rate
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 flex items-baseline gap-1">
              <span>{fulfillmentRate}%</span>
              <span className="text-xs text-amber-300 font-sans font-bold">Satisfied</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Combined donors + blood banks</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-lifedrop-primary text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Requisitions ({hospitalRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('EMERGENCY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'EMERGENCY'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Emergency Broadcasts</span>
          </button>
          <button
            onClick={() => setActiveTab('BLOOD_BANK_TRANSFERS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'BLOOD_BANK_TRANSFERS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Blood Bank Transfers (Bought)</span>
          </button>
          <button
            onClick={() => setActiveTab('FULFILLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'FULFILLED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fully Fulfilled</span>
          </button>
        </div>

        {/* Search & Blood Group Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700"
          >
            <option value="ALL">All Blood Groups</option>
            {allGroups.map((g) => (
              <option key={g} value={g}>
                Group {g}
              </option>
            ))}
          </select>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient, blood bank, ticket #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-lifedrop-primary bg-slate-50 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Requisitions Ledger List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-lifedrop-primary" />
            <h2 className="text-base font-extrabold text-lifedrop-navy">
              Clinical Transfusion Transactions & Source Ledgers
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredRequests.length} of {hospitalRequests.length} requisitions
          </span>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Requisitions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions matched your current search and filter settings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => {
              const isDirectTransfer =
                req.bloodBankContributions.length > 0 ||
                req.patientName.includes('Inter-Facility') ||
                req.patientName.includes('Requisition');

              const confirmedDonors = req.donorContributions.filter((c) => c.status === 'COMPLETED');
              const pendingDonors = req.donorContributions.filter(
                (c) => c.status === 'ACCEPTED' || c.status === 'AWAITING_DONATION'
              );

              return (
                <div
                  key={req.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors space-y-4"
                >
                  {/* Top Row: Header, Badges, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        #{req.id.length > 14 ? req.id.slice(0, 10).toUpperCase() : req.id}
                      </span>

                      {isDirectTransfer ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-blue-600" />
                          Blood Bank Unit Transfer (Acquired)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-rose-600" />
                          Emergency Radar Broadcast
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          req.emergencyLevel === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : req.emergencyLevel === 'URGENT'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {req.emergencyLevel} Priority
                      </span>

                      <StatusBadge type="request" value={req.status} />
                    </div>

                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Created {formatDateTime(req.createdAt)}</span>
                    </div>
                  </div>

                  {/* Middle Row: Patient & Required Units */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5 space-y-1">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Patient / Case Detail
                      </div>
                      <div className="text-base font-extrabold text-slate-900">
                        {req.patientName}
                      </div>
                      {req.notes && (
                        <div className="text-xs text-slate-600 font-medium line-clamp-2">
                          {req.notes}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-4 flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-mono font-black text-sm flex items-center justify-center">
                          {req.bloodGroup}
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            Required Volume
                          </div>
                          <div className="text-xs font-extrabold text-slate-800">
                            {req.requiredUnits} Unit(s)
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-mono font-black text-sm flex items-center justify-center">
                          {req.confirmedUnits || 0}
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-700 font-bold uppercase">
                            Fulfilled
                          </div>
                          <div className="text-xs font-extrabold text-emerald-900">
                            {req.confirmedUnits >= req.requiredUnits ? 'Complete' : `${req.remainingUnits} Remaining`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="md:col-span-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onNavigateTab('hosp-tracking')}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Activity className="w-3.5 h-3.5 text-rose-400" />
                        <span>Live Tracking</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fulfillment Breakdown Cards */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Source 1: Blood Bank Transferred Units (Bought) */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                      <div className="flex items-center justify-between text-blue-900 font-extrabold text-xs">
                        <span className="flex items-center gap-1.5">
                          <Warehouse className="w-4 h-4 text-blue-600" />
                          Blood Bank Direct Requisitions (Cold Vault)
                        </span>
                        <span className="font-mono text-blue-700 font-bold">
                          {req.bloodBankContributions.length} Facility Contacted
                        </span>
                      </div>

                      {req.bloodBankContributions.length === 0 ? (
                        <div className="text-slate-400 text-[11px] italic">
                          No direct blood bank transfer requisition attached to this ticket.
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          {req.bloodBankContributions.map((bb, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <strong className="text-slate-900 font-bold block">
                                  {bb.bloodBankName}
                                </strong>
                                <span className="text-[11px] text-slate-500">
                                  {bb.allocatedUnits || bb.offeredUnits} Units of {bb.bloodGroup} •{' '}
                                  {bb.reservedAt ? `Requested: ${bb.reservedAt}` : 'Active'}
                                </span>
                              </div>

                              <div>
                                {bb.status === 'CONFIRMED' && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[10px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Delivered & Transfused
                                  </span>
                                )}
                                {bb.status === 'RESERVED' && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold border border-blue-200 text-[10px] flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                                    Approved & Reserved
                                  </span>
                                )}
                                {bb.status === 'PENDING' && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Awaiting BB Approval
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Source 2: Community Donor Contributions */}
                    <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-2">
                      <div className="flex items-center justify-between text-rose-900 font-extrabold text-xs">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                          Voluntary Community Donors
                        </span>
                        <span className="font-mono text-rose-700 font-bold">
                          {confirmedDonors.length} Confirmed Donated
                        </span>
                      </div>

                      {req.donorContributions.length === 0 ? (
                        <div className="text-slate-400 text-[11px] italic">
                          No donor commitments recorded yet. Radar broadcast active.
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          {req.donorContributions.map((donor, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <strong className="text-slate-900 font-bold block">
                                  {donor.donorName}
                                </strong>
                                <span className="text-[11px] text-slate-500">
                                  {donor.phone ? formatPhone(donor.phone) : 'Anonymous'} •{' '}
                                  {donor.bloodGroup} ({donor.units || 1} Unit)
                                </span>
                              </div>

                              <div>
                                {donor.status === 'COMPLETED' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[10px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Donated at Hospital
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Committed / En Route
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalTransactionsView;
