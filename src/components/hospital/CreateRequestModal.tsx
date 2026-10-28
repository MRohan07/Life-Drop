import React, { useState, useRef } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup, EmergencyLevel } from '../../types';
import { Radio, AlertTriangle, Clock, Phone, User, Droplet, X, Activity, CheckCircle2 } from 'lucide-react';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: (requestId: string) => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
}) => {
  const { createBloodRequest, currentHospital, bloodBanks } = useLifeDrop();

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [requiredUnits, setRequiredUnits] = useState(2);
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('CRITICAL');
  const [requiredDateTime, setRequiredDateTime] = useState('');
  const [contactNumber, setContactNumber] = useState(currentHospital.phone);
  const [notes, setNotes] = useState('');
  const [targetBloodBankId, setTargetBloodBankId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const submittingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMessage('Please enter patient details.');
      return;
    }
    if (isSubmitting || submittingRef.current || isSuccess) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const defaultDateTime =
        requiredDateTime ||
        new Date(Date.now() + 3600000 * 4).toISOString().replace('T', ' ').slice(0, 16);

      const newReq = await createBloodRequest({
        patientName: patientName.trim(),
        bloodGroup,
        requiredUnits: Number(requiredUnits),
        emergencyLevel,
        requiredDateTime: defaultDateTime,
        contactNumber,
        notes,
        targetBloodBankId: targetBloodBankId || undefined,
      });

      setIsSuccess(true);
      if (newReq?.id) {
        onRequestCreated(newReq.id);
      }
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        submittingRef.current = false;
      }, 700);
    } catch (err: any) {
      console.error('Failed to create blood request:', err);
      setErrorMessage(err?.message || 'Failed to raise blood requisition. Please try again.');
      submittingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden card-3d-interactive flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-lifedrop-primary via-rose-700 to-lifedrop-darkRed text-white p-6 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                {currentHospital.name}
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Raise Emergency Blood Request
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Patient Name & Ward/Bed Info:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Robert Vance (Trauma Ward 2, Bed 12)"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Required Blood Group:
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-lifedrop-primary focus:ring-2 focus:ring-lifedrop-primary"
              >
                {(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodGroup[]).map((bg) => (
                  <option key={bg} value={bg}>
                    {bg} Blood Group
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Required Units / Packets:
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={requiredUnits}
                onChange={(e) => setRequiredUnits(Math.max(1, Number(e.target.value)))}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-extrabold text-lifedrop-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Emergency Priority Level:
              </label>
              <select
                value={emergencyLevel}
                onChange={(e) => setEmergencyLevel(e.target.value as EmergencyLevel)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-extrabold focus:ring-2 focus:ring-lifedrop-primary"
              >
                <option value="CRITICAL">🔴 CRITICAL (Immediate Operation)</option>
                <option value="URGENT">🟡 URGENT (Within 12 Hours)</option>
                <option value="NORMAL">🔵 STANDARD (Scheduled Transfusion)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Required By (Date & Time):
              </label>
              <input
                type="datetime-local"
                value={requiredDateTime}
                onChange={(e) => setRequiredDateTime(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Hospital Coordination Desk Contact:
            </label>
            <input
              type="tel"
              required
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Target Cold Chain Blood Bank Dispatch (Optional):
            </label>
            <select
              value={targetBloodBankId}
              onChange={(e) => setTargetBloodBankId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-lifedrop-primary"
            >
              <option value="">
                Broadcast to All Regional Blood Banks &amp; Radar Donors (Recommended)
              </option>
              {bloodBanks
                .filter((bb) => bb.isVerified)
                .map((bb) => (
                  <option key={bb.id} value={bb.id}>
                    Direct Requisition to: {bb.name} ({bb.city})
                  </option>
                ))}
            </select>
            {targetBloodBankId && (
              <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                This requisition will be directly allocated to{' '}
                {bloodBanks.find((b) => b.id === targetBloodBankId)?.name} and prioritized in their dispatch queue.
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Clinical Notes & Specific Instructions (Optional):
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Multiple fracture trauma surgery scheduled. Crossmatch required on arrival."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
            ⚡ Upon submission, the system generates a unique Emergency Radar ticket and broadcasts alerts to nearby compatible donors and verified blood banks within 15 km.
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsSuccess(false);
                submittingRef.current = false;
              }}
              disabled={isSubmitting || isSuccess}
              className="px-5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className={`px-6 py-3 rounded-xl text-white font-extrabold shadow-lg transition-transform inline-flex items-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-600 cursor-default'
                  : 'bg-lifedrop-primary hover:bg-lifedrop-emergency hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Request Broadcasted!</span>
                </>
              ) : isSubmitting ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Broadcasting Request...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 fill-current" />
                  <span>Broadcast Emergency Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
