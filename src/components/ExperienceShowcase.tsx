'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import styles from './ExperienceShowcase.module.css';
import { profileData } from '@/lib/profileData';

type Experience = {
  role: string;
  company: string;
  duration: string;
  description: string;
};

function extractStartYear(duration: string): number {
  const match = duration.match(/(\d{4})/);
  return match ? parseInt(match[1]) : 0;
}

/* ── Reverse experiences (oldest first: 2019 → 2023) ── */
const experiences: Experience[] = [...profileData.experience].reverse();

/* ── Company name → logo image mapping ── */
const COMPANY_LOGOS: Record<string, string> = {
  'viacon': '/images/vicaon 1.png',
  'totalai': '/images/total 1.png',
  'intolap': '/images/intolap 1.png',
  'tarini': '/images/tarini_consulting_logo_transparent 1.png',
  'royal': '/images/royalyourk.png',
};

function getLogoForCompany(company: string): string {
  const key = Object.keys(COMPANY_LOGOS).find(k =>
    company.toLowerCase().includes(k)
  );
  return key ? COMPANY_LOGOS[key] : '';
}


/* ══════════════════════════════════════════════════
   YEAR COUNTDOWN — Direct DOM updates
   Split into individual character spans
   ══════════════════════════════════════════════════ */

function YearCounter({ targetYear, yearKey }: { targetYear: number; yearKey: number }) {
  const [phase, setPhase] = useState<'counting' | 'settled'>('counting');
  const [displayYear, setDisplayYear] = useState(1997);
  const displayYearRef = useRef(1997);
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<HTMLSpanElement[]>([]);



  const handlePhaseChange = useCallback((p: 'counting' | 'settled') => {
    setPhase(p);
  }, []);

  useEffect(() => {
    setPhase('counting');
  }, [targetYear]);

  // Countdown animation — direct DOM updates via refs, no React re-render during animation
  useEffect(() => {
    const startCountdown = () => {
      const startValue = displayYearRef.current;
      const difference = Math.abs(targetYear - startValue);
      const duration = difference > 10 ? 2800 : 800 + difference * 100;
      let startTime: number | null = null;
      let rafId: number;

      handlePhaseChange('counting');

      function animate(ts: number) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        const current = Math.round(startValue + (targetYear - startValue) * eased);
        displayYearRef.current = current;

        // Direct DOM update — no React re-render
        const yearStr = String(current);
        yearStr.split('').forEach((ch, i) => {
          if (spanRefs.current[i]) {
            spanRefs.current[i].textContent = ch;
          }
        });

        if (t < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          // Final settle — sync React state + DOM
          const finalStr = String(targetYear);
          finalStr.split('').forEach((ch, i) => {
            if (spanRefs.current[i]) {
              spanRefs.current[i].textContent = ch;
            }
          });
          setDisplayYear(targetYear); // sync React state
          displayYearRef.current = targetYear; // sync ref
          handlePhaseChange('settled');
        }
      }

      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    };

    const cleanup = startCountdown();
    return cleanup;
  }, [targetYear, handlePhaseChange]);

  // Render individual character spans (like split() in the user's code)
  const yearStr = String(displayYear);

  const setSpanRef = (i: number) => (el: HTMLSpanElement | null) => {
    if (el) spanRefs.current[i] = el;
  };

  return (
    <div className={styles.yearSection}>
      <div
        className={`${styles.yearDigit} ${phase === 'counting' ? styles.yearCounting : styles.yearSettled}`}
        ref={containerRef}
      >
        {yearStr.split('').map((ch, i) => (
          <span
            key={i}
            className={styles.yearChar}
            ref={setSpanRef(i)}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPANY LOGO — Overlaid on the year text
   ══════════════════════════════════════════════════ */

function CompanyLogo({ company, isActive }: { company: string; isActive: boolean }) {
  const logoSrc = getLogoForCompany(company);

  return (
    <motion.div
      className={styles.logoSection}
      initial={{ opacity: 0, scale: 0.5, filter: 'blur(8px)' }}
      animate={isActive ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.companyLogoWrap}>
        <div className={styles.companyLogo}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={`${company} logo`}
              className={styles.logoImage}
            />
          ) : (
            <span className={styles.companyInitial}>{company.charAt(0)}</span>
          )}
        </div>

      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   CARD DETAILS — Below the year text
   ══════════════════════════════════════════════════ */

function CardDetails({ exp, index, total, isActive }: {
  exp: Experience;
  index: number;
  total: number;
  isActive: boolean;
}) {
  return (
    <motion.div
      className={styles.cardDetails}
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={
        isActive
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, y: -15, filter: 'blur(3px)' }
      }
      transition={{ duration: 0.9, ease: [0.19, 1, 0.28, 1] }}
    >
      <div className={styles.cardHeaderRow}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardIndex}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={styles.roleTitle}>{exp.role}</h3>
        </div>
        <div className={styles.durationBadge}>
          {exp.duration}
        </div>
      </div>
      <p className={styles.description}>{exp.description}</p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   BACKGROUND DECORATIONS — Very light, performant
   ══════════════════════════════════════════════════ */

function BackgroundDecorations() {
  return (
    <div className={styles.bgDecorations}>
      <div className={styles.orbitRingMain}>
        <div className={styles.orbitDot} style={{ top: '0%', left: '50%' }} />
        <div className={styles.orbitDot} style={{ bottom: '15%', left: '15%', width: '4px', height: '4px' }} />
        <div className={styles.orbitDot} style={{ top: '30%', right: '-3%', width: '3px', height: '3px' }} />
      </div>
      <div className={styles.orbitRingSecondary}>
        <div className={styles.orbitDot} style={{ bottom: '0%', right: '50%' }} />
        <div className={styles.orbitDot} style={{ top: '20%', left: '10%', width: '5px', height: '5px' }} />
      </div>
      <div className={styles.glowOrb} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   NAVIGATION DOTS
   ══════════════════════════════════════════════════ */

function NavDots({
  total,
  activeIndex,
  onNavigate,
}: {
  total: number;
  activeIndex: number;
  onNavigate: (i: number) => void;
}) {
  return (
    <div className={styles.navDots}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.button
          key={i}
          className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
          onClick={() => onNavigate(i)}
          whileHover={{ scale: 1.4 }}
          whileTap={{ scale: 0.9 }}
          aria-label={`Go to experience ${i + 1}`}
        >
          {i === activeIndex && (
            <motion.div
              className={styles.dotFill}
              layoutId="dotFill"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}



/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */

export default function ExperienceShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  const allYears = experiences.map(e => extractStartYear(e.duration));

  const handleNavigate = useCallback(
    (dir: number) => {
      const next = activeIndex + dir;
      if (next >= 0 && next < experiences.length) {
        setActiveIndex(next);
      }
    },
    [activeIndex, experiences.length]
  );

  const goToIndex = useCallback((i: number) => {
    setActiveIndex(i);
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = 50;

    if ((offset > threshold || velocity > 300) && activeIndex > 0) {
      handleNavigate(-1);
    } else if ((offset < -threshold || velocity < -300) && activeIndex < experiences.length - 1) {
      handleNavigate(1);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleNavigate(-1);
      else if (e.key === 'ArrowRight') handleNavigate(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNavigate]);

  return (
    <div className={styles.scene}>
      <BackgroundDecorations />

      <div className={styles.yearRegion}>
        <YearCounter targetYear={allYears[activeIndex]} yearKey={activeIndex} />
      </div>

      <div className={styles.logoRegion}>
        <AnimatePresence mode="wait">
          <CompanyLogo
            key={activeIndex}
            company={experiences[activeIndex].company}
            isActive={true}
          />
        </AnimatePresence>
      </div>

      <motion.div
        className={styles.dragArea}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.detailsRegion}>
          <AnimatePresence mode="wait">
            <CardDetails
              key={activeIndex}
              exp={experiences[activeIndex]}
              index={activeIndex}
              total={experiences.length}
              isActive={true}
            />
          </AnimatePresence>
        </div>
      </motion.div>

      <div className={styles.controls}>
        <NavDots
          total={experiences.length}
          activeIndex={activeIndex}
          onNavigate={goToIndex}
        />
      </div>

      <div className={styles.progressTrack}>
        <motion.div
          className={styles.progressFill}
          animate={{ scaleX: (activeIndex + 1) / experiences.length }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
