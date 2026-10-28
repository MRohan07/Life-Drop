# LifeDrop — Persistent Demo Accounts & Authentication Guide

> **Security Notice**: These credentials are strictly intended for local development, demonstration, and end-to-end integration testing. Before deploying to staging or production, all administrative accounts and demo credentials must be rotated or replaced with secure individual passphrases.

---

## 1. Authentication Architecture

LifeDrop uses real, database-backed authentication powered by PostgreSQL:
- **Password Hashing**: Argon2id with memory-hard parameters.
- **Tokens**: Stateless short-lived JWT access tokens + revocable rotating refresh sessions persisted in PostgreSQL (`RefreshSession` table).
- **Session Revocation**: Logging out instantly revokes the session on the backend.
- **No Client-Side Role Switching**: As per architectural standards, all persona switching buttons, dropdowns, and client-side impersonation shortcuts have been completely removed from authenticated navigation bars, mobile drawers, and dashboards.
- **Login Location**: Demo logins are available **only on the Login page (`/auth`) and landing login card**. Clicking a demo persona executes a real backend `POST /api/v1/auth/login` request, verifies credentials in PostgreSQL, and establishes a secure authenticated session.

---

## 2. Verified Predefined Accounts

### A. Predefined System Administrators

| Role | Name | Email | Password | Phone | Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator** | **Rohan** | `adminrohan@gmail.com` | `Admin@123` | `9848099001` | System Administration & Clinical Operations |
| **Administrator** | **Hanitha** | `adminhanitha@gmail.com` | `Admin@123` | `9848099002` | System Administration & Regulatory Compliance |
| **Administrator** | Dr. Rajesh Varma | `admin.rajesh@lifedrop.io` | `LifeDrop@2026!` | `9848011223` | Director of Clinical Operations, SBTC |

*Permissions*: Blood bank/hospital verification, user suspension/moderation, audit log review, network-wide analytics.

---

### B. Regular Donors / Users

| Role | Name | Email | Password | Phone | Blood Group | Rank |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Donor / User** | **Hemendra Das** | `hemendra.das@lifedrop.io` | `LifeDrop@2026!` | `9848012345` | **O+** | Gold (4 donations) |
| **Donor / User** | Pranaya | `pranaya@lifedrop.io` | `LifeDrop@2026!` | `9848056789` | **A+** | Silver (2 donations) |
| **Donor / User** | Sahith Ram | `sahith.ram@lifedrop.io` | `LifeDrop@2026!` | `9848099887` | **B+** | Platinum (7 donations) |

*Capabilities*: Book blood bank donation appointments, respond to emergency radar alerts, register for donation campaigns, manage availability & privacy consent.

---

### C. Blood Banks

| Role | Organization Name | Email | Password | Phone | License / City |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Blood Bank** | **Indian Red Cross Society Blood Bank** | `redcross.guntur@redcross.org.in` | `LifeDrop@2026!` | `08632234050` | `BB-AP-GNT-2023-1029` / Guntur |
| **Blood Bank** | Rotary Club of Guntur Blood Bank | `rotarybloodbank.guntur@gmail.com` | `LifeDrop@2026!` | `08632235555` | `BB-AP-GNT-2024-5501` / Guntur |

*Capabilities*: Component inventory management (RBC, Platelets, FFP, Whole Blood), blood request fulfillment & reservations, appointment management, walk-in donation verification.

---

### D. Hospitals

| Role | Hospital Name | Email | Password | Phone | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hospital** | **Government General Hospital (GGH)** | `superintendent@gghguntur.gov.in` | `LifeDrop@2026!` | `0863224095` | Government / Level 1 Trauma |
| **Hospital** | Ramesh Hospitals | `info@rameshhospitals.com` | `LifeDrop@2026!` | `08632377777` | Private / Super-Speciality |
| **Hospital** | NRI General Hospital | `emergency@nrihospitals.com` | `LifeDrop@2026!` | `08645230101` | Trust / Teaching Hospital |

*Capabilities*: Issue urgent & emergency blood requests, broadcast emergency radar notifications to nearby compatible donors, reserve blood units from verified blood banks.

---

## 3. How to Authenticate & Test

### In the Web Browser
1. Navigate to `http://localhost:3000/auth` (or click "Sign In" on the homepage).
2. **Method 1 (1-Click Demo Login)**: Click on any of the Demo Persona quick-fill buttons (e.g. **Admin Rohan**, **Admin Hanitha**, **Donor Hemendra**, or **Red Cross Blood Bank**).
3. **Method 2 (Manual Login)**: Enter the email or phone and password, then click "Sign In".
4. To test a different account:
   - Click the "Sign Out" button in the top navigation bar.
   - You will be cleanly redirected to the Login page.
   - Log in with the other demo account.

### Via Command-Line (cURL)

#### 1. Login as Admin Rohan:
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"adminrohan@gmail.com","password":"Admin@123"}'
```

#### 2. Login as Admin Hanitha:
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"adminhanitha@gmail.com","password":"Admin@123"}'
```

#### 3. Login as Donor Hemendra:
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"hemendra.das@lifedrop.io","password":"LifeDrop@2026!"}'
```

#### 4. Login as Red Cross Blood Bank:
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"redcross.guntur@redcross.org.in","password":"LifeDrop@2026!"}'
```
