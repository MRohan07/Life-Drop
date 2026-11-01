/* @module: Card — Reusable modern UI Card component with interactive styling */
import React from 'react';
import { CardProps } from './Card.types';

export const Card: React.FC<CardProps> = ({
  children,
  isInteractive = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200 shadow-sm',
    glass: 'bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md',
    dark: 'bg-slate-900 border border-slate-800 text-white shadow-2xl',
    amber: 'bg-amber-50/90 border border-amber-200 text-slate-800',
  };

  return (
    <div
      className={`rounded-3xl p-6 transition-all ${
        isInteractive ? 'card-3d-interactive hover:border-slate-300' : ''
      } ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
