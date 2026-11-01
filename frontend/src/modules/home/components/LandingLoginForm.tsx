/* @module: LandingLoginForm — Role-adaptive Login form with OTP and password */
import React from 'react';
import { UserRole } from '../../../types';

interface LandingLoginFormProps {
  activeRole: UserRole;
  contact: string;
  setContact: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  otpGenerated: boolean;
  isGeneratingOtp: boolean;
  otpCode: string;
  setOtpCode: (val: string) => void;
  onGenerateOtp: () => void;
  onLoginSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onSwitchToRegister: () => void;
  onOpenStatusModal?: () => void;
}

export const LandingLoginForm: React.FC<LandingLoginFormProps> = ({
  activeRole, contact, setContact, password = '', setPassword, otpGenerated, isGeneratingOtp,
  otpCode, setOtpCode, onGenerateOtp, onLoginSubmit, onGoogleSignIn, onSwitchToRegister,
  onOpenStatusModal,
}) => {
  return (
    <form onSubmit={onLoginSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {activeRole === 'ADMIN' ? 'Admin Email / Username' : 'Email or Mobile Number'}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text" required value={contact} onChange={(e) => setContact(e.target.value)}
            placeholder={activeRole === 'ADMIN' ? 'adminrohan@gmail.com' : 'you@example.com or +1 (555) 019-2834'}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
          />
          <button type="button" onClick={onGenerateOtp} disabled={isGeneratingOtp} className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold whitespace-nowrap active:scale-95 transition-all text-center cursor-pointer">
            {isGeneratingOtp ? 'Sending...' : otpGenerated ? 'Resend' : 'Generate OTP'}
          </button>
        </div>
      </div>

      {setPassword && (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Password (or verify with OTP below)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={activeRole === 'ADMIN' ? 'Admin@123' : 'LifeDrop@2026!'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700">Enter OTP</label>
          {otpGenerated && <span className="text-[11px] text-emerald-600 font-semibold">OTP sent! Use <strong>123456</strong></span>}
        </div>
        <input
          type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
          placeholder="Enter 6-digit OTP (123456)"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono tracking-widest font-bold focus:ring-2 focus:ring-slate-900 outline-none"
        />
        <p className="text-[11px] text-slate-400 mt-1">Default development OTP is 123456.</p>
      </div>

      <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer">
        {activeRole === 'USER' ? 'Sign in' : `Sign in as ${activeRole === 'HOSPITAL' ? 'Hospital' : activeRole === 'BLOOD_BANK' ? 'Blood Bank' : 'Admin'}`}
      </button>

      {activeRole === 'USER' && (
        <button type="button" onClick={onGoogleSignIn} className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer">
          Continue with Google
        </button>
      )}

      {/* Hide registration option for ADMIN role */}
      {activeRole !== 'ADMIN' ? (
        <div className="text-center pt-2">
          {activeRole === 'USER' ? (
            <p className="text-xs text-slate-500 font-medium">
              Don't have an account?{' '}
              <button type="button" onClick={onSwitchToRegister} className="font-bold text-slate-900 hover:underline cursor-pointer">
                Create new account
              </button>
            </p>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-2 text-center">
              <p className="text-xs text-slate-700 font-bold">
                {activeRole === 'HOSPITAL' ? 'Hospital Statutory Accreditation' : 'Blood Bank Statutory Certification'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                >
                  Submit Application
                </button>
                {onOpenStatusModal && (
                  <button
                    type="button"
                    onClick={onOpenStatusModal}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 shadow-xs transition-all cursor-pointer"
                  >
                    Track Application
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                Institutional facilities require administrator review and approval before gaining operational access.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Protected Admin System • Passwords securely hashed with Argon2id
          </p>
        </div>
      )}
    </form>
  );
};
