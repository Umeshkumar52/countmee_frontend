import React from 'react';

export const Badge = ({
  children,
  variant = 'slate', // slate, primary, danger, success, warning, info
  className = ''
}) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold leading-sm';
  
  const variants = {
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-brand-purple-soft text-brand-purple border border-brand-purple/10',
    danger: 'bg-red-50 text-red-600 border border-red-100',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
