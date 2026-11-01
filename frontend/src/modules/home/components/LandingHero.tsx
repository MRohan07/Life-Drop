import React from 'react';
import { BloodDrop3D } from '../../../components/common/BloodDrop3D';

export const LandingHero: React.FC = () => {
  return (
    <section id="main-section" className="relative pt-6 sm:pt-12 pb-6 sm:pb-10 flex flex-col items-center justify-center text-center px-3 sm:px-4 scroll-mt-20">
      <div className="relative z-10 max-w-6xl mx-auto space-y-5 sm:space-y-7 flex flex-col items-center w-full">
        {/* Next-Gen Platform Badge */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-lifedrop-primary text-[11px] sm:text-xs font-black uppercase shadow-xs">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-lifedrop-emergency animate-ping shrink-0" />
          <span>Next-Gen Blood Coordination Platform</span>
        </div>

        {/* 3D Blood Drop with Bubbles & Medical Plus Symbol */}
        <div className="my-1 sm:my-2 scale-90 sm:scale-100">
          <BloodDrop3D size="xl" showPulse={true} interactive={true} />
        </div>

        {/* Single-Line Grand Headline on Desktop, fluidly wraps on mobile */}
        <div className="space-y-3 sm:space-y-4 max-w-5xl w-full flex flex-col items-center">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[4.75rem] font-black tracking-tight text-slate-900 leading-[1.15] sm:leading-none md:whitespace-nowrap px-1">
            Every Drop <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-red-600 to-rose-700">Saves a Life</span>
          </h2>
          <p className="text-sm sm:text-lg md:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl mx-auto px-2">
            Connecting patients, donors, hospitals, and blood banks when every second matters. Real-time emergency radar, smart allocation, and verified donation tracking.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/auth"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/auth');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black tracking-wide shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Access Coordination Portal</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
