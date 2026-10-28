/* @module: BloodBankDonationsView — Walk-in donor phlebotomy intake & donor registry console */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodGroup } from '../../types';
import {
  HeartHandshake,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Droplet,
  Clock,
  ShieldCheck,
  Activity,
  Check,
  X,
  FileText,
  UserCheck,
  Award,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

interface BloodBankDonationsViewProps {
  onNavigateTab: (tabId: string) => void;
}

interface WalkInDonationRecord {
  id: string;
  donorId: string;
  donorName: string;
  phone: string;
  bloodGroup: BloodGroup;
  units: number;
  hemoglobin: string;
  weightKg: number;
  phlebotomist: string;
  timestamp: string;
  status: 'TESTED_AND_STORED' | 'PENDING_SEROLOGY' | 'RELEASED_TO_INVENTORY';
}

const ALL_BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BloodBankDonationsView: React.FC<BloodBankDonationsViewProps> = ({
  onNavigateTab,
}) => {
  const { currentBloodBank, users, bloodBankWalkInDonation } = useLifeDrop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'ALL' | BloodGroup>('ALL');


  // Default seeded donation log records
  const [donationLogs, setDonationLogs] = useState<WalkInDonationRecord[]>([
    {
      id: 'DN-2026-0901',
      donorId: 'LD-DON-101',
      donorName: 'Rahul Verma',
      phone: '+91 98765 43210',
      bloodGroup: 'O+',
      units: 1,
      hemoglobin: '14.2 g/dL',
      weightKg: 72,
      phlebotomist: 'Dr. S. K. Murthy',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      status: 'RELEASED_TO_INVENTORY',
    },
    {
      id: 'DN-2026-0902',
      donorId: 'LD-DON-102',
      donorName: 'Priya Sundaram',
      phone: '+91 98451 23456',
      bloodGroup: 'A+',
      units: 1,
      hemoglobin: '13.5 g/dL',
      weightKg: 61,
      phlebotomist: 'Nurse Anitha K.',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: 'RELEASED_TO_INVENTORY',
    },
    {
      id: 'DN-2026-0903',
      donorId: 'LD-DON-103',
      donorName: 'Vikram Patel',
      phone: '+91 97123 45678',
      bloodGroup: 'B+',
      units: 1,
      hemoglobin: '15.0 g/dL',
      weightKg: 78,
      phlebotomist: 'Dr. S. K. Murthy',
      timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
      status: 'RELEASED_TO_INVENTORY',
    },
    {
      id: 'DN-2026-0904',
      donorId: 'LD-DON-104',
      donorName: 'Sneha Reddy',
      phone: '+91 99012 34567',
      bloodGroup: 'O-',
      units: 1,
      hemoglobin: '13.1 g/dL',
      weightKg: 58,
      phlebotomist: 'Dr. S. K. Murthy',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      status: 'RELEASED_TO_INVENTORY',
    },
  ]);



  const filteredLogs = donationLogs.filter((log) => {
    if (selectedGroupFilter !== 'ALL' && log.bloodGroup !== selectedGroupFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        log.donorName.toLowerCase().includes(q) ||
        log.donorId.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        log.phone.includes(q)
      );
    }
    return true;
  });

  const totalCollectedUnits = donationLogs.reduce((acc, l) => acc + l.units, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* View Header */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Phlebotomy Intake Desk
              </span>
              <span className="text-xs font-mono text-slate-500">
                Facility ID: {currentBloodBank.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-lifedrop-navy tracking-tight">
              Walk-In Blood Donations
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Register voluntary donors visiting {currentBloodBank.name}. Complete donor screening, record phlebotomy vitals, and automatically credit fresh units to cold storage inventory.
            </p>
          </div>


        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Total Walk-In Donations</div>
              <div className="text-xl font-black text-lifedrop-navy">
                {donationLogs.length} Donors
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Fresh Units Added</div>
              <div className="text-xl font-black text-lifedrop-navy">
                {totalCollectedUnits} Packets
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Screening Protocol</div>
              <div className="text-xl font-black text-emerald-600">
                100% CDSCO Compliant
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search donor name, ID, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-lifedrop-primary/20 focus:border-lifedrop-primary outline-none"
          />
        </div>

        {/* Blood Group Chips */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setSelectedGroupFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedGroupFilter === 'ALL'
                ? 'bg-lifedrop-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Groups
          </button>
          {ALL_BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              onClick={() => setSelectedGroupFilter(bg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedGroupFilter === bg
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* Intake Records Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-lifedrop-primary" />
            <h2 className="text-base font-extrabold text-lifedrop-navy">
              Recent Phlebotomy Intake Logs ({filteredLogs.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Real-time synchronization with Central Blood Register
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No walk-in donation records match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="py-3.5 px-4">Receipt ID</th>
                  <th className="py-3.5 px-4">Donor Name &amp; Contact</th>
                  <th className="py-3.5 px-4 text-center">Group</th>
                  <th className="py-3.5 px-4 text-center">Units</th>
                  <th className="py-3.5 px-4">Clinical Vitals</th>
                  <th className="py-3.5 px-4">Phlebotomist</th>
                  <th className="py-3.5 px-4">Intake Time</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-700">
                      {log.id}
                      <div className="text-[10px] text-slate-400">{log.donorId}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">{log.donorName}</div>
                      <div className="text-slate-500 text-[11px]">{log.phone}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs">
                        {log.bloodGroup}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {log.units} Packet{log.units > 1 ? 's' : ''}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-700 font-medium">Hb: {log.hemoglobin}</div>
                      <div className="text-slate-400 text-[11px]">Weight: {log.weightKg} kg</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {log.phlebotomist}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-medium">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Stored in Inventory
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  );
};
