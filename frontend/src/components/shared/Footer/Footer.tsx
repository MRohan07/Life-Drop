/* @module: Footer — Clean neatly arranged footer without redundant portal pills */
import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';
import { FooterProps } from './Footer.types';

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80 py-6 px-4 sm:px-8 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Brand & Mission */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <Heart className="w-4 h-4 text-lifedrop-primary fill-current" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              Life<span className="text-lifedrop-primary">Drop</span> Blood Coordination
            </span>
            <p className="text-[11px] text-slate-400">
              Real-time emergency blood allocation & verified donation network.
            </p>
          </div>
        </div>

        {/* Security & Copyright */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-300">HIPAA & Medical Data Encrypted</span>
          </div>
          <span className="text-[11px] text-slate-500">© 2026 LifeDrop. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
