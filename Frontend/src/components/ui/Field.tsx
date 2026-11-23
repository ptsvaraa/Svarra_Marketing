import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Text input style shared by the site's forms. */
export const inputClass = (invalid?: boolean) =>
  cn(
    'h-12 w-full rounded-xl border bg-glass-strong px-4 text-[0.95rem] text-ink placeholder:text-subtle',
    'transition-colors duration-150 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary/30',
    invalid ? 'border-danger' : 'border-line hover:border-primary/40',
  );

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** A labelled form control with its error or hint underneath. */
export function Field({ id, label, error, optional, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-heading">
        {label}
        {optional && <span className="ml-1.5 font-normal text-subtle">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
