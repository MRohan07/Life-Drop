import React, { useState } from 'react';
import { api } from '../../lib/api/client';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  KeyRound,
  Building2,
  Warehouse,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { UserRole } from '../../types';

interface FacilityActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  onActivated?: (role: UserRole) => void;
  onActivationSuccess?: (role?: UserRole) => void;
}

export const FacilityActivationModal: React.FC<FacilityActivationModalProps> = ({
  isOpen,
  onClose,
  initialToken = '',
  onActivated,
  onActivationSuccess,
}) => {
  const { checkAuthSession } = useLifeDrop();
  const handleSuccess = (role: UserRole) => {
    if (onActivated) onActivated(role);
    if (onActivationSuccess) onActivationSuccess(role);
  };
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [facilityInfo, setFacilityInfo] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const res: any = await api.facilityApplications.verifyToken(token.trim());
      if (res?.data?.facility) {
        setFacilityInfo(res.data.facility);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired activation invitation token.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res: any = await api.facilityApplications.completeActivation(token.trim(), password);
      if (res?.data?.accessToken) {
        api.setTokens(res.data.accessToken, res.data.refreshToken);
        if (res.data.user) {
          localStorage.setItem('lifedrop_auth_user', JSON.stringify(res.data.user));
        }
        await checkAuthSession();
        setSuccess(true);
        setTimeout(() => {
          onClose();
          handleSuccess(res.data.user.role as UserRole);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete account activation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-lifedrop-navy text-white p-6 relative flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Facility Account Activation</h2>
                <p className="text-xs text-slate-300">Set your secure credentials to enter the operational portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-8 space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Account Activated Successfully!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your credentials have been securely stored in PostgreSQL. Entering your authorized facility dashboard...
              </p>
            </div>
          ) : !facilityInfo ? (
            /* Step 1: Enter Token */
            <form onSubmit={handleVerifyToken} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium">
                Enter the 64-character activation invitation token provided by the administrator upon approval of your facility application.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Activation Invitation Token *
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste activation token here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-lifedrop-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 bg-lifedrop-primary hover:bg-lifedrop-emergency text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? 'Verifying Token...' : 'Validate Activation Token'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Step 2: Configure Password */
            <form onSubmit={handleCompleteActivation} className="space-y-4 animate-fadeIn">
              {/* Facility Identity Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  {facilityInfo.facilityType === 'HOSPITAL' ? (
                    <Building2 className="w-5 h-5 text-rose-600" />
                  ) : (
                    <Warehouse className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-extrabold text-slate-900 truncate">{facilityInfo.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {facilityInfo.email} • {facilityInfo.licenseNumber}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Set Institutional Administrator Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters (letters, numbers)"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-lifedrop-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Activating Facility Account...' : 'Complete Activation & Enter Portal'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
