# LifeDrop — Frontend to Backend Integration Checklist

This document details the complete end-to-end integration status between the React frontend pages/components and the Express.js / PostgreSQL backend REST APIs.

---

## 1. Authentication & Session Management

| Feature | Frontend Page / Component | Backend API Endpoint | Methods | Persistent Entity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Donor Registration | `RegisterPage.tsx` / `RegisterStepSecurity.tsx` | `/api/v1/auth/register` | `POST` | `User`, `DonorProfile`, `DonorAvailability`, `DonorConsent` | ✅ Integrated |
| Hospital Registration | `RegisterPage.tsx` / `HospitalStep*.tsx` | `/api/v1/auth/register` | `POST` | `User`, `Hospital` | ✅ Integrated |
| Blood Bank Registration | `RegisterPage.tsx` / `BloodBankStep*.tsx` | `/api/v1/auth/register` | `POST` | `User`, `BloodBank`, `InventoryBalance` | ✅ Integrated |
| User Login | `LoginPage.tsx` | `/api/v1/auth/login` | `POST` | `RefreshSession` | ✅ Integrated |
| Phone OTP Verification | `OtpModal.tsx` | `/api/v1/auth/otp/request`<br>`/api/v1/auth/otp/verify` | `POST` | `OTPChallenge` | ✅ Integrated |
| Token Refresh | `api/client.ts` (Automatic on 401) | `/api/v1/auth/refresh` | `POST` | `RefreshSession` | ✅ Integrated |
| User Logout | `Navbar.tsx` | `/api/v1/auth/logout` | `POST` | `RefreshSession` (Revocation) | ✅ Integrated |
| Passkey Verification | `AdminLogin.tsx` | `/api/v1/auth/admin-passkey` | `POST` | Server Verification | ✅ Integrated |

---

## 2. Donor Features

| Feature | Frontend Page / Component | Backend API Endpoint | Methods | Persistent Entity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Donor Discovery | `DonorListPage.tsx`, `EmergencyRadar.tsx` | `/api/v1/donors` | `GET` | `DonorProfile`, `User` | ✅ Integrated |
| Donor Detail | `DonorDetailPage.tsx` | `/api/v1/donors/:id` | `GET` | `DonorProfile` | ✅ Integrated |
| Availability Preferences | `DonorProfilePage.tsx` | `/api/v1/donors/me/availability` | `PATCH` | `DonorAvailability` | ✅ Integrated |
| Privacy & Consent | `DonorProfilePage.tsx` | `/api/v1/donors/me/consent` | `PATCH` | `DonorConsent` | ✅ Integrated |
| Respond to Request (Accept) | `EmergencyDetailModal.tsx` | `/api/v1/blood-requests/:id/responses` | `POST` | `BloodRequestResponse`, `BloodRequest` | ✅ Integrated |
| Cancel Commitment | `DonorProfilePage.tsx` | `/api/v1/blood-requests/:id/cancel-commitment` | `POST` | `BloodRequestResponse`, `BloodRequest` | ✅ Integrated |
| Donation History | `DonorProfilePage.tsx` | `/api/v1/donations/me` | `GET` | `DonationRecord` | ✅ Integrated |
| Appointment Booking | `BloodBankDetailPage.tsx` | `/api/v1/appointments` | `POST` | `DonationAppointment` | ✅ Integrated |

---

## 3. Hospital Features

| Feature | Frontend Page / Component | Backend API Endpoint | Methods | Persistent Entity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Create Emergency Request | `CreateRequestModal.tsx` | `/api/v1/blood-requests` | `POST` | `BloodRequest`, `AuditLog` | ✅ Integrated |
| Hospital Requisition List | `HospitalDashboardPage.tsx` | `/api/v1/blood-requests?hospitalId=...` | `GET` | `BloodRequest` | ✅ Integrated |
| Confirm Donor Donation | `HospitalDashboardPage.tsx` | `/api/v1/donations/confirm` | `POST` | `DonationRecord`, `BloodRequest`, `DonorProfile` | ✅ Integrated |
| Mark Donor No-Show | `HospitalDashboardPage.tsx` | `/api/v1/donations/mark-no-show` | `POST` | `BloodRequestResponse`, `BloodRequest` | ✅ Integrated |
| Mark Not Completed | `HospitalDashboardPage.tsx` | `/api/v1/donations/mark-not-completed` | `POST` | `BloodRequestResponse`, `BloodRequest` | ✅ Integrated |
| Close Requisition | `HospitalDashboardPage.tsx` | `/api/v1/blood-requests/:id/cancel` | `POST` | `BloodRequest` | ✅ Integrated |
| Hospital Facility Profile | `HospitalProfilePage.tsx` | `/api/v1/hospitals/me` | `PATCH` | `Hospital` | ✅ Integrated |
| File Abuse Report | `ReportModal.tsx` | `/api/v1/reports` | `POST` | `UserReport`, `AuditLog` | ✅ Integrated |

---

## 4. Blood Bank Features

| Feature | Frontend Page / Component | Backend API Endpoint | Methods | Persistent Entity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| View Inventory | `BloodBankInventoryPage.tsx` | `/api/v1/inventory` | `GET` | `InventoryBalance`, `InventoryLot` | ✅ Integrated |
| Intake Stock Lot | `AddStockModal.tsx` | `/api/v1/inventory/stock` | `POST` | `InventoryLot`, `InventoryBalance`, `InventoryTransaction` | ✅ Integrated |
| Stock Adjustment | `BloodBankInventoryPage.tsx` | `/api/v1/inventory/adjustments` | `POST` | `InventoryBalance`, `InventoryTransaction` | ✅ Integrated |
| Reserve Units for Hospital | `BloodBankDashboardPage.tsx` | `/api/v1/blood-requests/:id/reservations` | `POST` | `InventoryReservation`, `InventoryBalance`, `InventoryTransaction` | ✅ Integrated |
| Walk-In Donation Intake | `BloodBankDashboardPage.tsx` | `/api/v1/donations/confirm` | `POST` | `DonationRecord`, `InventoryBalance`, `InventoryLot` | ✅ Integrated |
| Expiring Stock Audit | `BloodBankInventoryPage.tsx` | `/api/v1/inventory/expiring` | `GET` | `InventoryLot` | ✅ Integrated |
| Transaction History | `BloodBankInventoryPage.tsx` | `/api/v1/inventory/transactions` | `GET` | `InventoryTransaction` | ✅ Integrated |
| Create Donation Campaign | `CreateCampaignModal.tsx` | `/api/v1/campaigns` | `POST` | `Campaign`, `AuditLog` | ✅ Integrated |
| Blood Bank Profile | `BloodBankProfilePage.tsx` | `/api/v1/blood-banks/me` | `PATCH` | `BloodBank` | ✅ Integrated |

---

## 5. Administration & Moderation

| Feature | Frontend Page / Component | Backend API Endpoint | Methods | Persistent Entity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Aggregate Analytics | `AdminDashboardPage.tsx` | `/api/v1/admin/dashboard` | `GET` | Platform-wide Aggregations | ✅ Integrated |
| User List & Search | `AdminUsersPage.tsx` | `/api/v1/admin/users` | `GET` | `User` | ✅ Integrated |
| User Status (Suspend/Warn) | `AdminUsersPage.tsx` | `/api/v1/admin/users/:id/status` | `PATCH` | `User`, `AuditLog` | ✅ Integrated |
| Hospital Verifications | `AdminHospitalsPage.tsx` | `/api/v1/admin/hospitals/:id/verification` | `PATCH` | `Hospital`, `AuditLog` | ✅ Integrated |
| Blood Bank Verifications | `AdminBloodBanksPage.tsx` | `/api/v1/admin/blood-banks/:id/verification` | `PATCH` | `BloodBank`, `AuditLog` | ✅ Integrated |
| Moderation Reports | `AdminReportsPage.tsx` | `/api/v1/admin/reports/:id` | `PATCH` | `UserReport`, `AuditLog` | ✅ Integrated |
| Feedback Replies | `FeedbackManagementModal.tsx` | `/api/v1/admin/feedback/:id/reply` | `POST` | `FeedbackSubmission`, `Notification` | ✅ Integrated |
| Audit Trail Inspection | `AdminAuditLogPage.tsx` | `/api/v1/admin/audit-logs` | `GET` | `AuditLog` | ✅ Integrated |
