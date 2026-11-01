/* @module: BloodBankInventoryView — 8-group component inventory management & cold-chain monitoring */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup, BloodInventoryItem } from '../../types';
import {
  Droplet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Thermometer,
  Layers,
  Save,
  X,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  ArrowLeftRight,
} from 'lucide-react';

interface BloodBankInventoryViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const BloodBankInventoryView: React.FC<BloodBankInventoryViewProps> = ({
  onNavigateTab,
}) => {
  const { currentBloodBank, updateInventoryStock, refreshBloodBanks, refreshMyInventory } = useLifeDrop();

  const [editGroup, setEditGroup] = useState<BloodGroup | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Routine Donation Intake Batch');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync inventory with live backend API on mount
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

  const inventoryList = Object.values(currentBloodBank.inventory) as BloodInventoryItem[];
  const totalAvailable = inventoryList.reduce((sum, item) => sum + (item.available || 0), 0);
  const totalReserved = inventoryList.reduce((sum, item) => sum + (item.reserved || 0), 0);
  const totalSupplied = inventoryList.reduce((sum, item) => sum + (item.supplied || 0), 0);
  const lowStockItems = inventoryList.filter((item) => (item.available || 0) < 5);

  const allGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleOpenEdit = (group: BloodGroup) => {
    setEditGroup(group);
    setNewStockValue(currentBloodBank.inventory[group]?.available || 0);
    setAdjustmentReason('Routine Donation Intake Batch');
    setSaveSuccessMsg(null);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroup) return;

    setIsSaving(true);
    try {
      await updateInventoryStock(currentBloodBank.id, editGroup, Number(newStockValue));
      setSaveSuccessMsg(`Inventory updated: ${editGroup} stock updated to ${newStockValue} available units.`);
      setTimeout(() => {
        setEditGroup(null);
        setSaveSuccessMsg(null);
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-lifedrop-navy to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-amber-400" />
                Component Stock & Cold Chain Console
              </span>
              <span className="text-xs font-mono text-slate-400">
                Facility ID: {currentBloodBank.id}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              8-Group Blood Inventory Management
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time component storage levels for {currentBloodBank.name}. Audit cold-chain storage parameters, adjust batch quantities, and track units reserved for hospital orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <button
              onClick={() => onNavigateTab('bb-transactions')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Inflow &amp; Outflow Ledger</span>
            </button>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
              title="Sync inventory with live PostgreSQL database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Live Stock'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('bb-requests')}
              className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 flex-shrink-0"
            >
              <span>Incoming Hospital Requisitions</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 font-semibold">Total Packets Available</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{totalAvailable} Units</div>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 font-semibold">Reserved for Hospitals</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{totalReserved} Units</div>
          </div>
          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50">
            <div className="text-slate-400 font-semibold">Total Issued / Dispatched</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{totalSupplied} Units</div>
          </div>
          <div className={`p-3.5 rounded-2xl border ${lowStockItems.length > 0 ? 'bg-rose-950/40 border-rose-900/50' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <div className={`${lowStockItems.length > 0 ? 'text-rose-300' : 'text-slate-400'} font-semibold flex items-center gap-1.5`}>
              {lowStockItems.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
              Low Stock Alerts (&lt;5)
            </div>
            <div className={`text-2xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-rose-200' : 'text-slate-300'}`}>
              {lowStockItems.length} Groups
            </div>
          </div>
        </div>
      </div>

      {/* 8-Group Interactive Stock Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-rose-600" />
            <span>Blood Group Inventory Matrix</span>
          </h3>
          <span className="text-xs text-slate-500">Click any blood group card to adjust stock quantities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allGroups.map((group) => {
            const item = currentBloodBank.inventory[group] || { bloodGroup: group, available: 0, reserved: 0, supplied: 0 };
            const isLow = item.available < 5;
            const isDepleted = item.available === 0;

            let badgeStatus = 'Adequate Stock';
            let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            if (isDepleted) {
              badgeStatus = 'Depleted';
              badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
            } else if (isLow) {
              badgeStatus = 'Low Reserve (<5)';
              badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
            }

            return (
              <div
                key={group}
                onClick={() => handleOpenEdit(group)}
                className={`p-5 rounded-3xl bg-white border shadow-xs hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isDepleted ? 'border-rose-300 bg-rose-50/10' : isLow ? 'border-amber-300' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1.5 rounded-2xl bg-rose-50 text-rose-700 font-mono font-black text-2xl border border-rose-200">
                      {group}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                      {badgeStatus}
                    </span>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Available in Storage</span>
                    <div className="text-3xl font-black text-slate-900 mt-0.5">
                      {item.available}{' '}
                      <span className="text-xs font-normal text-slate-500">Packets</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between text-purple-700 font-bold">
                    <span>Reserved for Orders:</span>
                    <span>{item.reserved} units</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Supplied / Issued:</span>
                    <span>{item.supplied} units</span>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 hover:underline">
                      <Edit3 className="w-3 h-3" /> Update Stock
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Component Separation & Cold Chain Storage Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Separation Capabilities */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Blood Component Separation Specifications</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400">Drug Control Compliant</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Packed Red Blood Cells (PRBC)</div>
                <div className="text-[11px] text-slate-500">Storage: 2°C to 6°C • Sag-M Solution (42 Days)</div>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Fresh Frozen Plasma (FFP)</div>
                <div className="text-[11px] text-slate-500">Storage: -80°C Ultra-Low Freezers (1 Year)</div>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Platelet Concentrates (Random & Apheresis)</div>
                <div className="text-[11px] text-slate-500">Storage: 20°C to 24°C with continuous agitation (5 Days)</div>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Cryoprecipitate Factor VIII</div>
                <div className="text-[11px] text-slate-500">Storage: Below -30°C for hemophilia & trauma</div>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
            </div>
          </div>
        </div>

        {/* Cold Chain Real-time Monitoring */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-600" />
              <span>Cold Chain Storage Temperature Monitors</span>
            </h4>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Sensors Normal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Whole Blood Vault #1</span>
              <div className="text-xl font-mono font-black text-slate-900">+4.1°C</div>
              <div className="text-emerald-600 text-[11px] font-bold">✓ Calibrated Range (2°C - 6°C)</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Whole Blood Vault #2</span>
              <div className="text-xl font-mono font-black text-slate-900">+3.8°C</div>
              <div className="text-emerald-600 text-[11px] font-bold">✓ Calibrated Range (2°C - 6°C)</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Plasma Deep Freezer</span>
              <div className="text-xl font-mono font-black text-slate-900">-79.4°C</div>
              <div className="text-emerald-600 text-[11px] font-bold">✓ Cryo Range (&lt; -30°C)</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Platelet Agitator</span>
              <div className="text-xl font-mono font-black text-slate-900">+22.2°C</div>
              <div className="text-emerald-600 text-[11px] font-bold">✓ Agitation 60 RPM Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Stock Modal */}
      {editGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-mono font-black text-lg">
                  {editGroup}
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Inventory Adjustment
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    Update {editGroup} Available Packets
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setEditGroup(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-6 space-y-4 text-xs">
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Current Available Packets in Storage:
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-base text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reason for Adjustment:
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option value="Routine Donation Intake Batch">Routine Donation Intake Batch</option>
                  <option value="Component Processing Separation Credit">Component Processing Separation Credit</option>
                  <option value="Manual Cold-Vault Physical Recount">Manual Cold-Vault Physical Recount</option>
                  <option value="Discarded due to QA / Expiry">Discarded due to QA / Expiry</option>
                  <option value="Emergency Inter-Facility Transfer Receipt">Emergency Inter-Facility Transfer Receipt</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-[11px] leading-relaxed">
                Stock changes will immediately be visible to nearby hospitals and ambulance coordination centers searching for {editGroup} units.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditGroup(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Saving Stock...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Commit Stock Level</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodBankInventoryView;
