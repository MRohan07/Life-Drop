import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  UserProfile,
  Hospital,
  BloodBank,
  BloodRequest,
  BloodBankContribution,
  Campaign,
  UserReport,
  AuditLog,
  AppNotification,
  UserRole,
  BloodGroup,
  EmergencyLevel,
  DonationAppointment,
  FeedbackSubmission,
  FeedbackAdminReply,
  AdminProfile,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_HOSPITALS,
  INITIAL_BLOOD_BANKS,
  INITIAL_REQUESTS,
  INITIAL_CAMPAIGNS,
  INITIAL_AUDIT_LOGS,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_FEEDBACKS,
  INITIAL_ADMIN,
} from '../data/initialMockData';
import {
  checkEligibility,
  calculateDonorRank,
  isBloodCompatible,
} from '../utils/compatibility';
import { recalculateRequestFulfillment } from '../utils/allocationEngine';
import api, { toPrismaBloodGroup, normalizeBloodGroup } from '../lib/api/client';
import {
  transformBackendRequest,
  transformBackendHospital,
  transformBackendBloodBank,
  transformBackendDonor,
  transformBackendCampaign,
} from '../lib/api/transformers';

interface LifeDropContextType {
  // Active Persona / Role State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;
  setCurrentUserId: (id: string) => void;
  currentHospital: Hospital;
  setCurrentHospitalId: (id: string) => void;
  currentBloodBank: BloodBank;
  setCurrentBloodBankId: (id: string) => void;
  currentAdmin: AdminProfile;

  // Real PostgreSQL Auth
  isAuthenticated: boolean;
  login: (identifier: string, password?: string, role?: UserRole) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  loginWithDemo: (role: UserRole, accountKey?: string) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  checkAuthSession: () => Promise<boolean>;

  // Data Stores
  users: UserProfile[];
  hospitals: Hospital[];
  bloodBanks: BloodBank[];
  requests: BloodRequest[];
  campaigns: Campaign[];
  reports: UserReport[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  appointments: DonationAppointment[];
  feedbacks: FeedbackSubmission[];

  // User Actions
  donorRespond: (
    requestId: string,
    response: 'ACCEPT' | 'DECLINE',
    reason?: string
  ) => { success: boolean; message: string };
  donorCancelDonation: (
    requestId: string,
    reason?: string
  ) => { success: boolean; message: string };
  updateUserProfile: (updated: Partial<UserProfile>) => void;
  registerUser: (userData: {
    name: string;
    phone: string;
    bloodGroup: BloodGroup;
    city: string;
    email?: string;
    location?: string;
    dob?: string;
    latitude?: number;
    longitude?: number;
    lastDonationDate?: string | null;
    password?: string;
  }) => Promise<{ success: boolean; message?: string; user?: any }>;
  registerHospital: (data: Hospital) => Hospital;
  registerBloodBank: (data: BloodBank) => BloodBank;
  registerDonationAppointment: (
    bloodBankId: string,
    date: string,
    timeSlot: string
  ) => { success: boolean; message: string };
  cancelDonationAppointment: (
    apptId: string,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Hospital Actions
  createBloodRequest: (data: {
    patientName: string;
    bloodGroup: BloodGroup;
    requiredUnits: number;
    emergencyLevel: EmergencyLevel;
    requiredDateTime: string;
    contactNumber: string;
    notes?: string;
    targetBloodBankId?: string;
  }) => Promise<BloodRequest>;
  hospitalConfirmDonation: (
    requestId: string,
    donorId: string,
    unitsDonated?: number
  ) => { success: boolean; message: string };
  hospitalMarkNoShow: (
    requestId: string,
    donorId: string
  ) => { success: boolean; message: string };
  hospitalMarkNotCompleted: (
    requestId: string,
    donorId: string,
    reason?: string
  ) => { success: boolean; message: string };
  submitReport: (data: {
    reportedUserId: string;
    requestId: string;
    reason: UserReport['reason'];
    description: string;
  }) => void;
  closeRequest: (requestId: string) => void;
  deleteBloodRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  updateHospitalProfile: (updated: Partial<Hospital>) => void;
  hospitalRequestBloodTransfer: (
    bloodBankId: string,
    requestId: string,
    bloodGroup: BloodGroup,
    units: number
  ) => Promise<{ success: boolean; message: string; requestId?: string }>;
  refreshRequests: () => Promise<void>;
  refreshBloodBanks: () => Promise<void>;
  refreshMyInventory: () => Promise<void>;

  // Blood Bank Actions
  bloodBankOfferUnits: (
    requestId: string,
    bloodGroup: BloodGroup,
    units: number
  ) => { success: boolean; message: string };
  bloodBankConfirmSupply: (
    requestId: string,
    bloodBankId: string
  ) => { success: boolean; message: string };
  bloodBankWalkInDonation: (
    donorId: string,
    bloodGroup: BloodGroup,
    units?: number
  ) => { success: boolean; message: string };
  updateInventoryStock: (
    bloodBankId: string,
    bloodGroup: BloodGroup,
    newAvailable: number
  ) => Promise<void> | void;
  createCampaign: (data: Omit<Campaign, 'id'>) => void;
  updateBloodBankProfile: (updated: Partial<BloodBank>) => void;

  // Admin Actions
  adminApproveHospital: (hospitalId: string) => void;
  adminRejectHospital: (hospitalId: string) => void;
  adminApproveBloodBank: (bloodBankId: string) => void;
  adminRejectBloodBank: (bloodBankId: string) => void;
  adminUpdateUserStatus: (
    userId: string,
    status: 'ACTIVE' | 'WARNED' | 'SUSPENDED'
  ) => void;
  adminResolveReport: (
    reportId: string,
    resolution: 'WARNED' | 'SUSPENDED' | 'DISMISSED'
  ) => void;
  updateAdminProfile: (updated: Partial<AdminProfile>) => { success: boolean; message: string };
  changeAdminPassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  toggleAdmin2FA: () => boolean;

  // Notification Actions
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (notifId: string) => void;

  // Feedback Actions & Modal
  submitFeedback: (feedback: Omit<FeedbackSubmission, 'id' | 'createdAt' | 'status'>) => { success: boolean; id: string };
  adminReplyToFeedback: (
    feedbackId: string,
    replyMessage: string,
    status?: 'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED'
  ) => { success: boolean; error?: string };
  hasUserSeenFeedbackPrompt: (userId: string) => boolean;
  markFeedbackPromptAsSeen: (userId: string) => void;
  feedbackModalState: {
    isOpen: boolean;
    triggerRole: UserRole;
    triggerUserId: string;
    triggerUserName: string;
    triggerUserBloodGroup?: string;
    requestId?: string;
    facilityName?: string;
    isPostDonation?: boolean;
  };
  openFeedbackModal: (params?: Partial<{
    triggerRole: UserRole;
    triggerUserId: string;
    triggerUserName: string;
    triggerUserBloodGroup?: string;
    requestId?: string;
    facilityName?: string;
    isPostDonation?: boolean;
  }>) => void;
  closeFeedbackModal: () => void;

  // Global Helpers
  resetToInitialData: () => void;

  // Facility Applications (Admin & Institutional Registry)
  facilityApplications: any[];
  fetchFacilityApplications: () => Promise<void>;
  pendingApplicationsCount: number;

  // Real-time Push Notification
  pushNotification: (
    recipientRole: UserRole,
    title: string,
    message: string,
    type: AppNotification['type'],
    recipientId?: string,
    requestId?: string,
    smsPreview?: string
  ) => void;
}

const LifeDropContext = createContext<LifeDropContextType | undefined>(undefined);

export const LifeDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cache to prevent duplicate simultaneous or rapid (within 3.5s) blood transfer & request submissions
  const recentRequisitionsCache = useRef<Map<string, { timestamp: number; result: any }>>(new Map());

  // Load initial states with localStorage support (v5 Guntur AP dataset)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_users');
      if (saved) return JSON.parse(saved);
      localStorage.removeItem('lifedrop_v4_users');
    } catch {}
    return INITIAL_USERS;
  });

  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_hospitals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HOSPITALS;
  });

  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_bloodbanks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BLOOD_BANKS;
  });

  const [requests, setRequests] = useState<BloodRequest[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_REQUESTS;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_campaigns');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CAMPAIGNS;
  });

  const [reports, setReports] = useState<UserReport[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_reports');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_REPORTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_auditlogs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_notifs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  const [appointments, setAppointments] = useState<DonationAppointment[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_appointments');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_feedbacks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FEEDBACKS;
  });

  const [promptedFeedbackUserIds, setPromptedFeedbackUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_feedback_prompted_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [feedbackModalState, setFeedbackModalState] = useState<{
    isOpen: boolean;
    triggerRole: UserRole;
    triggerUserId: string;
    triggerUserName: string;
    triggerUserBloodGroup?: string;
    requestId?: string;
    facilityName?: string;
    isPostDonation?: boolean;
  }>({
    isOpen: false,
    triggerRole: 'USER',
    triggerUserId: '',
    triggerUserName: '',
    triggerUserBloodGroup: undefined,
    requestId: undefined,
    facilityName: undefined,
    isPostDonation: false,
  });

  // Real PostgreSQL Authenticated Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!(
      (typeof window !== 'undefined' && sessionStorage.getItem('lifedrop_access_token')) ||
      (typeof window !== 'undefined' && localStorage.getItem('lifedrop_auth_user'))
    );
  });

  // Current Role & Active Persona selection
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('lifedrop_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.role) return u.role;
      }
    } catch {}
    return 'USER';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('lifedrop_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.role === 'USER' && u?.id) return u.id;
      }
    } catch {}
    return 'LD-DON-1045'; // Hemendra Das default
  });
  const [currentHospitalId, setCurrentHospitalId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('lifedrop_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.hospital?.id) return u.hospital.id;
      }
    } catch {}
    return 'LD-HOSP-01'; // GGH Guntur default
  });
  const [currentBloodBankId, setCurrentBloodBankId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('lifedrop_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.bloodBank?.id) return u.bloodBank.id;
      }
    } catch {}
    return 'LD-BB-01'; // Red Cross Guntur default
  });
  const [admin, setAdmin] = useState<AdminProfile>(() => {
    try {
      const saved = localStorage.getItem('lifedrop_v5_admin');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ADMIN;
  });

  const [facilityApplications, setFacilityApplications] = useState<any[]>([]);

  const fetchFacilityApplications = async (): Promise<void> => {
    try {
      const res: any = await api.facilityApplications.list({ limit: 100 });
      const apps = res?.applications || res?.data?.applications || (Array.isArray(res) ? res : []);
      if (Array.isArray(apps)) {
        setFacilityApplications(apps);
      }
    } catch (err) {
      console.warn('Facility applications fetch error:', err);
    }
  };

  const pendingApplicationsCount = facilityApplications.filter(
    (a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW'
  ).length;

  const checkAuthSession = async (): Promise<boolean> => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lifedrop_auth_user') : null;
      const res = await api.auth.getMe();
      const user = res?.user || res?.data?.user || res;
      if (user && user.id) {
        setIsAuthenticated(true);
        setCurrentRole(user.role as UserRole);
        setCurrentUserId(user.id);
        if (user.role === 'USER') {
          setCurrentUserId(user.id);
        } else if (user.role === 'HOSPITAL') {
          if (user.hospital?.id) {
            const transformedHosp = transformBackendHospital(user.hospital);
            setCurrentHospitalId(transformedHosp.id);
            setHospitals((prev) => [transformedHosp, ...prev.filter((h) => h.id !== transformedHosp.id)]);
          }
        } else if (user.role === 'BLOOD_BANK') {
          if (user.bloodBank?.id) {
            const transformedBB = transformBackendBloodBank(user.bloodBank);
            setCurrentBloodBankId(transformedBB.id);
            setBloodBanks((prev) => [transformedBB, ...prev.filter((b) => b.id !== transformedBB.id)]);
          }
        } else if (user.role === 'ADMIN') {
          fetchFacilityApplications();
          if (user.adminProfile) {
            setAdmin((prev) => ({
              ...prev,
              name: user.name || prev.name,
              email: user.email || prev.email,
              phone: user.phone || prev.phone,
              designation: user.adminProfile?.designation || prev.designation,
              department: user.adminProfile?.department || prev.department,
              employeeId: user.adminProfile?.employeeId || prev.employeeId,
            }));
          }
        }
        localStorage.setItem('lifedrop_auth_user', JSON.stringify(user));
        return true;
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          setIsAuthenticated(true);
          setCurrentRole(parsed.role as UserRole);
          setCurrentUserId(parsed.id);
          if (parsed.role === 'HOSPITAL' && parsed.hospital) {
            const transformedHosp = transformBackendHospital(parsed.hospital);
            setCurrentHospitalId(transformedHosp.id);
            setHospitals((prev) => [transformedHosp, ...prev.filter((h) => h.id !== transformedHosp.id)]);
          } else if (parsed.role === 'BLOOD_BANK' && parsed.bloodBank) {
            const transformedBB = transformBackendBloodBank(parsed.bloodBank);
            setCurrentBloodBankId(transformedBB.id);
            setBloodBanks((prev) => [transformedBB, ...prev.filter((b) => b.id !== transformedBB.id)]);
          }
          return true;
        }
      }
    } catch {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lifedrop_auth_user') : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.id) {
            setIsAuthenticated(true);
            setCurrentRole(parsed.role as UserRole);
            setCurrentUserId(parsed.id);
            if (parsed.role === 'HOSPITAL' && parsed.hospital) {
              const transformedHosp = transformBackendHospital(parsed.hospital);
              setCurrentHospitalId(transformedHosp.id);
              setHospitals((prev) => [transformedHosp, ...prev.filter((h) => h.id !== transformedHosp.id)]);
            } else if (parsed.role === 'BLOOD_BANK' && parsed.bloodBank) {
              const transformedBB = transformBackendBloodBank(parsed.bloodBank);
              setCurrentBloodBankId(transformedBB.id);
              setBloodBanks((prev) => [transformedBB, ...prev.filter((b) => b.id !== transformedBB.id)]);
            }
            return true;
          }
        } catch {}
      }
      setIsAuthenticated(false);
      return false;
    }
    return false;
  };

  const refreshRequests = useCallback(async () => {
    try {
      const res: any = await api.requests.list();
      const list = res?.requests || res?.data?.requests;
      if (Array.isArray(list)) {
        const transformed = list.map(transformBackendRequest);
        setRequests((prev) => {
          const map = new Map<string, BloodRequest>();
          transformed.forEach((r: BloodRequest) => map.set(r.id, r));
          prev.forEach((r) => {
            if (!map.has(r.id)) {
              map.set(r.id, r);
            } else {
              const remote = map.get(r.id)!;
              if ((r.bloodBankContributions?.length || 0) > (remote.bloodBankContributions?.length || 0)) {
                map.set(r.id, {
                  ...remote,
                  bloodBankContributions: r.bloodBankContributions,
                  allocatedUnits: Math.max(remote.allocatedUnits, r.allocatedUnits),
                });
              }
            }
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }
    } catch (err) {
      console.warn('Failed to refresh requests from backend', err);
    }
  }, []);

  const refreshBloodBanks = useCallback(async () => {
    try {
      const res: any = await api.bloodBanks.list();
      const banks = res?.bloodBanks || res?.data?.bloodBanks || (Array.isArray(res) ? res : []);
      if (Array.isArray(banks) && banks.length > 0) {
        const transformed = banks.map(transformBackendBloodBank);
        setBloodBanks(transformed);
      }
    } catch (err) {
      console.warn('Failed to refresh blood banks from backend', err);
    }
  }, []);

  const refreshMyInventory = useCallback(async () => {
    try {
      const res: any = await api.inventory.getMyInventory();
      const data = res?.data || res;
      if (data?.summary) {
        setBloodBanks((prev) =>
          prev.map((b) => {
            if (b.id !== currentBloodBankId) return b;
            const updatedInv: any = { ...b.inventory };
            Object.keys(data.summary).forEach((k) => {
              const norm = normalizeBloodGroup(k) as BloodGroup;
              updatedInv[norm] = {
                bloodGroup: norm,
                available: Number(data.summary[k].available ?? 0),
                reserved: Number(data.summary[k].reserved ?? 0),
                supplied: Number(data.summary[k].supplied ?? 0),
              };
            });
            return {
              ...b,
              inventory: updatedInv,
            };
          })
        );
      }
    } catch (err) {
      console.warn('Failed to refresh my inventory from backend', err);
    }
  }, [currentBloodBankId]);

  const login = async (
    identifier: string,
    password?: string,
    role?: UserRole
  ): Promise<{ success: boolean; message?: string; role?: UserRole }> => {
    try {
      const res = await api.auth.login(identifier, password, role);
      if (res?.accessToken) {
        api.setTokens(res.accessToken, res.refreshToken);
      }
      const user = res?.user || res?.data?.user || res;
      if (user && user.id) {
        setIsAuthenticated(true);
        setCurrentRole(user.role as UserRole);
        setCurrentUserId(user.id);
        if (user.role === 'USER') {
          setCurrentUserId(user.id);
        } else if (user.role === 'HOSPITAL') {
          if (user.hospital?.id) {
            const transformedHosp = transformBackendHospital(user.hospital);
            setCurrentHospitalId(transformedHosp.id);
            setHospitals((prev) => [transformedHosp, ...prev.filter((h) => h.id !== transformedHosp.id)]);
          }
        } else if (user.role === 'BLOOD_BANK') {
          if (user.bloodBank?.id) {
            const transformedBB = transformBackendBloodBank(user.bloodBank);
            setCurrentBloodBankId(transformedBB.id);
            setBloodBanks((prev) => [transformedBB, ...prev.filter((b) => b.id !== transformedBB.id)]);
          }
        } else if (user.role === 'ADMIN') {
          fetchFacilityApplications();
          if (user.adminProfile) {
            setAdmin((prev) => ({
              ...prev,
              name: user.name || prev.name,
              email: user.email || prev.email,
              phone: user.phone || prev.phone,
              designation: user.adminProfile?.designation || prev.designation,
              department: user.adminProfile?.department || prev.department,
              employeeId: user.adminProfile?.employeeId || prev.employeeId,
            }));
          }
        }
        localStorage.setItem('lifedrop_auth_user', JSON.stringify(user));
        refreshRequests().catch(() => {});
        refreshBloodBanks().catch(() => {});
        if (user.role === 'BLOOD_BANK') {
          refreshMyInventory().catch(() => {});
        }
        return { success: true, role: user.role };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const loginWithDemo = async (
    role: UserRole,
    accountKey?: string
  ): Promise<{ success: boolean; message?: string; role?: UserRole }> => {
    let email = 'hemendra.das@lifedrop.io';
    let password = 'LifeDrop@2026!';

    if (role === 'ADMIN') {
      if (accountKey === 'hanitha' || accountKey === 'adminhanitha@gmail.com') {
        email = 'adminhanitha@gmail.com';
        password = 'Admin@123';
      } else {
        email = 'adminrohan@gmail.com';
        password = 'Admin@123';
      }
    } else if (role === 'HOSPITAL') {
      email = 'superintendent@gghguntur.gov.in';
      password = 'LifeDrop@2026!';
    } else if (role === 'BLOOD_BANK') {
      email = 'redcross.guntur@redcross.org.in';
      password = 'LifeDrop@2026!';
    } else {
      email = 'hemendra.das@lifedrop.io';
      password = 'LifeDrop@2026!';
    }

    return await login(email, password, role);
  };

  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      api.clearTokens();
      setIsAuthenticated(false);
      localStorage.removeItem('lifedrop_auth_user');
      setCurrentRole('USER');
    }
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_bloodbanks', JSON.stringify(bloodBanks));
  }, [bloodBanks]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_requests', JSON.stringify(requests));
  }, [requests]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_reports', JSON.stringify(reports));
  }, [reports]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_auditlogs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_notifs', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_appointments', JSON.stringify(appointments));
  }, [appointments]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_feedback_prompted_users', JSON.stringify(promptedFeedbackUserIds));
  }, [promptedFeedbackUserIds]);
  useEffect(() => {
    localStorage.setItem('lifedrop_v5_admin', JSON.stringify(admin));
  }, [admin]);

  // Synchronize initial state with PostgreSQL database API
  useEffect(() => {
    let isMounted = true;
    async function syncBackendData() {
      try {
        const [reqsRes, hospRes, bbRes, donorsRes, campsRes, notifsRes, fbRes, appsRes] =
          await Promise.allSettled([
            api.requests.list(),
            api.hospitals.list(),
            api.bloodBanks.list(),
            api.donors.list(),
            api.campaigns.list(),
            api.notifications.list(),
            api.feedback.list(),
            api.facilityApplications.list({ limit: 100 }),
          ]);

        if (!isMounted) return;

        if (reqsRes.status === 'fulfilled' && reqsRes.value?.requests) {
          const transformed = reqsRes.value.requests.map(transformBackendRequest);
          if (transformed.length > 0) {
            setRequests((prev) => {
              const map = new Map<string, BloodRequest>();
              transformed.forEach((r: BloodRequest) => map.set(r.id, r));
              prev.forEach((r) => {
                if (!map.has(r.id)) {
                  map.set(r.id, r);
                } else {
                  const remote = map.get(r.id)!;
                  if ((r.bloodBankContributions?.length || 0) > (remote.bloodBankContributions?.length || 0)) {
                    map.set(r.id, {
                      ...remote,
                      bloodBankContributions: r.bloodBankContributions,
                      allocatedUnits: Math.max(remote.allocatedUnits, r.allocatedUnits),
                    });
                  }
                }
              });
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        }
        if (hospRes.status === 'fulfilled' && hospRes.value?.hospitals) {
          const transformed = hospRes.value.hospitals.map(transformBackendHospital);
          if (transformed.length > 0) setHospitals(transformed);
        }
        if (bbRes.status === 'fulfilled' && bbRes.value?.bloodBanks) {
          const transformed = bbRes.value.bloodBanks.map(transformBackendBloodBank);
          if (transformed.length > 0) setBloodBanks(transformed);
        }
        if (donorsRes.status === 'fulfilled' && donorsRes.value?.donors) {
          const transformed = donorsRes.value.donors.map(transformBackendDonor);
          if (transformed.length > 0) setUsers(transformed);
        }
        if (campsRes.status === 'fulfilled' && campsRes.value?.campaigns) {
          const transformed = campsRes.value.campaigns.map(transformBackendCampaign);
          if (transformed.length > 0) setCampaigns(transformed);
        }
        if (fbRes.status === 'fulfilled' && fbRes.value?.feedbacks) {
          if (fbRes.value.feedbacks.length > 0) setFeedbacks(fbRes.value.feedbacks);
        }
        if (notifsRes.status === 'fulfilled' && notifsRes.value?.notifications) {
          if (notifsRes.value.notifications.length > 0) setNotifications(notifsRes.value.notifications);
        }
        if (appsRes.status === 'fulfilled') {
          const apps = (appsRes.value as any)?.applications || (appsRes.value as any)?.data?.applications || (Array.isArray(appsRes.value) ? appsRes.value : []);
          if (Array.isArray(apps) && apps.length > 0) {
            setFacilityApplications(apps);
          }
        }
      } catch (err) {
        console.warn('Backend sync failed, falling back to local persistent store', err);
      }
    }
    syncBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.id === currentUserId);
    if (found) return found;

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lifedrop_auth_user') : null;
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id && u?.name) return transformBackendDonor(u);
      }
    } catch {}

    return users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  const currentHospital = useMemo(() => {
    const found = hospitals.find((h) => h.id === currentHospitalId);
    if (found) return found;

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lifedrop_auth_user') : null;
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.hospital?.name) return transformBackendHospital(u.hospital);
      }
    } catch {}

    return hospitals[0] || INITIAL_HOSPITALS[0];
  }, [hospitals, currentHospitalId]);

  const currentBloodBank = useMemo(() => {
    const found = bloodBanks.find((b) => b.id === currentBloodBankId);
    if (found) return found;

    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lifedrop_auth_user') : null;
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.bloodBank?.name) return transformBackendBloodBank(u.bloodBank);
      }
    } catch {}

    return bloodBanks[0] || INITIAL_BLOOD_BANKS[0];
  }, [bloodBanks, currentBloodBankId]);

  const currentAdmin = admin;

  // Helper to add audit log
  const logAudit = (
    eventType: AuditLog['eventType'],
    description: string,
    actor: string,
    targetId?: string,
    details?: Record<string, any>
  ) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      eventType,
      description,
      actor,
      targetId,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper to push notification
  const pushNotification = (
    recipientRole: UserRole,
    title: string,
    message: string,
    type: AppNotification['type'],
    recipientId?: string,
    requestId?: string,
    smsPreview?: string
  ) => {
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      recipientRole,
      recipientId,
      title,
      message,
      type,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false,
      requestId,
      smsPreview,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Reset entire database
  const resetToInitialData = () => {
    setUsers(INITIAL_USERS);
    setHospitals(INITIAL_HOSPITALS);
    setBloodBanks(INITIAL_BLOOD_BANKS);
    setRequests(INITIAL_REQUESTS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setReports(INITIAL_REPORTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAppointments([]);
    setFeedbacks(INITIAL_FEEDBACKS);
    setAdmin(INITIAL_ADMIN);
    setPromptedFeedbackUserIds([]);
    localStorage.clear();
  };

  // Feedback Methods & Dialog State Management
  const hasUserSeenFeedbackPrompt = (userId: string): boolean => {
    if (!userId) return false;
    return promptedFeedbackUserIds.includes(userId);
  };

  const markFeedbackPromptAsSeen = (userId: string) => {
    if (!userId) return;
    setPromptedFeedbackUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const openFeedbackModal = (params?: Partial<typeof feedbackModalState>) => {
    const role = params?.triggerRole || currentRole;
    let defaultUserId = '';
    let defaultUserName = '';
    let defaultBloodGroup = undefined;

    if (role === 'USER') {
      defaultUserId = currentUser.id;
      defaultUserName = currentUser.name;
      defaultBloodGroup = currentUser.bloodGroup;
    } else if (role === 'HOSPITAL') {
      defaultUserId = currentHospital.id;
      defaultUserName = currentHospital.name;
    } else if (role === 'BLOOD_BANK') {
      defaultUserId = currentBloodBank.id;
      defaultUserName = currentBloodBank.name;
    } else {
      defaultUserId = 'ADMIN';
      defaultUserName = 'Super Administrator';
    }

    setFeedbackModalState({
      isOpen: true,
      triggerRole: role,
      triggerUserId: params?.triggerUserId || defaultUserId,
      triggerUserName: params?.triggerUserName || defaultUserName,
      triggerUserBloodGroup: params?.triggerUserBloodGroup ?? defaultBloodGroup,
      requestId: params?.requestId,
      facilityName: params?.facilityName,
      isPostDonation: params?.isPostDonation ?? false,
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const submitFeedback = (
    feedbackData: Omit<FeedbackSubmission, 'id' | 'createdAt' | 'status'>
  ): { success: boolean; id: string } => {
    const newId = `FB-${Date.now().toString().slice(-6)}`;
    const submission: FeedbackSubmission = {
      ...feedbackData,
      id: newId,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'SUBMITTED',
    };

    setFeedbacks((prev) => [submission, ...prev]);
    markFeedbackPromptAsSeen(feedbackData.userId);

    logAudit(
      'FEEDBACK_SUBMISSION',
      `${feedbackData.userRole} ${feedbackData.userName} submitted a ${feedbackData.rating}-star review for ${feedbackData.experienceType} experience.`,
      feedbackData.userName,
      feedbackData.relatedRequestId
    );

    // Call PostgreSQL API backend
    api.feedback
      .submit(feedbackData)
      .catch((err) => console.warn('Backend submitFeedback error:', err));

    return { success: true, id: newId };
  };

  const adminReplyToFeedback = (
    feedbackId: string,
    replyMessage: string,
    status: 'RESOLVED' | 'INVESTIGATING' | 'ACKNOWLEDGED' = 'RESOLVED'
  ): { success: boolean; error?: string } => {
    const targetFeedback = feedbacks.find((f) => f.id === feedbackId);
    if (!targetFeedback) {
      return { success: false, error: 'Feedback record not found.' };
    }

    const replyObj: FeedbackAdminReply = {
      replyId: `REP-${Date.now().toString().slice(-6)}`,
      adminName: currentAdmin.name,
      adminEmail: currentAdmin.email,
      message: replyMessage.trim(),
      status,
      repliedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === feedbackId
          ? {
              ...fb,
              status,
              adminReply: replyObj,
            }
          : fb
      )
    );

    pushNotification(
      targetFeedback.userRole,
      status === 'RESOLVED' ? 'Issue Resolved by Administration' : 'Administration Response',
      `${currentAdmin.name} replied: "${replyMessage.trim().slice(0, 90)}..."`,
      'info',
      targetFeedback.userId
    );

    logAudit(
      'FEEDBACK_RESOLVED',
      `Administrator replied to feedback from ${targetFeedback.userName} (${targetFeedback.userRole}): "${replyMessage.trim().slice(0, 60)}..." (Status: ${status})`,
      currentAdmin.name,
      targetFeedback.id
    );

    // Call PostgreSQL API backend
    api.admin
      .replyFeedback(feedbackId, replyMessage, status)
      .catch((err) => console.warn('Backend replyFeedback error:', err));

    return { success: true };
  };

  // 1. Donor Response (I CAN DONATE / SORRY, I CANNOT)
  const donorRespond = (
    requestId: string,
    response: 'ACCEPT' | 'DECLINE',
    reason?: string
  ): { success: boolean; message: string } => {
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { success: false, message: 'Blood request not found.' };
    }

    if (response === 'DECLINE') {
      // Record decline reason in request contributions for tracing
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id !== requestId) return req;
          const existing = req.donorContributions.find((d) => d.donorId === currentUser.id);
          const updatedDonors = existing
            ? req.donorContributions.map((d) =>
                d.donorId === currentUser.id
                  ? { ...d, status: 'DECLINED' as const, declineReason: reason || 'Not available' }
                  : d
              )
            : [
                ...req.donorContributions,
                {
                  donorId: currentUser.id,
                  donorName: currentUser.name,
                  bloodGroup: currentUser.bloodGroup,
                  phone: currentUser.phone,
                  status: 'DECLINED' as const,
                  units: 1,
                  acceptedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  declineReason: reason || 'Not available',
                },
              ];
          return { ...req, donorContributions: updatedDonors };
        })
      );
      return { success: true, message: 'Response recorded. Thank you for letting us know.' };
    }

    // Checking donor eligibility
    const { isEligible } = checkEligibility(currentUser.lastDonationDate);
    if (!isEligible) {
      return {
        success: false,
        message: 'You are currently not eligible to donate. Eligibility is restored 90 days after your last confirmed donation.',
      };
    }

    // Checking single active commitment rule
    if (currentUser.activeCommitmentRequestId && currentUser.activeCommitmentRequestId !== requestId) {
      return {
        success: false,
        message: `You are already committed to another active blood request (${currentUser.activeCommitmentRequestId}). You can only commit to one request at a time.`,
      };
    }

    // Check blood compatibility
    if (!isBloodCompatible(targetReq.bloodGroup, currentUser.bloodGroup)) {
      return {
        success: false,
        message: `Your blood group (${currentUser.bloodGroup}) is not compatible with patient's blood group (${targetReq.bloodGroup}).`,
      };
    }

    // Check if request already fully allocated
    const unconfirmedAllocated = targetReq.allocatedUnits;
    const remainingUnits = targetReq.remainingUnits;
    if (unconfirmedAllocated >= remainingUnits) {
      return {
        success: false,
        message: 'All required units for this request have already been reserved or committed.',
      };
    }

    // Accept commitment
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, activeCommitmentRequestId: requestId } : u
      )
    );

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const exists = req.donorContributions.find((d) => d.donorId === currentUser.id);
        const newContrib = {
          donorId: currentUser.id,
          donorName: currentUser.name,
          bloodGroup: currentUser.bloodGroup,
          phone: currentUser.phone,
          status: 'ACCEPTED' as const,
          units: 1,
          acceptedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        const updatedDonors = exists
          ? req.donorContributions.map((d) => (d.donorId === currentUser.id ? newContrib : d))
          : [...req.donorContributions, newContrib];

        const updatedTimeline = [
          ...req.timeline,
          {
            title: `Donor ${currentUser.name} (${currentUser.bloodGroup}) Accepted`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `Donor committed 1 unit. Hospital alerted for arrival.`,
            type: 'allocation' as const,
          },
        ];

        const updatedReq: BloodRequest = {
          ...req,
          donorContributions: updatedDonors,
          timeline: updatedTimeline,
        };

        return recalculateRequestFulfillment(updatedReq);
      })
    );

    logAudit(
      'DONOR_RESPONSE',
      `Donor ${currentUser.name} (${currentUser.id}) accepted emergency request ${requestId}.`,
      currentUser.name,
      requestId
    );

    pushNotification(
      'HOSPITAL',
      'Donor Accepted Request!',
      `Donor ${currentUser.name} (${currentUser.bloodGroup}) committed to donate for Request ${requestId}.`,
      'success',
      targetReq.hospitalId,
      requestId
    );

    // Call PostgreSQL API backend
    api.requests
      .donorRespond(requestId, 'ACCEPT', reason)
      .catch((err) => console.warn('Backend donorRespond error:', err));

    return {
      success: true,
      message: `You have committed to donate 1 unit for ${targetReq.hospitalName}. Please head to the hospital at your earliest convenience.`,
    };
  };

  // 2. Donor Cancellation
  const donorCancelDonation = (
    requestId: string,
    reason?: string
  ): { success: boolean; message: string } => {
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Request not found.' };

    // Call PostgreSQL API backend
    api.requests
      .donorCancelCommitment(requestId, reason)
      .catch((err) => console.warn('Backend donorCancel error:', err));

    // Release donor commitment
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, activeCommitmentRequestId: null } : u
      )
    );

    // Update request
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedDonors = req.donorContributions.map((d) => {
          if (d.donorId === currentUser.id) {
            return {
              ...d,
              status: 'CANCELLED' as const,
              cancellationReason: reason || 'Donor cancelled response',
            };
          }
          return d;
        });

        const updatedTimeline = [
          ...req.timeline,
          {
            title: `Donor ${currentUser.name} Cancelled`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `Donor had to cancel: ${reason || 'Personal reasons'}. Radar reopened search.`,
            type: 'cancel' as const,
          },
        ];

        const updatedReq: BloodRequest = {
          ...req,
          donorContributions: updatedDonors,
          timeline: updatedTimeline,
        };

        return recalculateRequestFulfillment(updatedReq);
      })
    );

    logAudit(
      'DONOR_CANCELLATION',
      `Donor ${currentUser.name} (${currentUser.id}) cancelled commitment for request ${requestId}. Reason: ${reason || 'Unspecified'}.`,
      currentUser.name,
      requestId
    );

    pushNotification(
      'HOSPITAL',
      'Donor Commitment Cancelled',
      `Donor ${currentUser.name} cancelled their commitment for Request ${requestId}. Radar search automatically resumed.`,
      'warning',
      targetReq.hospitalId,
      requestId
    );

    return {
      success: true,
      message: 'Donation response cancelled. Your active commitment has been released.',
    };
  };

  // 3. User Profile Update
  const updateUserProfile = (updated: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== currentUser.id) return u;
        return {
          ...u,
          ...updated,
          // Guard system-controlled fields
          id: u.id,
          totalDonations: u.totalDonations,
          rank: u.rank,
          lastDonationDate: u.lastDonationDate,
          nextEligibleDate: u.nextEligibleDate,
          isEligible: u.isEligible,
        };
      })
    );
    logAudit('USER_REGISTER', `User ${currentUser.name} updated profile details.`, currentUser.name, currentUser.id);
    // Call PostgreSQL API backend
    api.users.updateMe(updated).catch((err) => console.warn('Backend updateUserProfile error:', err));
  };

  // Register New Donor
  const registerUser = async (userData: {
    name: string;
    phone: string;
    bloodGroup: BloodGroup;
    city: string;
    email?: string;
    location?: string;
    dob?: string;
    latitude?: number;
    longitude?: number;
    lastDonationDate?: string | null;
    password?: string;
  }): Promise<{ success: boolean; message?: string; user?: any }> => {
    const newId = `LD-DON-${Date.now().toString().slice(-4)}`;
    const localUser: UserProfile = {
      id: newId,
      name: userData.name,
      phone: userData.phone,
      email: userData.email || `${userData.name.toLowerCase().replace(/\s+/g, '.')}@lifedrop.io`,
      dob: userData.dob || '1998-01-01',
      bloodGroup: userData.bloodGroup,
      city: userData.city,
      location: userData.location || `${userData.city} Central District`,
      latitude: userData.latitude || 16.3067,
      longitude: userData.longitude || 80.4365,
      lastDonationDate: userData.lastDonationDate || null,
      nextEligibleDate: new Date().toISOString().slice(0, 10),
      isEligible: true,
      totalDonations: 0,
      rank: 'Bronze',
      activeCommitmentRequestId: null,
      status: 'ACTIVE',
      warningCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    try {
      // Call PostgreSQL Backend API
      const res: any = await api.auth.register({
        role: 'USER',
        name: userData.name,
        phone: userData.phone,
        email: userData.email && userData.email.trim() !== '' ? userData.email.trim() : undefined,
        bloodGroup: toPrismaBloodGroup(userData.bloodGroup),
        city: userData.city,
        location: userData.location || `${userData.city} Central District`,
        dob: userData.dob,
        password: userData.password || 'LifeDrop@2026!',
      });

      const data = res?.data || res;
      if (data?.accessToken) {
        api.setTokens(data.accessToken, data.refreshToken);
        setIsAuthenticated(true);
      }
      const backendUser = data?.user;
      const finalId = backendUser?.id || newId;
      const userToStore = { ...localUser, id: finalId, ...(backendUser || {}) };

      setUsers((prev) => [userToStore, ...prev.filter((u) => u.id !== finalId)]);
      setCurrentUserId(finalId);
      setCurrentRole('USER');
      logAudit('USER_REGISTER', `New donor ${userToStore.name} (${userToStore.bloodGroup}) registered.`, userToStore.name, finalId);
      localStorage.setItem('lifedrop_auth_user', JSON.stringify(userToStore));

      return { success: true, user: userToStore };
    } catch (err: any) {
      console.warn('Backend registerUser error:', err);
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  // Register New Hospital
  const registerHospital = (data: Hospital): Hospital => {
    setHospitals((prev) => [data, ...prev]);
    setCurrentHospitalId(data.id);
    logAudit('HOSPITAL_REGISTER', `New hospital ${data.name} registered (ID: ${data.id}) pending verification.`, data.name, data.id);
    pushNotification('ADMIN', 'New Hospital Registration', `${data.name} (ID: ${data.id}) submitted registration documents for verification.`, 'info', 'admin', data.id);

    // Asynchronously submit application to PostgreSQL backend
    api.facilityApplications
      .submit({
        facilityType: 'HOSPITAL',
        name: data.name,
        category: (data as any).type || 'Private',
        phone: data.phone || '+1 (555) 019-3344',
        email: data.email || `hospital.${Date.now()}@lifedrop.io`,
        address: data.address || `${data.city || 'Guntur'} Medical Center`,
        city: data.city || 'Guntur',
        licenseNumber: data.licenseNumber || `MED-LIC-${Date.now().toString().slice(-6)}`,
        authorizedPersonName: data.name,
        authorizedPersonDesignation: 'Hospital Administrator',
        authorizedPersonPhone: data.phone || '+1 (555) 019-3344',
        authorizedPersonEmail: data.email || `desk.${Date.now().toString().slice(-6)}@lifedrop.io`,
      })
      .then((res: any) => {
        if (res?.data) {
          fetchFacilityApplications();
        }
      })
      .catch((err) => {
        console.warn('Backend facility registration error:', err);
      });

    return data;
  };

  // Register New Blood Bank
  const registerBloodBank = (data: BloodBank): BloodBank => {
    setBloodBanks((prev) => [data, ...prev]);
    setCurrentBloodBankId(data.id);
    logAudit('BLOOD_BANK_REGISTER', `New blood bank ${data.name} registered (ID: ${data.id}) pending verification.`, data.name, data.id);
    pushNotification('ADMIN', 'New Blood Bank Registration', `${data.name} (ID: ${data.id}) submitted registration documents for verification.`, 'info', 'admin', data.id);

    // Asynchronously submit application to PostgreSQL backend
    api.facilityApplications
      .submit({
        facilityType: 'BLOOD_BANK',
        name: data.name,
        category: (data as any).type || 'Charitable',
        phone: data.phone || '+1 (555) 019-7788',
        email: data.email || `bloodbank.${Date.now()}@lifedrop.io`,
        address: data.address || `${data.city || 'Guntur'} Center`,
        city: data.city || 'Guntur',
        licenseNumber: data.licenseNumber || `BB-LIC-${Date.now().toString().slice(-6)}`,
        authorizedPersonName: data.name,
        authorizedPersonDesignation: 'Blood Bank Officer',
        authorizedPersonPhone: data.phone || '+1 (555) 019-7788',
        authorizedPersonEmail: data.email || `dispatch.${Date.now().toString().slice(-6)}@lifedrop.io`,
      })
      .then((res: any) => {
        if (res?.data) {
          fetchFacilityApplications();
        }
      })
      .catch((err) => {
        console.warn('Backend facility registration error:', err);
      });

    return data;
  };

  // 4. Register Donation Appointment at Blood Bank
  const registerDonationAppointment = (
    bloodBankId: string,
    date: string,
    timeSlot: string
  ): { success: boolean; message: string } => {
    const bb = bloodBanks.find((b) => b.id === bloodBankId);
    if (!bb) return { success: false, message: 'Blood Bank not found.' };

    const newAppt: DonationAppointment = {
      id: `APPT-${Date.now().toString().slice(-4)}`,
      donorId: currentUser.id,
      donorName: currentUser.name,
      donorPhone: currentUser.phone,
      bloodGroup: currentUser.bloodGroup,
      bloodBankId,
      bloodBankName: bb.name,
      date,
      timeSlot,
      status: 'REGISTERED',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setAppointments((prev) => [newAppt, ...prev]);

    pushNotification(
      'BLOOD_BANK',
      'New Donation Appointment Registered',
      `${currentUser.name} (${currentUser.bloodGroup}) registered for donation on ${date} at ${timeSlot}.`,
      'info',
      bloodBankId
    );

    // Call PostgreSQL API backend
    api.appointments
      .book({ bloodBankId, date, timeSlot })
      .catch((err) => console.warn('Backend book appointment error:', err));

    return {
      success: true,
      message: `Donation appointment registered at ${bb.name} for ${date} (${timeSlot}). Please note: This registration is not a confirmed donation until completed on-site.`,
    };
  };

  const cancelDonationAppointment = async (
    apptId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      await api.appointments.cancel(apptId, reason);
    } catch (err) {
      console.warn('Backend cancel appointment error:', err);
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status: 'CANCELLED' } : a))
    );
    return { success: true, message: 'Appointment cancelled.' };
  };

  // 5. Hospital: Create Emergency Blood Request
  const createBloodRequest = async (data: {
    patientName: string;
    bloodGroup: BloodGroup;
    requiredUnits: number;
    emergencyLevel: EmergencyLevel;
    requiredDateTime: string;
    contactNumber: string;
    notes?: string;
    targetBloodBankId?: string;
  }): Promise<BloodRequest> => {
    // 0. Cache check for rapid duplicate submissions (within 3.5s)
    const cacheKey = `create-${data.patientName}-${data.bloodGroup}-${data.requiredUnits}-${data.targetBloodBankId || 'broadcast'}`;
    const cachedReq = recentRequisitionsCache.current.get(cacheKey);
    if (cachedReq && Date.now() - cachedReq.timestamp < 3500) {
      console.warn(`[LifeDropContext] Ignored duplicate createBloodRequest within 3.5s: ${cacheKey}`);
      return cachedReq.result;
    }

    const targetBB = data.targetBloodBankId ? bloodBanks.find((b) => b.id === data.targetBloodBankId) : undefined;
    const notesWithBB = targetBB
      ? `${data.notes ? data.notes + ' | ' : ''}Direct Facility Requisition: ${targetBB.name}`
      : data.notes;

    // Deduct stock if targetBB was selected
    if (targetBB) {
      setBloodBanks((prev) =>
        prev.map((b) => {
          if (b.id !== targetBB.id) return b;
          const currentStock = b.inventory[data.bloodGroup] || { available: 0, reserved: 0, supplied: 0 };
          const unitsToReserve = Math.min(data.requiredUnits, currentStock.available);
          return {
            ...b,
            inventory: {
              ...b.inventory,
              [data.bloodGroup]: {
                ...currentStock,
                available: Math.max(0, currentStock.available - unitsToReserve),
                reserved: currentStock.reserved + unitsToReserve,
              },
            },
          };
        })
      );
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const bbContributions: BloodBankContribution[] = targetBB
      ? [
          {
            bloodBankId: targetBB.id,
            bloodBankName: targetBB.name,
            bloodGroup: data.bloodGroup,
            offeredUnits: data.requiredUnits,
            allocatedUnits: data.requiredUnits,
            status: 'RESERVED' as const,
            reservedAt: nowStr,
          },
        ]
      : [];

    // 1. Call PostgreSQL API backend first so the request has its permanent database ID
    try {
      const res: any = await api.requests.create({
        patientName: data.patientName,
        bloodGroup: toPrismaBloodGroup(data.bloodGroup),
        requiredUnits: data.requiredUnits,
        emergencyLevel: data.emergencyLevel,
        requiredDateTime: data.requiredDateTime,
        contactNumber: data.contactNumber,
        notes: notesWithBB,
        targetBloodBankId: data.targetBloodBankId,
      });

      const backendReq = res?.request || res?.data?.request || res;
      if (backendReq?.id) {
        let transformed = transformBackendRequest(backendReq);
        if (targetBB && bbContributions.length > 0) {
          transformed = {
            ...transformed,
            allocatedUnits: data.requiredUnits,
            remainingUnits: 0,
            bloodBankContributions: bbContributions,
            timeline: [
              ...transformed.timeline,
              {
                title: `Directed Requisition to ${targetBB.name}`,
                timestamp: nowStr,
                description: `Emergency requisition routed to ${targetBB.name} for ${data.requiredUnits} unit(s). Cold chain transit alerted.`,
                type: 'allocation' as const,
              },
            ],
          };
        }
        setRequests((prev) => [transformed, ...prev.filter((r) => r.id !== transformed.id)]);

        logAudit(
          'REQUEST_CREATION',
          `Hospital ${currentHospital.name} created ${data.emergencyLevel} request ${transformed.id} for ${data.requiredUnits} units of ${data.bloodGroup}${targetBB ? ` directed to ${targetBB.name}` : ''}.`,
          currentHospital.name,
          transformed.id
        );

        if (targetBB) {
          pushNotification(
            'BLOOD_BANK',
            `🚨 Direct Requisition: ${data.requiredUnits} Units of ${data.bloodGroup}`,
            `${currentHospital.name} submitted an emergency requisition directly to your facility. Cold chain dispatch required.`,
            'emergency',
            targetBB.id,
            transformed.id,
            `LIFEDROP DISPATCH: Emergency requisition #${transformed.id} for ${data.requiredUnits} units of ${data.bloodGroup} from ${currentHospital.name}. Open portal to navigate and dispatch.`
          );
        } else {
          bloodBanks.forEach((b) => {
            pushNotification(
              'BLOOD_BANK',
              `New Emergency Request: ${data.requiredUnits} Units of ${data.bloodGroup}`,
              `${currentHospital.name} submitted request ${transformed.id}. Please check your inventory and supply.`,
              'emergency',
              b.id,
              transformed.id
            );
          });
        }

        // Broadcast emergency notification to all compatible donors
        users.forEach((u) => {
          if (isBloodCompatible(data.bloodGroup, u.bloodGroup) && u.isEligible) {
            pushNotification(
              'USER',
              `EMERGENCY: ${data.bloodGroup} Blood Needed!`,
              `${currentHospital.name} urgently needs ${data.requiredUnits} units of ${data.bloodGroup}. You are compatible!`,
              'emergency',
              u.id,
              transformed.id,
              `LIFEDROP EMERGENCY: ${data.bloodGroup} blood urgently needed at ${currentHospital.name}. Open https://lifedrop.io/req/${transformed.id} to respond.`
            );
          }
        });

        recentRequisitionsCache.current.set(cacheKey, { timestamp: Date.now(), result: transformed });
        return transformed;
      }
    } catch (err: any) {
      console.warn('Backend createBloodRequest sync error, falling back to local:', err);
    }

    // 2. Local fallback if backend is offline/unreachable
    const newReqId = `LD${Math.floor(1000 + Math.random() * 9000)}`;
    const fallbackRequest: BloodRequest = {
      id: newReqId,
      hospitalId: currentHospital.id,
      hospitalName: currentHospital.name,
      hospitalAddress: currentHospital.address,
      hospitalPhone: currentHospital.phone,
      hospitalLatitude: currentHospital.latitude || 16.3067,
      hospitalLongitude: currentHospital.longitude || 80.4365,
      patientName: data.patientName,
      bloodGroup: data.bloodGroup,
      requiredUnits: data.requiredUnits,
      allocatedUnits: targetBB ? data.requiredUnits : 0,
      confirmedUnits: 0,
      remainingUnits: targetBB ? 0 : data.requiredUnits,
      emergencyLevel: data.emergencyLevel,
      requiredDateTime: data.requiredDateTime,
      contactNumber: data.contactNumber,
      notes: notesWithBB,
      status: targetBB ? 'RESERVED' : 'SEARCHING',
      createdAt: nowStr,
      donorContributions: [],
      bloodBankContributions: bbContributions,
      timeline: [
        {
          title: `Emergency Request Created (${data.requiredUnits} Units ${data.bloodGroup})`,
          timestamp: nowStr,
          description: `${currentHospital.name} broadcast emergency request for patient: ${data.patientName}.`,
          type: 'creation',
        },
        ...(targetBB
          ? [
              {
                title: `Reserved by ${targetBB.name}`,
                timestamp: nowStr,
                description: `Emergency requisition routed to ${targetBB.name}. Units reserved from cold vault.`,
                type: 'allocation' as const,
              },
            ]
          : [
              {
                title: 'Radar Broadcast Active',
                timestamp: nowStr,
                description: `Scanning nearby compatible donors (${data.bloodGroup}) and blood banks.`,
                type: 'match' as const,
              },
            ]),
      ],
    };

    setRequests((prev) => [fallbackRequest, ...prev]);

    logAudit(
      'REQUEST_CREATION',
      `Hospital ${currentHospital.name} created ${data.emergencyLevel} request ${newReqId} for ${data.requiredUnits} units of ${data.bloodGroup}${targetBB ? ` directed to ${targetBB.name}` : ''}.`,
      currentHospital.name,
      newReqId
    );

    if (targetBB) {
      pushNotification(
        'BLOOD_BANK',
        `🚨 Direct Requisition: ${data.requiredUnits} Units of ${data.bloodGroup}`,
        `${currentHospital.name} submitted an emergency requisition directly to your facility. Cold chain dispatch required.`,
        'emergency',
        targetBB.id,
        newReqId,
        `LIFEDROP DISPATCH: Emergency requisition #${newReqId} for ${data.requiredUnits} units of ${data.bloodGroup} from ${currentHospital.name}. Open portal to navigate and dispatch.`
      );
    }

    recentRequisitionsCache.current.set(cacheKey, { timestamp: Date.now(), result: fallbackRequest });
    return fallbackRequest;
  };

  // 6. Hospital Confirm Donation (Arrival & Completion)
  const hospitalConfirmDonation = (
    requestId: string,
    donorId: string,
    unitsDonated: number = 1
  ): { success: boolean; message: string } => {
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Request not found.' };

    const targetUser = users.find((u) => u.id === donorId);
    if (!targetUser) return { success: false, message: `Donor ID ${donorId} not found in LifeDrop system.` };

    // Call PostgreSQL API backend
    api.donations
      .confirm({
        requestId,
        donorId,
        units: unitsDonated,
      })
      .catch((err: any) => console.warn('Backend donation confirm sync error:', err));

    const todayStr = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 90);
    const nextEligibleDateStr = nextDate.toISOString().split('T')[0];

    const newTotalDonations = targetUser.totalDonations + unitsDonated;
    const newRank = calculateDonorRank(newTotalDonations);

    // Update donor record: 90 days timer, increment donations, rank, release commitment
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== donorId) return u;
        return {
          ...u,
          lastDonationDate: todayStr,
          nextEligibleDate: nextEligibleDateStr,
          isEligible: false,
          totalDonations: newTotalDonations,
          rank: newRank,
          activeCommitmentRequestId: null,
        };
      })
    );

    // Update request: mark contribution COMPLETED, recalculate fulfillment
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const exists = req.donorContributions.find((d) => d.donorId === donorId);
        const updatedDonors = exists
          ? req.donorContributions.map((d) =>
              d.donorId === donorId
                ? {
                    ...d,
                    status: 'COMPLETED' as const,
                    units: unitsDonated,
                    confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  }
                : d
            )
          : [
              ...req.donorContributions,
              {
                donorId: targetUser.id,
                donorName: targetUser.name,
                bloodGroup: targetUser.bloodGroup,
                phone: targetUser.phone,
                status: 'COMPLETED' as const,
                units: unitsDonated,
                acceptedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              },
            ];

        const updatedTimeline = [
          ...req.timeline,
          {
            title: `Donation Confirmed: ${targetUser.name} (${unitsDonated} Unit)`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `Hospital verified and confirmed blood receipt from donor ${targetUser.name}.`,
            type: 'fulfilment' as const,
          },
        ];

        const updatedReq: BloodRequest = {
          ...req,
          donorContributions: updatedDonors,
          timeline: updatedTimeline,
        };

        const recalculated = recalculateRequestFulfillment(updatedReq);

        if (recalculated.status === 'FULFILLED') {
          updatedTimeline.push({
            title: 'Request 100% Fulfilled',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `All ${req.requiredUnits} units successfully arranged and confirmed.`,
            type: 'fulfilment',
          });
        }

        return recalculated;
      })
    );

    logAudit(
      'DONATION_CONFIRMATION',
      `Hospital ${currentHospital.name} confirmed ${unitsDonated} unit donation from donor ${targetUser.name} (${donorId}) for request ${requestId}.`,
      currentHospital.name,
      requestId
    );

    pushNotification(
      'USER',
      'Donation Confirmed! Life Saved ❤️',
      `Thank you ${targetUser.name}! Your donation of 1 unit at ${currentHospital.name} was confirmed. Your donor rank is now ${newRank}.`,
      'success',
      donorId,
      requestId
    );

    // One-time post-donation feedback popup for Hospital
    if (!hasUserSeenFeedbackPrompt(currentHospital.id)) {
      openFeedbackModal({
        triggerRole: 'HOSPITAL',
        triggerUserId: currentHospital.id,
        triggerUserName: currentHospital.name,
        requestId,
        facilityName: currentHospital.name,
        isPostDonation: true,
      });
      markFeedbackPromptAsSeen(currentHospital.id);
    }

    return {
      success: true,
      message: `Donation successfully confirmed for ${targetUser.name}! Total donations updated to ${newTotalDonations}. Next eligible date: ${nextEligibleDateStr}.`,
    };
  };

  // 7. Hospital Mark No-Show
  const hospitalMarkNoShow = (
    requestId: string,
    donorId: string
  ): { success: boolean; message: string } => {
    // Call PostgreSQL API backend
    api.donations.markNoShow(requestId, donorId).catch((err: any) => console.warn('Backend markNoShow sync error:', err));

    const targetUser = users.find((u) => u.id === donorId);
    if (targetUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === donorId ? { ...u, activeCommitmentRequestId: null } : u))
      );
    }

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedDonors = req.donorContributions.map((d) =>
          d.donorId === donorId ? { ...d, status: 'NO_SHOW' as const } : d
        );

        const updatedTimeline = [
          ...req.timeline,
          {
            title: `Donor ${targetUser?.name || donorId} Marked No-Show`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `Donor did not arrive. Allocation released; active radar search continuing.`,
            type: 'cancel' as const,
          },
        ];

        return recalculateRequestFulfillment({
          ...req,
          donorContributions: updatedDonors,
          timeline: updatedTimeline,
        });
      })
    );

    logAudit(
      'DONOR_RESPONSE',
      `Hospital ${currentHospital.name} marked donor ${donorId} as NO SHOW for request ${requestId}.`,
      currentHospital.name,
      requestId
    );

    return { success: true, message: 'Donor marked as No-Show. Commitment released and search reopened.' };
  };

  // 8. Hospital Mark Not Completed
  const hospitalMarkNotCompleted = (
    requestId: string,
    donorId: string,
    reason?: string
  ): { success: boolean; message: string } => {
    // Call PostgreSQL API backend
    api.donations
      .markNotCompleted(requestId, donorId, reason || '')
      .catch((err: any) => console.warn('Backend markNotCompleted sync error:', err));

    setUsers((prev) =>
      prev.map((u) => (u.id === donorId ? { ...u, activeCommitmentRequestId: null } : u))
    );

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedDonors = req.donorContributions.map((d) =>
          d.donorId === donorId
            ? { ...d, status: 'NOT_COMPLETED' as const, declineReason: reason || 'Medical deferral on site' }
            : d
        );
        return recalculateRequestFulfillment({
          ...req,
          donorContributions: updatedDonors,
        });
      })
    );

    return {
      success: true,
      message: 'Donation marked as Not Completed. Donor stats unaffected; search continued.',
    };
  };

  // 9. Blood Bank Offer Units
  // 9. Blood Bank Offer Units (Review & Approve Requisition)
  const bloodBankOfferUnits = (
    requestId: string,
    bloodGroup: BloodGroup,
    units: number
  ): { success: boolean; message: string } => {
    const bb = currentBloodBank;
    const stock = bb.inventory[bloodGroup];
    if (!stock || stock.available < units) {
      return {
        success: false,
        message: `Insufficient stock! You only have ${stock?.available || 0} units of ${bloodGroup} available.`,
      };
    }

    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Request not found.' };

    const unallocatedNeeded = Math.max(0, targetReq.requiredUnits - targetReq.confirmedUnits - targetReq.allocatedUnits);
    const actualUnitsToAllocate = Math.min(
      units,
      Math.max(1, unallocatedNeeded > 0 ? unallocatedNeeded : targetReq.remainingUnits)
    );

    if (actualUnitsToAllocate <= 0) {
      return {
        success: false,
        message: 'This request has already reached its allocated unit limit.',
      };
    }

    // Reserve stock in Blood Bank inventory
    setBloodBanks((prev) =>
      prev.map((b) => {
        if (b.id !== bb.id) return b;
        return {
          ...b,
          inventory: {
            ...b.inventory,
            [bloodGroup]: {
              ...stock,
              available: Math.max(0, stock.available - actualUnitsToAllocate),
              reserved: stock.reserved + actualUnitsToAllocate,
            },
          },
        };
      })
    );

    // Update request
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const existingBB = req.bloodBankContributions.find((c) => c.bloodBankId === bb.id);
        const newContrib = {
          bloodBankId: bb.id,
          bloodBankName: bb.name,
          bloodGroup,
          offeredUnits: Math.max(units, existingBB?.offeredUnits || units),
          allocatedUnits: actualUnitsToAllocate,
          status: 'RESERVED' as const,
          reservedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        const updatedBBs = existingBB
          ? req.bloodBankContributions.map((c) => (c.bloodBankId === bb.id ? newContrib : c))
          : [...req.bloodBankContributions, newContrib];

        const updatedTimeline = [
          ...req.timeline,
          {
            title: `Blood Bank ${bb.name} Approved & Reserved ${actualUnitsToAllocate} Units`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `Approved requisition and reserved ${actualUnitsToAllocate} units of ${bloodGroup} in cold storage vault. Ready for clinical dispatch.`,
            type: 'allocation' as const,
          },
        ];

        return recalculateRequestFulfillment({
          ...req,
          bloodBankContributions: updatedBBs,
          timeline: updatedTimeline,
        });
      })
    );

    logAudit(
      'BLOOD_RESERVATION',
      `Blood Bank ${bb.name} approved and reserved ${actualUnitsToAllocate} units of ${bloodGroup} for request ${requestId}.`,
      bb.name,
      requestId
    );

    pushNotification(
      'HOSPITAL',
      'Blood Bank Approved Requisition',
      `${bb.name} approved and reserved ${actualUnitsToAllocate} units of ${bloodGroup} for Request ${requestId}. Ready for dispatch.`,
      'success',
      targetReq.hospitalId,
      requestId
    );

    // Call PostgreSQL API backend and refresh state
    api.requests
      .bloodBankReserve(requestId, actualUnitsToAllocate)
      .then(() => {
        refreshRequests().catch(() => {});
        refreshMyInventory().catch(() => {});
        refreshBloodBanks().catch(() => {});
      })
      .catch((err) => console.warn('Backend bloodBankReserve error:', err));

    return {
      success: true,
      message: `Successfully approved & reserved ${actualUnitsToAllocate} units of ${bloodGroup} for ${targetReq.hospitalName}.`,
    };
  };

  // 10. Blood Bank Confirm Supply (Dispatch & Clinical Delivery Confirmation)
  const bloodBankConfirmSupply = (
    requestId: string,
    bloodBankId: string
  ): { success: boolean; message: string } => {
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Request not found.' };

    const contrib = targetReq.bloodBankContributions.find((c) => c.bloodBankId === bloodBankId);
    if (!contrib || contrib.status !== 'RESERVED') {
      return { success: false, message: 'No active approved reservation found to confirm. Please approve the requisition first.' };
    }

    const units = contrib.allocatedUnits;
    const bg = contrib.bloodGroup;

    // Shift reserved -> supplied in inventory
    setBloodBanks((prev) =>
      prev.map((b) => {
        if (b.id !== bloodBankId) return b;
        const stock = b.inventory[bg];
        return {
          ...b,
          inventory: {
            ...b.inventory,
            [bg]: {
              ...stock,
              reserved: Math.max(0, stock.reserved - units),
              supplied: stock.supplied + units,
            },
          },
        };
      })
    );

    // Update request
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedBBs = req.bloodBankContributions.map((c) =>
          c.bloodBankId === bloodBankId
            ? { ...c, status: 'CONFIRMED' as const, confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) }
            : c
        );

        const updatedTimeline = [
          ...req.timeline,
          {
            title: `Blood Bank Dispatched & Confirmed Delivery`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `${contrib.bloodBankName} delivered ${units} units of ${bg} to ${req.hospitalName}. Cold chain verified.`,
            type: 'fulfilment' as const,
          },
        ];

        return recalculateRequestFulfillment({
          ...req,
          bloodBankContributions: updatedBBs,
          timeline: updatedTimeline,
        });
      })
    );

    logAudit(
      'DONATION_CONFIRMATION',
      `Blood Bank ${contrib.bloodBankName} supplied and confirmed ${units} units for request ${requestId}.`,
      contrib.bloodBankName,
      requestId
    );

    pushNotification(
      'HOSPITAL',
      'Blood Delivery Dispatched & Confirmed',
      `${contrib.bloodBankName} dispatched and confirmed ${units} units of ${bg} for request #${requestId}.`,
      'success',
      targetReq.hospitalId,
      requestId
    );

    // Call PostgreSQL API backend and refresh state
    api.requests
      .bloodBankConfirmSupply(requestId)
      .then(() => {
        refreshRequests().catch(() => {});
        refreshMyInventory().catch(() => {});
        refreshBloodBanks().catch(() => {});
      })
      .catch((err) => console.warn('Backend bloodBankConfirmSupply error:', err));

    return { success: true, message: `Dispatched & confirmed ${units} units of ${bg} successfully!` };
  };

  // 11. Blood Bank Walk-In Donation
  const bloodBankWalkInDonation = (
    donorId: string,
    bloodGroup: BloodGroup,
    units: number = 1
  ): { success: boolean; message: string } => {
    const targetUser = users.find((u) => u.id === donorId);
    if (!targetUser) return { success: false, message: `Donor ID ${donorId} not found.` };

    const todayStr = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 90);
    const nextEligibleDateStr = nextDate.toISOString().split('T')[0];

    const newTotal = targetUser.totalDonations + units;
    const newRank = calculateDonorRank(newTotal);

    // Update donor
    setUsers((prev) =>
      prev.map((u) =>
        u.id === donorId
          ? {
              ...u,
              lastDonationDate: todayStr,
              nextEligibleDate: nextEligibleDateStr,
              isEligible: false,
              totalDonations: newTotal,
              rank: newRank,
              activeCommitmentRequestId: null,
            }
          : u
      )
    );

    // Increment blood bank available stock
    setBloodBanks((prev) =>
      prev.map((b) => {
        if (b.id !== currentBloodBank.id) return b;
        const stock = b.inventory[bloodGroup];
        return {
          ...b,
          inventory: {
            ...b.inventory,
            [bloodGroup]: {
              ...stock,
              available: stock.available + units,
            },
          },
        };
      })
    );

    logAudit(
      'DONATION_CONFIRMATION',
      `Walk-in donation of ${units} unit(s) (${bloodGroup}) confirmed at ${currentBloodBank.name} from donor ${targetUser.name} (${donorId}).`,
      currentBloodBank.name,
      donorId
    );

    // Call PostgreSQL API backend
    api.donations
      .confirm({
        donorId,
        units,
        bloodBankId: currentBloodBank.id,
      })
      .catch((err) => console.warn('Backend walk-in donation confirm error:', err));

    return {
      success: true,
      message: `Walk-in donation of ${units} unit (${bloodGroup}) confirmed. Blood bank stock increased by ${units}.`,
    };
  };

  // 12. Update Inventory Stock (Manual adjustments / batch receipts)
  const updateInventoryStock = async (bloodBankId: string, bloodGroup: BloodGroup, newAvailable: number) => {
    const validCount = Math.max(0, newAvailable);

    setBloodBanks((prev) =>
      prev.map((b) => {
        if (b.id !== bloodBankId) return b;
        return {
          ...b,
          inventory: {
            ...b.inventory,
            [bloodGroup]: {
              ...(b.inventory[bloodGroup] || { reserved: 0, supplied: 0 }),
              bloodGroup,
              available: validCount,
            },
          },
        };
      })
    );

    logAudit(
      'INVENTORY_UPDATE',
      `Stock for ${bloodGroup} updated to ${validCount} units at ${currentBloodBank.name}.`,
      currentBloodBank.name,
      bloodBankId
    );

    // Call PostgreSQL API backend with target absolute stock
    try {
      await api.inventory.adjustStock({
        bloodGroup: toPrismaBloodGroup(bloodGroup),
        newAvailableUnits: validCount,
        operationType: 'ADJUSTMENT_CORRECTION',
        reason: 'Manual adjustment via dashboard inventory console',
      });
      // Re-sync all blood banks so other facilities immediately see the update
      await refreshBloodBanks();
    } catch (err) {
      console.warn('Backend inventory adjustStock error:', err);
    }
  };

  // 13. Create Campaign
  const createCampaign = (data: Omit<Campaign, 'id'>) => {
    const newCamp: Campaign = {
      ...data,
      id: `CAMP-${Date.now().toString().slice(-4)}`,
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    logAudit('REQUEST_CREATION', `Blood Bank created new campaign "${data.name}".`, data.bloodBankName, newCamp.id);

    // Call PostgreSQL API backend
    api.campaigns
      .create({
        name: data.name,
        bloodBankId: data.bloodBankId,
        date: data.date,
        timeSlot: data.time,
        location: data.location,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        googleFormUrl: data.googleFormUrl,
      })
      .catch((err) => console.warn('Backend createCampaign error:', err));
  };

  // 14. Hospital Reporting a Donor
  const submitReport = (data: {
    reportedUserId: string;
    requestId: string;
    reason: UserReport['reason'];
    description: string;
  }) => {
    const targetUser = users.find((u) => u.id === data.reportedUserId);
    const newReport: UserReport = {
      id: `REP-${Date.now().toString().slice(-4)}`,
      reporterHospitalId: currentHospital.id,
      reporterHospitalName: currentHospital.name,
      reportedUserId: data.reportedUserId,
      reportedUserName: targetUser?.name || 'Unknown User',
      requestId: data.requestId,
      reason: data.reason,
      description: data.description,
      status: 'PENDING',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setReports((prev) => [newReport, ...prev]);
    logAudit(
      'REPORT_SUBMITTED',
      `Hospital ${currentHospital.name} filed report against ${targetUser?.name || data.reportedUserId} for "${data.reason}".`,
      currentHospital.name,
      newReport.id
    );

    // Call PostgreSQL API backend
    api.reports
      .fileReport({
        reportedUserId: data.reportedUserId,
        requestId: data.requestId,
        reason: data.reason,
        description: data.description,
      })
      .catch((err) => console.warn('Backend submitReport error:', err));
  };

  // 15. Hospital Close Request
  const closeRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'CLOSED' as const } : r))
    );
    logAudit('REQUEST_FULFILMENT', `Request ${requestId} formally closed by hospital.`, currentHospital.name, requestId);

    // Call PostgreSQL API backend
    api.requests
      .cancel(requestId, 'Request formally closed by hospital')
      .catch((err) => console.warn('Backend closeRequest error:', err));
  };

  // 15a. Delete Emergency Blood Request
  const deleteBloodRequest = async (
    requestId: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { success: false, message: 'Request not found.' };
    }

    if (currentRole !== 'ADMIN' && targetReq.hospitalId !== currentHospital.id) {
      return {
        success: false,
        message: 'You can only delete blood requests created by your hospital.',
      };
    }

    // Call PostgreSQL API backend
    try {
      await api.requests.delete(requestId);
    } catch (err: any) {
      console.warn('Backend deleteBloodRequest error:', err);
    }

    // Release any users committed to this request
    setUsers((prev) =>
      prev.map((u) =>
        u.activeCommitmentRequestId === requestId ? { ...u, activeCommitmentRequestId: null } : u
      )
    );

    // Remove from in-memory requests
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    logAudit(
      'REQUEST_DELETED',
      `Hospital ${currentHospital.name} permanently deleted emergency request ${requestId} for patient: ${targetReq.patientName}.`,
      currentHospital.name,
      requestId
    );

    pushNotification(
      'HOSPITAL',
      `Requisition #${requestId.length > 12 ? requestId.slice(0, 8).toUpperCase() : requestId} Deleted`,
      `Emergency requisition for ${targetReq.patientName} was permanently deleted.`,
      'info',
      undefined,
      requestId
    );

    return { success: true, message: 'Emergency requisition deleted successfully.' };
  };

  // 15b. Hospital Update Profile
  const updateHospitalProfile = (updated: Partial<Hospital>) => {
    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id !== currentHospital.id) return h;
        return {
          ...h,
          ...updated,
          id: h.id,
        };
      })
    );
    logAudit('HOSPITAL_UPDATE', `Hospital ${currentHospital.name} updated facility profile details.`, currentHospital.name, currentHospital.id);
  };

  // 15c. Blood Bank Update Profile
  const updateBloodBankProfile = (updated: Partial<BloodBank>) => {
    setBloodBanks((prev) =>
      prev.map((b) => {
        if (b.id !== currentBloodBank.id) return b;
        return {
          ...b,
          ...updated,
          id: b.id,
        };
      })
    );
    logAudit('BLOOD_BANK_UPDATE', `Blood Bank ${currentBloodBank.name} updated facility profile details.`, currentBloodBank.name, currentBloodBank.id);
  };

  // 15c. Hospital Request Blood Transfer from Blood Bank
  const hospitalRequestBloodTransfer = async (
    bloodBankId: string,
    requestId: string,
    bloodGroup: BloodGroup,
    units: number
  ): Promise<{ success: boolean; message: string; requestId?: string }> => {
    // 0. Cache check for rapid duplicate submissions (within 3.5s)
    const cacheKey = `transfer-${bloodBankId}-${requestId || 'new'}-${bloodGroup}-${units}`;
    const cachedXfer = recentRequisitionsCache.current.get(cacheKey);
    if (cachedXfer && Date.now() - cachedXfer.timestamp < 3500) {
      console.warn(`[LifeDropContext] Ignored duplicate hospitalRequestBloodTransfer within 3.5s: ${cacheKey}`);
      return cachedXfer.result;
    }

    const bb = bloodBanks.find((b) => b.id === bloodBankId);
    if (!bb) return { success: false, message: 'Blood bank not found.' };

    const stock = bb.inventory[bloodGroup];
    if (!stock || stock.available < units) {
      return {
        success: false,
        message: `Insufficient inventory: ${bb.name} has only ${stock?.available || 0} units of ${bloodGroup} available.`,
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let finalReqId = requestId;

    if (requestId) {
      // 1. Assign existing ticket directly to target blood bank
      try {
        await api.requests.directRequisition(requestId, bloodBankId, units);
      } catch (err) {
        console.warn('Backend directRequisition failed, continuing with local state', err);
      }

      setRequests((prev) =>
        prev.map((req) => {
          if (req.id !== requestId) return req;
          const existing = req.bloodBankContributions.find((c) => c.bloodBankId === bloodBankId);
          const updatedContributions = existing
            ? req.bloodBankContributions.map((c) =>
                c.bloodBankId === bloodBankId
                  ? {
                      ...c,
                      offeredUnits: units,
                      allocatedUnits: 0,
                      status: 'PENDING' as const,
                    }
                  : c
              )
            : [
                ...req.bloodBankContributions,
                {
                  bloodBankId: bb.id,
                  bloodBankName: bb.name,
                  bloodGroup,
                  offeredUnits: units,
                  allocatedUnits: 0,
                  status: 'PENDING' as const,
                  reservedAt: nowStr,
                },
              ];

          const updatedTimeline = [
            ...req.timeline,
            {
              title: `Direct Transfer Requisition: ${bb.name}`,
              timestamp: nowStr,
              description: `Emergency transfer requisition for ${units} unit(s) of ${bloodGroup} submitted to ${bb.name}. Awaiting blood bank review and approval.`,
              type: 'allocation' as const,
            },
          ];

          return {
            ...req,
            bloodBankContributions: updatedContributions,
            timeline: updatedTimeline,
          };
        })
      );
    } else {
      // 2. No specific ticket: Create a new inter-facility emergency blood request directed to target blood bank!
      let backendCreatedReq: any = null;
      try {
        const res: any = await api.requests.create({
          patientName: `Inter-Facility Requisition (${bb.name})`,
          bloodGroup: toPrismaBloodGroup(bloodGroup),
          requiredUnits: units,
          emergencyLevel: 'URGENT',
          requiredDateTime: new Date(Date.now() + 4 * 3600000).toISOString(),
          contactNumber: currentHospital.phone,
          notes: `Inter-facility stock transfer request directed to ${bb.name}. Cold chain dispatch required for ${units} unit(s) of ${bloodGroup}.`,
          targetBloodBankId: bloodBankId,
        });
        backendCreatedReq = res?.request || res?.data?.request || res;
        if (backendCreatedReq?.id) {
          finalReqId = backendCreatedReq.id;
        }
      } catch (err) {
        console.warn('Backend API request create failed, using local requisition ID', err);
      }

      if (!finalReqId) {
        finalReqId = `LD-XFER-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const newTransferReq: BloodRequest = {
        id: finalReqId,
        hospitalId: currentHospital.id,
        hospitalName: currentHospital.name,
        hospitalAddress: currentHospital.address,
        hospitalPhone: currentHospital.phone,
        hospitalLatitude: currentHospital.latitude || 16.3067,
        hospitalLongitude: currentHospital.longitude || 80.4365,
        patientName: `Inter-Facility Requisition (${bb.name})`,
        bloodGroup,
        requiredUnits: units,
        allocatedUnits: 0,
        confirmedUnits: 0,
        remainingUnits: units,
        emergencyLevel: 'URGENT',
        requiredDateTime: new Date(Date.now() + 4 * 3600000).toISOString().replace('T', ' ').slice(0, 16),
        contactNumber: currentHospital.phone,
        notes: `Emergency inter-facility stock transfer requisition submitted to ${bb.name}. Awaiting blood bank review and approval.`,
        status: 'SEARCHING',
        createdAt: nowStr,
        donorContributions: [],
        bloodBankContributions: [
          {
            bloodBankId: bb.id,
            bloodBankName: bb.name,
            bloodGroup,
            offeredUnits: units,
            allocatedUnits: 0,
            status: 'PENDING',
            reservedAt: nowStr,
          },
        ],
        timeline: [
          {
            title: `Inter-Facility Transfer Requisition (${units} Units ${bloodGroup})`,
            timestamp: nowStr,
            description: `${currentHospital.name} requisitioned ${units} unit(s) of ${bloodGroup} from ${bb.name}. Awaiting blood bank approval.`,
            type: 'creation',
          },
          {
            title: `Pending Blood Bank Approval`,
            timestamp: nowStr,
            description: `Requisition submitted to ${bb.name}. Awaiting blood bank approval before unit reservation and cold-chain dispatch.`,
            type: 'allocation',
          },
        ],
      };

      setRequests((prev) => [newTransferReq, ...prev.filter((r) => r.id !== finalReqId)]);
    }

    logAudit(
      'BLOOD_TRANSFER_REQUISITION',
      `Hospital ${currentHospital.name} submitted transfer requisition for ${units} units of ${bloodGroup} to ${bb.name}.`,
      currentHospital.name,
      finalReqId || bloodBankId
    );

    pushNotification(
      'BLOOD_BANK',
      `🚨 Urgent Requisition: ${units} Units of ${bloodGroup}`,
      `${currentHospital.name} requested transfer of ${units} unit(s) of ${bloodGroup}. Approval required before dispatch.`,
      'emergency',
      bb.id,
      finalReqId
    );

    // Refresh remote state to ensure synchronized inventory and requests across sessions
    refreshRequests().catch(() => {});

    const result = {
      success: true,
      message: `Requisition for ${units} unit(s) of ${bloodGroup} submitted to ${bb.name}. Awaiting blood bank approval.`,
      requestId: finalReqId,
    };
    recentRequisitionsCache.current.set(cacheKey, { timestamp: Date.now(), result });
    return result;
  };

  // 16. Admin Approvals & User Management
  const adminApproveHospital = (hospitalId: string) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === hospitalId ? { ...h, isVerified: true, status: 'VERIFIED' as const } : h))
    );
    logAudit('HOSPITAL_APPROVAL', `Admin approved hospital verification for ${hospitalId}.`, 'Admin', hospitalId);
    api.admin.updateHospitalVerification(hospitalId, 'VERIFIED', 'Admin approval').catch((err) => console.warn('Backend adminApproveHospital error:', err));
  };

  const adminRejectHospital = (hospitalId: string) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === hospitalId ? { ...h, isVerified: false, status: 'REJECTED' as const } : h))
    );
    logAudit('ADMIN_ACTION', `Admin rejected hospital registration for ${hospitalId}.`, 'Admin', hospitalId);
    api.admin.updateHospitalVerification(hospitalId, 'REJECTED', 'Admin rejection').catch((err) => console.warn('Backend adminRejectHospital error:', err));
  };

  const adminApproveBloodBank = (bloodBankId: string) => {
    setBloodBanks((prev) =>
      prev.map((b) => (b.id === bloodBankId ? { ...b, isVerified: true, status: 'VERIFIED' as const } : b))
    );
    logAudit('BLOOD_BANK_APPROVAL', `Admin approved blood bank verification for ${bloodBankId}.`, 'Admin', bloodBankId);
    api.admin.updateBloodBankVerification(bloodBankId, 'VERIFIED', 'Admin approval').catch((err) => console.warn('Backend adminApproveBloodBank error:', err));
  };

  const adminRejectBloodBank = (bloodBankId: string) => {
    setBloodBanks((prev) =>
      prev.map((b) => (b.id === bloodBankId ? { ...b, isVerified: false, status: 'REJECTED' as const } : b))
    );
    logAudit('ADMIN_ACTION', `Admin rejected blood bank registration for ${bloodBankId}.`, 'Admin', bloodBankId);
    api.admin.updateBloodBankVerification(bloodBankId, 'REJECTED', 'Admin rejection').catch((err) => console.warn('Backend adminRejectBloodBank error:', err));
  };

  const adminUpdateUserStatus = (userId: string, status: 'ACTIVE' | 'WARNED' | 'SUSPENDED') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status, warningCount: status === 'WARNED' ? u.warningCount + 1 : u.warningCount } : u))
    );
    logAudit('ADMIN_ACTION', `Admin updated user ${userId} status to ${status}.`, 'Admin', userId);
    api.admin.updateUserStatus(userId, status, 'Admin update').catch((err) => console.warn('Backend adminUpdateUserStatus error:', err));
  };

  const adminResolveReport = (reportId: string, resolution: 'WARNED' | 'SUSPENDED' | 'DISMISSED') => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: resolution } : r))
    );
    logAudit('ADMIN_ACTION', `Report ${reportId} marked as ${resolution}.`, 'Admin', reportId);
    api.admin.resolveReport(reportId, resolution, 'Admin resolution').catch((err) => console.warn('Backend adminResolveReport error:', err));
  };

  const updateAdminProfile = (updated: Partial<AdminProfile>) => {
    setAdmin((prev) => {
      const next = { ...prev, ...updated };
      logAudit(
        'ADMIN_PROFILE_UPDATE',
        `Administrator profile updated (${Object.keys(updated).join(', ')})`,
        prev.name,
        prev.id,
        { updatedFields: Object.keys(updated) }
      );
      return next;
    });
    pushNotification(
      'ADMIN',
      'Profile Updated',
      'Administrator profile details saved successfully.',
      'success'
    );
    return { success: true, message: 'Profile updated successfully.' };
  };

  const changeAdminPassword = (currentPass: string, newPass: string) => {
    if (!currentPass || currentPass.trim().length === 0) {
      return { success: false, message: 'Please enter your current password.' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    setAdmin((prev) => ({
      ...prev,
      lastPasswordChange: todayStr,
    }));
    logAudit(
      'SECURITY_CREDENTIAL_CHANGE',
      `Administrator password changed securely`,
      admin.name,
      admin.id
    );
    pushNotification(
      'ADMIN',
      'Password Changed',
      'Administrator password has been successfully updated.',
      'success'
    );
    return { success: true, message: 'Password changed successfully.' };
  };

  const toggleAdmin2FA = () => {
    let nextVal = false;
    setAdmin((prev) => {
      nextVal = !prev.twoFactorEnabled;
      logAudit(
        'SECURITY_2FA_TOGGLE',
        `Two-Factor Authentication ${nextVal ? 'enabled' : 'disabled'} for Administrator`,
        prev.name,
        prev.id
      );
      return { ...prev, twoFactorEnabled: nextVal };
    });
    pushNotification(
      'ADMIN',
      'Security Settings Updated',
      `Two-factor authentication is now ${nextVal ? 'enabled' : 'disabled'}.`,
      'info'
    );
    return nextVal;
  };

  // 17. Notification Center Management
  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    api.notifications.markRead(notifId).catch((err) => console.warn('Backend markRead error:', err));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.notifications.readAll().catch((err) => console.warn('Backend readAll error:', err));
  };

  const clearNotification = (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  return (
    <LifeDropContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUserId,
        currentHospital,
        setCurrentHospitalId,
        currentBloodBank,
        setCurrentBloodBankId,
        currentAdmin,
        isAuthenticated,
        login,
        loginWithDemo,
        logout,
        checkAuthSession,
        users,
        hospitals,
        bloodBanks,
        requests,
        campaigns,
        reports,
        auditLogs,
        notifications,
        appointments,
        donorRespond,
        donorCancelDonation,
        updateUserProfile,
        registerUser,
        registerHospital,
        registerBloodBank,
        registerDonationAppointment,
        cancelDonationAppointment,
        createBloodRequest,
        hospitalConfirmDonation,
        hospitalMarkNoShow,
        hospitalMarkNotCompleted,
        submitReport,
        closeRequest,
        deleteBloodRequest,
        updateHospitalProfile,
        hospitalRequestBloodTransfer,
        refreshRequests,
        refreshBloodBanks,
        refreshMyInventory,
        bloodBankOfferUnits,
        bloodBankConfirmSupply,
        bloodBankWalkInDonation,
        updateInventoryStock,
        createCampaign,
        updateBloodBankProfile,
        adminApproveHospital,
        adminRejectHospital,
        adminApproveBloodBank,
        adminRejectBloodBank,
        adminUpdateUserStatus,
        adminResolveReport,
        updateAdminProfile,
        changeAdminPassword,
        toggleAdmin2FA,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        resetToInitialData,
        feedbacks,
        submitFeedback,
        adminReplyToFeedback,
        hasUserSeenFeedbackPrompt,
        markFeedbackPromptAsSeen,
        feedbackModalState,
        openFeedbackModal,
        closeFeedbackModal,
        facilityApplications,
        fetchFacilityApplications,
        pendingApplicationsCount,
        pushNotification,
      }}
    >
      {children}
    </LifeDropContext.Provider>
  );
};

export const useLifeDrop = () => {
  const context = useContext(LifeDropContext);
  if (!context) {
    throw new Error('useLifeDrop must be used within a LifeDropProvider');
  }
  return context;
};
