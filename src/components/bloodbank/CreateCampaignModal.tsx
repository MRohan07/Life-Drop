import React, { useState } from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import { Calendar, Image, MapPin, Clock, FileText, X } from 'lucide-react';
import { isValidWebUrl, sanitizeUrl } from '../../utils/security';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose }) => {
  const { currentBloodBank, createCampaign } = useLifeDrop();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00 AM - 04:00 PM');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80'
  );
  const [googleFormUrl, setGoogleFormUrl] = useState(
    'https://forms.google.com/lifedrop-camp-registration'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !location || !googleFormUrl) {
      alert('Please fill out all required fields.');
      return;
    }

    if (!isValidWebUrl(googleFormUrl)) {
      alert('Please provide a valid web link starting with http:// or https://');
      return;
    }

    createCampaign({
      name,
      bloodBankId: currentBloodBank.id,
      bloodBankName: currentBloodBank.name,
      description,
      date,
      time,
      location,
      city: currentBloodBank.city,
      latitude: currentBloodBank.latitude,
      longitude: currentBloodBank.longitude,
      image,
      googleFormUrl,
      distanceKm: 2.5,
    });

    alert('Campaign successfully created! It is now visible to eligible donors within 10 km.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lifedrop-navy/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white p-6 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 block">
                {currentBloodBank.name}
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Create Community Blood Drive
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Campaign Title:</label>
            <input
              type="text"
              required
              placeholder="e.g. Metropolis Youth Life Saver Blood Drive 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Campaign Date:</label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Operating Hours:</label>
              <input
                type="text"
                required
                placeholder="e.g. 09:00 AM - 04:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Camp Location / Venue:</label>
            <input
              type="text"
              required
              placeholder="e.g. City Civic Center, Auditorium Hall 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              External Google Form Link (For Donor Registration):
            </label>
            <input
              type="url"
              required
              placeholder="https://forms.google.com/..."
              value={googleFormUrl}
              onChange={(e) => setGoogleFormUrl(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-blue-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Banner Image URL:</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description & Details:</label>
            <textarea
              rows={3}
              placeholder="Describe donor amenities, health checks provided, and refreshments..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 text-[11px] leading-relaxed border border-amber-200">
            📍 Campaigns are automatically broadcast to donors and hospital dashboards located strictly within a 10 km radius of the campaign location.
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md"
            >
              Publish Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
