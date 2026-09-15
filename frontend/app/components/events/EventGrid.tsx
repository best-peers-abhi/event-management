'use client';

import React from 'react';
import Link from 'next/link';
import { EventCard } from './EventCard';
import { Event } from '../../types';
import { SkeletonCard } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { CalendarX2, PlusCircle, RefreshCw } from 'lucide-react';

export interface EventGridProps {
  events: Event[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onResetFilters?: () => void;
  featuredFirst?: boolean;
}

export const EventGrid: React.FC<EventGridProps> = ({
  events,
  isLoading = false,
  emptyTitle = 'No events found',
  emptyDescription = 'There are no events matching your search or filter criteria right now.',
  onResetFilters,
  featuredFirst = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 sm:p-16 rounded-3xl glass border border-slate-800/80 my-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/5">
          <CalendarX2 className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-100">{emptyTitle}</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
          {emptyDescription}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {onResetFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reset Filters
            </Button>
          )}

          <Link href="/events/create">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Host an Event
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <EventCard
          key={event.id}
          event={event}
          featured={featuredFirst && index === 0}
        />
      ))}
    </div>
  );
};
