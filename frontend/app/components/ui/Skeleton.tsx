import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantStyles = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4 w-full',
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-slate-800/80 border border-white/5 ${variantStyles[variant]} ${className}`.trim()}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-6 rounded-2xl glass border border-slate-800/80 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>
      <Skeleton className="h-6 w-3/4 rounded-lg" />
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
      <div className="pt-2">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
};
