/* @module: BloodBankCampaignsView — Mobile blood collection drives & camp logistics console */
import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { Campaign } from '../../types';
import { CreateCampaignModal } from './CreateCampaignModal';
import { sanitizeUrl } from '../../utils/security';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Search,
  Users,
  Share2,
  ExternalLink,
  CheckCircle2,
  Building2,
  Copy,
  Layers,
  Sparkles,
  Droplet,
  Truck,
} from 'lucide-react';

interface BloodBankCampaignsViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const BloodBankCampaignsView: React.FC<BloodBankCampaignsViewProps> = ({
  onNavigateTab,
}) => {
  const { currentBloodBank, campaigns } = useLifeDrop();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MINE' | 'UPCOMING'>('ALL');
  const [copiedCampId, setCopiedCampId] = useState<string | null>(null);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    if (filterType === 'MINE' && camp.bloodBankId !== currentBloodBank.id) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = camp.name.toLowerCase().includes(q);
      const matchLoc = camp.location.toLowerCase().includes(q);
      const matchOrg = camp.bloodBankName.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchOrg) return false;
    }
    return true;
  });

  const handleCopyLink = (camp: Campaign) => {
    navigator.clipboard.writeText(camp.googleFormUrl);
    setCopiedCampId(camp.id);
    setTimeout(() => setCopiedCampId(null), 2000);
  };

  const myCampCount = campaigns.filter((c) => c.bloodBankId === currentBloodBank.id).length;

  return (
    <div className="space-y-6 pb-16">
      {/* View Header */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                Mobile Blood Collection Drives
              </span>
              <span className="text-xs font-mono text-slate-500">
                Facility ID: {currentBloodBank.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-lifedrop-navy tracking-tight">
              Donation Camps &amp; Drives
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Plan, schedule, and supervise outdoor blood donation camps, corporate drives, and college camps organized by {currentBloodBank.name}. Broadcast invites directly to local eligible donors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md flex items-center gap-2 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Schedule Donation Camp
            </button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Our Scheduled Camps</div>
              <div className="text-xl font-black text-lifedrop-navy">
                {myCampCount} Active
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Expected Intake Target</div>
              <div className="text-xl font-black text-rose-700">
                {myCampCount * 50 + 120} Units
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Regional Outreach Radius</div>
              <div className="text-xl font-black text-slate-800">
                10 km Local Circle
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Public Registration</div>
              <div className="text-xl font-black text-emerald-700">
                Live &amp; Open
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search camp title, location, organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-lifedrop-navy text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Regional Camps ({campaigns.length})
          </button>
          <button
            onClick={() => setFilterType('MINE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'MINE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Organized by Our Blood Bank ({myCampCount})
          </button>
        </div>
      </div>

      {/* Camps Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
          No blood donation camps found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((camp) => {
            const isMine = camp.bloodBankId === currentBloodBank.id;

            return (
              <div
                key={camp.id}
                className="rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Camp Image / Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={camp.image}
                      alt={camp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3">
                      {isMine ? (
                        <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[11px] shadow-sm">
                          Our Facility Camp
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white font-semibold text-[11px]">
                          Partner Camp
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-amber-200 mb-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {camp.bloodBankName}
                      </div>
                      <h3 className="text-base font-extrabold line-clamp-1 leading-snug">
                        {camp.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-3.5 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Date: {camp.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Hours: {camp.time}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {camp.location} ({camp.city})
                        </span>
                      </div>
                    </div>

                    {camp.description && (
                      <p className="text-slate-500 line-clamp-2 text-[11px] leading-relaxed pt-1 border-t border-slate-100">
                        {camp.description}
                      </p>
                    )}

                    {/* Progress / Capacity tracker */}
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-[11px] text-amber-900">
                        <span>Target Donation Slots:</span>
                        <span>45 / 60 Registered</span>
                      </div>
                      <div className="w-full bg-amber-200/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all"
                          style={{ width: '75%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => handleCopyLink(camp)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedCampId === camp.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={sanitizeUrl(camp.googleFormUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Form</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Create Campaign */}
      <CreateCampaignModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};
