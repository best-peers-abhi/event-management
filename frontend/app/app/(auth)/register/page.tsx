import { Metadata } from 'next';
import { RegisterForm } from '../../../components/auth/RegisterForm';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Create Account | EventSphere',
  description: 'Join EventSphere to discover, host, and register for tech events.',
};

export default function RegisterPage() {
  return (
    <div>
      <div className="flex flex-col items-center text-center mb-6">
        <Link
          href="/"
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20 mb-3 hover:scale-105 transition-transform"
        >
          <CalendarDays className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create an Account
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Join thousands of developers hosting & attending events
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
