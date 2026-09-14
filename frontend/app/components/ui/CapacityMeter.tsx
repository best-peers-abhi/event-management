import React from 'react';
import { Users } from 'lucide-react';

export interface CapacityMeterProps {
  capacity: number;
  registeredCount?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CapacityMeter: React.FC<CapacityMeterProps> = ({
  capacity,
  registeredCount = 0,
  showDetails = true,
  size = 'md',
  className = '',
}) => {
  const safeCapacity = Math.max(1, capacity);
  const count = Math.min(registeredCount, safeCapacity);
  const percentage = Math.min(100, Math.round((count / safeCapacity) * 100));
  const remaining = Math.max(0, safeCapacity - count);

  const isSoldOut = remaining === 0;
  const isAlmostFull = percentage >= 80 && !isSoldOut;

  const barHeight = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const barColor = isSoldOut
    ? 'bg-gradient-to-r from-rose-500 to-red-600'
    : isAlmostFull
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400';

  const textColor = isSoldOut
    ? 'text-rose-400 font-semibold'
    : isAlmostFull
    ? 'text-amber-400 font-medium'
    : 'text-slate-300';

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`.trim()}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>
              {count} / {safeCapacity} Registered
            </span>
          </div>

          <span className={textColor}>
            {isSoldOut
              ? '🔴 Sold Out'
              : `${remaining} seat${remaining === 1 ? '' : 's'} remaining (${percentage}%)`}
          </span>
        </div>
      )}

      {/* Track & Bar */}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/5 ${barHeight[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
