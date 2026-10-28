# LifeDrop — Complete Blood Donation & Emergency Coordination Platform

LifeDrop is a production-grade emergency blood coordination platform built with a high-performance **Express.js + TypeScript + PostgreSQL + Prisma ORM** backend and a responsive, dynamic **React + Vite + Tailwind CSS** frontend.

---

## 1. System Architecture

LifeDrop is architected as a **modular monolith** with clean boundary separation between HTTP routing, validation, business domain services, persistence, and external messaging integrations:

```
┌───────────────────────────────────────────────────────────┐
│               LifeDrop React Frontend (Vite)              │
│       Pages: Donor, Hospital, Blood Bank, Administrator   │
│  State: LifeDropContext + Typed API Client + Transformers │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTP / REST JSON (Port 5001)
                              ▼
┌───────────────────────────────────────────────────────────┐
│              LifeDrop Backend (Express + TS)              │
│  Middleware: Helmet, CORS, RateLimiter, CookieParser, JWT │
├───────────────────────────────────────────────────────────┤
│ Modules:                                                  │
│  • Auth (Argon2id, JWT Access + Refresh Session Rotation) │
│  • Donors (Discovery, Privacy Masking, Eligibility)       │
│  • Hospitals (Requisitions, Fulfillment, Verification)    │
│  • Blood Banks (Lot Tracking, Stock Reconciliation)       │
│  • Inventory (ACID Ledger, Concurrency Row Locks)         │
│  • Blood Requests (Multi-step Allocation, Fulfillment)    │
│  • Donations (Post-donation Verification, 90-day Cooldown)│
│  • Campaigns (Community Drives, Capacity Enforcement)     │
│  • Appointments (On-site Slot Booking)                    │
│  • Notifications (In-app Alerts, SMS Integration Outbox)  │
│  • Feedback & Reports (Moderation & Administrative Audit) │
│  • Admin (Dashboard Analytics, System RBAC Moderation)    │
├───────────────────────────────────────────────────────────┤
│ Data Access Layer: Prisma ORM (v6.19)                     │
└─────────────────────────────┬─────────────────────────────┘
                              │ TCP / SQL (Port 5432)
                              ▼
┌───────────────────────────────────────────────────────────┐
│           PostgreSQL 16 Relational Database               │
│  Tables, Foreign Keys, Unique Indexes, Check Constraints  │
│  ACID Concurrency Locks, Append-only Ledger               │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| DonorProfile : has
    User ||--o| Hospital : manages
    User ||--o| BloodBank : operates
    User ||--o| AdminProfile : has
    User ||--o{ RefreshSession : owns
    User ||--o{ Notification : receives
    User ||--o| NotificationPreference : configures
    User ||--o{ FeedbackSubmission : submits
    User ||--o{ UserReport : reported_in

    DonorProfile ||--o| DonorAvailability : defines
    DonorProfile ||--o| DonorConsent : configures
    DonorProfile ||--o{ BloodRequestResponse : commits_to
    DonorProfile ||--o{ DonationRecord : completes
    DonorProfile ||--o{ DonationAppointment : schedules
    DonorProfile ||--o{ CampaignRegistration : registers

    Hospital ||--o{ BloodRequest : creates
    Hospital ||--o{ UserReport : files

    BloodBank ||--o{ InventoryLot : holds
    BloodBank ||--o{ InventoryBalance : maintains
    BloodBank ||--o{ InventoryTransaction : records
    BloodBank ||--o{ InventoryReservation : allocates
    BloodBank ||--o{ Campaign : hosts
    BloodBank ||--o{ DonationAppointment : accepts

    BloodRequest ||--o{ BloodRequestResponse : receives
    BloodRequest ||--o{ InventoryReservation : reserves
    BloodRequest ||--o{ DonationRecord : fulfills

    InventoryLot ||--o{ InventoryTransaction : traces
    InventoryLot ||--o{ InventoryReservation : holds
```

---

## 3. Technology Stack

- **Relational Database**: PostgreSQL 16
- **Backend Framework**: Express.js 4 (Node.js v23 / TypeScript 5.7)
- **Database ORM & Migrations**: Prisma ORM 6.19 with Prisma Migrate
- **Password Hashing**: Argon2id (`argon2` package)
- **Token Security**: Short-lived JWT access tokens (15m) + high-entropy refresh token session rotation
- **Input Validation**: Zod (`zod` schemas for request body, query params, and route IDs)
- **Logging**: Structured Pino logging with request-level metadata
- **API Documentation**: OpenAPI / Swagger UI (`/docs` and `/api/docs`)
- **Testing**: Vitest 3, Supertest, PostgreSQL integration tests against `lifedrop_test`
- **Frontend**: React 18, TypeScript 5.7, Vite 6, Tailwind CSS 3, Lucide Icons

---

## 4. Database Setup & PostgreSQL Instructions

### Local PostgreSQL Setup on macOS

1. **Install PostgreSQL**:
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create Database User & Databases**:
   ```bash
   psql -U postgres -d postgres
   ```
   Execute the following SQL commands:
   ```sql
   CREATE USER lifedrop_user WITH PASSWORD 'lifedrop_secure_pass_2026';
   ALTER USER lifedrop_user CREATEDB;
   CREATE DATABASE lifedrop OWNER lifedrop_user;
   CREATE DATABASE lifedrop_test OWNER lifedrop_user;
   GRANT ALL PRIVILEGES ON DATABASE lifedrop TO lifedrop_user;
   GRANT ALL PRIVILEGES ON DATABASE lifedrop_test TO lifedrop_user;
   \c lifedrop
   GRANT ALL ON SCHEMA public TO lifedrop_user;
   \c lifedrop_test
   GRANT ALL ON SCHEMA public TO lifedrop_user;
   ```

3. **Verify Database Connection**:
   ```bash
   psql -U lifedrop_user -d lifedrop -h localhost -p 5432
   ```

---

## 5. Environment Variables Configuration

Create a `.env` file in `backend/` based on `backend/.env.example`:

```ini
# Application
NODE_ENV=development
PORT=5001
HOST=0.0.0.0

# Database Connections
DATABASE_URL="postgresql://lifedrop_user:lifedrop_secure_pass_2026@localhost:5432/lifedrop?schema=public"

# Authentication & Sessions
JWT_ACCESS_SECRET="lifedrop_production_super_secret_access_jwt_key_at_least_32_chars_2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="lifedrop_production_super_secret_refresh_jwt_key_at_least_32_chars_2026"
REFRESH_TOKEN_EXPIRES_DAYS=30

# CORS & Frontend Origins
FRONTEND_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500

# Logging
LOG_LEVEL="info"
```

---

## 6. Database Migrations & Seed Data

1. **Apply Migrations**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Seed Database with Initial Data**:
   ```bash
   npm run prisma:seed
   ```
   The seed script populates:
   - **Predefined Administrators**:
     - `adminrohan@gmail.com` / `Admin@123`
     - `adminhanitha@gmail.com` / `Admin@123`
     - `admin.rajesh@lifedrop.io` / `LifeDrop@2026!`
   - **Demo Donors**:
     - `hemendra.das@lifedrop.io` / `LifeDrop@2026!` (O+)
     - `pranaya@lifedrop.io` / `LifeDrop@2026!` (A+)
     - `sahith.ram@lifedrop.io` / `LifeDrop@2026!` (B+)
   - **Demo Blood Banks & Hospitals**:
     - `redcross.guntur@redcross.org.in` / `LifeDrop@2026!`
     - `superintendent@gghguntur.gov.in` / `LifeDrop@2026!`
   - Complete inventory lots, real-time balances for all 8 blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-), campaigns, appointments, and notification streams.
   - For full credential details and workflows, see [DEMO_ACCOUNTS.md](file:///Users/rohan/Desktop/Life%20Drop/DEMO_ACCOUNTS.md).

---

## 6.1 Authentication & Demo Account Policy

- **No Client-Side Persona Switching**: In compliance with security standards, all client-side account-switching dropdowns, buttons, and state shortcuts have been completely eliminated from authenticated screens.
- **Login Exclusively on `/auth`**: To switch users, the active user must click "Sign Out", return to `/auth`, and authenticate with the desired account.
- **Real Backend Verification**: Every demo login executes a real `POST /api/v1/auth/login` HTTP request validated via Argon2id password hashing against PostgreSQL, generating valid JWT access tokens and database `RefreshSession` records.

---

## 7. Running the Application

### Start the Backend API (Port 5001)

```bash
cd backend
npm run dev
```
Health status check: `curl http://localhost:5001/health/ready`
Swagger UI Documentation: `http://localhost:5001/docs`

### Start the Frontend Application (Port 5173)

```bash
# In the root workspace directory
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 8. Automated Testing

All automated integration tests run against the dedicated `lifedrop_test` database:

```bash
cd backend
npm test
```

To run tests with code coverage:
```bash
npm run test:coverage
```

### Test Coverage Highlights:
- **Authentication**: Argon2id hashing, token issuance, refresh token rotation, session revocation, OTP validation.
- **Privacy & Security**: Masking of donor phone numbers and coordinates on public search.
- **Inventory ACID Control**: Atomic balance updates, immutable transaction ledger, rejection of negative stock.
- **Concurrency & Race Conditions**: Parallel reservation lock contention (preventing double allocation), campaign capacity enforcement.
- **Request Lifecycle**: Status transitions from `SEARCHING` to `RESERVED` to `FULFILLED`, incompatibility rejection, and duplicate donation confirmation prevention.
- **Administration & RBAC**: Strict role enforcement (403 Forbidden for unauthorized roles) and audit trail verification.

---

## 9. Production Deployment Guide

### Building for Production

1. **Build Backend**:
   ```bash
   cd backend
   npm run build
   ```
2. **Build Frontend**:
   ```bash
   npm run build
   ```
   The compiled frontend bundle will be generated in `dist/`.

### Deployment with Process Manager (PM2)

```bash
npm install -g pm2
cd backend
pm2 start dist/server.js --name "lifedrop-api" -i max
pm2 save
pm2 startup
```

### Production Migrations

To apply database schema changes in production without data loss:
```bash
npx prisma migrate deploy
```

---

## 10. Database Backup and Recovery

### Automated Backup (`pg_dump`)

Create daily backups using PostgreSQL native tools:
```bash
pg_dump -U lifedrop_user -h localhost -F c -b -v -f "/var/backups/lifedrop_$(date +%Y%m%d_%H%M%S).dump" lifedrop
```

### Database Restoration (`pg_restore`)

```bash
pg_restore -U lifedrop_user -h localhost -d lifedrop -v "/var/backups/lifedrop_20261014_120000.dump"
```

---

## 11. Clinical & Security Notice

> **Important Clinical Transfusion Disclaimer**:
> LifeDrop coordinates blood donations and facilitates emergency hospital requisitions. The platform is not a medical device and does not replace certified laboratory pre-transfusion cross-matching, infectious disease screening (HIV, HBV, HCV, Syphilis, Malaria), or clinical decision-making by qualified medical specialists.
