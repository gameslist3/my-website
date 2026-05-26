'use client';

import { useEffect, useRef } from 'react';

/**
 * SoundManager — orchestrates all audio using the Web Audio API.
 *
 * Expects these files in `public/sounds/`:
 *   - background.mp3   (looped background music)
 *   - click.mp3        (played on every click)
 *   - hover.mp3        (played on mouse‑enter of interactive elements)
 *
 * Background music attempts to auto-play immediately on mount. If the browser
 * blocks autoplay (AudioContext suspended), it resumes on the very first user
 * interaction — moving the mouse, pressing a key, scrolling, or touching the
 * screen. No deliberate click is required.
 */

interface SoundManagerProps {
  /** Master toggle — set false to mute everything */
  enabled?: boolean;
}

const INTERACTIVE_SELECTOR = 'button, a, [data-cursor], .interactive';

// Audio file URLs to preload
const SOUND_FILES: Record<string, string> = {
  click: '/sounds/click.mp3',
  hover: '/sounds/hover.mp3',
  background: '/sounds/background.mp3',
};

export default function SoundManager({ enabled = true }: SoundManagerProps) {
  /** Refs are used instead of state to avoid re-renders */
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Record<string, AudioBuffer | null>>({
    click: null,
    hover: null,
    background: null,
  });
  const resumedRef = useRef(false);     // AudioContext has been resumed
  const bgPlayingRef = useRef(false);   // background loop started
  const lastHoveredRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // ── 1. Create AudioContext & load all buffers ─────────────────
    let cancelled = false;

    async function init() {
      try {
        const AudioCtx = window.AudioContext ??
          (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        if (cancelled) { ctx.close(); return; }
        ctxRef.current = ctx;

        // Fetch & decode all files in parallel
        const results = await Promise.all(
          Object.entries(SOUND_FILES).map(async ([key, url]) => {
            try {
              const res = await fetch(url);
              const ab = await res.arrayBuffer();
              const buf = await ctx.decodeAudioData(ab);
              return { key, buf };
            } catch (err) {
              console.warn(`[SoundManager] Failed to load "${key}":`, err);
              return { key, buf: null };
            }
          }),
        );

        if (cancelled) return;

        for (const { key, buf } of results) {
          buffersRef.current[key] = buf;
        }

        console.log('[SoundManager] All audio files loaded & decoded');

        // ── Attempt auto-play after buffers are loaded ──────────────
        tryAutoPlay(ctx);
      } catch (err) {
        console.warn('[SoundManager] AudioContext creation failed:', err);
      }
    }

    init();

    // ── 2. Helper: try to auto-play background music ──────────────
    function tryAutoPlay(ctx: AudioContext) {
      if (bgPlayingRef.current) return;

      if (ctx.state === 'running') {
        // Context is already running — start background immediately
        startBg();
      } else if (ctx.state === 'suspended') {
        // Browser blocks autoplay — try to resume, will likely fail
        ctx.resume().then(() => {
          if (!cancelled && !bgPlayingRef.current) {
            startBg();
          }
        }).catch(() => {
          // Resume failed — will start on first user interaction
          console.log('[SoundManager] Autoplay blocked, waiting for first interaction');
        });
      }
    }

    // ── 3. Helper: play a one-shot sound effect ───────────────────
    function play(name: 'click' | 'hover') {
      const ctx = ctxRef.current;
      const buf = buffersRef.current[name];
      if (!ctx || !buf) return;

      try {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buf;
        gain.gain.value = name === 'click' ? 0.8 : 0.6;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
      } catch (err) {
        console.warn(`[SoundManager] Error playing "${name}":`, err);
      }
    }

    // ── 4. Helper: start looping background music ─────────────────
    function startBg() {
      const ctx = ctxRef.current;
      const buf = buffersRef.current.background;
      if (!ctx || !buf || bgPlayingRef.current) return;

      try {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buf;
        source.loop = true;
        gain.gain.value = 0.4;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        bgPlayingRef.current = true;
        console.log('[SoundManager] Background music started');
      } catch (err) {
        console.warn('[SoundManager] Error starting background:', err);
      }
    }

    // ── 5. Resume AudioContext on first user interaction ──────────
    function resumeOnInteraction() {
      const ctx = ctxRef.current;
      if (!ctx || resumedRef.current || bgPlayingRef.current) return;

      resumedRef.current = true;

      // Resume the context (this is inside a user gesture handler)
      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => {
          console.warn('[SoundManager] Failed to resume context:', err);
        });
      }

      // Start background music
      startBg();
    }

    // ── 6. Event handlers ────────────────────────────────────────

    // Resume on first interaction — no click required.
    // pointerdown covers mouse press, touch, and pen.
    // scroll and keydown cover other natural interactions.
    // mousemove and pointermove cover cursor activity for an instant auto-play on load.
    const interactionEvents = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'mousemove', 'pointermove'] as const;
    const interactionHandlers = interactionEvents.map((event) => {
      const handler = () => resumeOnInteraction();
      document.addEventListener(event, handler, { once: true });
      return { event, handler };
    });

    // Click sound effect (separate from interaction resume)
    const handleClick = () => {
      play('click');
    };
    document.addEventListener('click', handleClick);

    // Hover sound (event delegation)
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(INTERACTIVE_SELECTOR);

      if (interactive && interactive !== lastHoveredRef.current) {
        lastHoveredRef.current = interactive;
        play('hover');
      } else if (!interactive) {
        lastHoveredRef.current = null;
      }
    };
    document.addEventListener('mouseover', handleMouseOver);

    // ── 7. Cleanup ───────────────────────────────────────────────
    return () => {
      cancelled = true;

      for (const { event, handler } of interactionHandlers) {
        document.removeEventListener(event, handler);
      }
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseover', handleMouseOver);

      ctxRef.current?.close();
      ctxRef.current = null;
      resumedRef.current = false;
      bgPlayingRef.current = false;
      lastHoveredRef.current = null;
      buffersRef.current = { click: null, hover: null, background: null };
    };
  }, [enabled]);

  return null;
}
