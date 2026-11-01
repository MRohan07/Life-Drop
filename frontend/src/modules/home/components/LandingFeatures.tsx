/* @module: LandingFeatures — Core platform capabilities and medical safety cards */
import React from 'react';
import { Droplet, Layers, Calendar } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export const LandingFeatures: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-4 space-y-6 sm:space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-lifedrop-navy tracking-tight px-2">
          Platform Capabilities Built for High-Stakes Healthcare
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 text-left">
        <Card isInteractive className="p-4 sm:p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-lifedrop-primary flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-lifedrop-navy">Smart Donor Matching</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Calculates red-cell compatibility, 90-day safety eligibility cycles, and road distances to reach optimal responders.
          </p>
        </Card>

        <Card isInteractive className="p-4 sm:p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-lifedrop-navy">Strict Allocation Engine</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Guarantees allocated units never exceed requirements, automatically releasing excess commitments.
          </p>
        </Card>

        <Card isInteractive className="p-4 sm:p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-lifedrop-navy">10 km Campaigns Geo-Radius</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Blood drive registration campaigns targeted specifically to community donors located within travel range.
          </p>
        </Card>
      </div>
    </section>
  );
};

export default LandingFeatures;
