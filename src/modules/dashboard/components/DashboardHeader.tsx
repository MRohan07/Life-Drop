/* @module: DashboardHeader — Header banner for user and institutional dashboards */
import React from 'react';
import { UserRole } from '../../../types';

interface DashboardHeaderProps {
  role: UserRole;
  title: string;
  subtitle: string;
  badgeText?: string;
  actionButton?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title, subtitle, badgeText = 'Active Portal', actionButton,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lifedrop-navy via-slate-900 to-rose-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            {badgeText}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{title}</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">{subtitle}</p>
        </div>
        {actionButton}
      </div>
    </div>
  );
};
