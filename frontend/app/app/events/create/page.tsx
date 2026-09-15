'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  Users,
  AlignLeft,
  ArrowLeft,
  Sparkles,
  Radio,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { eventService } from '../../../services/event.service';
import { CreateEventDto } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { toDatetimeLocalInput } from '../../../utils/date';

export default function CreateEventPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  // Auth Guard: redirect unauthenticated users
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      showToast('Please log in to host a new event.', 'info');
      router.push('/login?redirect=/events/create');
    }
  }, [isAuthenticated, isAuthLoading, router, showToast]);

  // Default dates: tomorrow 09:00 AM -> 05:00 PM
  const getInitialDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setHours(17, 0, 0, 0);

    return {
      start: toDatetimeLocalInput(start),
      end: toDatetimeLocalInput(end),
    };
  };

  const initialDates = getInitialDates();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: initialDates.start,
    endDate: initialDates.end,
    capacity: 50,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.title.trim()) {
      errs.title = 'Event title is required';
    } else if (formData.title.length < 3) {
      errs.title = 'Title must be at least 3 characters long';
    }

    if (!formData.description.trim()) {
      errs.description = 'Please provide an event description';
    }

    if (!formData.location.trim()) {
      errs.location = 'Venue location or livestream URL is required';
    }

    if (!formData.startDate) {
      errs.startDate = 'Start date and time are required';
    }

    if (!formData.endDate) {
      errs.endDate = 'End date and time are required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errs.endDate = 'End time must be after start time';
    }

    if (!formData.capacity || formData.capacity < 1) {
      errs.capacity = 'Capacity must be at least 1 seat';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Please fix the validation errors before submitting.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateEventDto = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        capacity: Number(formData.capacity),
      };

      const createdEvent = await eventService.create(payload);
      showToast('🎉 Event successfully created and broadcasted to Kafka!', 'success');
      router.push(`/events/${createdEvent.id}`);
    } catch (err: any) {
      console.error('Failed to create event:', err);
      showToast(err?.message || 'Failed to create event. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading session...
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Back Link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Directory</span>
        </Link>

        {/* Header Title Banner */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Event Host Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Host a New Event
          </h1>
          <p className="text-sm text-slate-400">
            Publish your conference, workshop, or meetup. Your event will be instantly synced across the NestJS microservices and broadcasted via Apache Kafka.
          </p>
        </div>

        {/* Creation Form Card */}
        <form
          onSubmit={handleSubmit}
          className="glass-card p-6 sm:p-10 rounded-3xl border border-slate-800/80 flex flex-col gap-6"
        >
          {/* Title Field */}
          <Input
            label="Event Title"
            required
            placeholder="e.g. Distributed Systems & Kafka Summit 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            helperText="A clear, engaging name for your conference or meetup"
            leftIcon={<CalendarDays className="w-4 h-4" />}
          />

          {/* Description Field */}
          <Textarea
            label="Event Description & Agenda"
            required
            rows={5}
            placeholder="Describe what attendees will learn, keynote speakers, agenda, or prerequisites..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            helperText="Supports multi-line descriptions and agenda items"
          />

          {/* Location Field */}
          <Input
            label="Venue Location or Online Stream URL"
            required
            placeholder="e.g. Moscone Center, SF or https://youtube.com/live/..."
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            error={errors.location}
            helperText="Physical address or link for online attendance"
            leftIcon={<MapPin className="w-4 h-4" />}
          />

          {/* Dates & Schedule Grid */}
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

          {/* Capacity Field */}
          <div className="pt-2 border-t border-slate-800/80">
            <Input
              label="Maximum Seat Capacity"
              type="number"
              min={1}
              max={100000}
              required
              placeholder="100"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              error={errors.capacity}
              helperText="Total number of attendees allowed before registrations are marked Sold Out"
              leftIcon={<Users className="w-4 h-4" />}
            />
          </div>

          {/* Microservice Architecture Info Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-3">
            <Radio className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Event-Driven Distribution:</span>
              <p className="text-slate-400 mt-0.5">
                Publishing triggers a synchronous TCP RPC transaction to PostgreSQL and emits an asynchronous <code className="text-pink-300 font-mono">event.created</code> message to Apache Kafka.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Link href="/events">
              <Button variant="ghost" size="md" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Publish Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
