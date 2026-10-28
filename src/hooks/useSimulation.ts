import { useCallback, useEffect, useReducer, useRef } from 'react';

export type SimStatus = 'idle' | 'playing' | 'paused' | 'complete';

interface SimState {
  /** Current beat. Equals the beat count once the demo is complete. */
  beat: number;
  status: SimStatus;
  /** Bumped whenever the demo restarts, so demo-local state can be remounted. */
  runId: number;
}

type SimAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'advance'; from: number; total: number }
  | { type: 'jump'; to: number; total: number };

const INITIAL: SimState = { beat: 0, status: 'idle', runId: 0 };

function settle(state: SimState, beat: number, total: number): SimState {
  return beat >= total
    ? { ...state, beat: total, status: 'complete' }
    : { ...state, beat, status: 'playing' };
}

function reducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'play':
      if (state.status === 'playing') return state;
      if (state.status === 'complete') {
        return { beat: 0, status: 'playing', runId: state.runId + 1 };
      }
      return { ...state, status: 'playing' };
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'reset':
      return { beat: 0, status: 'idle', runId: state.runId + 1 };
    case 'advance':
      // Ignore a timer that fired for a beat we've already left.
      if (state.status !== 'playing' || state.beat !== action.from) return state;
      return settle(state, state.beat + 1, action.total);
    case 'jump':
      // Interactions only ever move the story forward.
      if (state.status === 'complete' || action.to <= state.beat) return state;
      return settle(state, action.to, action.total);
  }
}

interface Options {
  /** Start playing automatically the first time this becomes true. */
  autoStart: boolean;
}

export interface Simulation {
  beat: number;
  status: SimStatus;
  runId: number;
  total: number;
  isPlaying: boolean;
  isComplete: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  goTo: (beat: number) => void;
}

/**
 * A pausable, timer-driven script of beats. Pausing remembers how much of the
 * current beat was left, so resuming continues rather than restarting it.
 */
export function useSimulation(durations: readonly number[], { autoStart }: Options): Simulation {
  const total = durations.length;
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const { beat, status, runId } = state;

  const timing = useRef<{ startedAt: number; duration: number } | null>(null);
  const remaining = useRef<number | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (status !== 'playing' || beat >= total) return;
    const duration = remaining.current ?? durations[beat] ?? 0;
    remaining.current = null;
    timing.current = { startedAt: performance.now(), duration };
    const id = window.setTimeout(() => dispatch({ type: 'advance', from: beat, total }), duration);
    return () => window.clearTimeout(id);
  }, [status, beat, runId, total, durations]);

  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    dispatch({ type: 'play' });
  }, [autoStart]);

  const play = useCallback(() => dispatch({ type: 'play' }), []);

  const pause = useCallback(() => {
    if (status !== 'playing') return;
    const t = timing.current;
    remaining.current = t ? Math.max(0, t.duration - (performance.now() - t.startedAt)) : null;
    dispatch({ type: 'pause' });
  }, [status]);

  const toggle = useCallback(() => {
    if (status === 'playing') pause();
    else play();
  }, [status, pause, play]);

  const reset = useCallback(() => {
    remaining.current = null;
    dispatch({ type: 'reset' });
  }, []);

  const goTo = useCallback(
    (to: number) => {
      remaining.current = null;
      dispatch({ type: 'jump', to, total });
    },
    [total],
  );

  return {
    beat,
    status,
    runId,
    total,
    isPlaying: status === 'playing',
    isComplete: status === 'complete',
    play,
    pause,
    toggle,
    reset,
    goTo,
  };
}
