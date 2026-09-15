'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  Users,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { eventService } from '../../../../services/event.service';
import { Event, UpdateEventDto } from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Textarea } from '../../../../components/ui/Textarea';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { toDatetimeLocalInput } from '../../../../utils/date';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const eventId = Number(params?.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: 50,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load event details
  const loadEvent = useCallback(async () => {
    if (!eventId || isNaN(eventId)) {
      setErrorMessage('Invalid Event ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await eventService.getById(eventId);
      setEvent(data);

      setFormData({
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        startDate: toDatetimeLocalInput(data.startDate),
        endDate: toDatetimeLocalInput(data.endDate),
        capacity: data.capacity,
      });
    } catch (err: any) {
      console.error('Failed to load event for editing:', err);
      setErrorMessage(err?.message || 'Failed to fetch event details.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Auth & Organizer Guard
  const isCreator = user?.id === event?.createdBy;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.title.trim()) {
      errs.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      errs.description = 'Event description is required';
    }

    if (!formData.location.trim()) {
      errs.location = 'Location is required';
    }

    if (!formData.startDate) {
      errs.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errs.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errs.endDate = 'End date must be after start date';
    }

    const currentRegistrations = event?.registeredCount || 0;
    if (!formData.capacity || formData.capacity < 1) {
      errs.capacity = 'Capacity must be at least 1';
    } else if (formData.capacity < currentRegistrations) {
      errs.capacity = `Cannot reduce capacity below current registered attendees (${currentRegistrations})`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Please correct the validation errors.', 'warning');
      return;
    }

    try {
      setIsSaving(true);

      const payload: UpdateEventDto = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        capacity: Number(formData.capacity),
      };

      await eventService.update(eventId, payload);
      showToast('✅ Event updated successfully!', 'success');
      router.push(`/events/${eventId}`);
    } catch (err: any) {
      console.error('Failed to update event:', err);
      showToast(err?.message || 'Failed to update event details.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col gap-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">{errorMessage}</p>
        <Link href="/events" className="mt-6">
          <Button variant="primary">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  // Unauthorized guard view
  if (!isAuthenticated || !isCreator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Unauthorized Access</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          You do not have organizer privileges to modify this event. Only user #{event.createdBy} can edit this event.
        </p>
        <Link href={`/events/${eventId}`} className="mt-8">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Event Details
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Back Link */}
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Event Details</span>
        </Link>

        {/* Header Title */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold self-start">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Organizer Management Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Edit Event Details
          </h1>
          <p className="text-sm text-slate-400">
            Update schedule, capacity, and details for <strong className="text-white">{event.title}</strong>.
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleUpdate}
          className="glass-card p-6 sm:p-10 rounded-3xl border border-slate-800/80 flex flex-col gap-6"
        >
          {/* Title */}
          <Input
            label="Event Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            leftIcon={<CalendarDays className="w-4 h-4" />}
          />

          {/* Description */}
          <Textarea
            label="Event Description"
            required
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
          />

          {/* Location */}
          <Input
            label="Venue Location or Stream URL"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={errors.location}
            leftIcon={<MapPin className="w-4 h-4" />}
          />

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Start Date & Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-4 py-3 bg-slate-900/80 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.startDate
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              {errors.startDate && (
                <span className="text-xs text-rose-400 mt-1 block">{errors.startDate}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                End Date & Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-4 py-3 bg-slate-900/80 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.endDate
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              {errors.endDate && (
                <span className="text-xs text-rose-400 mt-1 block">{errors.endDate}</span>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="pt-2 border-t border-slate-800/80">
            <Input
              label="Maximum Seat Capacity"
              type="number"
              min={1}
              required
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              error={errors.capacity}
              helperText={`Current registered attendees: ${event.registeredCount || 0}`}
              leftIcon={<Users className="w-4 h-4" />}
            />
          </div>

          {/* Info Banner */}
          {(event.registeredCount || 0) > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> There are currently {event.registeredCount} active RSVPs. Lowering capacity below this number is blocked by the backend microservice.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Link href={`/events/${eventId}`}>
              <Button variant="ghost" size="md" disabled={isSaving}>
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
