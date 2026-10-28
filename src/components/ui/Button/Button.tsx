/* @module: Button — Reusable UI Button component with role and size variants */
import React from 'react';
import { ButtonProps } from './Button.types';

const variantClasses = {
  primary: 'bg-lifedrop-primary hover:bg-rose-600 text-white shadow-md',
  secondary: 'bg-slate-900 hover:bg-black text-white shadow-md',
  outline: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
  hospital: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg border border-blue-400/30',
  bloodbank: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg border border-amber-400/30',
  admin: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg border border-purple-400/30',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-xl font-bold',
  md: 'px-4 py-2.5 text-xs rounded-xl font-bold',
  lg: 'px-6 py-3.5 text-sm rounded-2xl font-extrabold',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
