/**
 * Lightweight, dependency-free visual and audio effects.
 *
 * Everything here is procedural: no image, audio, or third-party assets are
 * loaded, and nothing initializes until a tool actually needs it. Both helpers
 * are safe to call on any page — they no-op when their API is unavailable.
 */

/* ------------------------------------------------------------------ */
/* Result reveal                                                       */
/* ------------------------------------------------------------------ */

export interface RevealOptions {
  /** Add a soft glow pulse — use for winner-style results. */
  celebrate?: boolean;
  /** Run a confetti burst on this element after it appears. */
  confetti?: boolean;
}

/**
 * Reveal a result element with its entrance animation.
 *
 * Safe to call repeatedly: the animation classes are removed and the element is
 * reflowed first, so a second call restarts the motion instead of being ignored.
 */
export function revealResult(element: HTMLElement | null, options: RevealOptions = {}): void {
  if (!element) return;

  element.classList.remove('hidden');
  element.classList.remove('result-reveal');
  void element.offsetWidth; // force reflow so the animation restarts
  element.classList.add('result-reveal');

  if (options.celebrate) {
    element.classList.remove('celebrate-soft');
    void element.offsetWidth;
    element.classList.add('celebrate-soft');
  }

  if (options.confetti) burstConfetti(element);
}

/* ------------------------------------------------------------------ */
/* Confetti                                                            */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = ['#7e93eb', '#aebeff', '#17233f', '#dfe5f0', '#56627a'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
  life: number;
}

export interface ConfettiOptions {
  /** Number of particles in the burst. */
  count?: number;
  /** How far (px) particles spread horizontally from the origin. */
  spread?: number;
  /** Duration of the effect in ms. */
  duration?: number;
}

/**
 * Fire a small confetti burst centred on `target`.
 *
 * Particles are drawn to a temporary fixed-position canvas that is removed once
 * the animation finishes, so there is no lasting DOM or memory cost. Honors
 * `prefers-reduced-motion` by doing nothing.
 */
export function burstConfetti(target: HTMLElement, options: ConfettiOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const { count = 26, spread = 90, duration = 1500 } = options;
  // `spread` scales the horizontal velocity only; vertical is left to gravity
  // so a wider burst still arcs like confetti rather than a flat spray.
  const spreadScale = spread / 90;
  // Furthest a particle can get from the origin: with drag 0.99 per frame the
  // velocity decays geometrically, so total travel converges on v0 / 0.01 over
  // the ~90 frames of a 1500ms burst. vx peaks at 3.6px/frame, giving ~214px,
  // plus a little for the particle's own size. Anything less than this and the
  // arcs get clipped at the canvas edge mid-flight.
  const pad = Math.round(240 * Math.max(1, spreadScale));
  const rect = target.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const cssWidth = rect.width + pad * 2;
  const cssHeight = rect.height + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    left: `${rect.left - pad}px`,
    top: `${rect.top - pad}px`,
    width: `${cssWidth}px`,
    height: `${cssHeight}px`,
    pointerEvents: 'none',
    zIndex: '40',
  } satisfies Partial<CSSStyleDeclaration>);

  // Cap the backing store at 2x: confetti is soft-edged and short-lived, so a
  // 3x buffer on a high-DPI phone would cost ~2x the per-frame fill for no
  // visible gain. This keeps the effect cheap on mobile.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(cssWidth * pixelRatio));
  canvas.height = Math.max(1, Math.floor(cssHeight * pixelRatio));

  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  // Particle coordinates are stored relative to the canvas origin.
  const localX = originX - (rect.left - pad);
  const localY = originY - (rect.top - pad);

  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 1.8 + Math.random() * 1.8;
    return {
      x: localX,
      y: localY,
      vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5) * spreadScale,
      vy: Math.sin(angle) * speed - Math.random() * 1.4,
      size: 4 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      life: 1,
    };
  });

  document.body.appendChild(canvas);

  const start = performance.now();
  let frame = 0;

  const step = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    context.clearRect(0, 0, cssWidth, cssHeight);

    for (const particle of particles) {
      particle.vy += 0.12; // gravity
      particle.vx *= 0.99; // air drag
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.spin;
      particle.life = 1 - progress;

      context.save();
      context.globalAlpha = Math.max(0, particle.life);
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      const w = particle.size;
      const h = particle.size * 0.6;
      context.fillRect(-w / 2, -h / 2, w, h);
      context.restore();
    }

    if (progress < 1) {
      frame = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(frame);
      canvas.remove();
    }
  };

  frame = requestAnimationFrame(step);
}

/* ------------------------------------------------------------------ */
/* Sound                                                               */
/* ------------------------------------------------------------------ */

export interface SoundKit {
  /** Short click as the wheel passes a segment boundary. */
  tick(): void;
  /** Warmer two-note chime when the wheel lands. */
  chime(): void;
  /** Total silence toggle. */
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Call from a user gesture to satisfy autoplay policies (iOS Safari). */
  unlock(): void;
}

/**
 * Create a procedurally generated sound kit backed by the Web Audio API.
 *
 * The audio context is created lazily on first use so no audio machinery is
 * set up for visitors who never enable sound.
 */
export function createSoundKit(): SoundKit {
  let context: AudioContext | null = null;
  let muted = true;

  const getContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (context) return context;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch {
      return null;
    }
    return context;
  };

  const playTone = (
    ctx: AudioContext,
    frequency: number,
    startOffset: number,
    duration: number,
    peakGain: number,
    type: OscillatorType
  ) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const startAt = ctx.currentTime + startOffset;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  };

  return {
    tick() {
      if (muted) return;
      const ctx = getContext();
      if (!ctx) return;
      playTone(ctx, 1180, 0, 0.035, 0.035, 'square');
    },
    chime() {
      if (muted) return;
      const ctx = getContext();
      if (!ctx) return;
      // C5 -> E5, a warm major third.
      playTone(ctx, 523.25, 0, 0.35, 0.09, 'sine');
      playTone(ctx, 659.25, 0.07, 0.45, 0.07, 'sine');
    },
    setMuted(next: boolean) {
      muted = next;
    },
    isMuted() {
      return muted;
    },
    unlock() {
      const ctx = getContext();
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    },
  };
}
