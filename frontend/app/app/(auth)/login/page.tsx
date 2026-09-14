import { Metadata } from 'next';
import { LoginForm } from '../../../components/auth/LoginForm';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In | EventSphere',
  description: 'Log in to your EventSphere account to manage and attend events.',
};

export default function LoginPage() {
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
          Welcome Back
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enter your credentials to access your EventSphere dashboard
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
