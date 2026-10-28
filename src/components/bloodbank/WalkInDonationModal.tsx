/* @module: WalkInDonationModal — Complete phlebotomy walk-in intake modal for registered & new volunteer donors */
import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Check,
} from 'lucide-react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup } from '../../types';

interface WalkInDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDonationSuccess?: (record: any) => void;
}

const ALL_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const WalkInDonationModal: React.FC<WalkInDonationModalProps> = ({
  isOpen,
  onClose,
  onDonationSuccess,
}) => {
  const {
    currentBloodBank,
    users,
    bloodBankWalkInDonation,
    openFeedbackModal,
    hasUserSeenFeedbackPrompt,
    markFeedbackPromptAsSeen,
  } = useLifeDrop();

  // Donor source state
  const [donorSource, setDonorSource] = useState<'REGISTERED' | 'NEW'>('REGISTERED');
  const [selectedDonorId, setSelectedDonorId] = useState<string>(users[0]?.id || '');
  const [donorSearchQuery, setDonorSearchQuery] = useState('');
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');

  // Intake details
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup>('O+');
  const [unitsCollected, setUnitsCollected] = useState<number>(1);
  const [hemoglobinVal, setHemoglobinVal] = useState<string>('13.8');
  const [donorWeight, setDonorWeight] = useState<number>(68);
  const [phlebotomistName, setPhlebotomistName] = useState<string>(
    'Dr. S. K. Murthy (Lead Phlebotomist)'
  );

  // Clinical screening checklist
  const [checklist, setChecklist] = useState({
    ageOk: true,
    weightOk: true,
    hbOk: true,
    bpOk: true,
    noRecentInfection: true,
    cooldownOk: true,
  });

  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const currentSelectedDonor = users.find((u) => u.id === selectedDonorId) || users[0];

  const filteredRegisteredDonors = users.filter((u) => {
    if (!donorSearchQuery.trim()) return true;
    const q = donorSearchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.bloodGroup.toLowerCase().includes(q) ||
      (u.city && u.city.toLowerCase().includes(q))
    );
  });

  const allChecklistPassed =
    checklist.ageOk &&
    checklist.weightOk &&
    checklist.hbOk &&
    checklist.bpOk &&
    checklist.noRecentInfection &&
    checklist.cooldownOk;

  const handleSelectDonor = (donorId: string) => {
    setSelectedDonorId(donorId);
    const donor = users.find((u) => u.id === donorId);
    if (donor) {
      setSelectedBloodGroup(donor.bloodGroup);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetDonorId = selectedDonorId;
    let targetDonorName = currentSelectedDonor?.name || '';
    let targetPhone = currentSelectedDonor?.phone || '';

    if (donorSource === 'NEW') {
      if (!newDonorName.trim() || !newDonorPhone.trim()) {
        setFeedback({ message: 'Please enter donor full name and phone number.', isError: true });
        return;
      }
      targetDonorId = `WK-${Math.floor(1000 + Math.random() * 9000)}`;
      targetDonorName = newDonorName.trim();
      targetPhone = newDonorPhone.trim();
    }

    if (donorSource === 'REGISTERED') {
      const res = bloodBankWalkInDonation(targetDonorId, selectedBloodGroup, unitsCollected);
      if (!res.success) {
        setFeedback({ message: res.message, isError: true });
        return;
      }
    } else {
      // For new walk-in volunteers, credit stock via first registered donor proxy or direct store credit
      const existingUser = users[0];
      if (existingUser) {
        bloodBankWalkInDonation(existingUser.id, selectedBloodGroup, unitsCollected);
      }
    }

    const donationRecord = {
      id: `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      donorId: targetDonorId,
      donorName: targetDonorName,
      phone: targetPhone,
      bloodGroup: selectedBloodGroup,
      units: unitsCollected,
      hemoglobin: `${hemoglobinVal} g/dL`,
      weightKg: donorWeight,
      phlebotomist: phlebotomistName,
      timestamp: new Date().toISOString(),
      status: 'RELEASED_TO_INVENTORY',
    };

    if (onDonationSuccess) {
      onDonationSuccess(donationRecord);
    }

    setFeedback({
      message: `Successfully logged ${unitsCollected} unit(s) of ${selectedBloodGroup} from ${targetDonorName}. Stock incremented in ${currentBloodBank.name} inventory.`,
      isError: false,
    });

    // One-time post-donation feedback popup for Blood Bank
    if (!hasUserSeenFeedbackPrompt(currentBloodBank.id)) {
      setTimeout(() => {
        openFeedbackModal({
          triggerRole: 'BLOOD_BANK',
          triggerUserId: currentBloodBank.id,
          triggerUserName: currentBloodBank.name,
          isPostDonation: true,
        });
        markFeedbackPromptAsSeen(currentBloodBank.id);
      }, 1600);
    }

    setTimeout(() => {
      setFeedback(null);
      setNewDonorName('');
      setNewDonorPhone('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              Phlebotomy Counter
            </span>
            <h3 className="text-xl font-extrabold text-lifedrop-navy mt-1.5">
              Walk-In Blood Donation Intake
            </h3>
            <p className="text-xs text-slate-500">
              Direct intake immediately credits {currentBloodBank.name} storage and resets donor cooldown.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              feedback.isError
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {feedback.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Donor Source Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Donor Type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDonorSource('REGISTERED')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  donorSource === 'REGISTERED'
                    ? 'border-lifedrop-navy bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Registered LifeDrop Donor
              </button>
              <button
                type="button"
                onClick={() => setDonorSource('NEW')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  donorSource === 'NEW'
                    ? 'border-lifedrop-navy bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                New Walk-In Volunteer
              </button>
            </div>
          </div>

          {/* Donor Selection / Inputs */}
          {donorSource === 'REGISTERED' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Registered Donor:
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {filteredRegisteredDonors.length} of {users.length} donors
                </span>
              </div>

              {/* Donor Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type name, phone, ID (e.g. 1045), or blood group (e.g. O+)..."
                  value={donorSearchQuery}
                  onChange={(e) => setDonorSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none transition-all font-medium"
                />
                {donorSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDonorSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Searchable Donor Results List */}
              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 space-y-1 shadow-inner">
                {filteredRegisteredDonors.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No donors found matching &ldquo;<span className="font-semibold text-slate-700">{donorSearchQuery}</span>&rdquo;
                  </div>
                ) : (
                  filteredRegisteredDonors.map((u) => {
                    const isSelected = u.id === selectedDonorId;
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectDonor(u.id)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all text-xs ${
                          isSelected
                            ? 'bg-rose-50/80 border border-rose-300 text-rose-950 font-semibold shadow-xs'
                            : 'hover:bg-slate-50 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {u.bloodGroup}
                          </span>
                          <div className="truncate">
                            <div className="font-extrabold truncate text-slate-900">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>ID: <strong className="font-mono text-slate-700">{u.id}</strong></span>
                              <span>•</span>
                              <span>Tel: {u.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                              Selected
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5">
                              Click to Select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Active Selected Donor Confirmation Card */}
              {currentSelectedDonor && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-[10px] block font-medium uppercase tracking-wider">
                        Selected for Phlebotomy:
                      </span>
                      <span className="font-black text-slate-900 text-sm">
                        {currentSelectedDonor.name}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-2">
                        ({currentSelectedDonor.id} • Tel: {currentSelectedDonor.phone})
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-black text-xs shadow-xs">
                    {currentSelectedDonor.bloodGroup}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Donor Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newDonorName}
                  onChange={(e) => setNewDonorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Phone Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98480 12345"
                  value={newDonorPhone}
                  onChange={(e) => setNewDonorPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
                />
              </div>
            </div>
          )}

          {/* Blood Group & Units */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Blood Group:
              </label>
              <select
                value={selectedBloodGroup}
                onChange={(e) => setSelectedBloodGroup(e.target.value as BloodGroup)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-black text-rose-700 text-sm focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
              >
                {ALL_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Units Collected:
              </label>
              <select
                value={unitsCollected}
                onChange={(e) => setUnitsCollected(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
              >
                <option value={1}>1 Unit (350 mL / 450 mL)</option>
                <option value={2}>2 Units (Apheresis Protocol)</option>
              </select>
            </div>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Hemoglobin (g/dL):
              </label>
              <input
                type="number"
                step="0.1"
                min="12.5"
                max="18.0"
                required
                value={hemoglobinVal}
                onChange={(e) => setHemoglobinVal(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Weight (kg):
              </label>
              <input
                type="number"
                min="45"
                max="150"
                required
                value={donorWeight}
                onChange={(e) => setDonorWeight(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Attending Phlebotomist:
              </label>
              <input
                type="text"
                required
                value={phlebotomistName}
                onChange={(e) => setPhlebotomistName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
              />
            </div>
          </div>

          {/* Clinical Screening Verification Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Pre-Donation Eligibility Verification (Mandatory):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.ageOk}
                  onChange={(e) => setChecklist({ ...checklist, ageOk: e.target.checked })}
                  className="rounded text-lifedrop-primary focus:ring-lifedrop-primary"
                />
                <span>Donor age between 18–65 years</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.weightOk}
                  onChange={(e) => setChecklist({ ...checklist, weightOk: e.target.checked })}
                  className="rounded text-lifedrop-primary focus:ring-lifedrop-primary"
                />
                <span>Body weight &ge; 45 kg confirmed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.hbOk}
                  onChange={(e) => setChecklist({ ...checklist, hbOk: e.target.checked })}
                  className="rounded text-lifedrop-primary focus:ring-lifedrop-primary"
                />
                <span>Hemoglobin &ge; 12.5 g/dL verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.bpOk}
                  onChange={(e) => setChecklist({ ...checklist, bpOk: e.target.checked })}
                  className="rounded text-lifedrop-primary focus:ring-lifedrop-primary"
                />
                <span>Normal blood pressure &amp; pulse</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.noRecentInfection}
                  onChange={(e) =>
                    setChecklist({ ...checklist, noRecentInfection: e.target.checked })
                  }
                  className="rounded text-lifedrop-primary focus:ring-lifedrop-primary"
                />
                <span>No fever, infection, or antibiotics in 14d</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.cooldownOk}
                  onChange={(e) =>
                    setChecklist({ ...checklist, cooldownOk: e.target.checked })
                  }
                  className="rounded text-lifedrop-primary focus:ring-lifedrop-primary"
                />
                <span>90-day donation cooldown fulfilled</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!allChecklistPassed}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirm Intake &amp; Add to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
