'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import styles from './BottomArea.module.css';

interface BottomAreaProps {
  activeSection: number;
  setActiveSection: (sec: number) => void;
}

export default function BottomArea({ activeSection, setActiveSection }: BottomAreaProps) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 35, stiffness: 60, mass: 1.2 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const parallaxX = useTransform(springX, [-200, 200], [-10, 10]);
  const parallaxY = useTransform(springY, [-200, 200], [-6, 6]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      x.set(e.clientX - cx);
      y.set(e.clientY - cy);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y]);

  const navItems = ['Work', 'Experience', 'Profiles', 'Contact'];

  return (
    <div className={styles.bottomArea}>
      {/* Atmospheric huge "Designer" word — parallax driven, fades out on scroll */}
      <AnimatePresence>
        {activeSection === 1 && (
          <motion.div
            className={styles.typographyContainer}
            style={{ x: parallaxX, y: parallaxY }}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80, filter: 'blur(15px)', transition: { duration: 0.8 } }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={styles.hugeText}>Designer</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom navigation with expand-on-hover functionality */}
      <motion.nav
        className={styles.bottomNav}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        layout
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {navItems.map((item, idx) => {
          const itemSectionNum = idx + 2; // Work = 2, Experience = 3, etc.
          const isActive = activeSection === itemSectionNum;
          const shouldShow = activeSection === 1 || isHovered || isActive;

          return (
            <AnimatePresence key={item} mode="popLayout">
              {shouldShow && (
                <motion.div
                  className={`${styles.navItem} ${isActive ? styles.navActive : ''} interactive`}
                  onClick={() => setActiveSection(itemSectionNum)}
                  initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -25, filter: 'blur(8px)', transition: { duration: 0.4 } }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  layout
                >
                  {item}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </motion.nav>
    </div>
  );
}
