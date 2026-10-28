/* @module: MobileDrawer — Slide-over navigation drawer for mobile viewport */
import React from 'react';
import {
  X, LayoutDashboard, HeartHandshake, AlertCircle, Building2, Warehouse,
  Calendar, User, Radio, FileCheck2, Users, ShieldCheck, Droplet,
  Activity, FileText, ChevronRight, LogOut, RefreshCw, MessageSquare,
} from 'lucide-react';
import { useLifeDrop } from '../../context/LifeDropContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigateHome?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onNavigateHome,
}) => {
  const {
    currentRole, currentUser, currentHospital, currentBloodBank, currentAdmin,
    hospitals, bloodBanks, reports, logout, facilityApplications = [],
  } = useLifeDrop();

  if (!isOpen) return null;

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

  const items =
    currentRole === 'USER'
      ? userItems
      : currentRole === 'HOSPITAL'
      ? hospitalItems
      : currentRole === 'BLOOD_BANK'
      ? bloodBankItems
      : adminItems;

  const rankBorders: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    gold: { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
    silver: { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
    platinum: { border: 'border-cyan-400', bg: 'bg-cyan-50', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    bronze: { border: 'border-amber-700', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
  };
  const rankStyle = rankBorders[currentUser?.rank?.toLowerCase() || 'bronze'] || rankBorders.bronze;

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slideInLeft">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full border-2 ${
                currentRole === 'USER'
                  ? `${rankStyle.border} ${rankStyle.bg} ${rankStyle.text}`
                  : 'border-slate-200 bg-slate-100 text-slate-700'
              } flex items-center justify-center flex-shrink-0 shadow-xs`}
            >
              {currentRole === 'USER' ? (
                <User className="w-5 h-5" />
              ) : currentRole === 'HOSPITAL' ? (
                <Building2 className="w-5 h-5 text-blue-600" />
              ) : currentRole === 'BLOOD_BANK' ? (
                <Warehouse className="w-5 h-5 text-amber-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900 truncate">
                {currentRole === 'USER'
                  ? currentUser.name
                  : currentRole === 'HOSPITAL'
                  ? currentHospital.name
                  : currentRole === 'BLOOD_BANK'
                  ? currentBloodBank.name
                  : (currentAdmin?.name || 'Super Admin')}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                  {currentRole}
                </span>
                {currentRole === 'USER' && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold border ${rankStyle.badge}`}
                  >
                    {currentUser.rank}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation Menu
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-lifedrop-navy text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {'badge' in item && item.badge !== undefined ? (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-white/60' : 'text-slate-300'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <button
            onClick={async () => {
              await logout();
              onClose();
              if (onNavigateHome) onNavigateHome();
              else window.location.pathname = '/';
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out of LifeDrop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
