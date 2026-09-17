'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventService } from '../../services/event.service';
import { Event } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { isPast } from '../../utils/date';
import {
  Ticket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogIn,
  ShieldCheck,
  Users,
  Edit3,
} from 'lucide-react';

export interface JoinEventCTAProps {
  event: Event;
  isRegistered: boolean;
  onRegistrationChange: (registered: boolean) => void;
  className?: string;
}

export const JoinEventCTA: React.FC<JoinEventCTAProps> = ({
  event,
  isRegistered,
  onRegistrationChange,
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const isCreator = user?.id === event.createdBy;
  const capacity = event.capacity || 1;
  const registeredCount = event.registeredCount ?? 0;
  const remainingSeats = event.remainingSeats ?? Math.max(0, capacity - registeredCount);
  const isSoldOut = remainingSeats === 0;
  const eventPast = isPast(event.endDate || event.startDate);

  // 1. Handle Registration (POST /event/:id/register)
  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${event.id}`);
      return;
    }

    try {
      setIsLoading(true);
      await eventService.register(event.id);
      showToast('🎉 You have successfully registered for this event!', 'success');
      onRegistrationChange(true);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to register for event. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Cancellation (DELETE /event/:id/register)
  const handleCancelRegistration = async () => {
    try {
      setIsLoading(true);
      await eventService.cancel(event.id);
      showToast('Your registration has been cancelled and seat released.', 'info');
      setIsCancelModalOpen(false);
      onRegistrationChange(false);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to cancel registration.';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`.trim()}>
      {/* 1. Unauthenticated Visitor State */}
      {!isAuthenticated && !eventPast && (
        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center shadow-indigo-500/25"
          onClick={() => router.push(`/login?redirect=/events/${event.id}`)}
          leftIcon={<LogIn className="w-5 h-5" />}
        >
          Sign In to Register
        </Button>
      )}

      {/* 2. Event Creator / Organizer Controls */}
      {isAuthenticated && isCreator && (
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>You are the organizer of this event</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Link href={`/events/${event.id}/edit`} className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Event
              </Button>
            </Link>
            <Link href={`/events/${event.id}/attendees`} className="flex-1">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center text-xs"
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                View Roster ({registeredCount})
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 3. Already Registered User State */}
      {isAuthenticated && !isCreator && isRegistered && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">You're Attending!</span>
                <span className="text-[11px] text-emerald-400/80">
                  Your seat is reserved in our Kafka stream.
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCancelModalOpen(true)}
            isLoading={isLoading}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs justify-center"
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            Cancel RSVP & Release Seat
          </Button>
        </div>
      )}

      {/* 4. Available to Register */}
      {isAuthenticated && !isCreator && !isRegistered && !isSoldOut && !eventPast && (
        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center shadow-lg shadow-indigo-500/25"
          onClick={handleRegister}
          isLoading={isLoading}
          leftIcon={<Ticket className="w-5 h-5" />}
        >
          Register for Free RSVP
        </Button>
      )}

      {/* 5. Sold Out State */}
      {isAuthenticated && !isCreator && !isRegistered && isSoldOut && !eventPast && (
        <Button
          variant="secondary"
          size="lg"
          disabled
          className="w-full justify-center opacity-70 cursor-not-allowed bg-slate-800/80 border-slate-700"
          leftIcon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        >
          Event is Sold Out
        </Button>
      )}

      {/* 6. Past Event State */}
      {eventPast && (
        <Button
          variant="secondary"
          size="lg"
          disabled
          className="w-full justify-center opacity-60 cursor-not-allowed"
        >
          This Event Has Ended
        </Button>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Event Registration?"
        description="Are you sure you want to cancel your RSVP for this event?"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isLoading}
            >
              Keep My Spot
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelRegistration}
              isLoading={isLoading}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Yes, Cancel RSVP
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300 leading-relaxed">
          Cancelling will release your ticket for <strong className="text-white">{event.title}</strong> back into the available pool. You may re-register later if seats remain open.
        </p>
      </Modal>
    </div>
  );
};
