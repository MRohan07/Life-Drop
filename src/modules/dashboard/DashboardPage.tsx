/* @module: DashboardPage — Master dashboard page with sidebar layout, mobile drawer, and bottom navigation */
import React from 'react';
import { Sidebar } from '../../components/shared/Sidebar';
import { MobileNav } from '../../components/common/MobileNav';
import { MobileDrawer } from '../../components/common/MobileDrawer';
import { RoleDashboardView } from './components/RoleDashboardView';
import { NotificationCenter } from '../../components/common/NotificationCenter';
import { ToastContainer } from '../../components/common/ToastContainer';
import { useDashboard } from './hooks/useDashboard';

interface DashboardPageProps {
  isMobileDrawerOpen?: boolean;
  onToggleMobileDrawer?: () => void;
  onCloseMobileDrawer?: () => void;
  onNavigateHome?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  isMobileDrawerOpen: controlledDrawerOpen,
  onToggleMobileDrawer,
  onCloseMobileDrawer,
  onNavigateHome,
}) => {
  const dashboard = useDashboard();

  const isDrawerOpen =
    controlledDrawerOpen !== undefined
      ? controlledDrawerOpen
      : dashboard.isMobileDrawerOpen;

  const handleCloseDrawer = () => {
    if (onCloseMobileDrawer) onCloseMobileDrawer();
    dashboard.setIsMobileDrawerOpen(false);
  };

  const handleOpenDrawer = () => {
    if (onToggleMobileDrawer) onToggleMobileDrawer();
    dashboard.setIsMobileDrawerOpen(true);
  };

  return (
    <div className="flex-1 flex w-full">
      {/* Desktop Persistent Collapsible Sidebar */}
      <Sidebar
        activeTab={dashboard.activeTab}
        setActiveTab={dashboard.setActiveTab}
        isCollapsed={dashboard.isSidebarCollapsed}
        setIsCollapsed={dashboard.setIsSidebarCollapsed}
      />

      {/* Main Content Area - pb-24 on mobile so pinned bottom bar never covers content */}
      <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
        <RoleDashboardView
          activeTab={dashboard.activeTab}
          setActiveTab={dashboard.setActiveTab}
        />
      </main>

      {/* Mobile Pinned Bottom Navigation Bar */}
      <MobileNav
        activeTab={dashboard.activeTab}
        setActiveTab={dashboard.setActiveTab}
        onOpenMenu={handleOpenDrawer}
      />

      {/* Mobile Slide-Over Navigation Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        activeTab={dashboard.activeTab}
        setActiveTab={dashboard.setActiveTab}
        onNavigateHome={onNavigateHome}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={dashboard.notificationCenterOpen}
        onClose={() => dashboard.setNotificationCenterOpen(false)}
        onSelectRequest={() => dashboard.setActiveTab('hosp-tracking')}
      />
      <ToastContainer />
    </div>
  );
};

export default DashboardPage;

