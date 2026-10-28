import { z } from 'zod';
import { UserRole, BloodGroup } from '@prisma/client';

export const BloodGroupSchema = z.nativeEnum(BloodGroup);

export const RegisterUserSchema = z.object({
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  city: z.string().min(2, 'City is required'),
  location: z.string().optional(),
  dob: z.string().optional(), // YYYY-MM-DD
  bloodGroup: BloodGroupSchema.optional(), // Required for USER
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Facility specific fields
  hospitalType: z.string().optional(),
  bloodBankType: z.string().optional(),
  licenseNumber: z.string().optional(),
  address: z.string().optional(),
});

export const LoginSchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required'),
  password: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const OtpRequestSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  purpose: z.enum(['LOGIN', 'REGISTER', 'VERIFY_PHONE']).default('LOGIN'),
});

export const OtpVerifySchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required').optional(),
});

export const AdminPasskeySchema = z.object({
  passkey: z.string().min(4, 'Passkey PIN required'),
});
