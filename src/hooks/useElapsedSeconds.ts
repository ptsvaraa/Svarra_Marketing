import { useEffect, useState } from 'react';

/** Counts whole seconds while `running` is true. Remount the owner to reset it. */
export function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return seconds;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
