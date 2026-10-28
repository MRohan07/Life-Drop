/* @module: Input — Reusable UI Input field component */
import React from 'react';
import { InputProps } from './Input.types';

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={`w-full py-2.5 rounded-xl border text-xs font-medium transition-all outline-none ${
            leftIcon ? 'pl-9 pr-3' : 'px-3.5'
          } ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-500'
              : 'border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900'
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2 flex items-center">{rightElement}</div>
        )}
      </div>
      {error ? (
        <p className="text-[11px] text-red-500 font-semibold">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
