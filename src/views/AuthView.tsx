import React, { useState } from 'react';
import { useLifeDrop } from '../context/LifeDropContext';
import { UserRole, BloodGroup } from '../types';
import { BloodDrop3D } from '../components/common/BloodDrop3D';
import {
  ShieldCheck,
  Heart,
  Building2,
  Warehouse,
  KeyRound,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  X,
  UserPlus,
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: (role: UserRole) => void;
  onCancel?: () => void;
  initialRole?: UserRole;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onCancel, initialRole = 'USER' }) => {
  const {
    login,
    registerUser,
  } = useLifeDrop();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>(initialRole);

  // Form State
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [city, setCity] = useState('Guntur');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsSubmitting(true);
    setAuthError(null);
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpSent(true);
      setOtpCode('123456');
    }, 400);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await login(phone, 'LifeDrop@2026!', activeRoleTab);
      if (res.success) {
        onSuccess(res.role || activeRoleTab);
      } else {
        setAuthError(res.message || 'Verification failed');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await registerUser({
        name: name.trim(),
        phone: phone.trim(),
        bloodGroup,
        city: city.trim(),
      });
      if (res.success) {
        onSuccess('USER');
      } else {
        setAuthError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-lifedrop-navy via-slate-900 to-rose-950 text-white p-6 relative overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lifedrop-primary/30 border border-white/20 flex items-center justify-center">
                <BloodDrop3D size="sm" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">LifeDrop Access</h2>
                <p className="text-xs text-slate-300">Secure Emergency Coordination Portal</p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Role Picker Tabs */}
          <div className="grid grid-cols-4 gap-1.5 mt-5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
            {(
              [
                { id: 'USER', label: 'Donor', icon: Heart },
                { id: 'HOSPITAL', label: 'Hospital', icon: Building2 },
                { id: 'BLOOD_BANK', label: 'Blood Bank', icon: Warehouse },
                { id: 'ADMIN', label: 'Admin', icon: ShieldCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeRoleTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveRoleTab(tab.id);
                    setOtpSent(false);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-lifedrop-primary text-white shadow-lg shadow-lifedrop-primary/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {authError}
            </div>
          )}

          {/* Phone / OTP Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Sending SMS OTP...' : 'Send Secure OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold">
                OTP sent to {phone}. Enter <strong>123456</strong> for verification.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono tracking-widest font-extrabold focus:ring-2 focus:ring-lifedrop-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-lifedrop-primary hover:bg-lifedrop-emergency text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Enter Portal'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
