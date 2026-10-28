import React from 'react';
import { RequestStatus, EmergencyLevel, DonorResponseStatus } from '../../types';

interface StatusBadgeProps {
  type: 'emergency' | 'request' | 'donorResponse' | 'eligibility' | 'verification';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-3 py-1 text-xs font-bold tracking-wide';

  if (type === 'emergency') {
    const level = value as EmergencyLevel;
    if (level === 'CRITICAL') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-lifedrop-emergency/15 text-lifedrop-emergency border border-lifedrop-emergency/30 ${sizeClasses} shadow-sm animate-pulse`}
        >
          <span className="w-2 h-2 rounded-full bg-lifedrop-emergency animate-ping" />
          CRITICAL EMERGENCY
        </span>
      );
    }
    if (level === 'URGENT') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-lifedrop-warning/15 text-lifedrop-warning border border-lifedrop-warning/30 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-lifedrop-warning" />
          URGENT
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
      >
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        STANDARD
      </span>
    );
  }

  if (type === 'request') {
    const status = value as RequestStatus;
    switch (status) {
      case 'SEARCHING':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-lifedrop-emergency/10 text-lifedrop-emergency border border-lifedrop-emergency/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-lifedrop-emergency animate-ping" />
            SEARCHING
          </span>
        );
      case 'PARTIALLY_FULFILLED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            PARTIALLY FULFILLED
          </span>
        );
      case 'RESERVED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
            RESERVED
          </span>
        );
      case 'FULFILLED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold shadow-sm ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            REQUEST FULFILLED
          </span>
        );
      case 'CLOSED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 ${sizeClasses}`}>
            CLOSED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 border border-red-200 ${sizeClasses}`}>
            CANCELLED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  if (type === 'donorResponse') {
    const status = value as DonorResponseStatus;
    switch (status) {
      case 'ACCEPTED':
      case 'AWAITING_DONATION':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 ${sizeClasses}`}>
            COMMITTED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
            DONATION CONFIRMED
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 ${sizeClasses}`}>
            NO SHOW
          </span>
        );
      case 'CANCELLED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            CANCELLED BY DONOR
          </span>
        );
      case 'DECLINED':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses}`}>
            DECLINED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
            {value}
          </span>
        );
    }
  }

  if (type === 'eligibility') {
    const isEligible = value === 'true' || value === 'eligible';
    if (isEligible) {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 ${sizeClasses}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          Eligible to Donate
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300 ${sizeClasses}`}>
        <span className="w-2 h-2 rounded-full bg-rose-600" />
        Currently Not Eligible
      </span>
    );
  }

  if (type === 'verification') {
    const isVerified = value === 'VERIFIED' || value === 'true';
    if (isVerified) {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          ✓ Verified
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses}`}>
        ⏳ Pending Admin Verification
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
      {value}
    </span>
  );
};
