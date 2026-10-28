/* @module: AdminPasskeyModal — Security gate protecting Super Admin view and private records */
import React, { useState } from 'react';
import { ShieldCheck, Lock, X, AlertCircle } from 'lucide-react';

interface AdminPasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasskeyModal: React.FC<AdminPasskeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passkey, setPasskey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim() === 'admin123') {
      setErrorMsg(null);
      setPasskey('');
      onSuccess();
    } else {
      setErrorMsg('Incorrect administrative passkey. Please enter "admin123" to verify.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Security Verification
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Admin Access Passkey
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Access to the Super Admin console reveals sensitive donor contact records, hospital accreditation dossiers, and incident reports.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Enter Passkey:
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Enter master admin passkey"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Authorization code: <strong className="font-mono text-slate-600">admin123</strong>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verify &amp; Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
