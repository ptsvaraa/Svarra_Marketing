import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { inputClass } from '../ui/Field';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  /** The surrounding Field shows a hint, to link for screen readers. */
  hasHint?: boolean;
}

/** Password box with a show / hide toggle. */
export function PasswordInput({ id, value, onChange, autoComplete, error, hasHint }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hasHint ? `${id}-hint` : undefined}
        className={`${inputClass(!!error)} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-1 my-auto inline-flex size-10 items-center justify-center rounded-lg text-subtle transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
