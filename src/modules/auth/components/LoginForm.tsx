/* @module: LoginForm — Phone and OTP login UI form */
import React from 'react';
import { Phone, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface LoginFormProps {
  phone: string;
  setPhone: (phone: string) => void;
  otpSent: boolean;
  otpCode: string;
  setOtpCode: (code: string) => void;
  isSubmitting: boolean;
  onSendOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  phone, setPhone, otpSent, otpCode, setOtpCode, isSubmitting, onSendOtp, onVerifyOtp,
}) => {
  if (!otpSent) {
    return (
      <form onSubmit={onSendOtp} className="space-y-4 text-left">
        <Input
          label="Registered Mobile Number"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 019-2834"
          leftIcon={<Phone className="w-4 h-4" />}
        />
        <Button type="submit" variant="secondary" isLoading={isSubmitting} rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full">
          Send Secure OTP
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onVerifyOtp} className="space-y-4 text-left">
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
        OTP sent to {phone}. Enter <strong>123456</strong> for verification.
      </div>
      <Input
        label="Enter 6-Digit OTP"
        type="text"
        required
        maxLength={6}
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        placeholder="123456"
        leftIcon={<KeyRound className="w-4 h-4" />}
      />
      <Button type="submit" variant="primary" isLoading={isSubmitting} rightIcon={<CheckCircle2 className="w-4 h-4" />} className="w-full">
        Verify & Enter Portal
      </Button>
    </form>
  );
};
