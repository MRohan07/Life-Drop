/* @module: BloodBankDashboard — Primary operational command center for Blood Bank personnel */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup, BloodInventoryItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { WalkInDonationModal } from './WalkInDonationModal';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import {
  Droplet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Building2,
  Thermometer,
  Layers,
  Send,
  X,
  Check,
  Search,
  UserCheck,
  Navigation,
  MapPin,
  RefreshCw,
  ArrowLeftRight,
  ChevronRight,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

interface BloodBankDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const BloodBankDashboard: React.FC<BloodBankDashboardProps> = ({ onNavigateTab }) => {
  const {
    currentBloodBank,
    requests,
    bloodBankOfferUnits,
    bloodBankConfirmSupply,
    bloodBankWalkInDonation,
    users,
    refreshBloodBanks,
    refreshMyInventory,
  } = useLifeDrop();

  // Reserve modal state
  const [selectedReqForSupply, setSelectedReqForSupply] = useState<string | null>(null);
  const [supplyBloodGroup, setSupplyBloodGroup] = useState<BloodGroup>('O+');
  const [unitsToSupply, setUnitsToSupply] = useState<number>(1);
  const [reserveFeedback, setReserveFeedback] = useState<string | null>(null);
  const [dispatchConfirmData, setDispatchConfirmData] = useState<{
    reqId: string;
    hospitalName: string;
    bloodGroup: string;
    units: number;
  } | null>(null);

  // Live Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    refreshMyInventory().catch(() => {});
    refreshBloodBanks().catch(() => {});
  }, [refreshMyInventory, refreshBloodBanks]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([refreshMyInventory(), refreshBloodBanks()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Walk-In Intake Modal state
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);

  // Hospital Navigation Modal state
  const [navModal, setNavModal] = useState<{
    isOpen: boolean;
    hospitalName: string;
    hospitalAddress: string;
    hospitalPhone: string;
    latitude: number;
    longitude: number;
  }>({
    isOpen: false,
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    latitude: 16.3067,
    longitude: 80.4365,
  });

  const inventoryList = Object.values(currentBloodBank.inventory) as BloodInventoryItem[];

  const totalAvailable = inventoryList.reduce((sum, item) => sum + (item.available || 0), 0);
  const totalReserved = inventoryList.reduce((sum, item) => sum + (item.reserved || 0), 0);
  const totalSupplied = inventoryList.reduce((sum, item) => sum + (item.supplied || 0), 0);
  const lowStockItems = inventoryList.filter((item) => (item.available || 0) < 5);

  const allGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Active hospital emergency requests (including direct requisitions reserved or pending approval for our facility)
  const activeRequests = requests.filter(
    (r) =>
      r.status !== 'CLOSED' &&
      r.status !== 'CANCELLED' &&
      (r.remainingUnits > 0 ||
        r.bloodBankContributions.some(
          (c) =>
            c.bloodBankId === currentBloodBank.id &&
            (c.status === 'RESERVED' || c.status === 'PENDING')
        ))
  );

  // Prioritize pending approval direct requisitions at the top of the dashboard
  const sortedDashboardRequests = [...activeRequests].sort((a, b) => {
    const aPending = a.bloodBankContributions.some(
      (c) => c.bloodBankId === currentBloodBank.id && c.status === 'PENDING'
    );
    const bPending = b.bloodBankContributions.some(
      (c) => c.bloodBankId === currentBloodBank.id && c.status === 'PENDING'
    );
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleSupplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForSupply) return;

    const res = bloodBankOfferUnits(selectedReqForSupply, supplyBloodGroup, unitsToSupply);
    if (res.success) {
      setReserveFeedback(`Successfully reserved ${unitsToSupply} unit(s) of ${supplyBloodGroup}.`);
      setTimeout(() => {
        setSelectedReqForSupply(null);
        setReserveFeedback(null);
      }, 1200);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Facility Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Licensed Blood Bank
              </span>
              <span className="text-xs font-mono text-slate-500">
                CDSCO License: {currentBloodBank.licenseNumber}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-lifedrop-navy tracking-tight">
              {currentBloodBank.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Blood Bank Operations Console. Real-time component stock monitoring, hospital emergency requisitions response, and voluntary donor phlebotomy intake.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('bb-transactions')}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-102"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-400" />
              <span>Inflow &amp; Outflow Ledger</span>
            </button>

            <button
              onClick={() => setWalkInModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-lifedrop-primary hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-102"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Log Walk-In</span>
            </button>

            <button
              onClick={() => onNavigateTab('bb-inventory')}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Manage Inventory</span>
            </button>
          </div>
        </div>

        {/* Cold Storage Live Health Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <Thermometer className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-slate-500 font-medium">PRBC Cold Room: </span>
              <strong className="text-slate-800">+4.1°C (Normal)</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <Thermometer className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-500 font-medium">Plasma Freezers: </span>
              <strong className="text-slate-800">-80.4°C (Normal)</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <Thermometer className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-slate-500 font-medium">Platelet Agitator: </span>
              <strong className="text-slate-800">22.0°C (60 RPM)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Vital Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold">
            <Droplet className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Available Stock</div>
            <div className="text-2xl font-black text-lifedrop-navy mt-0.5">
              {totalAvailable} <span className="text-xs font-normal text-slate-400">Packets</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-extrabold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Reserved for Patients</div>
            <div className="text-2xl font-black text-purple-700 mt-0.5">
              {totalReserved} <span className="text-xs font-normal text-slate-400">Packets</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => onNavigateTab('bb-transactions')}
          className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4 cursor-pointer hover:border-blue-300 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Supplied &amp; Dispatched</div>
            <div className="text-2xl font-black text-blue-700 mt-0.5">
              {totalSupplied} <span className="text-xs font-normal text-slate-400">Packets</span>
            </div>
            <span className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5">
              <span>View Outflow Ledger</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold ${
              lowStockItems.length > 0
                ? 'bg-rose-50 text-lifedrop-emergency'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Low Stock (&lt;5 units)</div>
            <div
              className={`text-2xl font-black mt-0.5 ${
                lowStockItems.length > 0 ? 'text-lifedrop-emergency' : 'text-emerald-600'
              }`}
            >
              {lowStockItems.length} Group{lowStockItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live 8 Blood Group Matrix */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-lifedrop-navy flex items-center gap-2">
              <Droplet className="w-4 h-4 text-lifedrop-primary" />
              Live Blood Group Stock Matrix (8 Groups)
            </h2>
            <p className="text-xs text-slate-500">
              Current inventory levels across standard whole blood &amp; packed red cells.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh stock levels from PostgreSQL database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Stock'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('bb-inventory')}
              className="text-xs font-bold text-lifedrop-primary hover:text-rose-800 flex items-center gap-1"
            >
              <span>Open Inventory Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {allGroups.map((group) => {
            const item = currentBloodBank.inventory[group] || {
              bloodGroup: group,
              available: 0,
              reserved: 0,
              supplied: 0,
            };
            const isCritical = item.available < 5;
            const isAdequate = item.available >= 15;

            return (
              <div
                key={group}
                onClick={() => onNavigateTab('bb-inventory')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCritical
                    ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-lifedrop-primary">
                      {group}
                    </span>
                    {isCritical ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Low stock" />
                    ) : isAdequate ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Adequate stock" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Moderate stock" />
                    )}
                  </div>

                  <div className="mt-2.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Available
                    </span>
                    <div className="text-2xl font-black text-lifedrop-navy mt-0.5">
                      {item.available}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 text-[10px] space-y-0.5 text-slate-500">
                  <div className="flex justify-between">
                    <span>Reserved:</span>
                    <span className="font-bold text-purple-700">{item.reserved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supplied:</span>
                    <span className="font-semibold text-slate-600">{item.supplied}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Hospital Emergency Requisitions */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-lifedrop-emergency" />
              <h2 className="text-base font-extrabold text-lifedrop-navy">
                Hospital Emergency Requisitions ({activeRequests.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Requisitions from local partner hospitals requiring units from our inventory.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('bb-requests')}
            className="text-xs font-bold text-lifedrop-primary hover:text-rose-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Requisitions Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
            No active emergency requisitions pending response at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {sortedDashboardRequests.slice(0, 4).map((req) => {
              const myStock = currentBloodBank.inventory[req.bloodGroup]?.available || 0;
              const myContribution = req.bloodBankContributions.find(
                (c) => c.bloodBankId === currentBloodBank.id
              );
              const isPendingApproval = myContribution && myContribution.status === 'PENDING';
              const hasActiveReservation = myContribution && myContribution.status === 'RESERVED';

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge type="emergency" value={req.emergencyLevel} />
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{req.id}
                          </span>
                          {isPendingApproval ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300 animate-pulse">
                              Pending Approval
                            </span>
                          ) : hasActiveReservation ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold border border-purple-200">
                              Reserved
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-sm font-extrabold text-lifedrop-navy mt-1">
                          {req.patientName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {req.hospitalName}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-black text-sm border border-rose-200">
                          {req.bloodGroup}
                        </span>
                        <div className="text-[11px] font-bold text-rose-600 mt-1">
                          {req.remainingUnits} Needed
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Our In-Stock ({req.bloodGroup}):</span>
                      <span className="font-extrabold text-slate-800">
                        {myStock} Units
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setNavModal({
                          isOpen: true,
                          hospitalName: req.hospitalName,
                          hospitalAddress: req.hospitalAddress,
                          hospitalPhone: req.contactNumber || req.hospitalPhone,
                          latitude: req.hospitalLatitude || 16.3067,
                          longitude: req.hospitalLongitude || 80.4365,
                        })
                      }
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Open GPS navigation to hospital"
                    >
                      <Navigation className="w-3.5 h-3.5 fill-current" />
                      <span>Directions</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isPendingApproval ? (
                        myStock === 0 ? (
                          <span className="text-xs font-bold text-rose-500 italic">
                            Out of Stock
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const unitsNeeded = myContribution.offeredUnits || req.remainingUnits || 1;
                              if (myStock >= unitsNeeded) {
                                const res = bloodBankOfferUnits(req.id, req.bloodGroup, unitsNeeded);
                                alert(res.message);
                              } else {
                                setSelectedReqForSupply(req.id);
                                setSupplyBloodGroup(req.bloodGroup);
                                setUnitsToSupply(Math.min(unitsNeeded, myStock));
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-xs"
                          >
                            Approve Units
                          </button>
                        )
                      ) : hasActiveReservation ? (
                        <button
                          onClick={() => {
                            const contribution = req.bloodBankContributions.find(
                              (c) => c.bloodBankId === currentBloodBank.id
                            );
                            const units = contribution?.allocatedUnits || contribution?.offeredUnits || req.remainingUnits || 1;
                            setDispatchConfirmData({
                              reqId: req.id,
                              hospitalName: req.hospitalName,
                              bloodGroup: req.bloodGroup,
                              units,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs"
                        >
                          Confirm Dispatch
                        </button>
                      ) : myStock === 0 ? (
                        <span className="text-xs font-bold text-rose-500 italic">
                          Out of Stock
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedReqForSupply(req.id);
                            setSupplyBloodGroup(req.bloodGroup);
                            setUnitsToSupply(Math.min(req.remainingUnits, myStock));
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-lifedrop-navy hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
                        >
                          Reserve Units
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reserve Units Modal */}
      {selectedReqForSupply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-3 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  Hospital Requisition
                </span>
                <h3 className="text-lg font-extrabold text-lifedrop-navy mt-1">
                  Reserve Units for Request #{selectedReqForSupply}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReqForSupply(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reserveFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {reserveFeedback}
              </div>
            )}

            <form onSubmit={handleSupplySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Blood Group:</label>
                <input
                  type="text"
                  disabled
                  value={`${supplyBloodGroup} (Available in storage: ${
                    currentBloodBank.inventory[supplyBloodGroup]?.available || 0
                  } packets)`}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Units to Reserve:
                </label>
                <input
                  type="number"
                  min={1}
                  max={currentBloodBank.inventory[supplyBloodGroup]?.available || 1}
                  value={unitsToSupply}
                  onChange={(e) => setUnitsToSupply(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-slate-800 text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 text-purple-800 text-[11px] border border-purple-200">
                Reserving immediately commits this packet in {currentBloodBank.name} storage and notifies the hospital transfusion wing to arrange transit.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReqForSupply(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-lifedrop-primary hover:bg-rose-700 text-white font-extrabold shadow-sm"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Phlebotomy Walk-In Intake Modal with New Volunteer & Registered Donor Intake */}
      <WalkInDonationModal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
      />

      {/* Dispatch Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!dispatchConfirmData}
        onClose={() => setDispatchConfirmData(null)}
        onConfirm={() => {
          if (!dispatchConfirmData) return;
          const res = bloodBankConfirmSupply(dispatchConfirmData.reqId, currentBloodBank.id);
          alert(res.message);
          setDispatchConfirmData(null);
        }}
        title="Confirm Blood Packet Dispatch"
        message={`Confirm physical dispatch of ${dispatchConfirmData?.units} packet(s) of ${dispatchConfirmData?.bloodGroup} blood to ${dispatchConfirmData?.hospitalName}?`}
        impactDetails="This will confirm delivery handover, permanently deduct the reserved inventory, and inform the hospital transfusion wing that packets are delivered."
        confirmText="Yes, Confirm Dispatch"
        cancelText="Cancel"
        variant="success"
      />

      {/* Hospital Navigation Modal */}
      {navModal.isOpen && (
        <GoogleMapsModal
          isOpen={navModal.isOpen}
          onClose={() => setNavModal((prev) => ({ ...prev, isOpen: false }))}
          destinationName={navModal.hospitalName}
          destinationAddress={navModal.hospitalAddress}
          destinationPhone={navModal.hospitalPhone}
          destinationType="Hospital"
          latitude={navModal.latitude}
          longitude={navModal.longitude}
          isVerified={true}
          services={[
            'Emergency Trauma Center',
            '24/7 Transfusion Reception Desk',
            'Cold Chain Receiving Station',
          ]}
        />
      )}
    </div>
  );
};
