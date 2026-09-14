import React from 'react';
import { CalendarDays, Server, Radio, Database, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950/80 border-t border-slate-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-900">
          {/* Col 1: Brand & Architecture Description */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 border border-indigo-400/20">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Event<span className="gradient-text">Sphere</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              An enterprise-grade event management platform combining high-speed Synchronous TCP RPC for atomic transactions and scalable Apache Kafka event streaming for asynchronous pub/sub fan-out.
            </p>

            {/* Architecture Stack Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                <Server className="w-3 h-3 text-indigo-400" />
                NestJS Gateway :3000
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                <Activity className="w-3 h-3 text-cyan-400" />
                TCP RPC :3001-3003
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                <Radio className="w-3 h-3 text-pink-400" />
                Kafka KRaft :9092
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                <Database className="w-3 h-3 text-emerald-400" />
                PostgreSQL :5432
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Platform
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-400">
              <li>
                <Link href="/events" className="hover:text-indigo-400 transition-colors">
                  Explore Events
                </Link>
              </li>
              <li>
                <Link href="/events/create" className="hover:text-indigo-400 transition-colors">
                  Host an Event
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Microservices Mesh */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Microservices Mesh
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-slate-400 font-mono">
              <li className="flex items-center justify-between">
                <span>Auth Service</span>
                <span className="text-slate-500">TCP 3002</span>
              </li>
              <li className="flex items-center justify-between">
                <span>User Service</span>
                <span className="text-slate-500">TCP 3001</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Event Service</span>
                <span className="text-slate-500">TCP 3003</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Kafka Consumer</span>
                <span className="text-slate-500">topic: event.created</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EventSphere. Monorepo Microservices Platform.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Secured with JWT & Passport Guard</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
