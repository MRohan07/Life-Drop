/* @module: Navbar — Global navigation bar with landing-only Login and authenticated Sign Out */
import React from 'react';
import { Menu, Bell, UserCheck, Building2, Warehouse, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { useLifeDrop } from '../../../context/LifeDropContext';
import { BloodDrop3D } from '../../common/BloodDrop3D';
import { NavbarProps } from './Navbar.types';

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar, onOpenNotifications, activeSectionTitle = 'LifeDrop Network',
  onNavigate, currentPath = '/',
}) => {
  const {
    currentRole, currentUser,
    currentHospital,
    currentBloodBank,
    currentAdmin,
    notifications,
    isAuthenticated,
    logout,
  } = useLifeDrop();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    await logout();
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.location.pathname = '/';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-2.5 transition-all shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate ? onNavigate('/') : window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <BloodDrop3D size="sm" showPulse={false} />
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-lifedrop-navy">
                Life<span className="text-lifedrop-primary">Drop</span>
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-lifedrop-primary text-xs font-black tracking-tight">
                Blood Coordination
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center h-6 w-px bg-slate-200 mx-2" />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{activeSectionTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* If NOT on dashboard/authenticated, show Login button */}
          {currentPath !== '/dashboard' && !isAuthenticated && (
            <button
              onClick={() => onNavigate ? onNavigate('/auth') : (window.location.pathname = '/auth')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-rose-400" />
              <span>Login</span>
            </button>
          )}

          {/* Authenticated Identity Badge (Read-only, no persona switching dropdown) */}
          {(currentPath === '/dashboard' || isAuthenticated) && (
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
          )}

          {/* On Dashboard or Authenticated: Sign Out Button */}
          {(currentPath === '/dashboard' || isAuthenticated) && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Sign out of LifeDrop"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}

          {onOpenNotifications && (
            <button onClick={onOpenNotifications} className="relative p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-xs cursor-pointer">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lifedrop-emergency text-white text-[9px] font-black flex items-center justify-center">{unreadCount}</span>}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
