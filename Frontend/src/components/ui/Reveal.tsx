import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Fades content in when `show` flips on. Hidden content keeps its space (no
 * layout shift as the demo progresses) and is `inert`, so it can't be focused
 * or read by assistive tech until it appears.
 */
export function Reveal({
  show,
  delay = 0,
  className,
  children,
}: {
  show: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.5, ease: EASE, delay: show ? delay : 0 }}
      inert={!show}
    >
      {children}
    </motion.div>
  );
}
