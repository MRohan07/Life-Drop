import React, { useState, useEffect } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications } = useLifeDrop();
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // Only pop emergency / recent
      if (latest.type === 'emergency' || !latest.read) {
        setActiveToast({
          id: latest.id,
          title: latest.title,
          message: latest.message,
          type: latest.type,
        });

        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 6000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 max-w-sm w-full animate-slideUp">
      <div
        className={`p-4 rounded-3xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
          activeToast.type === 'emergency'
            ? 'bg-red-900/95 text-white border-red-500/50 shadow-red-900/30'
            : activeToast.type === 'success'
            ? 'bg-emerald-900/95 text-white border-emerald-500/50 shadow-emerald-900/30'
            : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/30'
        }`}
      >
        <div className="p-2 rounded-2xl bg-white/10 flex-shrink-0 mt-0.5">
          {activeToast.type === 'emergency' && (
            <AlertTriangle className="w-5 h-5 text-rose-300 animate-bounce" />
          )}
          {activeToast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          )}
          {activeToast.type !== 'emergency' && activeToast.type !== 'success' && (
            <Info className="w-5 h-5 text-blue-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">
            {activeToast.title}
          </h4>
          <p className="text-xs text-white/80 mt-0.5 leading-snug line-clamp-2">
            {activeToast.message}
          </p>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="p-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
