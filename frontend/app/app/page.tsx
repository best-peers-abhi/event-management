'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  PlusCircle,
  Zap,
  Radio,
  Shield,
  Ticket,
  ArrowRight,
  Cpu,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { eventService } from '../services/event.service';
import { Event } from '../types';
import { EventGrid } from '../components/events/EventGrid';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchFeaturedEvents() {
      try {
        setIsLoading(true);
        const data = await eventService.getAll();
        setEvents(data);
      } catch (err) {
        console.error('Failed to load featured events:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeaturedEvents();
  }, []);

  const featuredEvents = events.slice(0, 6);

  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-pink-600/10 blur-[130px] -z-10 pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Microservices Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-md shadow-inner animate-in fade-in zoom-in-95 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>NestJS TCP RPC & Kafka KRaft Event Architecture</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1] sm:leading-[1.1]">
            Discover, Host & Connect at{' '}
            <span className="gradient-text">Next-Gen Tech Events</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            The high-throughput event platform engineered with microservices architecture.
            Instant capacity-safe reservations, live Kafka event streaming, and real-time organizer controls.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
            <Link href="/events" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-xl shadow-indigo-500/30 text-base"
                leftIcon={<Compass className="w-5 h-5" />}
              >
                Explore All Events
              </Button>
            </Link>

            <Link href={isAuthenticated ? "/events/create" : "/register"} className="w-full sm:w-auto">
              <Button
                variant="glass"
                size="lg"
                className="w-full sm:w-auto text-base"
                leftIcon={<PlusCircle className="w-5 h-5 text-indigo-400" />}
              >
                Host an Event
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 w-full max-w-4xl">
            <div className="flex flex-col items-center p-4 rounded-2xl glass border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-indigo-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Latency</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">&lt; 1ms</span>
              <span className="text-[11px] text-slate-400 mt-0.5">TCP RPC Speed</span>
            </div>

            <div className="flex flex-col items-center p-4 rounded-2xl glass border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-pink-400 mb-1">
                <Radio className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Streaming</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Kafka KRaft</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Event Pub/Sub</span>
            </div>

            <div className="flex flex-col items-center p-4 rounded-2xl glass border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                <Ticket className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Accuracy</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">100% Lock</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Zero Overbooking</span>
            </div>

            <div className="flex flex-col items-center p-4 rounded-2xl glass border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Security</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">JWT Auth</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Role Guarded</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED EVENTS SECTION */}
      <section className="py-16 border-t border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Curated Experiences</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Featured & Upcoming Events
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Explore popular tech summits, developer workshops, and local meetups.
              </p>
            </div>

            <Link href="/events">
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Browse All Directory
              </Button>
            </Link>
          </div>

          {/* Event Grid */}
          <EventGrid
            events={featuredEvents}
            isLoading={isLoading}
            featuredFirst={true}
            emptyTitle="No Upcoming Events Yet"
            emptyDescription="Be the pioneer to host the first event in this community!"
          />
        </div>
      </section>

      {/* 3. ARCHITECTURE HIGHLIGHTS / HOW IT WORKS */}
      <section className="py-20 border-t border-slate-800/60 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Hybrid Distributed Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built on High-Performance Microservices
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Every request is orchestrated across independent NestJS microservices communicating synchronously via TCP RPC and asynchronously via Apache Kafka streams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-card p-8 rounded-3xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Synchronous TCP RPC</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  The API Gateway executes ultra-low latency TCP RPC calls to the dedicated <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-xs font-mono">event-service</code> and <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-xs font-mono">user-service</code> for immediate database transactions.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-indigo-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Port 3003 (Event) & Port 3002 (User)
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 rounded-3xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mb-6">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Apache Kafka Pub/Sub</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  When events are created or tickets booked, Kafka broadcasts <code className="text-pink-300 bg-pink-950/60 px-1.5 py-0.5 rounded text-xs font-mono">event.created</code> and <code className="text-pink-300 bg-pink-950/60 px-1.5 py-0.5 rounded text-xs font-mono">event.registered</code> messages to asynchronously notify services without blocking API responses.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-pink-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                Kafka Broker :9092
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-8 rounded-3xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">PostgreSQL ACID & Concurrency</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  All event inventories, user credentials, and ticket registrations are backed by transactional PostgreSQL relations with strict capacity verification to prevent seat overbooking.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL :5432
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 overflow-hidden shadow-2xl text-center flex flex-col items-center">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Host Your Next Event?
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Create and publish your conference, meetup, or hackathon in seconds. Get real-time attendee tracking and capacity management out of the box.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Link href={isAuthenticated ? "/events/create" : "/register"}>
                <Button
                  variant="primary"
                  size="lg"
                  className="shadow-xl shadow-indigo-500/30"
                  leftIcon={<PlusCircle className="w-5 h-5" />}
                >
                  Create Event Now
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" size="lg">
                  Explore Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
