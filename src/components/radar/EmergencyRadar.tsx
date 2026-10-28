/* @module: EmergencyRadar — Orchestrator component for real-time 360-degree radar dispatch */
import React, { useState } from 'react';
import { BloodRequest } from '../../types';
import { useLifeDrop } from '../../context/LifeDropContext';
import { isBloodCompatible } from '../../utils/compatibility';
import { RadarHeader } from './RadarHeader';
import { RadarScope } from './RadarScope';
import { RadarNodeDrawer } from './RadarNodeDrawer';
import { RadarLegend } from './RadarLegend';

interface EmergencyRadarProps {
  request: BloodRequest;
  onAcceptByDonor?: (requestId: string) => void;
  onOfferByBloodBank?: (requestId: string) => void;
}

export const EmergencyRadar: React.FC<EmergencyRadarProps> = ({
  request,
  onAcceptByDonor,
  onOfferByBloodBank,
}) => {
  const { users, bloodBanks, currentUser, currentRole } = useLifeDrop();
  const [selectedNode, setSelectedNode] = useState<{
    type: 'donor' | 'bloodBank';
    id: string;
    name: string;
    bloodGroup: string;
    status: string;
    distance: string;
  } | null>(null);

  const isFulfilled = request.status === 'FULFILLED' || request.remainingUnits === 0;

  // Filter nearby compatible donors
  const nearbyDonors = users
    .filter((u) => isBloodCompatible(request.bloodGroup, u.bloodGroup))
    .slice(0, 5);

  // Filter nearby verified blood banks
  const nearbyBBs = bloodBanks.filter((b) => b.isVerified).slice(0, 3);

  return (
    <div className="relative w-full flex flex-col items-center justify-center space-y-3 py-2">
      {/* 1. Sleek Compact Header Bar (Above Bar) */}
      <RadarHeader request={request} isFulfilled={isFulfilled} />

      {/* 2. Realistic 360-Degree Circular Radar Scope */}
      <RadarScope
        request={request}
        isFulfilled={isFulfilled}
        donors={nearbyDonors}
        bloodBanks={nearbyBBs}
        currentUserId={currentUser.id}
        onSelectNode={setSelectedNode}
      />

      {/* 3. Selected Node Popover Drawer */}
      {selectedNode && (
        <RadarNodeDrawer
          selectedNode={selectedNode}
          currentUserId={currentUser.id}
          currentRole={currentRole}
          isFulfilled={isFulfilled}
          requestId={request.id}
          onAcceptByDonor={onAcceptByDonor}
          onOfferByBloodBank={onOfferByBloodBank}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* 4. Compact Floating Legend Pill */}
      <RadarLegend />
    </div>
  );
};

export default EmergencyRadar;
