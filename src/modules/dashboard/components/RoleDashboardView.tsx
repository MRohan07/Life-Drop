/* @module: RoleDashboardView — View switcher for active role and subtab */
import React from 'react';
import { UserDashboard } from '../../../components/user/UserDashboard';
import { DonateBloodView } from '../../../components/user/DonateBloodView';
import { BloodRequestsView } from '../../../components/user/BloodRequestsView';
import { NearbyHospitals } from '../../../components/user/NearbyHospitals';
import { NearbyBloodBanks } from '../../../components/user/NearbyBloodBanks';
import { CampaignsFeed } from '../../../components/user/CampaignsFeed';
import { UserProfileView } from '../../../components/user/UserProfile';
import { UserTransactionsView } from '../../../components/user/UserTransactionsView';
import { HospitalDashboard } from '../../../components/hospital/HospitalDashboard';
import { HospitalEmergencyView } from '../../../components/hospital/HospitalEmergencyView';
import { HospitalTrackingHub } from '../../../components/hospital/HospitalTrackingHub';
import { HospitalTransactionsView } from '../../../components/hospital/HospitalTransactionsView';
import { PendingDonorsView } from '../../../components/hospital/PendingDonorsView';
import { HospitalBloodBanksView } from '../../../components/hospital/HospitalBloodBanksView';
import { HospitalProfileView } from '../../../components/hospital/HospitalProfileView';
import { BloodBankDashboard } from '../../../components/bloodbank/BloodBankDashboard';
import { BloodBankInventoryView } from '../../../components/bloodbank/BloodBankInventoryView';
import { BloodBankRequestsView } from '../../../components/bloodbank/BloodBankRequestsView';
import { BloodBankDonationsView } from '../../../components/bloodbank/BloodBankDonationsView';
import { BloodBankTransactionsView } from '../../../components/bloodbank/BloodBankTransactionsView';
import { BloodBankCampaignsView } from '../../../components/bloodbank/BloodBankCampaignsView';
import { BloodBankProfileView } from '../../../components/bloodbank/BloodBankProfileView';
import { AdminDashboard } from '../../../components/admin/AdminDashboard';
import { AdminProfileView } from '../../../components/admin/AdminProfileView';
import { useLifeDrop } from '../../../context/LifeDropContext';

interface RoleDashboardViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const RoleDashboardView: React.FC<RoleDashboardViewProps> = ({ activeTab, setActiveTab }) => {
  const { requests } = useLifeDrop();

  // User / Donor Tabs
  if (activeTab === 'user-dashboard') return <UserDashboard onNavigateTab={setActiveTab} />;
  if (activeTab === 'user-requests') return <BloodRequestsView />;
  if (activeTab === 'user-donate') return <DonateBloodView />;
  if (activeTab === 'user-transactions') return <UserTransactionsView onNavigateTab={setActiveTab} />;
  if (activeTab === 'user-hospitals') return <NearbyHospitals />;
  if (activeTab === 'user-bloodbanks') return <NearbyBloodBanks />;
  if (activeTab === 'user-campaigns') return <CampaignsFeed />;
  if (activeTab === 'user-profile') return <UserProfileView />;

  // Hospital Tabs
  if (activeTab === 'hosp-dashboard') return <HospitalDashboard onNavigateTab={setActiveTab} />;
  if (activeTab === 'hosp-emergency') return <HospitalEmergencyView onNavigateTab={setActiveTab} />;
  if (activeTab === 'hosp-tracking') return <HospitalTrackingHub onNavigateTab={setActiveTab} />;
  if (activeTab === 'hosp-transactions') return <HospitalTransactionsView onNavigateTab={setActiveTab} />;
  if (activeTab === 'hosp-donors') return <PendingDonorsView />;
  if (activeTab === 'hosp-bloodbanks') return <HospitalBloodBanksView onNavigateTab={setActiveTab} />;
  if (activeTab === 'hosp-profile') return <HospitalProfileView onNavigateTab={setActiveTab} />;

  // Blood Bank Tabs
  if (activeTab === 'bb-dashboard') return <BloodBankDashboard onNavigateTab={setActiveTab} />;
  if (activeTab === 'bb-inventory') return <BloodBankInventoryView onNavigateTab={setActiveTab} />;
  if (activeTab === 'bb-requests') return <BloodBankRequestsView onNavigateTab={setActiveTab} />;
  if (activeTab === 'bb-donations') return <BloodBankDonationsView onNavigateTab={setActiveTab} />;
  if (activeTab === 'bb-transactions') return <BloodBankTransactionsView onNavigateTab={setActiveTab} />;
  if (activeTab === 'bb-campaigns') return <BloodBankCampaignsView onNavigateTab={setActiveTab} />;
  if (activeTab === 'bb-profile') return <BloodBankProfileView onNavigateTab={setActiveTab} />;

  // Admin Tabs
  if (activeTab === 'admin-profile') return <AdminProfileView onNavigateTab={setActiveTab} />;
  if (activeTab.startsWith('admin')) {
    let subTab: 'overview' | 'hospitals' | 'bloodbanks' | 'users' | 'requests' | 'reports' | 'audit' | 'reviews' | 'applications' = 'overview';
    if (activeTab === 'admin-applications') subTab = 'applications';
    else if (activeTab === 'admin-hospitals') subTab = 'hospitals';
    else if (activeTab === 'admin-bloodbanks') subTab = 'bloodbanks';
    else if (activeTab === 'admin-users') subTab = 'users';
    else if (activeTab === 'admin-requests') subTab = 'requests';
    else if (activeTab === 'admin-reports') subTab = 'reports';
    else if (activeTab === 'admin-audit') subTab = 'audit';
    else if (activeTab === 'admin-reviews' || activeTab === 'admin-feedback') subTab = 'reviews';
    return <AdminDashboard onNavigateTab={setActiveTab} subTab={subTab} />;
  }

  return <UserDashboard onNavigateTab={setActiveTab} />;
};

export default RoleDashboardView;
