'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  CalendarDays,
  ShieldCheck,
  Edit3,
  Trash2,
  ExternalLink,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventService } from '../../services/event.service';
import { Event } from '../../types';
import { formatDate, formatTime, isUpcoming, isPast } from '../../utils/date';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { CapacityMeter } from '../../components/ui/CapacityMeter';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'attending' | 'hosted'>('hosted');
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Delete modal state
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Auth Guard
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Load user data
  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const events = await eventService.getAll();
      setAllEvents(events);

      // Check registration for each event to build "My Tickets" list
      const attendingList: Event[] = [];
      await Promise.all(
        events.map(async (ev) => {
          try {
            const roster = await eventService.getAttendees(ev.id);
            const isUserAttending = roster.attendees?.some((a) => a.userId === user.id);
            if (isUserAttending) {
              attendingList.push(ev);
            }
          } catch {
            // Ignore 403 or errors if not allowed
          }
        })
      );

      setAttendingEvents(attendingList);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      showToast('Failed to load dashboard events.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user, loadDashboardData]);

  // Hosted events
  const hostedEvents = useMemo(() => {
    if (!user) return [];
    return allEvents.filter((e) => e.createdBy === user.id);
  }, [allEvents, user]);

  // Metrics
  const totalAudience = useMemo(() => {
    return hostedEvents.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  }, [hostedEvents]);

  // Handle Event Deletion
  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await eventService.delete(eventToDelete.id);
      showToast(`Event "${eventToDelete.title}" was deleted.`, 'info');
      setEventToDelete(null);
      loadDashboardData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete event.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAuthLoading || (isLoading && !allEvents.length)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>User Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="gradient-text">{user?.name || 'Organizer'}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your hosted conferences, inspect attendee rosters, and view your tickets.
            </p>
          </div>

          <Link href="/events/create">
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Host New Event
            </Button>
          </Link>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-3xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Hosted Events</span>
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {hostedEvents.length}
              </span>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Active Tickets (Attending)</span>
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {attendingEvents.length}
              </span>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Total Audience Reach</span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                {totalAudience} attendees
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('hosted')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'hosted'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Events I'm Hosting ({hostedEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attending')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'attending'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Tickets & RSVPs ({attendingEvents.length})</span>
          </button>
        </div>

        {/* Tab Content 1: Hosted Events */}
        {activeTab === 'hosted' && (
          <div className="flex flex-col gap-4">
            {hostedEvents.length === 0 ? (
              <div className="py-16 text-center glass rounded-3xl border border-slate-800/80 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">You haven't hosted any events yet</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  Publish a conference, meetup, or online webinar to start managing attendees.
                </p>
                <Link href="/events/create" className="mt-6">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Create Your First Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hostedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="glass-card p-6 rounded-3xl border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="purple" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                          Organizer
                        </Badge>
                        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          #{ev.id}
                        </span>
                      </div>

                      <Link href={`/events/${ev.id}`}>
                        <h3 className="text-lg font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1">
                          {ev.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {ev.description || 'No description.'}
                      </p>

                      <div className="flex items-center gap-3 mt-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1 text-slate-400">
                          <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{formatDate(ev.startDate)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-slate-400 truncate max-w-[180px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <CapacityMeter
                          capacity={ev.capacity}
                          registeredCount={ev.registeredCount}
                          size="sm"
                          showDetails={true}
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Link href={`/events/${ev.id}/attendees`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            leftIcon={<Users className="w-3.5 h-3.5" />}
                          >
                            Roster
                          </Button>
                        </Link>
                        <Link href={`/events/${ev.id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/events/${ev.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 p-2"
                          onClick={() => setEventToDelete(ev)}
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: My Tickets (Attending) */}
        {activeTab === 'attending' && (
          <div className="flex flex-col gap-4">
            {attendingEvents.length === 0 ? (
              <div className="py-16 text-center glass rounded-3xl border border-slate-800/80 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <Ticket className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">No active event tickets</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                  Browse our events directory and register for upcoming conferences and meetups.
                </p>
                <Link href="/events" className="mt-6">
                  <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                    Explore Events
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attendingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="glass-card p-6 rounded-3xl border border-emerald-500/30 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge
                          variant="success"
                          size="sm"
                          icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        >
                          Confirmed RSVP
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">
                          #{ev.id}
                        </span>
                      </div>

                      <Link href={`/events/${ev.id}`}>
                        <h3 className="text-lg font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1">
                          {ev.title}
                        </h3>
                      </Link>

                      <div className="flex flex-col gap-2 mt-4 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>{formatDate(ev.startDate)} • {formatTime(ev.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Kafka stream verified
                      </span>
                      <Link href={`/events/${ev.id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          View Ticket
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!eventToDelete}
          onClose={() => setEventToDelete(null)}
          title="Delete Hosted Event?"
          description="Are you sure you want to permanently delete this event?"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Event
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-300 leading-relaxed">
            This will permanently remove <strong className="text-white">{eventToDelete?.title}</strong> and cancel all registrations.
          </p>
        </Modal>
      </div>
    </div>
  );
}
