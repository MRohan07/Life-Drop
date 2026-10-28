import React, { useState, useEffect } from 'react';
import { useLifeDrop } from '../context/LifeDropContext';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { MobileNav } from '../components/common/MobileNav';
import { NotificationCenter } from '../components/common/NotificationCenter';
import { ToastContainer } from '../components/common/ToastContainer';
import { GlassFeedbackModal } from '../components/common/GlassFeedbackModal';

// Landing Page
import { LandingPage } from '../components/landing/LandingPage';

// User Views
import { UserDashboard } from '../components/user/UserDashboard';
import { DonateBloodView } from '../components/user/DonateBloodView';
import { NearbyHospitals } from '../components/user/NearbyHospitals';
import { NearbyBloodBanks } from '../components/user/NearbyBloodBanks';
import { CampaignsFeed } from '../components/user/CampaignsFeed';
import { UserProfileView } from '../components/user/UserProfile';
import { UserTransactionsView } from '../components/user/UserTransactionsView';

// Hospital Views
import { HospitalDashboard } from '../components/hospital/HospitalDashboard';
import { HospitalEmergencyView } from '../components/hospital/HospitalEmergencyView';
import { HospitalTrackingHub } from '../components/hospital/HospitalTrackingHub';
import { PendingDonorsView } from '../components/hospital/PendingDonorsView';
import { HospitalBloodBanksView } from '../components/hospital/HospitalBloodBanksView';
import { HospitalProfileView } from '../components/hospital/HospitalProfileView';
import { HospitalTransactionsView } from '../components/hospital/HospitalTransactionsView';

// Blood Bank Views
import { BloodBankDashboard } from '../components/bloodbank/BloodBankDashboard';
import { BloodBankInventoryView } from '../components/bloodbank/BloodBankInventoryView';
import { BloodBankRequestsView } from '../components/bloodbank/BloodBankRequestsView';
import { BloodBankDonationsView } from '../components/bloodbank/BloodBankDonationsView';
import { BloodBankCampaignsView } from '../components/bloodbank/BloodBankCampaignsView';
import { BloodBankProfileView } from '../components/bloodbank/BloodBankProfileView';
import { BloodBankTransactionsView } from '../components/bloodbank/BloodBankTransactionsView';

// Admin Views
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminProfileView } from '../components/admin/AdminProfileView';
import { AuthView } from './AuthView';

export const MainLayout: React.FC = () => {
  const { currentRole, setCurrentRole, requests } = useLifeDrop();

  const [activeTab, setActiveTab] = useState<string>('landing');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [activeTrackingReqId, setActiveTrackingReqId] = useState<string | null>(null);

  // Sync activeTab default whenever role changes if not in landing
  useEffect(() => {
    if (activeTab !== 'landing') {
      if (currentRole === 'USER') setActiveTab('user-dashboard');
      if (currentRole === 'HOSPITAL') setActiveTab('hosp-dashboard');
      if (currentRole === 'BLOOD_BANK') setActiveTab('bb-dashboard');
      if (currentRole === 'ADMIN') setActiveTab('admin-dashboard');
    }
  }, [currentRole]);

  const handleEnterPlatform = (role?: string) => {
    if (role) {
      setCurrentRole(role as any);
    }
    if (role === 'HOSPITAL') setActiveTab('hosp-dashboard');
    else if (role === 'BLOOD_BANK') setActiveTab('bb-dashboard');
    else if (role === 'ADMIN') setActiveTab('admin-dashboard');
    else setActiveTab('user-dashboard');
  };

  const getSectionTitle = () => {
    if (activeTab === 'landing') return 'Public Portal & Landing';
    if (activeTab.startsWith('user')) return 'Donor Coordination Portal';
    if (activeTab.startsWith('hosp')) return 'Hospital Emergency Coordination';
    if (activeTab.startsWith('bb')) return 'Blood Bank Inventory & Logistics';
    if (activeTab.startsWith('admin')) return 'Super Administrator Control';
    return 'LifeDrop Network';
  };

  return (
    <div className="min-h-screen bg-lifedrop-bg flex flex-col selection:bg-lifedrop-primary selection:text-white">
      {/* Global Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenNotifications={() => setNotificationCenterOpen(true)}
        activeSectionTitle={getSectionTitle()}
      />

      {/* Main Body Layout with Collapsible Sidebar & Content */}
      <div className="flex-1 flex w-full">
        {activeTab !== 'landing' && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* 1. PUBLIC LANDING VIEW */}
          {activeTab === 'landing' && (
            <LandingPage
              onEnterPlatform={handleEnterPlatform}
              onRequestBloodClick={() => handleEnterPlatform('HOSPITAL')}
              onDonateBloodClick={() => handleEnterPlatform('USER')}
            />
          )}

          {/* 2. USER / DONOR VIEWS */}
          {activeTab === 'user-dashboard' && (
            <UserDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'user-donate' && <DonateBloodView />}
          {activeTab === 'user-transactions' && (
            <UserTransactionsView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'user-requests' && (
            <UserDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'user-hospitals' && <NearbyHospitals />}
          {activeTab === 'user-bloodbanks' && <NearbyBloodBanks />}
          {activeTab === 'user-campaigns' && <CampaignsFeed />}
          {activeTab === 'user-profile' && (
            <UserProfileView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 3. HOSPITAL VIEWS */}
          {activeTab === 'hosp-dashboard' && (
            <HospitalDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'hosp-emergency' && (
            <HospitalEmergencyView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'hosp-transactions' && (
            <HospitalTransactionsView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'hosp-tracking' && (
            <HospitalTrackingHub onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'hosp-donors' && <PendingDonorsView />}
          {activeTab === 'hosp-bloodbanks' && (
            <HospitalBloodBanksView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'hosp-reports' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="reports" />
          )}
          {activeTab === 'hosp-profile' && (
            <HospitalProfileView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 4. BLOOD BANK VIEWS */}
          {activeTab === 'bb-dashboard' && (
            <BloodBankDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'bb-inventory' && (
            <BloodBankInventoryView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'bb-transactions' && (
            <BloodBankTransactionsView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'bb-requests' && (
            <BloodBankRequestsView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'bb-donations' && (
            <BloodBankDonationsView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'bb-campaigns' && (
            <BloodBankCampaignsView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'bb-profile' && (
            <BloodBankProfileView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {/* 5. ADMIN VIEWS */}
          {activeTab === 'admin-dashboard' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="overview" />
          )}
          {activeTab === 'admin-applications' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="applications" />
          )}
          {activeTab === 'admin-users' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="users" />
          )}
          {activeTab === 'admin-hospitals' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="hospitals" />
          )}
          {activeTab === 'admin-bloodbanks' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="bloodbanks" />
          )}
          {activeTab === 'admin-requests' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="requests" />
          )}
          {activeTab === 'admin-reports' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="reports" />
          )}
          {activeTab === 'admin-campaigns' && <CampaignsFeed />}
          {(activeTab === 'admin-reviews' || activeTab === 'admin-feedback') && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="reviews" />
          )}
          {activeTab === 'admin-audit' && (
            <AdminDashboard onNavigateTab={setActiveTab} subTab="audit" />
          )}
          {activeTab === 'admin-profile' && (
            <AdminProfileView onNavigateTab={setActiveTab} />
          )}
        </main>
      </div>

      {/* Mobile-First Bottom Navigation Bar */}
      {activeTab !== 'landing' && (
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Slide-Out Notification Center */}
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        onSelectRequest={(reqId) => {
          if (currentRole === 'HOSPITAL') {
            setActiveTab('hosp-tracking');
          } else {
            setActiveTab('user-dashboard');
          }
        }}
      />

      {/* Auth / Role Switcher Modal */}
      {authModalOpen && (
        <AuthView
          onSuccess={(role) => {
            setAuthModalOpen(false);
            handleEnterPlatform(role);
          }}
          onCancel={() => setAuthModalOpen(false)}
        />
      )}

      {/* Glassmorphic Feedback Dialog */}
      <GlassFeedbackModal />

      {/* Live Toast Emergency Notifications */}
      <ToastContainer />
    </div>
  );
};
