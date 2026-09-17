'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  Ticket,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { eventService } from '../../../../services/event.service';
import { AttendeesResponse, Event } from '../../../../types';
import { formatDate, formatDateTime } from '../../../../utils/date';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Skeleton } from '../../../../components/ui/Skeleton';

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const eventId = Number(params?.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [roster, setRoster] = useState<AttendeesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!eventId || isNaN(eventId)) {
      setErrorMessage('Invalid Event ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [eventData, attendeesData] = await Promise.all([
        eventService.getById(eventId),
        eventService.getAttendees(eventId),
      ]);

      setEvent(eventData);
      setRoster(attendeesData);
    } catch (err: any) {
      console.error('Failed to load attendees:', err);
      setErrorMessage(err?.message || 'Failed to fetch attendee roster.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter attendees by search
  const filteredAttendees = useMemo(() => {
    if (!roster?.attendees) return [];
    if (!searchTerm.trim()) return roster.attendees;

    const term = searchTerm.toLowerCase();
    return roster.attendees.filter(
      (a) =>
        a.id.toString().includes(term) ||
        a.userId.toString().includes(term) ||
        a.registeredAt.toLowerCase().includes(term)
    );
  }, [roster, searchTerm]);

  // Export Roster to CSV
  const handleExportCSV = () => {
    if (!roster?.attendees || roster.attendees.length === 0) {
      showToast('No attendees to export.', 'warning');
      return;
    }

    const headers = ['Registration ID', 'Event ID', 'User ID', 'Registered At'];
    const rows = roster.attendees.map((a) => [
      a.id,
      a.eventId,
      a.userId,
      `"${a.registeredAt}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees-event-${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📥 Attendee roster exported to CSV.', 'success');
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Event or Roster Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">{errorMessage}</p>
        <Link href="/events" className="mt-8">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to All Events
          </Button>
        </Link>
      </div>
    );
  }

  const isCreator = user?.id === event.createdBy;

  // Unauthorized guard
  if (!isAuthenticated || !isCreator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Organizer Only Access</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          The attendee roster is private and only accessible by the event host (User #{event.createdBy}).
        </p>
        <Link href={`/events/${eventId}`} className="mt-8">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Event Page
          </Button>
        </Link>
      </div>
    );
  }

  const totalAttendees = roster?.totalAttendees ?? roster?.attendees?.length ?? 0;
  const capacity = event.capacity || 1;
  const fillPercentage = Math.min(100, Math.round((totalAttendees / capacity) * 100));

  return (
    <div className="py-10 sm:py-16 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Event Details</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4 text-indigo-400" />}
          >
            Export to CSV
          </Button>
        </div>

        {/* Header Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Organizer Attendee Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>{formatDate(event.startDate)}</span>
              <span>•</span>
              <span>{event.location}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/events/${eventId}/edit`}>
              <Button variant="ghost" size="sm">
                Edit Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Total Confirmed RSVPs</span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {totalAttendees}
              </span>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Total Capacity</span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {capacity} Seats
              </span>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Capacity Fill Rate</span>
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                {fillPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search attendee by User ID or Reg ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Attendees List / Table */}
        <div className="glass-card rounded-3xl border border-slate-800/80 overflow-hidden">
          {filteredAttendees.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <Users className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-base font-medium text-slate-300">
                {searchTerm ? 'No attendees match your search query.' : 'No attendees registered yet.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Share your event link to start collecting registrations!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Reg ID</th>
                    <th className="py-4 px-6">Attendee</th>
                    <th className="py-4 px-6">Registered Timestamp</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAttendees.map((attendee) => (
                    <tr
                      key={attendee.id}
                      className="hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono text-xs text-indigo-400">
                        #{attendee.id}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold">
                            U{attendee.userId}
                          </div>
                          <span>User #{attendee.userId}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                        {formatDateTime(attendee.registeredAt)}
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant="success"
                          size="sm"
                          icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        >
                          Confirmed
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
