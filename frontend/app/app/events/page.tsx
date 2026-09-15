'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { eventService } from '../../services/event.service';
import { Event } from '../../types';
import { EventGrid } from '../../components/events/EventGrid';
import { EventSearchBar, EventFilterStatus } from '../../components/events/EventSearchBar';
import { isUpcoming, isPast } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';
import { Compass, Sparkles } from 'lucide-react';

export default function EventsDirectoryPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<EventFilterStatus>('all');

  // Fetch all events from backend
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.getAll();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Filter and search logic
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. Search filter
      const matchesSearch =
        !searchTerm.trim() ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Status chip filter
      const capacity = event.capacity || 1;
      const count = event.registeredCount || 0;
      const remaining = event.remainingSeats ?? Math.max(0, capacity - count);
      const isEventPast = isPast(event.endDate || event.startDate);
      const isEventUpcoming = isUpcoming(event.startDate);

      switch (activeFilter) {
        case 'upcoming':
          return isEventUpcoming && !isEventPast;
        case 'available':
          return remaining > 0 && !isEventPast;
        case 'past':
          return isEventPast;
        case 'my-events':
          return user ? event.createdBy === user.id : false;
        case 'all':
        default:
          return true;
      }
    });
  }, [events, searchTerm, activeFilter, user]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
  };

  return (
    <div className="py-10 sm:py-14 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Event Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Explore Tech & Community Events
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Browse upcoming developer conferences, workshops, and meetups. Reserve your seat with live Kafka microservice event tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 self-start sm:self-auto">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>
              Total Events: <strong className="text-white">{events.length}</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <EventSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          totalResults={filteredEvents.length}
        />

        {/* Events Grid */}
        <EventGrid
          events={filteredEvents}
          isLoading={isLoading}
          onResetFilters={handleResetFilters}
          emptyTitle={
            searchTerm || activeFilter !== 'all'
              ? 'No matching events found'
              : 'No events available'
          }
          emptyDescription={
            searchTerm || activeFilter !== 'all'
              ? `We couldn't find any events matching "${searchTerm || activeFilter}". Try adjusting your query or resetting filters.`
              : 'No events have been created yet. Be the first organizer to launch an event!'
          }
        />
      </div>
    </div>
  );
}
