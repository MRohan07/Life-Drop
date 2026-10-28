-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('HOSPITAL', 'BLOOD_BANK');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'PENDING_ACTIVATION';

-- AlterTable
ALTER TABLE "BloodBank" ADD COLUMN "facilityApplicationId" TEXT;

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN "facilityApplicationId" TEXT;

-- CreateTable
CREATE TABLE "FacilityApplication" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "facilityType" "FacilityType" NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT DEFAULT 'Private',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    "pinCode" TEXT,
    "latitude" DOUBLE PRECISION DEFAULT 16.3067,
    "longitude" DOUBLE PRECISION DEFAULT 80.4365,
    "licenseNumber" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "issuingAuthority" TEXT,
    "licenseDocUrl" TEXT,
    "registrationCertUrl" TEXT,
    "authorizedPersonName" TEXT NOT NULL,
    "authorizedPersonDesignation" TEXT NOT NULL,
    "authorizedPersonPhone" TEXT NOT NULL,
    "authorizedPersonEmail" TEXT NOT NULL,
    "emergencyContact" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "componentsAvailable" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "passwordHash" TEXT,
    "rejectionReason" TEXT,
    "requestedInfoQuery" TEXT,
    "applicantResponseNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByAdminId" TEXT,
    "activationToken" TEXT,
    "activationTokenExpiresAt" TIMESTAMP(3),
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "createdUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityApplicationReview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus" NOT NULL,
    "toStatus" "ApplicationStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityApplicationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacilityApplication_referenceNumber_key" ON "FacilityApplication"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityApplication_activationToken_key" ON "FacilityApplication"("activationToken");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityApplication_createdUserId_key" ON "FacilityApplication"("createdUserId");

-- CreateIndex
CREATE INDEX "FacilityApplication_status_facilityType_idx" ON "FacilityApplication"("status", "facilityType");

-- CreateIndex
CREATE INDEX "FacilityApplication_email_idx" ON "FacilityApplication"("email");

-- CreateIndex
CREATE INDEX "FacilityApplication_licenseNumber_idx" ON "FacilityApplication"("licenseNumber");

-- CreateIndex
CREATE INDEX "FacilityApplication_referenceNumber_idx" ON "FacilityApplication"("referenceNumber");

-- CreateIndex
CREATE INDEX "FacilityApplicationReview_applicationId_idx" ON "FacilityApplicationReview"("applicationId");

-- CreateIndex
CREATE INDEX "FacilityApplicationReview_adminId_idx" ON "FacilityApplicationReview"("adminId");

-- CreateIndex
CREATE INDEX "FacilityApplicationDocument_applicationId_idx" ON "FacilityApplicationDocument"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "BloodBank_facilityApplicationId_key" ON "BloodBank"("facilityApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_facilityApplicationId_key" ON "Hospital"("facilityApplicationId");

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_facilityApplicationId_fkey" FOREIGN KEY ("facilityApplicationId") REFERENCES "FacilityApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBank" ADD CONSTRAINT "BloodBank_facilityApplicationId_fkey" FOREIGN KEY ("facilityApplicationId") REFERENCES "FacilityApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityApplication" ADD CONSTRAINT "FacilityApplication_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityApplication" ADD CONSTRAINT "FacilityApplication_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityApplicationReview" ADD CONSTRAINT "FacilityApplicationReview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FacilityApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityApplicationReview" ADD CONSTRAINT "FacilityApplicationReview_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityApplicationDocument" ADD CONSTRAINT "FacilityApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FacilityApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
