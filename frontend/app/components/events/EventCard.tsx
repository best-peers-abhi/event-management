'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { Event } from '../../types';
import { formatDate, formatTime, isUpcoming, isPast } from '../../utils/date';
import { CapacityMeter } from '../ui/CapacityMeter';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => {
  const { user } = useAuth();
  const isCreator = user?.id === event.createdBy;

  // Capacity calculations
  const registeredCount = event.registeredCount ?? 0;
  const capacity = event.capacity || 1;
  const remainingSeats = event.remainingSeats ?? Math.max(0, capacity - registeredCount);
  const isSoldOut = remainingSeats === 0;
  const isAlmostFull = !isSoldOut && registeredCount / capacity >= 0.8;
  const past = isPast(event.endDate || event.startDate);
  const upcoming = isUpcoming(event.startDate);

  // Status badge selection
  const renderStatusBadge = () => {
    if (past) {
      return <Badge variant="default" size="sm">Past Event</Badge>;
    }
    if (isSoldOut) {
      return <Badge variant="danger" size="sm">Sold Out</Badge>;
    }
    if (isAlmostFull) {
      return <Badge variant="warning" size="sm">Almost Full</Badge>;
    }
    if (upcoming) {
      return <Badge variant="success" size="sm">Open for RSVP</Badge>;
    }
    return <Badge variant="info" size="sm">Live Now</Badge>;
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-300 ${
        featured
          ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950 border-indigo-500/30 hover:border-indigo-400/60 shadow-xl shadow-indigo-950/20'
          : 'glass-card hover:border-indigo-500/40 hover:shadow-indigo-500/10'
      }`}
    >
      {/* Top Banner Accent Glow */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 flex flex-col flex-1">
        {/* Badges Bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {renderStatusBadge()}
            {isCreator && (
              <Badge variant="purple" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                Organizer
              </Badge>
            )}
            {featured && (
              <Badge variant="info" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                Featured
              </Badge>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
            #{event.id}
          </span>
        </div>

        {/* Title */}
        <Link href={`/events/${event.id}`} className="group/title">
          <h3 className="text-xl font-bold text-slate-100 group-hover/title:text-indigo-400 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed flex-1">
          {event.description || 'Join us for this exciting event with industry experts and community leaders.'}
        </p>

        {/* Meta Details */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2 text-xs text-slate-300">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-medium">{formatDate(event.startDate)}</span>
            <span className="text-slate-500">•</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatTime(event.startDate)}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate" title={event.location}>
              {event.location || 'Online / Remote'}
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <CapacityMeter
            capacity={capacity}
            registeredCount={registeredCount}
            size="sm"
            showDetails={true}
          />
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-6 py-3.5 bg-slate-950/50 border-t border-slate-800/80 rounded-b-2xl flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {isSoldOut ? 'Waitlist available' : 'Instant confirmation'}
        </span>

        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all"
        >
          <span>{isCreator ? 'Manage Event' : 'View Details'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
