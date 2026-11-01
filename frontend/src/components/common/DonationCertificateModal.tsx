/* @module: DonationCertificateModal — Official voluntary blood donation certificate */
import React from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Printer,
  X,
  Heart,
  Droplet,
  ShieldCheck,
  Calendar,
  Building2,
  QrCode,
} from 'lucide-react';

export interface DonationCertificateData {
  certificateId: string;
  donorName: string;
  bloodGroup: string;
  units: number;
  date: string;
  facilityName: string;
  facilityType?: string;
  donationType?: string;
}

interface DonationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: DonationCertificateData | null;
}

export const DonationCertificateModal: React.FC<DonationCertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-extrabold tracking-wide">
              Official Blood Donation Certificate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              title="Print Certificate"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30">
          <div className="border-4 border-double border-amber-600/30 rounded-2xl p-6 sm:p-8 bg-white relative shadow-sm">
            {/* Watermark Logo Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Droplet className="w-96 h-96 text-rose-600" />
            </div>

            {/* Certificate Header */}
            <div className="text-center space-y-2 pb-6 border-b border-amber-100">
              <div className="flex items-center justify-center gap-2 text-rose-600 font-black text-xs uppercase tracking-widest">
                <Heart className="w-4 h-4 fill-rose-600" />
                <span>Government of Andhra Pradesh • National Blood Transfusion Council</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-slate-900">
                Certificate of Appreciation
              </h1>
              <p className="text-xs text-slate-500 font-medium italic">
                Awarded for Voluntary, Non-Remunerated Blood Donation
              </p>
            </div>

            {/* Certificate Body */}
            <div className="py-8 text-center space-y-6">
              <p className="text-xs sm:text-sm text-slate-600 font-serif">
                This is proudly presented in deep gratitude to
              </p>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-serif font-black text-lifedrop-navy underline decoration-amber-400 decoration-2 underline-offset-8">
                  {certificate.donorName}
                </div>
                <div className="pt-2 text-xs font-bold text-slate-500">
                  Donor Blood Group:{' '}
                  <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {certificate.bloodGroup}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-lg mx-auto font-serif">
                for selflessly donating{' '}
                <span className="font-bold text-slate-900">
                  {certificate.units} unit ({certificate.units * 450} ml)
                </span>{' '}
                of whole blood. Your noble act has directly empowered clinical emergency care and contributed to saving up to{' '}
                <span className="font-bold text-rose-600">
                  {certificate.units * 3} human lives
                </span>.
              </p>

              {/* Event & Facility Details */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 text-left">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    Transfusion Facility
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1 line-clamp-2">
                    {certificate.facilityName}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Date of Donation
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1">
                    {certificate.date}
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Footer / Signatures */}
            <div className="pt-6 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-1">
                  <QrCode className="w-11 h-11 text-slate-800" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Verification ID
                  </div>
                  <div className="font-mono font-black text-slate-800 text-[11px]">
                    {certificate.certificateId}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3" /> Digitally Verified
                  </div>
                </div>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <div className="font-serif italic text-slate-800 font-bold text-sm">
                  Dr. S. K. Murthy, MD (Transfusion)
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  State Blood Transfusion Officer
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            LifeDrop Electronic Transfusion Registry • Valid across India
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
};
