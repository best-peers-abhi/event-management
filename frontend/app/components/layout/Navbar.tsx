'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import {
  CalendarDays,
  PlusCircle,
  LayoutDashboard,
  Compass,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Radio,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { label: 'Explore Events', href: '/events', icon: <Compass className="w-4 h-4" /> },
    ...(isAuthenticated
      ? [
          { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Brand Logo & System Status */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Event<span className="gradient-text">Sphere</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase -mt-1 hidden sm:block">
                  Hybrid Microservices
                </span>
              </div>
            </Link>

            {/* Architecture Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-slate-400">Kafka & TCP RPC Mesh</span>
            </div>
          </div>

          {/* Middle: Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Auth Controls & Host Action */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/events/create">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<PlusCircle className="w-4 h-4" />}
                  >
                    Host Event
                  </Button>
                </Link>

                {/* User Pill */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                  <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase">
                      {user?.name ? user.name.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-200 leading-tight">
                        {user?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    aria-label="Log out"
                    title="Log out"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}

          {isAuthenticated ? (
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
              <Link
                href="/events/create"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button
                  size="md"
                  variant="primary"
                  className="w-full justify-center"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  Host Event
                </Button>
              </Link>

              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 mt-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
                    <p className="text-[10px] text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full justify-center">
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full justify-center">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
