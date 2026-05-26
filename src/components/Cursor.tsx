'use client';

import { useEffect, useRef } from 'react';
import { cursorState } from '@/lib/cursorState';
import styles from './Cursor.module.css';

export default function Cursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const isOverVideoRef = useRef(true);
  const isHoveringRef = useRef(false);

  const lastMoveTime = useRef(Date.now());
  const isIdle = useRef(false);
  const IDLE_TIMEOUT = 600; // 0.6s without movement → idle shrink

  // ── Shake effect state ────────────────────────────────────────
  const shakingRef = useRef(false);
  const shakeStartRef = useRef(0);
  const SHAKE_DURATION = 160;    // ms
  const SHAKE_INTENSITY = 3.5;   // max pixel offset

  useEffect(() => {
    mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    current.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      lastMoveTime.current = Date.now();
      isIdle.current = false;

      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest('button, a, [data-cursor], .interactive, .social-item') !== null;
      const isInsideLeftNav = target.closest('.interactive-nav') !== null;

      const actuallyInteractive = isInteractive && !isInsideLeftNav;
      isHoveringRef.current = actuallyInteractive;
      isOverVideoRef.current = !actuallyInteractive;
    };

    window.addEventListener('mousemove', onMove);

    const handleClick = (e: MouseEvent) => {
      // ── Ripple effect ──────────────────────────────────────────
      const ripple = document.createElement('div');
      ripple.className = styles.ripple;
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;

      // Match ripple shape to the current cursor shape
      if (ringRef.current) {
        const size = ringRef.current.offsetWidth;
        const radius = getComputedStyle(ringRef.current).borderRadius;
        ripple.style.setProperty('--ripple-start-size', `${size}px`);
        ripple.style.setProperty('--ripple-start-radius', radius);
      }

      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1300);

      // ── Shake effect ───────────────────────────────────────────
      shakingRef.current = true;
      shakeStartRef.current = Date.now();
    };
    window.addEventListener('click', handleClick);

    const tick = () => {
      velocity.current.x += (mouse.current.x - current.current.x) * 0.018;
      velocity.current.y += (mouse.current.y - current.current.y) * 0.018;
      velocity.current.x *= 0.885;
      velocity.current.y *= 0.885;
      current.current.x += velocity.current.x;
      current.current.y += velocity.current.y;

      // ── Apply shake offset ─────────────────────────────────────
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;

      if (shakingRef.current) {
        const elapsed = Date.now() - shakeStartRef.current;
        if (elapsed >= SHAKE_DURATION) {
          shakingRef.current = false;
        } else {
          // Decay factor: starts at 1, goes to 0
          const t = elapsed / SHAKE_DURATION;
          const decay = 1 - t;
          // Random jitter that changes every frame
          shakeOffsetX = (Math.random() - 0.5) * 2 * SHAKE_INTENSITY * decay;
          shakeOffsetY = (Math.random() - 0.5) * 2 * SHAKE_INTENSITY * decay;
        }
      }

      const displayX = current.current.x + shakeOffsetX;
      const displayY = current.current.y + shakeOffsetY;

      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);
      const angle = Math.atan2(velocity.current.y, velocity.current.x) * 180 / Math.PI;
      const stretchX = 1 + Math.min(speed * 0.018, 0.52);
      const stretchY = 1 - Math.min(speed * 0.006, 0.22);

      const time = Date.now() * 0.0007;
      const r1 = 48 + Math.sin(time) * 8;
      const r2 = 52 + Math.cos(time * 1.15) * 6;
      const r3 = 56 + Math.sin(time * 1.35) * 7;
      const r4 = 44 + Math.cos(time * 1.5) * 8;

      // Check idle state — shrink cursor when not moving
      if (Date.now() - lastMoveTime.current > IDLE_TIMEOUT) {
        isIdle.current = true;
      }

      // 50% bigger (126) when over video background, 84 otherwise
      const activeSize = isOverVideoRef.current ? 126 : 84;
      const targetSize = isIdle.current ? Math.max(activeSize * 0.65, 40) : activeSize;

      // Write live state to shared singleton — read by VideoManager
      cursorState.x = displayX;
      cursorState.y = displayY;
      cursorState.r1 = r1;
      cursorState.r2 = r2;
      cursorState.r3 = r3;
      cursorState.r4 = r4;
      cursorState.size = targetSize;
      cursorState.isOverVideo = isOverVideoRef.current;

      const transformStr = `translate(-50%,-50%) rotate(${angle}deg) scale(${stretchX},${stretchY})`;
      const radiusStr = `${r1}% ${r2}% ${r3}% ${r4}% / ${r3}% ${r1}% ${r4}% ${r2}%`;

      if (wrapRef.current) {
        wrapRef.current.style.left = `${displayX}px`;
        wrapRef.current.style.top = `${displayY}px`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = transformStr;
        ringRef.current.style.borderRadius = radiusStr;
        ringRef.current.style.width = `${targetSize}px`;
        ringRef.current.style.height = `${targetSize}px`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.cursorWrap}>
      {/* Organic liquid ring */}
      <div ref={ringRef} className={styles.cursorRing} />
    </div>
  );
}
