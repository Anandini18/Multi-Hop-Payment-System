import React from 'react';

export function Card({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-slate-700/60 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pb-4 space-y-1.5 ${className}`} {...props} />;
}

export function CardTitle({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-bold tracking-tight text-slate-100 ${className}`}
      {...props}
    />
  );
}

export function CardDescription({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs text-slate-500 ${className}`} {...props} />;
}

export function CardContent({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
}

export function CardFooter({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-0 border-t border-slate-800/40 flex items-center ${className}`} {...props} />
  );
}
