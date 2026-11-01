/* @module: BloodDrop3D — Hyper-realistic 3D volumetric liquid blood drop with clipped specular bubble and unified plus badge */
import React from 'react';

interface BloodDrop3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPulse?: boolean;
  className?: string;
  interactive?: boolean;
}

export const BloodDrop3D: React.FC<BloodDrop3DProps> = ({
  size = 'md',
  showPulse = true,
  className = '',
  interactive = false,
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-36 h-36',
    xl: 'w-52 h-52 sm:w-56 sm:h-56 md:w-60 md:h-60',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${
        interactive ? 'cursor-pointer hover:scale-105 transition-all duration-500' : ''
      } ${className}`}
    >
      {/* 1. Volumetric Ambient Red Aura & Liquid Caustic Halo */}
      {showPulse && (
        <>
          <div className="absolute inset-[-20%] rounded-full bg-rose-500/25 blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute inset-[-8%] rounded-full bg-red-600/30 blur-2xl animate-pulse pointer-events-none" style={{ animationDuration: '3s' }} />
          <div className="absolute -bottom-4 w-32 h-6 bg-red-950/40 rounded-full blur-md pointer-events-none" />
        </>
      )}

      {/* 2. 3D Volumetric Blood Drop SVG */}
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full drop-shadow-2xl animate-float-drop relative z-10"
        style={{
          filter: 'drop-shadow(0 20px 30px rgba(180, 10, 25, 0.45)) drop-shadow(0 0 20px rgba(244, 63, 94, 0.3))',
        }}
      >
        <defs>
          {/* Volumetric Spherical 3D Light Model */}
          <radialGradient id="blood3d" cx="38%" cy="40%" r="62%" fx="32%" fy="34%">
            <stop offset="0%" stopColor="#FF6B7A" />
            <stop offset="28%" stopColor="#E61C2E" />
            <stop offset="60%" stopColor="#BA0017" />
            <stop offset="85%" stopColor="#75000C" />
            <stop offset="100%" stopColor="#450007" />
          </radialGradient>

          {/* Bottom Ambient Caustic Glow */}
          <radialGradient id="bottomCaustic" cx="50%" cy="88%" r="42%">
            <stop offset="0%" stopColor="#FFA0AB" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#BA0017" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#75000C" stopOpacity="0" />
          </radialGradient>

          {/* Glare Linear Gradient */}
          <linearGradient id="glareGrad" x1="0%" y1="0%" x2="80%" y2="80%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Bubble Translucent Specular Gradient */}
          <radialGradient id="bubbleGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.38" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
          </radialGradient>

          {/* Exact Silhouette Clip Path so inner speculars wrap 3D curves perfectly */}
          <clipPath id="dropClip">
            <path d="M 50 3 C 50 3, 16 52, 16 78 A 34 34 0 0 0 84 78 C 84 52, 50 3, 50 3 Z" />
          </clipPath>
        </defs>

        {/* Base 3D Shaded Body */}
        <path
          d="M 50 3 C 50 3, 16 52, 16 78 A 34 34 0 0 0 84 78 C 84 52, 50 3, 50 3 Z"
          fill="url(#blood3d)"
        />

        {/* Bottom Caustic Reflection */}
        <path
          d="M 50 3 C 50 3, 16 52, 16 78 A 34 34 0 0 0 84 78 C 84 52, 50 3, 50 3 Z"
          fill="url(#bottomCaustic)"
        />

        {/* Group with Silhouette Clipping for realistic 3D internal glares */}
        <g clipPath="url(#dropClip)">
          {/* Top-Left 3D Gloss Sweep */}
          <path
            d="M 50 3 C 50 3, 16 52, 16 78 C 24 50, 40 22, 50 3 Z"
            fill="url(#glareGrad)"
          />

          {/* Smooth Diagonal 3D Oval Bubble Specular Highlight */}
          <g>
            <ellipse
              cx="39"
              cy="48"
              rx="13"
              ry="21"
              transform="rotate(-28 39 48)"
              fill="url(#bubbleGrad)"
            />
            {/* Bright Solid White Specular Dot */}
            <circle cx="37" cy="35" r="4.5" fill="#FFFFFF" fillOpacity="0.95" />
            <circle cx="36" cy="34" r="1.8" fill="#FFFFFF" />
          </g>

          {/* Unified Medical Plus (+) Symbol at Bottom-Right */}
          <path
            d="M 70 78 C 72 78, 73.5 79.5, 73.5 81.5 L 73.5 85 L 77 85 C 79 85, 80.5 86.5, 80.5 88.5 C 80.5 90.5, 79 92, 77 92 L 73.5 92 L 73.5 95.5 C 73.5 97.5, 72 99, 70 99 C 68 99, 66.5 97.5, 66.5 95.5 L 66.5 92 L 63 92 C 61 92, 59.5 90.5, 59.5 88.5 C 59.5 86.5, 61 85, 63 85 L 66.5 85 L 66.5 81.5 C 66.5 79.5, 68 78, 70 78 Z"
            fill="#FFA5B0"
            fillOpacity="0.45"
          />
        </g>
      </svg>
    </div>
  );
};

export default BloodDrop3D;
