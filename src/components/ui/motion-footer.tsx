/* @module: motion-footer — Cinematic GSAP ScrollTrigger curtain reveal footer */
import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "../../lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  --pill-bg-1: rgba(255, 255, 255, 0.08);
  --pill-bg-2: rgba(255, 255, 255, 0.02);
  --pill-shadow: rgba(0, 0, 0, 0.5);
  --pill-highlight: rgba(255, 255, 255, 0.2);
  --pill-inset-shadow: rgba(0, 0, 0, 0.7);
  --pill-border: rgba(255, 255, 255, 0.12);
  --pill-bg-1-hover: rgba(230, 57, 70, 0.25);
  --pill-bg-2-hover: rgba(230, 57, 70, 0.08);
  --pill-border-hover: rgba(230, 57, 70, 0.6);
  --pill-shadow-hover: rgba(230, 57, 70, 0.4);
  --pill-highlight-hover: rgba(255, 255, 255, 0.35);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(230, 57, 70, 0.6)); }
  15%, 45% { transform: scale(1.25); filter: drop-shadow(0 0 14px rgba(230, 57, 70, 0.95)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 35s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.footer-bg-grid {
  background-size: 32px 32px;
  background-image: 
    radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(230, 57, 70, 0.22) 0%, 
    rgba(29, 53, 87, 0.28) 40%, 
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: #FFFFFF;
}

.footer-giant-bg-text {
  font-size: clamp(3rem, 14vw, 12rem);
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 25px rgba(230, 57, 70, 0.3));
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Live Emergency Radar</span> <span className="text-rose-500">✦</span>
    <span>Red-Cell Compatibility Matching</span> <span className="text-blue-400">✦</span>
    <span>Zero-Wastage Allocation</span> <span className="text-rose-500">✦</span>
    <span>Verified Hospital Network</span> <span className="text-emerald-400">✦</span>
    <span>Every Drop Saves a Life</span> <span className="text-rose-500">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax text scale and reveal
      gsap.fromTo(
        giantTextRef.current,
        { y: "12vh", scale: 0.75, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 85%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered content reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.18,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 50%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToLogin = () => {
    window.history.pushState({}, '', '/auth');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-slate-950 text-white cinematic-footer-wrapper">
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[4vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none text-center"
          >
            LIFEDROP
          </div>

          <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-white/10 bg-slate-950/70 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-black tracking-[0.3em] text-slate-300 uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-16 w-full max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-black uppercase mb-4 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Emergency Blood Coordination Network
            </div>
            <h2
              ref={headingRef}
              className="text-4xl md:text-7xl font-black footer-text-glow tracking-tighter mb-8"
            >
              Every Second Counts.<br />Save a Life Today.
            </h2>

            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton
                  as="button"
                  onClick={scrollToLogin}
                  className="footer-glass-pill px-8 py-4 rounded-full text-white font-extrabold text-sm md:text-base flex items-center gap-3 group bg-rose-600/30 border-rose-500/40 hover:bg-rose-600/50"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  Enter User Portal
                </MagneticButton>

                <MagneticButton
                  as="button"
                  onClick={scrollToLogin}
                  className="footer-glass-pill px-8 py-4 rounded-full text-slate-200 font-extrabold text-sm md:text-base flex items-center gap-3 group"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  Hospital & Blood Bank Access
                </MagneticButton>
              </div>

              <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-2">
                <MagneticButton as="button" onClick={scrollToTop} className="footer-glass-pill px-6 py-2.5 rounded-full text-slate-300 font-medium text-xs hover:text-white">
                  Back to Top
                </MagneticButton>
                <MagneticButton as="a" href="#how-it-works" className="footer-glass-pill px-6 py-2.5 rounded-full text-slate-300 font-medium text-xs hover:text-white">
                  How It Works
                </MagneticButton>
                <MagneticButton as="a" href="#radar-section" className="footer-glass-pill px-6 py-2.5 rounded-full text-slate-300 font-medium text-xs hover:text-white">
                  Emergency Radar
                </MagneticButton>
              </div>
            </div>
          </div>

          <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-slate-400 text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              © 2026 LifeDrop Healthcare. Real-time Emergency Allocation.
            </div>

            <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border-white/10">
              <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Crafted for Saving Lives with</span>
              <span className="animate-footer-heartbeat text-sm md:text-base text-rose-500">❤</span>
              <span className="text-white font-black text-xs md:text-sm tracking-normal ml-1">LifeDrop</span>
            </div>

            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-slate-300 hover:text-white group order-3"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CinematicFooter;
