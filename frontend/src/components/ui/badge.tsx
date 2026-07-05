import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'cyan';
}

export function Badge({
  className = '',
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    secondary: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    destructive: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    outline: 'bg-transparent text-slate-400 border-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border select-none ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
