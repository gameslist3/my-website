'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './WorkShowcase.module.css';
import { behanceProjects } from '@/lib/behanceProjects';

const springSmooth = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 28,
  mass: 0.8,
};

/* ── Color palettes per project ──────────────────── */
const projectPalettes = [
  { bg: ['#0f0f1a', '#1a1a2e'], accent: '#B2F548', glow: 'rgba(178, 245, 72, 0.12)' },
  { bg: ['#1a0f1a', '#2d1b2e'], accent: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.12)' },
  { bg: ['#0f1a0f', '#1b2d1a'], accent: '#64FFDA', glow: 'rgba(100, 255, 218, 0.12)' },
  { bg: ['#1a0f0f', '#2e1b1b'], accent: '#FFD93D', glow: 'rgba(255, 217, 61, 0.12)' },
];

/* ── Cover image component ──────────────────────── */
function CoverImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`${styles.coverWrap} ${className || ''}`}>
      <img
        src={src}
        alt={alt}
        className={styles.coverImg}
        loading="lazy"
        onError={(e) => {
          // If image fails to load, show a gradient fallback
          const target = e.currentTarget;
          target.style.display = 'none';
        }}
      />
      {/* Fallback gradient shown while image loads or on error */}
      <div className={styles.coverFallback} />
    </div>
  );
}

export default function WorkShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const total = behanceProjects.length;

  /* ── 3 visible slots ──────────────────────────── */
  const visibleSlots = useMemo(() => {
    const slots: { project: (typeof behanceProjects)[0]; offset: number; gridIndex: number; id: number }[] = [];
    for (let i = -1; i <= 1; i++) {
      const idx = ((currentIndex + i) % total + total) % total;
      slots.push({ project: behanceProjects[idx], offset: i, gridIndex: idx, id: idx });
    }
    return slots;
  }, [currentIndex, total]);

  /* ── Navigation ───────────────────────────────── */
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => ((prev + 1) % total + total) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => ((prev - 1) % total + total) % total);
  }, [total]);

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < total) setCurrentIndex(idx);
  }, [total]);

  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      setIsDragging(false);
      const threshold = 50;
      if (info.offset.x < -threshold || info.velocity.x < -250) goNext();
      else if (info.offset.x > threshold || info.velocity.x > 250) goPrev();
    },
    [goNext, goPrev]
  );

  /* ── Keyboard nav ─────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const palette = projectPalettes[currentIndex % projectPalettes.length];

  return (
    <div
      className={styles.container}
      data-cursor="project"
      style={{ '--accent': palette.accent, '--glow': palette.glow } as React.CSSProperties}
    >
      {/* ── Floating ambient particles ──────────── */}
      <div className={styles.particles}>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            style={{
              left: `${5 + ((i * 17) % 90)}%`,
              top: `${8 + ((i * 23) % 84)}%`,
              width: `${1.5 + (i % 3) * 1.5}px`,
              height: `${1.5 + (i % 3) * 1.5}px`,
            }}
            animate={{
              y: [0, -(14 + (i % 10) * 4), 0],
              x: [0, (i % 2 === 0 ? 1 : -1) * (4 + (i % 6) * 2), 0],
              opacity: [0.15, 0.6, 0.15],
            }}
            transition={{
              duration: 4 + (i % 5) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* ── Main carousel ──────────────────────── */}
      <div className={styles.carousel} ref={constraintsRef}>
        {/* Background ambient glow behind center */}
        <motion.div
          className={styles.centerGlow}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {visibleSlots.map(({ project, offset, id }) => {
          const isCenter = offset === 0;
          const xPos = offset * 360;
          const cardScale = isCenter ? 1 : 0.55;
          const cardOpacity = isCenter ? 1 : 0.6;
          const cardBlur = isCenter ? 0 : 5;
          const zIdx = isCenter ? 10 : 5 - Math.abs(offset);
          const pal = projectPalettes[id % projectPalettes.length];

          return (
            <motion.div
              key={id}
              layout
              className={`${styles.card} ${isCenter ? styles.centerCard : styles.sideCard} ${isDragging && isCenter ? styles.dragging : ''} interactive`}
              style={{ zIndex: zIdx } as React.CSSProperties}
              initial={false}
              animate={{
                x: xPos,
                scale: cardScale,
                opacity: cardOpacity,
                filter: `blur(${cardBlur}px)`,
              }}
              transition={springSmooth}
              whileHover={isCenter ? {
                scale: 1.02,
                boxShadow: '0 60px 200px rgba(0,0,0,0.65), 0 0 80px var(--glow)',
                transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] },
              } : {
                scale: cardScale * 1.04,
                transition: { duration: 0.35, ease: [0.19, 1, 0.22, 1] },
              }}
              drag={isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              whileDrag={isCenter ? { scale: 0.94, transition: { duration: 0.08 } } : undefined}
            >
              {/* Card background layer */}
              <div
                className={styles.cardBg}
                style={{
                  background: `linear-gradient(145deg, ${pal.bg[0]}, ${pal.bg[1]})`,
                }}
              />

              {/* Shine sweep */}
              <div className={styles.shine} />

              {/* Glow ring on center card */}
              {isCenter && <div className={styles.cardGlow} />}

              {/* ── SIDE CARD: visual-only preview ───── */}
              {!isCenter && (
                <div className={styles.sidePreview}>
                  <CoverImage src={project.coverUrl} alt={project.title} />
                  <div className={styles.sideOverlay} />
                  <div className={styles.sideTitle}>
                    {project.title.length > 30
                      ? project.title.slice(0, 28) + '…'
                      : project.title}
                  </div>
                </div>
              )}

              {/* ── CENTER CARD: full preview ────────── */}
              {isCenter && (
                <div className={styles.centerInner}>
                  {/* Full-bleed cover image */}
                  <CoverImage src={project.coverUrl} alt={project.title} />

                  {/* Gradient overlay for readability */}
                  <div className={styles.centerOverlay} />

                  {/* Content overlay */}
                  <div className={styles.centerContent}>
                    {/* Top zone: type badge */}
                    <div className={styles.typeBadge}>
                      <span className={styles.typeDot} />
                      {project.type}
                    </div>

                    {/* Title */}
                    <h2 className={styles.title}>{project.title}</h2>

                    {/* Description */}
                    <p className={styles.description}>{project.description}</p>

                    {/* Action row */}
                    <div className={styles.actions}>
                      <a
                        href={project.behanceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewBtn}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Behance
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>

                      {/* Prev/Next */}
                      <div className={styles.navBtns}>
                        <button
                          className={`${styles.navBtn} interactive`}
                          onClick={(e) => { e.stopPropagation(); goPrev(); }}
                          aria-label="Previous project"
                        >
                          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          className={`${styles.navBtn} interactive`}
                          onClick={(e) => { e.stopPropagation(); goNext(); }}
                          aria-label="Next project"
                        >
                          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Navigation dots ────────────────────── */}
      <div className={styles.navDots}>
        {behanceProjects.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
            onClick={() => goTo(idx)}
            aria-label={`Go to project ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
