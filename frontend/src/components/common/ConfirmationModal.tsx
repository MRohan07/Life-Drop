/* @module: ConfirmationModal — Accessible, jargon-free confirmation dialog for critical/irreversible actions */
import React, { useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X, AlertCircle, HelpCircle, Activity } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  impactDetails?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  impactDetails,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
          iconBg: 'bg-rose-100',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
          accentBorder: 'border-rose-200',
          impactBg: 'bg-rose-50 border-rose-200 text-rose-900',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
          iconBg: 'bg-amber-100',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
          accentBorder: 'border-amber-200',
          impactBg: 'bg-amber-50 border-amber-200 text-amber-900',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          iconBg: 'bg-emerald-100',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
          accentBorder: 'border-emerald-200',
          impactBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        };
      case 'primary':
      default:
        return {
          icon: <HelpCircle className="w-6 h-6 text-lifedrop-primary" />,
          iconBg: 'bg-rose-50',
          confirmBtn: 'bg-lifedrop-primary hover:bg-rose-700 text-white shadow-rose-200',
          accentBorder: 'border-rose-100',
          impactBg: 'bg-slate-50 border-slate-200 text-slate-800',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
              {styles.icon}
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Confirmation Required
              </span>
              <h3 id="confirm-dialog-title" className="text-lg font-extrabold text-slate-900 leading-snug">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plain Language Message */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {message}
        </p>

        {/* Optional Context Callout */}
        {impactDetails && (
          <div className={`p-3 rounded-2xl border text-xs font-medium leading-relaxed ${styles.impactBg}`}>
            {impactDetails}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              onConfirm();
              if (!isLoading) {
                onClose();
              }
            }}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all hover:scale-102 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:hover:scale-100 ${styles.confirmBtn}`}
          >
            {isLoading && <Activity className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
