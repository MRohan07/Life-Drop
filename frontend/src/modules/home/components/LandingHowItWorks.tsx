/* @module: LandingHowItWorks — 6-step lifecycle coordination timeline */
import React from 'react';
import { Radio, Warehouse, Users, Building2, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export const LandingHowItWorks: React.FC = () => {
  const steps = [
    { step: '01', title: 'Raise Request', desc: 'Hospital or patient issues an emergency request specifying patient details, blood group, and units.', icon: Radio, color: 'text-rose-600 bg-rose-50' },
    { step: '02', title: 'Search Blood Banks', desc: 'Instantly scans inventories of verified blood banks in proximity and locks temporary reserves.', icon: Warehouse, color: 'text-amber-600 bg-amber-50' },
    { step: '03', title: 'Find Compatible Donors', desc: 'Nearby eligible donors matching red-cell compatibility receive high-priority In-App dispatches.', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { step: '04', title: 'Coordinate with Hospital', desc: 'Donors and blood banks accept commitments. Hospital monitors incoming supplies and ETA en route.', icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { step: '05', title: 'Confirm Donation', desc: 'On arrival, hospital verifies donor by ID, receives blood units, and confirms donation on-site.', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { step: '06', title: 'Fulfill Request', desc: 'When remaining units hit 0, search stops, donor 90-day cycles update, and records are permanently audited.', icon: ShieldCheck, color: 'text-slate-900 bg-slate-100' },
  ];

  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-3 sm:px-4 space-y-6 sm:space-y-10">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-extrabold uppercase border border-blue-200">
          <Activity className="w-3.5 h-3.5" />
          <span>Coordinated Lifecycle</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-lifedrop-navy tracking-tight">How LifeDrop Works</h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto px-2">
          A continuous coordination loop ensuring zero over-allocation and rapid emergency fulfillment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} isInteractive className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="font-mono text-lg sm:text-xl font-black text-slate-300">{item.step}</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-lifedrop-navy">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default LandingHowItWorks;
