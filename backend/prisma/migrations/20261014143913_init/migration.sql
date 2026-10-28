-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'HOSPITAL', 'BLOOD_BANK', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmergencyLevel" AS ENUM ('CRITICAL', 'URGENT', 'NORMAL');

-- CreateEnum
CREATE TYPE "DonorRank" AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SEARCHING', 'ACTIVE', 'PARTIALLY_FULFILLED', 'RESERVED', 'FULFILLED', 'CLOSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DonorResponseStatus" AS ENUM ('NOTIFIED', 'VIEWED', 'ACCEPTED', 'AWAITING_DONATION', 'COMPLETED', 'DECLINED', 'CANCELLED', 'NO_SHOW', 'NOT_COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BloodBankResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'RESERVED', 'ALLOCATED', 'CONFIRMED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING_APPROVAL', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'WARNED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('WHOLE_BLOOD', 'RED_BLOOD_CELLS', 'PLATELETS', 'PLASMA', 'CRYOPRECIPITATE');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('STOCK_ADDITION', 'ADJUSTMENT_CORRECTION', 'ADJUSTMENT_BREAKAGE', 'ADJUSTMENT_DISPOSAL', 'RESERVATION_HOLD', 'RESERVATION_RELEASE', 'FULFILLMENT_DEDUCTION', 'DONATION_COLLECTION');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FeedbackExperienceType" AS ENUM ('DONATION', 'COORDINATION', 'PLATFORM', 'GENERAL');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'FEATURED', 'RESOLVED', 'INVESTIGATING', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('Fraud', 'Misuse', 'Fake details', 'Repeated false acceptance', 'Suspicious activity', 'Other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'WARNED', 'SUSPENDED', 'DISMISSED', 'RESOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "city" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "lastDonationDate" TIMESTAMP(3),
    "nextEligibleDate" TIMESTAMP(3),
    "totalDonations" INTEGER NOT NULL DEFAULT 0,
    "rank" "DonorRank" NOT NULL DEFAULT 'Bronze',
    "activeCommitmentRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorAvailability" (
    "id" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableDays" TEXT NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    "preferredRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    "emergencyOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorConsent" (
    "id" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "sharePhoneWithHospitals" BOOLEAN NOT NULL DEFAULT true,
    "allowEmergencyRadar" BOOLEAN NOT NULL DEFAULT true,
    "allowSmsNotifications" BOOLEAN NOT NULL DEFAULT true,
    "allowEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'Private',
    "registrationNumber" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "image" TEXT,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT DEFAULT 'Andhra Pradesh',
    "pinCode" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "licenseNumber" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "licenseIssueDate" TIMESTAMP(3),
    "licenseExpiryDate" TIMESTAMP(3),
    "licenseDocUrl" TEXT,
    "registrationCertUrl" TEXT,
    "authorizedPersonName" TEXT,
    "authorizedPersonDesignation" TEXT,
    "authorizedPersonPhone" TEXT,
    "authorizedPersonEmail" TEXT,
    "emergencyContact" TEXT,
    "emergencyServiceAvailable" BOOLEAN NOT NULL DEFAULT true,
    "is24x7Emergency" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodBank" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'Private',
    "registrationNumber" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT DEFAULT 'Andhra Pradesh',
    "pinCode" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "componentsAvailable" TEXT[] DEFAULT ARRAY['Red Blood Cells', 'Platelets', 'Plasma', 'Whole Blood']::TEXT[],
    "emergencySupplyAvailable" BOOLEAN NOT NULL DEFAULT true,
    "is24x7Service" BOOLEAN NOT NULL DEFAULT true,
    "licenseNumber" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "licenseIssueDate" TIMESTAMP(3),
    "licenseExpiryDate" TIMESTAMP(3),
    "licenseDocUrl" TEXT,
    "registrationCertUrl" TEXT,
    "authorizedPersonName" TEXT,
    "authorizedPersonDesignation" TEXT,
    "authorizedPersonPhone" TEXT,
    "authorizedPersonEmail" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT 'Principal Health Informatics Director',
    "department" TEXT NOT NULL DEFAULT 'Emergency Response Oversight',
    "employeeId" TEXT NOT NULL DEFAULT 'GOV-AP-ADM-8801',
    "passkeyHash" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLot" (
    "id" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "componentType" "ComponentType" NOT NULL DEFAULT 'RED_BLOOD_CELLS',
    "batchNumber" TEXT NOT NULL,
    "initialUnits" INTEGER NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "reservedUnits" INTEGER NOT NULL DEFAULT 0,
    "suppliedUnits" INTEGER NOT NULL DEFAULT 0,
    "discardedUnits" INTEGER NOT NULL DEFAULT 0,
    "collectionDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBalance" (
    "id" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "componentType" "ComponentType" NOT NULL DEFAULT 'RED_BLOOD_CELLS',
    "availableUnits" INTEGER NOT NULL DEFAULT 0,
    "reservedUnits" INTEGER NOT NULL DEFAULT 0,
    "suppliedUnits" INTEGER NOT NULL DEFAULT 0,
    "lastReconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "lotId" TEXT,
    "bloodGroup" "BloodGroup" NOT NULL,
    "componentType" "ComponentType" NOT NULL DEFAULT 'RED_BLOOD_CELLS',
    "operationType" "InventoryTransactionType" NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "relatedRequestId" TEXT,
    "relatedReservationId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "componentType" "ComponentType" NOT NULL DEFAULT 'RED_BLOOD_CELLS',
    "requiredUnits" INTEGER NOT NULL,
    "allocatedUnits" INTEGER NOT NULL DEFAULT 0,
    "confirmedUnits" INTEGER NOT NULL DEFAULT 0,
    "remainingUnits" INTEGER NOT NULL,
    "emergencyLevel" "EmergencyLevel" NOT NULL DEFAULT 'NORMAL',
    "requiredDateTime" TIMESTAMP(3) NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'SEARCHING',
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequestResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "status" "DonorResponseStatus" NOT NULL DEFAULT 'NOTIFIED',
    "units" INTEGER NOT NULL DEFAULT 1,
    "acceptedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "cancellationReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodRequestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "componentType" "ComponentType" NOT NULL DEFAULT 'RED_BLOOD_CELLS',
    "lotId" TEXT,
    "offeredUnits" INTEGER NOT NULL,
    "allocatedUnits" INTEGER NOT NULL,
    "status" "BloodBankResponseStatus" NOT NULL DEFAULT 'RESERVED',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationRecord" (
    "id" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "bloodBankId" TEXT,
    "hospitalId" TEXT,
    "requestId" TEXT,
    "bloodGroup" "BloodGroup" NOT NULL,
    "componentType" "ComponentType" NOT NULL DEFAULT 'RED_BLOOD_CELLS',
    "units" INTEGER NOT NULL DEFAULT 1,
    "donationType" TEXT NOT NULL DEFAULT 'EMERGENCY_RESPONSE',
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "deferralReason" TEXT,
    "verifiedByActorId" TEXT NOT NULL,
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "googleFormUrl" TEXT,
    "targetUnits" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRegistration" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CampaignRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationAppointment" (
    "id" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "requestId" TEXT,
    "smsPreview" TEXT,
    "smsDelivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppUrgent" BOOLEAN NOT NULL DEFAULT true,
    "inAppGeneral" BOOLEAN NOT NULL DEFAULT true,
    "smsEmergency" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "experienceType" "FeedbackExperienceType" NOT NULL DEFAULT 'DONATION',
    "relatedRequestId" TEXT,
    "facilityName" TEXT,
    "aspects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comments" TEXT NOT NULL,
    "suggestions" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'SUBMITTED',
    "adminReplyMessage" TEXT,
    "adminReplyStatus" TEXT,
    "adminRepliedAt" TIMESTAMP(3),
    "adminRepliedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterHospitalId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "requestId" TEXT,
    "reason" "ReportReason" NOT NULL DEFAULT 'Other',
    "description" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "actionTaken" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "responseCode" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTPChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTPChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DonorProfile_userId_key" ON "DonorProfile"("userId");

-- CreateIndex
CREATE INDEX "DonorProfile_bloodGroup_isEligible_idx" ON "DonorProfile"("bloodGroup", "isEligible");

-- CreateIndex
CREATE UNIQUE INDEX "DonorAvailability_donorProfileId_key" ON "DonorAvailability"("donorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DonorConsent_donorProfileId_key" ON "DonorConsent"("donorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_userId_key" ON "Hospital"("userId");

-- CreateIndex
CREATE INDEX "Hospital_city_status_idx" ON "Hospital"("city", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BloodBank_userId_key" ON "BloodBank"("userId");

-- CreateIndex
CREATE INDEX "BloodBank_city_status_idx" ON "BloodBank"("city", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE INDEX "InventoryLot_bloodBankId_bloodGroup_status_idx" ON "InventoryLot"("bloodBankId", "bloodGroup", "status");

-- CreateIndex
CREATE INDEX "InventoryLot_expiryDate_idx" ON "InventoryLot"("expiryDate");

-- CreateIndex
CREATE INDEX "InventoryBalance_bloodBankId_idx" ON "InventoryBalance"("bloodBankId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBalance_bloodBankId_bloodGroup_componentType_key" ON "InventoryBalance"("bloodBankId", "bloodGroup", "componentType");

-- CreateIndex
CREATE INDEX "InventoryTransaction_bloodBankId_createdAt_idx" ON "InventoryTransaction"("bloodBankId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryTransaction_relatedRequestId_idx" ON "InventoryTransaction"("relatedRequestId");

-- CreateIndex
CREATE INDEX "BloodRequest_status_emergencyLevel_idx" ON "BloodRequest"("status", "emergencyLevel");

-- CreateIndex
CREATE INDEX "BloodRequest_bloodGroup_status_idx" ON "BloodRequest"("bloodGroup", "status");

-- CreateIndex
CREATE INDEX "BloodRequest_hospitalId_idx" ON "BloodRequest"("hospitalId");

-- CreateIndex
CREATE INDEX "BloodRequestResponse_requestId_status_idx" ON "BloodRequestResponse"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BloodRequestResponse_requestId_donorProfileId_key" ON "BloodRequestResponse"("requestId", "donorProfileId");

-- CreateIndex
CREATE INDEX "InventoryReservation_requestId_status_idx" ON "InventoryReservation"("requestId", "status");

-- CreateIndex
CREATE INDEX "InventoryReservation_bloodBankId_idx" ON "InventoryReservation"("bloodBankId");

-- CreateIndex
CREATE INDEX "DonationRecord_donorProfileId_idx" ON "DonationRecord"("donorProfileId");

-- CreateIndex
CREATE INDEX "DonationRecord_requestId_idx" ON "DonationRecord"("requestId");

-- CreateIndex
CREATE INDEX "Campaign_city_date_idx" ON "Campaign"("city", "date");

-- CreateIndex
CREATE INDEX "CampaignRegistration_donorProfileId_idx" ON "CampaignRegistration"("donorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRegistration_campaignId_donorProfileId_key" ON "CampaignRegistration"("campaignId", "donorProfileId");

-- CreateIndex
CREATE INDEX "DonationAppointment_bloodBankId_date_idx" ON "DonationAppointment"("bloodBankId", "date");

-- CreateIndex
CREATE INDEX "DonationAppointment_donorProfileId_idx" ON "DonationAppointment"("donorProfileId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "FeedbackSubmission_userId_idx" ON "FeedbackSubmission"("userId");

-- CreateIndex
CREATE INDEX "FeedbackSubmission_status_idx" ON "FeedbackSubmission"("status");

-- CreateIndex
CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_timestamp_idx" ON "AuditLog"("actorId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_tokenHash_idx" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");

-- CreateIndex
CREATE INDEX "OTPChallenge_phone_expiresAt_idx" ON "OTPChallenge"("phone", "expiresAt");

-- AddForeignKey
ALTER TABLE "DonorProfile" ADD CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorAvailability" ADD CONSTRAINT "DonorAvailability_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorConsent" ADD CONSTRAINT "DonorConsent_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBank" ADD CONSTRAINT "BloodBank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_bloodBankId_fkey" FOREIGN KEY ("bloodBankId") REFERENCES "BloodBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_bloodBankId_fkey" FOREIGN KEY ("bloodBankId") REFERENCES "BloodBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_bloodBankId_fkey" FOREIGN KEY ("bloodBankId") REFERENCES "BloodBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequestResponse" ADD CONSTRAINT "BloodRequestResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequestResponse" ADD CONSTRAINT "BloodRequestResponse_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_bloodBankId_fkey" FOREIGN KEY ("bloodBankId") REFERENCES "BloodBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationRecord" ADD CONSTRAINT "DonationRecord_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationRecord" ADD CONSTRAINT "DonationRecord_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_bloodBankId_fkey" FOREIGN KEY ("bloodBankId") REFERENCES "BloodBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRegistration" ADD CONSTRAINT "CampaignRegistration_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRegistration" ADD CONSTRAINT "CampaignRegistration_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationAppointment" ADD CONSTRAINT "DonationAppointment_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationAppointment" ADD CONSTRAINT "DonationAppointment_bloodBankId_fkey" FOREIGN KEY ("bloodBankId") REFERENCES "BloodBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSubmission" ADD CONSTRAINT "FeedbackSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterHospitalId_fkey" FOREIGN KEY ("reporterHospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
