'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LeftNav.module.css';

interface LeftNavProps {
  activeSection: number;
  setActiveSection: (sec: number) => void;
}

const sections = ['Overview', 'Work', 'Experience', 'Profiles', 'Contact'];

export default function LeftNav({ activeSection, setActiveSection }: LeftNavProps) {
  const [holding, setHolding] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation on window resize (debounced 150ms)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setAnimationKey((prev) => prev + 1);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const isFirstMount = useRef(true);

  // Trigger animation when activeSection changes (scroll-based screen change)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setAnimationKey((prev) => prev + 1);
  }, [activeSection]);

  const optionARef = useRef<HTMLDivElement>(null);
  const optionBRef = useRef<HTMLDivElement>(null);
  const optionCRRef = useRef<HTMLDivElement>(null);
  const optionDRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setHolding(false);
      setActiveOption(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!holding) return;

      const checkInside = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return false;
        const rect = ref.current.getBoundingClientRect();
        return (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        );
      };

      if (checkInside(optionARef)) {
        setActiveOption('a');
      } else if (checkInside(optionBRef)) {
        setActiveOption('b');
      } else if (checkInside(optionCRRef)) {
        setActiveOption('c');
      } else if (checkInside(optionDRef)) {
        setActiveOption('d');
      } else {
        setActiveOption(null);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [holding]);

  return (
    <motion.div
      className={`${styles.leftNav} interactive-nav`}
      initial={{ opacity: 0, scale: 0.85, x: -60, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 2.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Stacked Cards ── */}
      <AnimatePresence mode="wait">
        <motion.div
          className={styles.stack}
          key={`stack-${animationKey}`}
          initial={{ opacity: 0, scale: 0.6, x: -200, filter: 'blur(15px) brightness(2)' }}
          animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px) brightness(1)' }}
          exit={{ opacity: 0, scale: 0.3, x: 280, filter: 'blur(24px) brightness(2.5)', transition: { duration: 0.5 } }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
        {/* CARD 1 — Ask */}
        <div className={`${styles.card} ${styles.card1} interactive`}>
          <div className={styles.content}>
            <div className={styles.icon}>
              <svg viewBox="0 0 24 24" width="100%" height="100%">
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8c1.85 0 3.55-.63 4.9-1.69l4.39 4.39 1.41-1.41-4.39-4.39A7.93 7.93 0 0 0 18 10c0-4.42-3.58-8-8-8Z" />
              </svg>
            </div>
            <div className={styles.title}>Ask</div>
          </div>
        </div>

        {/* CARD 2 — Resume */}
        <div className={`${styles.card} ${styles.card2} interactive`}>
          <div className={styles.content}>
            <div className={styles.icon}>
              <svg viewBox="0 0 24 24" width="100%" height="100%">
                <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
              </svg>
            </div>
            <div className={styles.title}>Resume</div>
          </div>
        </div>

        {/* CARD 3 — Social Card with drag-hold options */}
        <div
          className={`${styles.card} ${styles.card3} ${styles.socialCard} ${holding ? styles.holding : ''} interactive`}
          onMouseDown={(e) => {
            if (e.button === 0) { // Left click
              setHolding(true);
            }
          }}
        >
          <div className={styles.socialGrid}>
            <div
              ref={optionARef}
              className={`${styles.option} ${styles.optionA} ${activeOption === 'a' ? styles.active : ''}`}
            >
              <div className={styles.socialItem}>IN</div>
            </div>
            <div
              ref={optionBRef}
              className={`${styles.option} ${styles.optionB} ${activeOption === 'b' ? styles.active : ''}`}
            >
              <div className={styles.socialItem}>BE</div>
            </div>
            <div
              ref={optionCRRef}
              className={`${styles.option} ${styles.optionC} ${activeOption === 'c' ? styles.active : ''}`}
            >
              <div className={styles.socialItem}>GH</div>
            </div>
            <div
              ref={optionDRef}
              className={`${styles.option} ${styles.optionD} ${activeOption === 'd' ? styles.active : ''}`}
            >
              <div className={styles.socialItem}>MD</div>
            </div>
          </div>
        </div>
      </motion.div>
      </AnimatePresence>

      {/* ── Section Progress ── */}
      <div className={styles.progressTrack}>
        <div className={styles.progressLine} />
        {sections.map((title, idx) => {
          const num = idx + 1;
          const isActive = activeSection === num;
          return (
            <div
              key={num}
              className={`${styles.sectionItem} ${isActive ? styles.sectionActive : ''} interactive`}
              onClick={() => setActiveSection(num)}
            >
              <div className={styles.numBadge}>{num}</div>
              {isActive && (
                <motion.span
                  className={styles.sectionLabel}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {title}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
