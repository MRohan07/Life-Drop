/* @module: BloodRequestsView — Dedicated emergency blood requests feed and donor response center */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { StatusBadge } from '../common/StatusBadge';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { isBloodCompatible } from '../../utils/compatibility';
import { formatDateTime } from '../../utils/formatters';
import { AlertTriangle, Building2, Clock, Navigation, CheckCircle2, Search } from 'lucide-react';

export const BloodRequestsView: React.FC = () => {
  const { currentUser, requests, donorRespond } = useLifeDrop();
  const [filter, setFilter] = useState<'ALL' | 'COMPATIBLE' | 'CRITICAL'>('COMPATIBLE');
  const [search, setSearch] = useState('');
  const [navModal, setNavModal] = useState<any>({ isOpen: false });
  const [donateConfirmReq, setDonateConfirmReq] = useState<any>(null);

  const handleConfirmDonate = () => {
    if (!donateConfirmReq) return;
    const res = donorRespond(donateConfirmReq.id, 'ACCEPT');
    if (!res.success) alert(res.message);
    setDonateConfirmReq(null);
  };

  const activeRequests = requests.filter((r) => {
    const isSearching = (r.status === 'SEARCHING' || r.status === 'PARTIALLY_FULFILLED') && r.remainingUnits > 0;
    if (!isSearching) return false;
    if (filter === 'COMPATIBLE' && !isBloodCompatible(r.bloodGroup, currentUser.bloodGroup)) return false;
    if (filter === 'CRITICAL' && r.emergencyLevel !== 'CRITICAL') return false;
    if (search) {
      const q = search.toLowerCase();
      return r.patientName.toLowerCase().includes(q) || r.hospitalName.toLowerCase().includes(q) || r.bloodGroup.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-lifedrop-navy flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-lifedrop-emergency" />
            Emergency Blood Requests
          </h2>
          <p className="text-xs text-slate-500 mt-1">Live requests within your region. Your registered group: <strong className="text-lifedrop-primary font-black">{currentUser.bloodGroup}</strong></p>
        </div>
        <div className="flex items-center gap-2">
          {(['COMPATIBLE', 'ALL', 'CRITICAL'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f === 'COMPATIBLE' ? '✓ Compatible' : f === 'ALL' ? 'All Requests' : '🚨 Critical'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient, hospital, or blood group..." className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 outline-none" />
      </div>

      {/* Request Cards Grid */}
      {activeRequests.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No matching emergency blood requests</h4>
          <p className="text-xs text-slate-400">All local requirements are currently fulfilled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeRequests.map((req) => {
            const isCompatible = isBloodCompatible(req.bloodGroup, currentUser.bloodGroup);
            const isCommitted = currentUser.activeCommitmentRequestId === req.id;
            return (
              <div key={req.id} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="emergency" value={req.emergencyLevel} />
                      <span className="text-[11px] font-mono font-bold text-slate-400">#{req.id}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-lifedrop-primary font-black">Group: {req.bloodGroup}</span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1.5">{req.patientName}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {req.hospitalName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-lifedrop-primary">{req.remainingUnits} <span className="text-xs font-normal text-slate-500">Units</span></div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> By: {formatDateTime(req.requiredDateTime)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button onClick={() => setNavModal({ isOpen: true, name: req.hospitalName, address: req.hospitalAddress, phone: req.hospitalPhone, type: 'Hospital', lat: req.hospitalLatitude, lng: req.hospitalLongitude, distanceKm: 2.4 })} className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-slate-400" /> View Map
                  </button>
                  {isCommitted ? (
                    <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 text-xs font-extrabold">✓ Committed</span>
                  ) : !currentUser.isEligible ? (
                    <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold">90-Day Waiting</span>
                  ) : !isCompatible ? (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold">Incompatible</span>
                  ) : (
                    <button onClick={() => setDonateConfirmReq(req)} className="px-4 py-1.5 rounded-xl bg-lifedrop-primary hover:bg-rose-600 text-white text-xs font-extrabold shadow-sm">
                      I Can Donate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {navModal.isOpen && <GoogleMapsModal {...navModal} onClose={() => setNavModal({ isOpen: false })} />}

      <ConfirmationModal
        isOpen={!!donateConfirmReq}
        onClose={() => setDonateConfirmReq(null)}
        onConfirm={handleConfirmDonate}
        title="Confirm Blood Donation Commitment"
        message={`Are you sure you can travel to ${donateConfirmReq?.hospitalName} to donate blood for patient ${donateConfirmReq?.patientName}?`}
        impactDetails="Confirming registers you as an active committed donor. The clinical team will be notified to prepare for your arrival."
        confirmText="Yes, I Will Donate"
        cancelText="Not Right Now"
        variant="primary"
      />
    </div>
  );
};

export default BloodRequestsView;
