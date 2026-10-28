import { z } from 'zod';

export const submitFacilityApplicationSchema = z.preprocess(
  (val: any) => {
    if (typeof val !== 'object' || val === null) return val;
    const rep = val.authorizedRepresentative || {};
    return {
      ...val,
      name: val.name || val.facilityName,
      phone: val.phone || val.contactNumber,
      email: val.email || val.officialEmail,
      pinCode: val.pinCode || val.postalCode,
      authorizedPersonName: val.authorizedPersonName || rep.name,
      authorizedPersonDesignation: val.authorizedPersonDesignation || rep.designation,
      authorizedPersonPhone: val.authorizedPersonPhone || rep.phone,
      authorizedPersonEmail: val.authorizedPersonEmail || rep.email,
    };
  },
  z.object({
    facilityType: z.enum(['HOSPITAL', 'BLOOD_BANK']),
    name: z.string().min(2, 'Facility name must be at least 2 characters').max(150),
    category: z.string().optional().default('Private'),
    phone: z.string().min(8, 'Phone number must be at least 8 characters').max(20),
    email: z.string().email('Valid official institutional email is required'),
    address: z.string().min(3, 'Address is required'),
    area: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().optional().default('Andhra Pradesh'),
    pinCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    licenseNumber: z.string().min(3, 'License number is required'),
    registrationNumber: z.string().optional(),
    issuingAuthority: z.string().optional(),
    licenseDocUrl: z.string().optional(),
    registrationCertUrl: z.string().optional(),
    authorizedPersonName: z.string().min(2, 'Authorized representative name is required'),
    authorizedPersonDesignation: z.string().min(2, 'Representative designation is required'),
    authorizedPersonPhone: z.string().min(8, 'Representative phone is required'),
    authorizedPersonEmail: z.string().email('Valid representative email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
    emergencyContact: z.string().optional(),
    services: z.array(z.string()).optional().default([]),
    componentsAvailable: z.array(z.string()).optional().default([]),
    documents: z
      .array(
        z.object({
          documentType: z.string(),
          fileName: z.string(),
          fileUrl: z.string(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
        })
      )
      .optional()
      .default([]),
  })
);

export const requestInfoSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters'),
});

export const applicantResponseSchema = z.object({
  responseNotes: z.string().min(5, 'Response notes must be at least 5 characters'),
  additionalDocs: z
    .array(
      z.object({
        documentType: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .optional(),
});

export const rejectApplicationSchema = z
  .object({
    reason: z.string().optional(),
    rejectionReason: z.string().optional(),
  })
  .transform((val) => ({
    reason: val.reason || val.rejectionReason || '',
  }))
  .refine((val) => val.reason.trim().length >= 5, {
    message: 'Rejection reason must be at least 5 characters',
    path: ['reason'],
  });

export const approveApplicationSchema = z.object({
  notes: z.string().optional(),
});

export const suspendFacilitySchema = z.object({
  reason: z.string().min(5, 'Suspension reason must be at least 5 characters'),
});

export const activateFacilitySchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const checkStatusAuthSchema = z.object({
  identifier: z.string().min(2, 'Email, phone, or application reference is required'),
  password: z.string().min(1, 'Password is required to verify status'),
});
