import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'outline' | 'muted' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover shadow-[0_10px_24px_-14px_var(--c-primary)]',
  outline: 'border border-primary/35 bg-glass-strong text-primary hover:bg-primary/5',
  muted: 'bg-ink/5 text-muted hover:bg-ink/10',
  danger: 'bg-danger text-white hover:brightness-95 shadow-[0_10px_24px_-14px_var(--c-danger)]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-4 text-[0.95rem] rounded-xl',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center gap-2 font-medium whitespace-nowrap',
        'transition-[background-color,color,box-shadow,opacity,filter] duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
