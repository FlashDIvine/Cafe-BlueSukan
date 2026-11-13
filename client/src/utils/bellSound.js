/**
 * Audio Alert helper using Web Audio API (Synthesized Ding-Dong chime)
 * Works without external .mp3 files and prevents 404/network latency issues.
 * Uses a single global AudioContext instance (singleton) and explicitly
 * disconnects transient nodes on end to eliminate browser audio memory leaks.
 */
let sharedAudioCtx = null;

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playCashierBell() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Two-tone harmonic chime (E5 -> C5)
    // 1st Tone (E5: ~659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);

    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);

    // Disconnect audio nodes immediately after tone completes to release hardware RAM
    osc1.onended = () => {
      try {
        osc1.disconnect();
        gain1.disconnect();
      } catch {
        // Safe ignore
      }
    };

    // 2nd Tone (C5: ~523.25 Hz) starting slightly after
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.16);

    gain2.gain.setValueAtTime(0.25, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.16);
    osc2.stop(now + 0.75);

    // Disconnect audio nodes immediately after tone completes to release hardware RAM
    osc2.onended = () => {
      try {
        osc2.disconnect();
        gain2.disconnect();
      } catch {
        // Safe ignore
      }
    };
  } catch (err) {
    console.warn('Audio alert diblokir oleh browser sebelum ada interaksi:', err);
  }
}

