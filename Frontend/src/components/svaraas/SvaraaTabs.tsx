import { useRef, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import type { Svaraa, SvaraaId } from '../../data/svaraas';

export const tabId = (prefix: string, id: SvaraaId) => `${prefix}-tab-${id}`;

interface SvaraaTabsProps {
  items: readonly Svaraa[];
  selected: SvaraaId;
  onSelect: (id: SvaraaId) => void;
  /** Namespaces element ids and the indicator animation, so several tab bars can coexist. */
  idPrefix: string;
  panelId: string;
  label: string;
  className?: string;
}

/** WAI-ARIA tabs with roving tabindex and automatic activation on arrow keys. */
export function SvaraaTabs({ items, selected, onSelect, idPrefix, panelId, label, className }: SvaraaTabsProps) {
  const refs = useRef(new Map<SvaraaId, HTMLButtonElement>());

  const activate = (id: SvaraaId) => {
    onSelect(id);
    refs.current.get(id)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((s) => s.id === selected);
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    const target = next === null ? undefined : items[next];
    if (!target) return;
    e.preventDefault();
    activate(target.id);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      // Never scrolls: tabs are compact and wrap to a second row on narrow screens, so every label stays visible.
      className={cn('flex flex-wrap justify-center gap-x-0.5 gap-y-1', className)}
    >
      {items.map((s) => {
        const isSelected = s.id === selected;
        return (
          <button
            key={s.id}
            ref={(el) => {
              if (el) refs.current.set(s.id, el);
              else refs.current.delete(s.id);
            }}
            id={tabId(idPrefix, s.id)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => activate(s.id)}
            className={cn(
              'relative shrink-0 rounded-lg px-2.5 py-2 text-[0.85rem] transition-colors duration-200 sm:px-3 sm:text-[0.9rem]',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary',
              isSelected ? 'font-semibold text-primary' : 'text-muted hover:text-heading',
            )}
          >
            {s.label}
            {isSelected && (
              <motion.span
                layoutId={`${idPrefix}-tab-indicator`}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
