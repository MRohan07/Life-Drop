/* @module: RadarNodeDrawer — Popover detail card for selected radar blip */
import React from 'react';
import { Users, Warehouse } from 'lucide-react';

interface RadarNodeDrawerProps {
  selectedNode: {
    type: 'donor' | 'bloodBank';
    id: string;
    name: string;
    bloodGroup: string;
    status: string;
    distance: string;
  };
  currentUserId: string;
  currentRole: string;
  isFulfilled: boolean;
  requestId: string;
  onAcceptByDonor?: (requestId: string) => void;
  onOfferByBloodBank?: (requestId: string) => void;
  onClose: () => void;
}

export const RadarNodeDrawer: React.FC<RadarNodeDrawerProps> = ({
  selectedNode, currentUserId, currentRole, isFulfilled, requestId,
  onAcceptByDonor, onOfferByBloodBank, onClose,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl animate-fadeIn my-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white max-w-2xl w-full">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
          {selectedNode.type === 'donor' ? (
            <Users className="w-5 h-5 text-rose-300" />
          ) : (
            <Warehouse className="w-5 h-5 text-blue-300" />
          )}
        </div>
        <div>
          <div className="font-bold text-sm text-white">
            {selectedNode.name}{' '}
            <span className="text-rose-400 font-extrabold">({selectedNode.bloodGroup})</span>
          </div>
          <div className="text-slate-300 text-[11px] mt-0.5 flex items-center gap-2">
            <span>Distance: {selectedNode.distance}</span>
            <span>•</span>
            <span className="uppercase font-bold tracking-wider text-emerald-400">
              Status: {selectedNode.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {selectedNode.type === 'donor' && selectedNode.id === currentUserId && !isFulfilled && onAcceptByDonor && (
          <button
            onClick={() => onAcceptByDonor(requestId)}
            className="px-4 py-2 rounded-xl bg-lifedrop-primary hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            I Can Donate Now
          </button>
        )}
        {selectedNode.type === 'bloodBank' && currentRole === 'BLOOD_BANK' && !isFulfilled && onOfferByBloodBank && (
          <button
            onClick={() => onOfferByBloodBank(requestId)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Supply Units from Stock
          </button>
        )}
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
