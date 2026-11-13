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

/**
 * Unlock Web Audio Context on first customer interaction (e.g. clicking checkout)
 * to comply with mobile browser autoplay policy.
 */
export function unlockAudioContext() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (_) {}
}

/**
 * Customer Alert Chime: Warm, melodic 3-tone chime (C5 -> E5 -> G5)
 * Played when the barista or cashier rings the customer phone from POS.
 */
export function playCustomerChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic 3-note arpeggio (C5: ~523.25, E5: ~659.25, G5: ~783.99)
    const notes = [
      { freq: 523.25, start: now, duration: 0.45, gain: 0.22 },
      { freq: 659.25, start: now + 0.15, duration: 0.45, gain: 0.24 },
      { freq: 783.99, start: now + 0.30, duration: 0.65, gain: 0.26 },
    ];

    notes.forEach(({ freq, start, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gainNode.gain.setValueAtTime(gain, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);

      osc.onended = () => {
        try {
          osc.disconnect();
          gainNode.disconnect();
        } catch {
          // Safe ignore
        }
      };
    });
  } catch (err) {
    console.warn('Gagal memutar customer chime:', err);
  }
}

