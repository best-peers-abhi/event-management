'use client';

import React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, disabled, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const baseTextareaStyles =
      'w-full bg-slate-900/80 border rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm min-h-[100px] resize-y';

    const stateStyles = error
      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20 text-rose-50'
      : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20';

    const textareaClasses = `${baseTextareaStyles} ${stateStyles} ${className}`.trim();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-slate-300 tracking-wide uppercase"
          >
            {label}
            {props.required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          className={textareaClasses}
          {...props}
        />

        {error ? (
          <p className="text-xs text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
