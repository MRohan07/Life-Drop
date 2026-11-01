/* @module: HomePage — Landing presentation with 3D drop, radar, timeline, and cinematic footer */
import React from 'react';
import { EmergencyRadar } from '../../components/radar/EmergencyRadar';
import { LandingHero } from './components/LandingHero';
import { LandingStats } from './components/LandingStats';
import { LandingHowItWorks } from './components/LandingHowItWorks';
import { LandingFeatures } from './components/LandingFeatures';
import { CinematicFooter } from '../../components/ui/motion-footer';
import { useLifeDrop } from '../../context/LifeDropContext';

interface HomePageProps {
  onEnterPlatform?: (role?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onEnterPlatform = () => {} }) => {
  const { users, hospitals, bloodBanks, requests } = useLifeDrop();
  const sampleRequest = requests[0];
  const totalDonations = users.reduce((sum, u) => sum + u.totalDonations, 0);

  return (
    <div className="relative w-full bg-slate-950 font-sans selection:bg-rose-500/30 overflow-x-hidden">
      {/* 1. MAIN LANDING CONTENT AREA (Clean presentation) */}
      <main className="relative z-10 w-full min-h-[120vh] bg-lifedrop-bg bg-dot-matrix flex flex-col items-center border-b border-slate-300/80 shadow-2xl rounded-b-[32px] sm:rounded-b-[56px] pb-16 sm:pb-24">
        <div className="relative z-10 max-w-6xl w-full mx-auto px-3 sm:px-4 lg:px-6 space-y-10 sm:space-y-16 pt-4 sm:pt-6">
          <LandingHero />

          <LandingStats
            donorCount={users.length}
            hospitalCount={hospitals.length}
            bloodBankCount={bloodBanks.length}
            livesSaved={totalDonations}
          />

          {sampleRequest && (
            <section id="radar-section" className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-1.5 sm:space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-lifedrop-navy tracking-tight">Real-Time Emergency Radar</h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto px-2">Live scanning connects hospitals directly with compatible donors within seconds.</p>
              </div>
              <EmergencyRadar request={sampleRequest} />
            </section>
          )}

          <LandingHowItWorks />
          <LandingFeatures />
        </div>
      </main>

      {/* 2. CINEMATIC FOOTER (Features the interactive Constellation Grid & GSAP parallax) */}
      <CinematicFooter />
    </div>
  );
};

export default HomePage;
