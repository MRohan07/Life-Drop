/* @module: Sidebar — Collapsible role navigation with rank-colored profile symbol */
import React from 'react';
import {
  LayoutDashboard, HeartHandshake, AlertCircle, Building2, Warehouse,
  Calendar, User, Radio, FileCheck2, Users, ShieldCheck, ChevronLeft, ChevronRight, Droplet,
  Activity, FileText, MessageSquare,
} from 'lucide-react';
import { useLifeDrop } from '../../../context/LifeDropContext';
import { SidebarProps } from './Sidebar.types';

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { currentRole, currentUser, currentHospital, currentBloodBank, currentAdmin, hospitals, bloodBanks, reports, facilityApplications = [] } = useLifeDrop();

  const userItems = [
    { id: 'user-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user-donate', label: 'Donate Blood', icon: HeartHandshake },
    { id: 'user-requests', label: 'Blood Requests', icon: AlertCircle },
    { id: 'user-transactions', label: 'Donation Ledger', icon: FileText },
    { id: 'user-hospitals', label: 'Nearby Hospitals', icon: Building2 },
    { id: 'user-bloodbanks', label: 'Nearby Blood Banks', icon: Warehouse },
    { id: 'user-campaigns', label: 'Campaigns', icon: Calendar },
    { id: 'user-profile', label: 'My Profile', icon: User },
  ];

  const hospitalItems = [
    { id: 'hosp-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hosp-emergency', label: 'Emergency Requests', icon: Radio },
    { id: 'hosp-tracking', label: 'Request Tracking', icon: AlertCircle },
    { id: 'hosp-transactions', label: 'Blood Transactions', icon: FileText },
    { id: 'hosp-donors', label: 'Pending Donors', icon: Users },
    { id: 'hosp-bloodbanks', label: 'Blood Banks', icon: Warehouse },
    { id: 'hosp-profile', label: 'Hospital Profile', icon: Building2 },
  ];

  const bloodBankItems = [
    { id: 'bb-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bb-inventory', label: 'Inventory (8 Groups)', icon: Droplet },
    { id: 'bb-requests', label: 'Blood Requests', icon: AlertCircle },
    { id: 'bb-donations', label: 'Walk-In Donations', icon: HeartHandshake },
    { id: 'bb-transactions', label: 'Transaction Audit', icon: FileText },
    { id: 'bb-campaigns', label: 'Campaigns', icon: Calendar },
    { id: 'bb-profile', label: 'Blood Bank Profile', icon: Building2 },
  ];

  const pendingHospitalApps = facilityApplications.filter((a) => a.facilityType === 'HOSPITAL' && (a.status === 'PENDING' || a.status === 'UNDER_REVIEW')).length;
  const pendingBloodBankApps = facilityApplications.filter((a) => a.facilityType === 'BLOOD_BANK' && (a.status === 'PENDING' || a.status === 'UNDER_REVIEW')).length;
  const pendingTotalApps = pendingHospitalApps + pendingBloodBankApps;
  const pendingHospitalsCount = hospitals.filter((h) => !h.isVerified).length + pendingHospitalApps;
  const pendingBloodBanksCount = bloodBanks.filter((b) => !b.isVerified).length + pendingBloodBankApps;
  const openReportsCount = reports.filter((r) => r.status === 'PENDING').length;

  const adminItems: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-applications', label: 'Facility Applications', icon: FileCheck2, badge: pendingTotalApps > 0 ? pendingTotalApps : undefined },
    { id: 'admin-hospitals', label: 'Hospitals & Clinics', icon: Building2, badge: pendingHospitalsCount > 0 ? pendingHospitalsCount : undefined },
    { id: 'admin-bloodbanks', label: 'Blood Banks', icon: Warehouse, badge: pendingBloodBanksCount > 0 ? pendingBloodBanksCount : undefined },
    { id: 'admin-users', label: 'Donors & Users', icon: Users },
    { id: 'admin-requests', label: 'Live Blood Requests', icon: Activity },
    { id: 'admin-reports', label: 'Incident Reports', icon: FileCheck2, badge: openReportsCount > 0 ? openReportsCount : undefined },
    { id: 'admin-reviews', label: 'Reviews & Feedback', icon: MessageSquare },
    { id: 'admin-audit', label: 'Activity Audit Logs', icon: FileText },
    { id: 'admin-profile', label: 'Admin Profile', icon: User },
  ];

  const items = currentRole === 'USER' ? userItems : currentRole === 'HOSPITAL' ? hospitalItems : currentRole === 'BLOOD_BANK' ? bloodBankItems : adminItems;

  const rankBorders: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    gold: { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
    silver: { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
    platinum: { border: 'border-cyan-400', bg: 'bg-cyan-50', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    bronze: { border: 'border-amber-700', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
  };
  const rankStyle = rankBorders[currentUser?.rank?.toLowerCase() || 'bronze'] || rankBorders.bronze;

  return (
    <aside className={`hidden lg:flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} shrink-0 h-screen sticky top-0`}>
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 truncate">
            {/* Clean Profile Icon Symbol with Rank Border (No Photo) */}
            <div className={`w-8 h-8 rounded-full border-2 ${currentRole === 'USER' ? `${rankStyle.border} ${rankStyle.bg} ${rankStyle.text}` : 'border-slate-200 bg-slate-100 text-slate-700'} flex items-center justify-center flex-shrink-0 shadow-2xs`}>
              {currentRole === 'USER' ? (
                <User className="w-4 h-4" />
              ) : currentRole === 'HOSPITAL' ? (
                <Building2 className="w-4 h-4 text-blue-600" />
              ) : currentRole === 'BLOOD_BANK' ? (
                <Warehouse className="w-4 h-4 text-amber-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              )}
            </div>
            <div className="truncate">
              <div className="text-xs font-black text-slate-900 truncate">
                {currentRole === 'USER' ? currentUser.name : currentRole === 'HOSPITAL' ? currentHospital.name : currentRole === 'BLOOD_BANK' ? currentBloodBank.name : (currentAdmin?.name || 'Super Admin')}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{currentRole}</span>
                {currentRole === 'USER' && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold border ${rankStyle.badge}`}>{currentUser.rank}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-full border-2 ${currentRole === 'USER' ? `${rankStyle.border} ${rankStyle.bg} ${rankStyle.text}` : 'border-slate-200 bg-slate-100'} flex items-center justify-center mx-auto`}>
            <User className="w-4 h-4" />
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0">
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive ? 'bg-lifedrop-navy text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
                  <span className="truncate">{item.label}</span>
                  {'badge' in item && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
