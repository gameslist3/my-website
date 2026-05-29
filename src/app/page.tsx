'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CursorProvider } from '@/context/CursorContext';
import Cursor from '@/components/Cursor';
import VideoManager from '@/components/VideoManager';
import LeftNav from '@/components/LeftNav';
import RightIdentity from '@/components/RightIdentity';
import BottomArea from '@/components/BottomArea';
import SoundManager from '@/components/SoundManager';
import WorkShowcase from '@/components/WorkShowcase';
import styles from './page.module.css';

export default function Home() {
  const [contentRevealed, setContentRevealed] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (!contentRevealed) return;

    const handleWheel = (e: WheelEvent) => {
      // Find any scrollable parent of the scroll target
      let isScrollableElement = false;
      let parent = e.target as HTMLElement | null;
      while (parent && parent !== document.body) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (parent.scrollHeight > parent.clientHeight && (overflowY === 'auto' || overflowY === 'scroll')) {
          const isScrollingDown = e.deltaY > 0;
          const atBottom = Math.abs(parent.scrollHeight - parent.clientHeight - parent.scrollTop) < 2;
          const atTop = parent.scrollTop === 0;
          
          if (isScrollingDown && !atBottom) {
            isScrollableElement = true;
            break;
          }
          if (!isScrollingDown && !atTop) {
            isScrollableElement = true;
            break;
          }
        }
        parent = parent.parentElement;
      }

      if (isScrollableElement) return; // Allow nested scrolling element to scroll instead

      if (isTransitioning.current) return;
      
      const threshold = 15;
      if (e.deltaY > threshold && activeSection < 5) {
        isTransitioning.current = true;
        setActiveSection((prev) => prev + 1);
        setTimeout(() => {
          isTransitioning.current = false;
        }, 1000);
      } else if (e.deltaY < -threshold && activeSection > 1) {
        isTransitioning.current = true;
        setActiveSection((prev) => prev - 1);
        setTimeout(() => {
          isTransitioning.current = false;
        }, 1000);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isTransitioning.current) return;
      const touchEndY = e.touches[0].clientY;
      const diffY = touchStartY - touchEndY;
      
      const threshold = 40;
      if (diffY > threshold && activeSection < 5) {
        isTransitioning.current = true;
        setActiveSection((prev) => prev + 1);
        setTimeout(() => {
          isTransitioning.current = false;
        }, 1000);
      } else if (diffY < -threshold && activeSection > 1) {
        isTransitioning.current = true;
        setActiveSection((prev) => prev - 1);
        setTimeout(() => {
          isTransitioning.current = false;
        }, 1000);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [contentRevealed, activeSection]);

  return (
    <CursorProvider>
      {/* Sound effects & background music — mounted once, plays on first user interaction */}
      <SoundManager />

      <main className={styles.main}>
        {/* Background video layer */}
        <VideoManager onMidpointReached={() => setContentRevealed(true)} activeSection={activeSection} />

        {/* Custom cursor — hidden during loading phase */}
        {contentRevealed && <Cursor />}

        {/* Content — appears at video midpoint with zoom+blur entrance */}
        {contentRevealed && (
          <>
            {/* Left nav is fixed-positioned, outside normal flow */}
            <LeftNav activeSection={activeSection} setActiveSection={setActiveSection} />

            {/* Right + Bottom UI layer */}
            <div className={styles.uiLayer}>
              <div className={styles.spacer} />
              {activeSection !== 2 && <RightIdentity activeSection={activeSection} />}
            </div>

            {/* Work Showcase — full width overlay for section 2 */}
            <AnimatePresence mode="wait">
              {activeSection === 2 && (
                <motion.div 
                  key="work-showcase"
                  className={styles.workSection}
                  initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -45, filter: 'blur(12px)' }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <WorkShowcase />
                </motion.div>
              )}
            </AnimatePresence>

            <BottomArea activeSection={activeSection} setActiveSection={setActiveSection} />
          </>
        )}
      </main>
    </CursorProvider>
  );
}
