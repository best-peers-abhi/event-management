import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border shrink-0';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    danger: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    info: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    outline: 'bg-transparent text-slate-300 border-slate-700',
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim();

  return (
    <span className={combinedClasses}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
