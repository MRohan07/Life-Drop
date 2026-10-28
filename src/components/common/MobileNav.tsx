import React from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  LayoutDashboard,
  HeartHandshake,
  AlertCircle,
  Building2,
  Warehouse,
  Radio,
  Activity,
  Users,
  Droplet,
  Menu,
  ShieldCheck,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMenu?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onOpenMenu }) => {
  const { currentRole } = useLifeDrop();

  const getUserItems = () => [
    { id: 'user-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'user-donate', label: 'Donate', icon: HeartHandshake },
    { id: 'user-requests', label: 'Emergency', icon: AlertCircle },
    { id: 'user-hospitals', label: 'Hospitals', icon: Building2 },
  ];

  const getHospitalItems = () => [
    { id: 'hosp-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hosp-emergency', label: 'Radar', icon: Radio },
    { id: 'hosp-tracking', label: 'Tracking', icon: Activity },
    { id: 'hosp-donors', label: 'Donors', icon: Users },
  ];

  const getBloodBankItems = () => [
    { id: 'bb-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bb-inventory', label: 'Inventory', icon: Droplet },
    { id: 'bb-requests', label: 'Requests', icon: AlertCircle },
    { id: 'bb-donations', label: 'Walk-In', icon: HeartHandshake },
  ];

  const getAdminItems = () => [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-hospitals', label: 'Facilities', icon: Building2 },
    { id: 'admin-requests', label: 'Requests', icon: Activity },
    { id: 'admin-profile', label: 'Profile', icon: ShieldCheck },
  ];

  const items =
    currentRole === 'USER'
      ? getUserItems()
      : currentRole === 'HOSPITAL'
      ? getHospitalItems()
      : currentRole === 'BLOOD_BANK'
      ? getBloodBankItems()
      : getAdminItems();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 shadow-2xl flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-lifedrop-primary font-bold scale-105'
                : 'text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] leading-tight">{item.label}</span>
          </button>
        );
      })}

      {onOpenMenu && (
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all text-slate-500 font-medium hover:text-slate-800 active:scale-95"
          title="More views & settings"
        >
          <Menu className="w-5 h-5 stroke-2 text-slate-600" />
          <span className="text-[10px] leading-tight text-slate-600">More</span>
        </button>
      )}
    </div>
  );
};

