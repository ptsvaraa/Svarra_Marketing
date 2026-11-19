/**
 * A synthesised two-tone siren (Web Audio, no sound file). Start it from a click, since
 * browsers only allow audio after a user gesture. Returns a function that stops it.
 */
export function startSiren(): () => void {
  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return () => {};
  const ctx = new Ctx();

  // A tone sweeping between about 650 and 1250 Hz, once every 1.4 seconds.
  const tone = ctx.createOscillator();
  tone.type = 'sawtooth';
  tone.frequency.value = 950;
  const sweep = ctx.createOscillator();
  sweep.frequency.value = 1 / 1.4;
  const sweepDepth = ctx.createGain();
  sweepDepth.gain.value = 300;
  sweep.connect(sweepDepth).connect(tone.frequency);

  // Soften the sawtooth and keep the volume modest.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2400;
  const volume = ctx.createGain();
  volume.gain.setValueAtTime(0, ctx.currentTime);
  volume.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
  tone.connect(filter).connect(volume).connect(ctx.destination);

  tone.start();
  sweep.start();

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    volume.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    window.setTimeout(() => void ctx.close(), 250);
  };
}
