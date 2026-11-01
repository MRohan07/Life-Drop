import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-4">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-lifedrop-navy hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
