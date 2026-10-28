# LifeDrop — Complete REST API Inventory

Base URL: `/api/v1`

---

## 1. Authentication (`/api/v1/auth`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/register` | `POST` | Public | Register new User, Hospital, or Blood Bank account |
| `/login` | `POST` | Public | Authenticate with phone/email and password |
| `/otp/request` | `POST` | Public | Request a 6-digit OTP challenge |
| `/otp/verify` | `POST` | Public | Verify OTP code and establish authenticated session |
| `/refresh` | `POST` | Public | Rotate refresh token and issue new access token |
| `/logout` | `POST` | Authenticated | Revoke refresh token and end session |
| `/logout-all` | `POST` | Authenticated | Revoke all active sessions for the user |
| `/me` | `GET` | Authenticated | Retrieve current authenticated user profile and roles |
| `/admin-passkey` | `POST` | Admin | Validate admin security passkey |

---

## 2. Users & Donors (`/api/v1/users`, `/api/v1/donors`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/users/me` | `GET` | Authenticated | Get current user's profile information |
| `/users/me` | `PATCH` | Authenticated | Update current user's personal details |
| `/donors` | `GET` | Public / Coordinator | Search eligible donors with privacy masking |
| `/donors/:id` | `GET` | Public / Coordinator | Get donor details (phone masked for non-staff) |
| `/donors/me/availability` | `PATCH` | `USER` | Update donor availability and travel radius |
| `/donors/me/consent` | `PATCH` | `USER` | Update donor consent and notification preferences |
| `/donors/me/donation-history` | `GET` | `USER` | Get completed donation history |

---

## 3. Hospitals (`/api/v1/hospitals`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/hospitals` | `GET` | Public | List verified medical facilities |
| `/hospitals/:id` | `GET` | Public | Get detailed hospital profile |
| `/hospitals/me` | `GET` | `HOSPITAL` | Get hospital facility profile for current account |
| `/hospitals/me` | `PATCH` | `HOSPITAL` | Update hospital facility information |

---

## 4. Blood Banks & Inventory (`/api/v1/blood-banks`, `/api/v1/inventory`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/blood-banks` | `GET` | Public | List accredited blood banks with inventory summary |
| `/blood-banks/:id` | `GET` | Public | Get blood bank facility details and stock status |
| `/blood-banks/me` | `GET` | `BLOOD_BANK` | Get blood bank facility details for current account |
| `/blood-banks/me` | `PATCH` | `BLOOD_BANK` | Update blood bank facility profile |
| `/inventory` | `GET` | `BLOOD_BANK`, `ADMIN` | Get inventory lots and balances |
| `/inventory/stock` | `POST` | `BLOOD_BANK`, `ADMIN` | Intake new blood stock lot |
| `/inventory/adjustments`| `POST` | `BLOOD_BANK`, `ADMIN` | Adjust inventory balance with reason code |
| `/inventory/transactions` | `GET` | `BLOOD_BANK`, `ADMIN` | Retrieve immutable audit transaction ledger |
| `/inventory/expiring` | `GET` | `BLOOD_BANK`, `ADMIN` | Query lots nearing expiration |

---

## 5. Blood Requests (`/api/v1/blood-requests`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/blood-requests` | `GET` | Public / Auth | List active emergency and routine requisitions |
| `/blood-requests` | `POST` | `HOSPITAL`, `ADMIN` | Broadcast emergency blood requisition |
| `/blood-requests/:id` | `GET` | Public / Auth | Get blood request with timeline and contributions |
| `/blood-requests/:id/responses` | `POST` | `USER` | Donor responds (`ACCEPT` / `DECLINE`) |
| `/blood-requests/:id/cancel-commitment` | `POST` | `USER` | Donor cancels their active commitment |
| `/blood-requests/:id/reservations` | `POST` | `BLOOD_BANK` | Blood bank reserves units for requisition |
| `/blood-requests/:id/cancel` | `POST` | `HOSPITAL`, `ADMIN` | Cancel blood request with reason |
| `/blood-requests/:id/fulfill` | `POST` | `HOSPITAL`, `ADMIN` | Mark blood request as completely fulfilled |

---

## 6. Donations (`/api/v1/donations`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/donations/confirm` | `POST` | `HOSPITAL`, `BLOOD_BANK` | Confirm completed blood receipt from donor |
| `/donations/mark-no-show` | `POST` | `HOSPITAL`, `BLOOD_BANK` | Mark donor as no-show and reopen radar search |
| `/donations/mark-not-completed` | `POST` | `HOSPITAL`, `BLOOD_BANK` | Record medical deferral without donor penalty |
| `/donations/me` | `GET` | `USER` | Get personal donation history and achievements |
| `/donations/:id` | `GET` | Authenticated | Get donation certificate / record details |

---

## 7. Campaigns (`/api/v1/campaigns`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/campaigns` | `GET` | Public | List upcoming community blood drives |
| `/campaigns` | `POST` | `BLOOD_BANK`, `ADMIN` | Host/announce new donation drive camp |
| `/campaigns/:id` | `GET` | Public | Get campaign schedule, venue, and registration count |
| `/campaigns/:id/register` | `POST` | `USER` | Register donor for campaign (enforces max capacity) |
| `/campaigns/:id/register` | `DELETE` | `USER` | Cancel registration for blood drive |
| `/campaigns/:id/registrations` | `GET` | `BLOOD_BANK`, `ADMIN` | Export registered donors for camp logistics |

---

## 8. Appointments (`/api/v1/appointments`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/appointments` | `POST` | `USER` | Book on-site donation appointment slot |
| `/appointments/me` | `GET` | `USER` | Get donor's upcoming appointments |
| `/appointments/facility` | `GET` | `BLOOD_BANK` | Blood bank view of scheduled appointments |
| `/appointments/:id/status` | `PATCH` | `BLOOD_BANK` | Update appointment status (`CONFIRMED`, `COMPLETED`, `CANCELLED`) |

---

## 9. Notifications (`/api/v1/notifications`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/notifications` | `GET` | Authenticated | List persistent notifications for current user |
| `/notifications/:id/read` | `PATCH` | Authenticated | Mark single notification as read |
| `/notifications/read-all` | `POST` | Authenticated | Mark all notifications as read |

---

## 10. Feedback & Reporting (`/api/v1/feedback`, `/api/v1/reports`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/feedback` | `POST` | Authenticated | Submit post-donation rating or platform review |
| `/feedback` | `GET` | Public | List approved user feedback and testimonials |
| `/reports` | `POST` | `HOSPITAL`, `BLOOD_BANK` | File abuse report against user for misconduct |

---

## 11. Administrator (`/api/v1/admin`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/admin/dashboard` | `GET` | `ADMIN` | Aggregate platform statistics and counts |
| `/admin/users` | `GET` | `ADMIN` | List and filter all user accounts |
| `/admin/users/:id/status` | `PATCH` | `ADMIN` | Suspend or reactivate user account |
| `/admin/hospitals` | `GET` | `ADMIN` | Inspect hospitals and pending verifications |
| `/admin/hospitals/:id/verification` | `PATCH` | `ADMIN` | Verify or reject hospital registration |
| `/admin/blood-banks` | `GET` | `ADMIN` | Inspect blood banks and pending accreditations |
| `/admin/blood-banks/:id/verification` | `PATCH` | `ADMIN` | Verify, accredit, or reject blood bank |
| `/admin/reports` | `GET` | `ADMIN` | List filed moderation reports |
| `/admin/reports/:id` | `PATCH` | `ADMIN` | Resolve moderation report (`WARNED`, `SUSPENDED`, `DISMISSED`) |
| `/admin/audit-logs` | `GET` | `ADMIN` | Query immutable administrative audit trail |
| `/admin/feedback/:id/reply` | `POST` | `ADMIN` | Official administrative reply to user review |
