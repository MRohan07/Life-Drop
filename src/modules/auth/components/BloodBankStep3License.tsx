/* @module: BloodBankStep3License — Blood bank drug controller licensing and certificates */
import React from 'react';
import { ShieldCheck, Upload, FileText } from 'lucide-react';

interface BloodBankStep3LicenseProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const BloodBankStep3License: React.FC<BloodBankStep3LicenseProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-3.5 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          3. Blood Banking License & Verification
        </h4>
        <p className="text-[11px] text-slate-500">Official Drug Controller licensing required for emergency unit supply.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Blood Bank License No. *</label>
          <input
            type="text" required value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            placeholder="e.g. BB-LIC-2026-88"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Issuing Authority *</label>
          <input
            type="text" required value={formData.issuingAuthority}
            onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
            placeholder="e.g. State Drug Control Administration"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">License Issue Date *</label>
          <input
            type="date" required value={formData.licenseIssueDate}
            onChange={(e) => setFormData({ ...formData, licenseIssueDate: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">License Expiry Date *</label>
          <input
            type="date" required value={formData.licenseExpiryDate}
            onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
          />
        </div>
      </div>

      {/* Document Uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2">
          <FileText className="w-6 h-6 text-amber-600 mx-auto" />
          <div>
            <span className="text-xs font-bold text-slate-800 block">Blood Bank License Document *</span>
            <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 10MB)</span>
          </div>
          <button type="button" onClick={() => setFormData({ ...formData, licenseDocUrl: 'bloodbank_license_doc_v1.pdf' })} className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50">
            {formData.licenseDocUrl ? '✓ License Attached' : 'Attach Document'}
          </button>
        </div>

        <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2">
          <Upload className="w-6 h-6 text-amber-600 mx-auto" />
          <div>
            <span className="text-xs font-bold text-slate-800 block">Registration Certificate *</span>
            <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 10MB)</span>
          </div>
          <button type="button" onClick={() => setFormData({ ...formData, registrationCertUrl: 'bloodbank_cert_v1.pdf' })} className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50">
            {formData.registrationCertUrl ? '✓ Certificate Attached' : 'Attach Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};
