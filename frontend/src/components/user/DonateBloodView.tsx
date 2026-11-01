import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { EligibilityCard } from './EligibilityCard';
import { GoogleMapsModal } from '../common/GoogleMapsModal';
import { StatusBadge } from '../common/StatusBadge';
import {
  Heart,
  Warehouse,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { formatPhone, formatDate, formatDateTime } from '../../utils/formatters';

export const DonateBloodView: React.FC = () => {
  const {
    currentUser,
    bloodBanks,
    appointments,
    registerDonationAppointment,
    cancelDonationAppointment,
    requests,
  } = useLifeDrop();

  // Booking modal
  const [selectedBBId, setSelectedBBId] = useState<string | null>(null);
  const [apptDate, setApptDate] = useState('');
  const [apptSlot, setApptSlot] = useState('10:00 AM - 11:30 AM');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Navigation modal
  const [navData, setNavData] = useState<{
    isOpen: boolean;
    name: string;
    address: string;
    phone: string;
    type: 'Hospital' | 'Blood Bank';
    lat: number;
    lng: number;
    distanceKm?: number;
  }>({
    isOpen: false,
    name: '',
    address: '',
    phone: '',
    type: 'Blood Bank',
    lat: 0,
    lng: 0,
  });

  const verifiedBloodBanks = bloodBanks.filter((b) => b.isVerified);

  // User's confirmed donation history from all requests
  const donationHistory = requests
    .flatMap((r) =>
      r.donorContributions
        .filter((c) => c.donorId === currentUser.id && c.status === 'COMPLETED')
        .map((c) => ({
          requestId: r.id,
          hospitalName: r.hospitalName,
          hospitalAddress: r.hospitalAddress,
          bloodGroup: c.bloodGroup,
          units: c.units,
          confirmedAt: c.confirmedAt || r.createdAt,
        }))
    );

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBBId || !apptDate) {
      alert('Please select a date.');
      return;
    }

    const res = registerDonationAppointment(selectedBBId, apptDate, apptSlot);
    if (res.success) {
      setBookingSuccessMsg(res.message);
      setSelectedBBId(null);
      setApptDate('');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-lifedrop-navy flex items-center gap-2.5">
          <Heart className="w-7 h-7 text-lifedrop-primary fill-lifedrop-primary" />
          Donate Blood Hub
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore donation avenues, schedule blood bank appointments, or review your verified life-saving record.
        </p>
      </div>

      {/* Success banner */}
      {bookingSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{bookingSuccessMsg}</span>
          </div>
          <button
            onClick={() => setBookingSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Eligibility Status */}
      <EligibilityCard
        lastDonationDate={currentUser.lastDonationDate}
        donorName={currentUser.name}
        bloodGroup={currentUser.bloodGroup}
      />

      {/* 2. Nearby Blood Banks for Donation Appointment */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-lifedrop-navy flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-lifedrop-primary" />
            Registered Blood Banks (Walk-In / Appointments)
          </h3>
          <p className="text-xs text-slate-500">
            Book a convenient slot. Note: Registering an appointment is not a confirmed donation until completed on-site.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {verifiedBloodBanks.map((bb, idx) => (
            <div
              key={bb.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 card-3d-interactive flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                      ✓ Verified Blood Bank
                    </span>
                    <h4 className="text-base font-extrabold text-lifedrop-navy mt-1.5">
                      {bb.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {bb.address} • ~{(1.5 + idx * 1.2).toFixed(1)} km
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                    <img src={bb.image} alt={bb.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setNavData({
                        isOpen: true,
                        name: bb.name,
                        address: bb.address,
                        phone: bb.phone,
                        type: 'Blood Bank',
                        lat: bb.latitude,
                        lng: bb.longitude,
                        distanceKm: 1.5 + idx * 1.2,
                      })
                    }
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5 text-lifedrop-primary" />
                    Navigate
                  </button>

                  <a
                    href={`tel:${bb.phone}`}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Call
                  </a>
                </div>

                <button
                  onClick={() => setSelectedBBId(bb.id)}
                  className="px-4 py-2 rounded-xl bg-lifedrop-navy hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Register Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. My Registered Appointments */}
      {appointments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-lifedrop-navy flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            My Registered Appointments
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  appt.status === 'CANCELLED'
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-blue-50/60 border-blue-100'
                }`}
              >
                <div>
                  <div className="text-xs font-extrabold text-blue-950">{appt.bloodBankName}</div>
                  <div className="text-xs text-blue-700 mt-0.5">
                    {formatDate(appt.date)} • {appt.timeSlot}
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${appt.status === 'CANCELLED' ? 'text-slate-500' : 'text-blue-600'}`}>
                    Status: {appt.status === 'CANCELLED' ? 'Cancelled' : 'Donation Appointment Registered (Pending On-Site Confirmation)'}
                  </div>
                </div>

                {appt.status !== 'CANCELLED' && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Cancel this donation appointment?')) {
                        await cancelDonationAppointment(appt.id);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-[10px] font-bold transition-all shadow-2xs cursor-pointer shrink-0 ml-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Confirmed Donation History */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h3 className="text-lg font-extrabold text-lifedrop-navy flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            Confirmed Donation History ({currentUser.totalDonations} Lives Saved)
          </h3>
          <p className="text-xs text-slate-500">
            Official records confirmed and verified directly by hospital transfusion teams.
          </p>
        </div>

        {donationHistory.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
            No confirmed donations recorded yet. Complete an emergency request or blood bank drive to build your history!
          </div>
        ) : (
          <div className="space-y-3">
            {donationHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-extrabold text-sm flex items-center justify-center">
                    +1
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-lifedrop-navy">
                      {item.hospitalName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Request #{item.requestId} • {item.bloodGroup} Blood ({item.units} Unit)
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 sm:justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified & Confirmed
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDateTime(item.confirmedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Registration Modal */}
      {selectedBBId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-lifedrop-navy">
              Register Donation Appointment
            </h3>
            <p className="text-xs text-slate-500">
              Registering for:{' '}
              <strong className="text-slate-800">
                {bloodBanks.find((b) => b.id === selectedBBId)?.name}
              </strong>
            </p>

            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Preferred Date:
                </label>
                <input
                  type="date"
                  required
                  value={apptDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Time Slot:
                </label>
                <select
                  value={apptSlot}
                  onChange={(e) => setApptSlot(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium"
                >
                  <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                  <option value="10:30 AM - 12:00 PM">10:30 AM - 12:00 PM</option>
                  <option value="01:30 PM - 03:00 PM">01:30 PM - 03:00 PM</option>
                  <option value="03:30 PM - 05:00 PM">03:30 PM - 05:00 PM</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                Note: An appointment registration reserves your slot but does not count as a completed donation until the blood bank physically tests, confirms, and logs your donation.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBBId(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-lifedrop-primary hover:bg-rose-700 text-white text-xs font-bold shadow-md"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      <GoogleMapsModal
        isOpen={navData.isOpen}
        onClose={() => setNavData((prev) => ({ ...prev, isOpen: false }))}
        destinationName={navData.name}
        destinationAddress={navData.address}
        destinationPhone={navData.phone}
        destinationType={navData.type}
        latitude={navData.lat}
        longitude={navData.lng}
        distanceKm={navData.distanceKm}
      />
    </div>
  );
};
