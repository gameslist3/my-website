'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import styles from './ContactShowcase.module.css';

const ICONS = [
  { id: 'linkedin', src: '/images/contact/linkedin-fill.svg', url: 'https://www.linkedin.com/in/shubham-roy-4a186920a/' },
  { id: 'behance', src: '/images/contact/behance.svg', url: 'https://www.behance.net/shubhamroy4' },
  { id: 'dribbble', src: '/images/contact/instagram.svg', url: 'https://www.instagram.com/' }, // Using instagram SVG as a placeholder if dribbble isn't there, wait, user said "instagram.svg". So we use it.
  { id: 'gmail', src: '/images/contact/gmail.svg', url: 'mailto:portfolioshubham787@gmail.com' },
  { id: 'whatsapp', src: '/images/contact/whatsapp.svg', url: 'https://wa.me/' },
  { id: 'coffee', src: '/images/contact/buy-me-a-coffee.svg', url: 'https://www.buymeacoffee.com/' },
];

export default function ContactShowcase() {
  const [activeIconIndex, setActiveIconIndex] = useState(Math.floor(ICONS.length / 2));
  const [glowingIndex, setGlowingIndex] = useState<number | null>(null);
  const [explodingIndex, setExplodingIndex] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Search/Ask State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [answer, setAnswer] = useState<{ text: string; generic: boolean } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when ask modal opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // Handle Drag for slider
  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = offset.x;
    if (swipe < -50 && activeIconIndex < ICONS.length - 1) {
      setActiveIconIndex(activeIconIndex + 1);
    } else if (swipe > 50 && activeIconIndex > 0) {
      setActiveIconIndex(activeIconIndex - 1);
    }
  };

  const handleIconClick = (index: number) => {
    if (index !== activeIconIndex) {
      setActiveIconIndex(index);
      return;
    }
    
    // Trigger sequence
    setGlowingIndex(index);
    setVideoPlaying(true);

    setTimeout(() => {
      setExplodingIndex(index);
      setGlowingIndex(null);
    }, 800);

    setTimeout(() => {
      window.open(ICONS[index].url, '_blank');
      setVideoPlaying(false);
      
      // Reset after a bit
      setTimeout(() => {
        setExplodingIndex(null);
      }, 1000);
    }, 2000);
  };

  // ── Handle Ask Search ──
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setAnswer(null);
    
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (response.ok) {
        const res = await response.json();
        setAnswer({ text: res.answer, generic: res.generic });
        setIsSearching(false);
        return;
      }
    } catch (serverError) {
      console.warn("Serverless route unavailable, falling back...", serverError);
    }

    // Client fallback (basic)
    setTimeout(() => {
      setAnswer({ text: "I'm Shubham Roy, a UI/UX & Product Designer. Reach me out via the contact icons below!", generic: true });
      setIsSearching(false);
    }, 1000);
  }, [searchQuery]);

  return (
    <div className={styles.container}>
      {/* Background Video */}
      <video
        className={`${styles.bgVideo} ${videoPlaying ? styles.bgVideoPlaying : ''}`}
        src="/videos/after-load.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Top Ask Bar */}
      <div className={styles.askBarContainer}>
        <div className={styles.askBtn} onClick={() => setSearchOpen(true)}>
          <div className={styles.askIcon}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span>Ask anything...</span>
        </div>
      </div>

      {/* Cover Flow Slider */}
      <div className={styles.sliderWrapper}>
        <motion.div
          className={styles.sliderTrack}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          {ICONS.map((icon, index) => {
            const offset = index - activeIconIndex;
            const isCenter = index === activeIconIndex;
            const isGlowing = index === glowingIndex;
            const isExploding = index === explodingIndex;

            // Cover flow calculations
            const x = offset * 140;
            const scale = isCenter ? 1.4 : Math.max(0.6, 1 - Math.abs(offset) * 0.2);
            const zIndex = 10 - Math.abs(offset);
            const opacity = isExploding ? 0 : Math.max(0, 1 - Math.abs(offset) * 0.35);

            return (
              <motion.div
                key={icon.id}
                className={`${styles.iconCard} ${isGlowing ? styles.glowing : ''}`}
                initial={false}
                animate={{
                  x,
                  scale,
                  zIndex,
                  opacity,
                  rotateY: offset * -15,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                onClick={() => handleIconClick(index)}
              >
                <img src={icon.src} alt={icon.id} className={styles.iconImage} />

                {/* Dust Particles */}
                {isExploding && (
                  <div className={styles.dustContainer}>
                    {[...Array(30)].map((_, i) => {
                      const angle = Math.random() * Math.PI * 2;
                      const distance = 100 + Math.random() * 150;
                      return (
                        <motion.div
                          key={i}
                          className={styles.particle}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(angle) * distance,
                            y: Math.sin(angle) * distance,
                            opacity: 0,
                            scale: 0,
                          }}
                          transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Ask Modal overlay */}
      <AnimatePresence>
        {searchOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              className={styles.modalBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />
            
            <motion.div
              className={styles.searchBox}
              initial={{ opacity: 0, y: -50, scale: 0.9, left: '50%', translateX: '-50%', width: 300, top: 40 }}
              animate={{ opacity: 1, y: 0, scale: 1, left: '50%', translateX: '-50%', width: Math.min(880, typeof window !== 'undefined' ? window.innerWidth * 0.9 : 880), top: '20%' }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className={styles.searchInputWrapper}>
                <div className={styles.searchIcon}>
                  {isSearching ? (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeDashoffset="0">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                      <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z" fill="currentColor"/>
                    </svg>
                  )}
                </div>
                <input 
                  ref={inputRef}
                  className={styles.searchInput}
                  placeholder="Ask anything about me..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {answer ? (
                <motion.div className={styles.answerArea} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={styles.answerContent}>{answer.text}</div>
                </motion.div>
              ) : (
                <motion.div className={styles.hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Press Enter to search
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
