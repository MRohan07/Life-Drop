/* @module: CinematicHero — Top sticky dark animated hero with GSAP and marquee */
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { MagneticButton } from '../../../components/ui/motion-footer';

interface CinematicHeroProps {
  onScrollToPortal: () => void;
  onScrollToInstitutional: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  onScrollToPortal,
  onScrollToInstitutional,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white cinematic-footer-wrapper"
    >
      <div className="footer-aurora absolute left-1/2 top-1/2 h-[55vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
      <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none text-center font-black tracking-tight text-white/5 w-full px-4"
        style={{ fontSize: 'clamp(2.5rem, 11vw, 8.5rem)', lineHeight: 0.8 }}
      >
        LIFEDROP
      </div>

      <div className="w-full overflow-hidden border-b border-white/10 bg-slate-950/70 backdrop-blur-md py-3 z-10">
        <div className="flex w-max animate-footer-scroll-marquee text-xs font-black tracking-[0.25em] text-slate-300 uppercase">
          <div className="flex items-center space-x-10 px-6">
            <span>Live Emergency Radar</span> <span className="text-rose-500">✦</span>
            <span>Red-Cell Compatibility</span> <span className="text-blue-400">✦</span>
            <span>Zero-Wastage Allocation</span> <span className="text-rose-500">✦</span>
            <span>Verified Hospital Network</span> <span className="text-emerald-400">✦</span>
            <span>Every Drop Saves a Life</span> <span className="text-rose-500">✦</span>
          </div>
          <div className="flex items-center space-x-10 px-6">
            <span>Live Emergency Radar</span> <span className="text-rose-500">✦</span>
            <span>Red-Cell Compatibility</span> <span className="text-blue-400">✦</span>
            <span>Zero-Wastage Allocation</span> <span className="text-rose-500">✦</span>
            <span>Verified Hospital Network</span> <span className="text-emerald-400">✦</span>
            <span>Every Drop Saves a Life</span> <span className="text-rose-500">✦</span>
          </div>
        </div>
      </div>

      <div ref={textRef} className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-6 text-center max-w-4xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          Emergency Blood Coordination Network
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black footer-text-glow tracking-tighter leading-tight">
          Every Second Counts.<br />Save a Life Today.
        </h1>

        <div className="flex flex-wrap justify-center gap-4 pt-1">
          <MagneticButton
            as="button"
            onClick={onScrollToPortal}
            className="footer-glass-pill px-8 py-4 rounded-full text-white font-extrabold text-sm md:text-base flex items-center gap-3 group bg-rose-600/30 border-rose-500/40 hover:bg-rose-600/50"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            Enter User Portal
          </MagneticButton>

          <MagneticButton
            as="button"
            onClick={onScrollToInstitutional}
            className="footer-glass-pill px-8 py-4 rounded-full text-slate-200 font-extrabold text-sm md:text-base flex items-center gap-3 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            Hospital & Blood Bank Access
          </MagneticButton>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button onClick={onScrollToPortal} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Explore Coordination ↓</button>
          <span className="text-slate-700">•</span>
          <a href="#how-it-works" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">How It Works</a>
          <span className="text-slate-700">•</span>
          <a href="#radar-section" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Emergency Radar</a>
        </div>
      </div>

      <div className="relative z-10 w-full pb-3 px-6 text-center text-slate-500 text-[11px] font-semibold">
        Scroll down to reveal verified coordination platform & user login ↓
      </div>
    </section>
  );
};
