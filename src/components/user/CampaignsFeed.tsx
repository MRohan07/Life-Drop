import React from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Users,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { sanitizeUrl } from '../../utils/security';

export const CampaignsFeed: React.FC = () => {
  const { campaigns, currentUser } = useLifeDrop();

  // ONLY show campaigns within 10 km
  const nearbyCampaigns = campaigns.filter((c) => (c.distanceKm || 0) <= 10);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider mb-2 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          Community Blood Drives
        </div>
        <h2 className="text-2xl font-extrabold text-lifedrop-navy flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-lifedrop-primary" />
          Nearby Donation Campaigns
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Active blood drives organized by certified blood banks within 10 km of {currentUser.city}. Registration links open the official Google Form for slot confirmation.
        </p>
      </div>

      {nearbyCampaigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No campaigns within 10 km</h3>
          <p className="text-xs text-slate-400 mt-1">
            New blood camps will automatically appear here when organized by nearby blood banks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nearbyCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 card-3d-interactive overflow-hidden flex flex-col justify-between"
            >
              {/* Image & Distance */}
              <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={camp.image}
                  alt={camp.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-lifedrop-navy/90 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {camp.distanceKm} km away
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                    {camp.bloodBankName}
                  </span>
                  <h3 className="text-lg font-extrabold text-white leading-snug drop-shadow-md">
                    {camp.name}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {camp.description}
                </p>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Calendar className="w-4 h-4 text-lifedrop-primary flex-shrink-0" />
                    <span>Date: {formatDate(camp.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Hours: {camp.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>Venue: {camp.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={sanitizeUrl(camp.googleFormUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-lifedrop-primary hover:bg-lifedrop-emergency text-white font-extrabold text-xs shadow-md transition-all inline-flex items-center justify-center gap-2"
                  >
                    Register via Official Google Form
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
