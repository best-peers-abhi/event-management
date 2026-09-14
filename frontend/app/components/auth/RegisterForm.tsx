'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Mail, Lock, UserPlus, AlertCircle, Check, X } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Password requirement tests
  const hasMinLength = password.length >= 6;
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMatch = password && confirmPassword && password === confirmPassword;

  const validate = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      showToast('Registration successful! Please log in with your credentials.', 'success', 5000);
      router.push('/login');
    } catch (err: any) {
      const msg = err.message || 'Failed to register account. Please try again.';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* API Error Banner */}
      {apiError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Registration Failed</p>
            <p className="text-xs text-rose-300/90 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={formErrors.name}
          leftIcon={<User className="w-4 h-4" />}
          autoComplete="name"
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={formErrors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={formErrors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (formErrors.confirmPassword)
              setFormErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={formErrors.confirmPassword}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
          required
        />

        {/* Live Password Checklist */}
        {password && (
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-0.5">
              Password Requirements
            </span>
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className={hasMinLength ? 'text-emerald-300' : 'text-slate-400'}>
                At least 6 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumberOrSpecial ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className={hasNumberOrSpecial ? 'text-emerald-300' : 'text-slate-400'}>
                Contains numbers or special characters
              </span>
            </div>
            {confirmPassword && (
              <div className="flex items-center gap-2">
                {isMatch ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className={isMatch ? 'text-emerald-300' : 'text-rose-400'}>
                  Passwords match
                </span>
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isSubmitting}
          rightIcon={<UserPlus className="w-4 h-4" />}
        >
          Create Account
        </Button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-4 hover:underline"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
};
