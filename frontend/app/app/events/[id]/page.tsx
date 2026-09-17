'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ArrowLeft,
  Trash2,
  Edit3,
  CheckCircle2,
  Share2,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { eventService } from '../../../services/event.service';
import { Event } from '../../../types';
import { formatDate, formatTime, formatDateRange, isPast } from '../../../utils/date';
import { CapacityMeter } from '../../../components/ui/CapacityMeter';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { JoinEventCTA } from '../../../components/events/JoinEventCTA';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Skeleton } from '../../../components/ui/Skeleton';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const eventId = Number(params?.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch single event and check registration status
  const fetchEventData = useCallback(async () => {
    if (!eventId || isNaN(eventId)) {
      setErrorMessage('Invalid event ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await eventService.getById(eventId);
      setEvent(data);

      // If user is authenticated, check if already in attendees roster
      if (isAuthenticated && user) {
        try {
          const attendeesRes = await eventService.getAttendees(eventId);
          const alreadyInList = attendeesRes.attendees?.some(
            (a) => a.userId === user.id
          );
          setIsRegistered(!!alreadyInList);
        } catch {
          // If unprivileged or attendee call fails, fallback to false
          setIsRegistered(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to load event details:', err);
      setErrorMessage(err?.message || 'Event not found or failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, isAuthenticated, user]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Handle registration status change from JoinEventCTA
  const handleRegistrationChange = (newStatus: boolean) => {
    setIsRegistered(newStatus);
    // Refresh event data to update seat counts
    fetchEventData();
  };

  // Handle Delete Event (Organizer only)
  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      setIsDeleting(true);
      await eventService.delete(event.id);
      showToast('Event and associated registrations deleted successfully.', 'info');
      router.push('/events');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete event.', 'error');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handle Share Event Link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('📋 Event link copied to clipboard!', 'info');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          {errorMessage || 'The event you are looking for does not exist or has been removed.'}
        </p>
        <Link href="/events" className="mt-8">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to All Events
          </Button>
        </Link>
      </div>
    );
  }

  const isCreator = user?.id === event.createdBy;
  const capacity = event.capacity || 1;
  const registeredCount = event.registeredCount ?? 0;
  const remainingSeats = event.remainingSeats ?? Math.max(0, capacity - registeredCount);
  const isSoldOut = remainingSeats === 0;
  const eventPast = isPast(event.endDate || event.startDate);

  return (
    <div className="py-8 sm:py-12 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Events</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Event</span>
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 Cols): Event Content & Schedule */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Event Header Banner Card */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

              {/* Status Badges */}
              <div className="flex items-center gap-2.5 flex-wrap mb-4">
                {eventPast ? (
                  <Badge variant="default">Past Event</Badge>
                ) : isSoldOut ? (
                  <Badge variant="danger">Sold Out</Badge>
                ) : (
                  <Badge variant="success">Open for Registration</Badge>
                )}

                {isCreator && (
                  <Badge variant="purple" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                    You are the Organizer
                  </Badge>
                )}

                <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  Event #{event.id}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              {/* Quick Meta Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Date & Schedule</span>
                    <span className="font-semibold text-white">
                      {formatDate(event.startDate)}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {formatTime(event.startDate)} – {formatTime(event.endDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Venue & Location</span>
                    <span className="font-semibold text-white truncate block max-w-[220px]">
                      {event.location || 'Online Stream'}
                    </span>
                    <span className="text-xs text-indigo-400 block mt-0.5">
                      {event.location?.toLowerCase().includes('http') ? 'Online Webinar' : 'In-Person Venue'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-800/80">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>About this Event</span>
              </h2>
              <div className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description || 'No detailed description provided for this event.'}
              </div>
            </div>

            {/* Event Schedule / Agenda breakdown */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-800/80">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Event Schedule Details</span>
              </h2>
              <div className="flex flex-col gap-4 text-sm text-slate-300">
                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Start Time:</span>
                  <span className="font-semibold text-white font-mono">
                    {formatDateRange(event.startDate, event.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Conclusion:</span>
                  <span className="font-semibold text-white font-mono">
                    {formatDateRange(event.endDate, event.endDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Organizer Info Card */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-lg">
                  O
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Organizer #{event.createdBy}</span>
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verified Host • Member since {formatDate(event.createdAt)}
                  </p>
                </div>
              </div>

              {isCreator && (
                <Link href={`/events/${event.id}/edit`}>
                  <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                    Edit Event
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Sticky RSVP & Capacity Action Card */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-6">
            <div className="glass-card p-6 sm:p-7 rounded-3xl border border-indigo-500/30 shadow-xl shadow-indigo-950/20 flex flex-col gap-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
                  Seat Availability
                </span>
                <div className="flex items-baseline justify-between mt-1 mb-4">
                  <span className="text-3xl font-extrabold text-white">
                    {remainingSeats} <span className="text-sm font-normal text-slate-400">Left</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Cap: {capacity}
                  </span>
                </div>

                {/* Capacity Meter */}
                <CapacityMeter
                  capacity={capacity}
                  registeredCount={registeredCount}
                  size="md"
                  showDetails={true}
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                {/* Dynamic RSVP CTA Button */}
                <JoinEventCTA
                  event={event}
                  isRegistered={isRegistered}
                  onRegistrationChange={handleRegistrationChange}
                />
              </div>

              {/* Event Quick Specs */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Total Registrations:
                  </span>
                  <span className="font-semibold text-white">{registeredCount} attendees</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-pink-400" />
                    Event Pipeline:
                  </span>
                  <span className="font-mono text-slate-300">Kafka KRaft Pub/Sub</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Admission Type:
                  </span>
                  <span className="font-semibold text-emerald-300">Free Community RSVP</span>
                </div>
              </div>

              {/* Organizer Management Actions */}
              {isCreator && (
                <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-indigo-300">Organizer Controls:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/events/${event.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs justify-center"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/events/${event.id}/attendees`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs justify-center"
                        leftIcon={<Users className="w-3.5 h-3.5" />}
                      >
                        Roster
                      </Button>
                    </Link>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full text-xs justify-center mt-1"
                    onClick={() => setIsDeleteModalOpen(true)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Event
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Event?"
          description="Are you sure you want to permanently delete this event?"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Keep Event
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteEvent}
                isLoading={isDeleting}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Confirm Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-300 leading-relaxed">
            This action cannot be undone. Deleting <strong className="text-white">{event.title}</strong> will remove the event record and cancel all <strong className="text-white">{registeredCount}</strong> attendee ticket reservations.
          </p>
        </Modal>
      </div>
    </div>
  );
}
