import React from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { BloodDrop3D } from './BloodDrop3D';
import {
  Bell,
  UserCheck,
  Building2,
  Warehouse,
  ShieldCheck,
  LogOut,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenNotifications: () => void;
  activeSectionTitle?: string;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenNotifications,
  activeSectionTitle = 'Coordination Dashboard',
  onSignOut,
}) => {
  const {
    currentRole,
    currentUser,
    currentHospital,
    currentBloodBank,
    currentAdmin,
    notifications,
    logout,
  } = useLifeDrop();

  // Compute unread count for current role
  const unreadCount = notifications.filter((n) => {
    if (n.read) return false;
    if (currentRole === 'ADMIN') return true;
    if (n.recipientRole !== currentRole) return false;
    if (currentRole === 'USER' && n.recipientId && n.recipientId !== currentUser.id) return false;
    if (currentRole === 'HOSPITAL' && n.recipientId && n.recipientId !== currentHospital.id) return false;
    if (currentRole === 'BLOOD_BANK' && n.recipientId && n.recipientId !== currentBloodBank.id) return false;
    return true;
  }).length;

  const handleLogout = async () => {
    await logout();
    if (onSignOut) {
      onSignOut();
    } else {
      window.location.pathname = '/';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand / Title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <BloodDrop3D size="sm" showPulse={false} />
            <div className="hidden sm:block">
              <span className="text-xl font-extrabold tracking-tight text-lifedrop-navy flex items-center gap-1">
                Life<span className="text-lifedrop-primary">Drop</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-1">
                Blood Coordination
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center h-6 w-px bg-slate-200 mx-2" />

          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-slate-800">{activeSectionTitle}</h1>
          </div>
        </div>

        {/* Right Actions: Authenticated Identity Badge, Notifications, Sign Out */}
        <div className="flex items-center gap-2.5">
          {/* Authenticated Identity Badge (Read-only, no persona switcher dropdown) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
            {currentRole === 'USER' && (
              <>
                <UserCheck className="w-4 h-4 text-lifedrop-primary" />
                <span className="hidden sm:inline">Donor: {currentUser.name} ({currentUser.bloodGroup})</span>
                <span className="sm:hidden">Donor</span>
              </>
            )}
            {currentRole === 'HOSPITAL' && (
              <>
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">{currentHospital.name.split(' ')[0]}</span>
                <span className="sm:hidden">Hospital</span>
              </>
            )}
            {currentRole === 'BLOOD_BANK' && (
              <>
                <Warehouse className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">{currentBloodBank.name.split(' ')[0]}</span>
                <span className="sm:hidden">Blood Bank</span>
              </>
            )}
            {currentRole === 'ADMIN' && (
              <>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">{currentAdmin?.name || 'Administrator'}</span>
                <span className="sm:hidden">Admin</span>
              </>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Sign out of LifeDrop"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-lifedrop-emergency text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
