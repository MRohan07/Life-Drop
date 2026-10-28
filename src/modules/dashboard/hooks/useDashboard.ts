/* @module: useDashboard — Dashboard navigation and role management hook */
import { useState, useEffect } from 'react';
import { useLifeDrop } from '../../../context/LifeDropContext';

export const useDashboard = () => {
  const { currentRole, setCurrentRole, requests } = useLifeDrop();
  const [activeTab, setActiveTab] = useState<string>('user-dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentRole === 'USER') setActiveTab('user-dashboard');
    if (currentRole === 'HOSPITAL') setActiveTab('hosp-dashboard');
    if (currentRole === 'BLOOD_BANK') setActiveTab('bb-dashboard');
    if (currentRole === 'ADMIN') setActiveTab('admin-dashboard');
  }, [currentRole]);

  return {
    currentRole, setCurrentRole, requests, activeTab, setActiveTab,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isMobileDrawerOpen, setIsMobileDrawerOpen,
    notificationCenterOpen, setNotificationCenterOpen,
  };
};

