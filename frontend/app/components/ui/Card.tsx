import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  glow = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl border transition-all duration-300';
  
  const glassStyles = hoverable
    ? 'glass-card cursor-pointer'
    : 'glass shadow-lg';

  const glowStyles = glow ? 'ring-1 ring-indigo-500/30 shadow-indigo-500/10' : '';

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const combinedClasses = `${baseStyles} ${glassStyles} ${glowStyles} ${paddingStyles[padding]} ${className}`.trim();

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};
