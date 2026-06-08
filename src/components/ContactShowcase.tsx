'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ContactShowcase.module.css';

const ICONS = [
  { id: 'linkedin', src: '/images/contact/linkedin-fill.svg', url: 'https://www.linkedin.com/in/shubham-roy-4a186920a/' },
  { id: 'behance', src: '/images/contact/behance.svg', url: 'https://www.behance.net/shubhamroy4' },
  { id: 'instagram', src: '/images/contact/instagram.svg', url: 'https://www.instagram.com/' },
  { id: 'gmail', src: '/images/contact/gmail.svg', url: 'mailto:portfolioshubham787@gmail.com' },
  { id: 'whatsapp', src: '/images/contact/whatsapp.svg', url: 'https://wa.me/' },
  { id: 'coffee', src: '/images/contact/buy-me-a-coffee.svg', url: 'https://www.buymeacoffee.com/' },
];

// ── Particle burst config (computed once) ──
const PARTICLE_COUNT = 120;
const PARTICLE_COLORS = ['#b2f548', '#9e9e9e', '#7a7a7a', '#8bc34a', '#d4d4d4', '#a5d6a7'];
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
  const spread = 60 + Math.random() * 140;
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  return {
    angle,
    spread,
    delay: Math.random() * 0.1,
    size: 1.5 + Math.random() * 2,
    color,
    isGreen: color === '#b2f548' || color === '#8bc34a' || color === '#a5d6a7',
    spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
  };
});

export default function ContactShowcase() {
  const [activeIconIndex, setActiveIconIndex] = useState(Math.floor(ICONS.length / 2));
  const [glowingIndex, setGlowingIndex] = useState<number | null>(null);
  const [explodingIndex, setExplodingIndex] = useState<number | null>(null);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [clickedIconIndex, setClickedIconIndex] = useState<number | null>(null);
  const [particleDuration, setParticleDuration] = useState(2.0);

  const [isDesktop, setIsDesktop] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoDurationRef = useRef(5);

  // ── Track desktop for wider icon gaps ──
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Preload video on mount & capture its duration ──
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.loop = true;
      v.play().catch(() => {});

      const onMetaLoaded = () => {
        videoDurationRef.current = v.duration || 5;
      };
      v.addEventListener('loadedmetadata', onMetaLoaded);
      if (v.readyState >= 1) {
        videoDurationRef.current = v.duration || 5;
      }
      return () => v.removeEventListener('loadedmetadata', onMetaLoaded);
    }
  }, []);

  // ── Handle video ending after click animation ──
  const handleVideoEnded = useCallback(() => {
    if (videoPlaying && clickedIconIndex !== null) {
      // Open link after video finishes
      window.open(ICONS[clickedIconIndex].url, '_blank');
      // Fade video out
      setVideoPlaying(false);
      setClickedIconIndex(null);
      setFlashIndex(null);
      // Reset explosion after fade
      setTimeout(() => setExplodingIndex(null), 800);
      // Restore looping for background
      if (videoRef.current) videoRef.current.loop = true;
    }
  }, [videoPlaying, clickedIconIndex]);

  // ── Search/Ask State ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [answer, setAnswer] = useState<{ text: string; generic: boolean } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const askBoxRef = useRef<HTMLDivElement>(null);

  // Focus input when ask opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!searchOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (askBoxRef.current && !askBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery('');
        setAnswer(null);
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClick), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [searchOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setAnswer(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

  // ── Handle clicking an icon ──
  const handleIconClick = (index: number) => {
    if (index !== activeIconIndex) {
      setActiveIconIndex(index);
      return;
    }

    // If already animating, ignore
    if (glowingIndex !== null || explodingIndex !== null) return;

    // Store which icon was clicked
    setClickedIconIndex(index);

    // Start glow
    setGlowingIndex(index);

    // After brief glow, play video and delay particles to when hand opens
    setTimeout(() => {
      setGlowingIndex(null);
      setVideoPlaying(true);

      const v = videoRef.current;
      if (v) {
        v.loop = false;
        v.currentTime = 0;
        v.play().catch(() => {});
      }

      // Delay particles to when hand opens in the video (~25% of duration)
      // and animate until just before hand closes (~78% of duration)
      const vidDuration = videoDurationRef.current;
      const handOpenTime = vidDuration * 0.25;   // when hand is fully open
      const handCloseTime = vidDuration * 0.78;  // just before hand closes

      setTimeout(() => {
        // Brief white flash right before explosion
        setFlashIndex(index);

        setTimeout(() => {
          setFlashIndex(null);
          // Particle duration = time from hand open to just before close (slowed down 1.5x) + 1.5s extra
          const pDur = Math.max((handCloseTime - handOpenTime - 0.3) * 1.5, 1.5) + 1.5;
          setParticleDuration(pDur);
          setExplodingIndex(index);
        }, 150);
      }, handOpenTime * 1000); // convert to ms

    }, 500);
  };

  // ── Drag handlers ──
  const handleDragEnd = (_: any, info: any) => {
    const threshold = 40;
    if (info.offset.x < -threshold && activeIconIndex < ICONS.length - 1) {
      setActiveIconIndex(activeIconIndex + 1);
    } else if (info.offset.x > threshold && activeIconIndex > 0) {
      setActiveIconIndex(activeIconIndex - 1);
    }
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

    setTimeout(() => {
      setAnswer({ text: "I'm Shubham Roy, a UI/UX & Product Designer. Reach me out via the contact icons below!", generic: true });
      setIsSearching(false);
    }, 1000);
  }, [searchQuery]);

  return (
    <div className={styles.container}>
      {/* Background Video — preloaded on mount, plays through once on click */}
      <video
        ref={videoRef}
        className={`${styles.bgVideo} ${videoPlaying ? styles.bgVideoPlaying : ''}`}
        src="/videos/hand%20video.mp4"
        muted
        playsInline
        onEnded={handleVideoEnded}
      />

      {/* Top Ask Bar — expands inline downward on click */}
      <div className={styles.askBarContainer}>
        <motion.div
          ref={askBoxRef}
          className={`${styles.askBox} ${searchOpen ? styles.askBoxOpen : ''}`}
          layout
        >
          <div className={styles.askBtn} onClick={() => setSearchOpen(prev => !prev)}>
            <div className={styles.askIcon}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            </div>
            <span>{searchOpen ? 'Ask anything...' : 'Ask anything...'}</span>
          </div>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                className={styles.askDropdown}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className={styles.searchInputWrapper}>
                  <div className={styles.searchIcon}>
                    {isSearching ? (
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                        </circle>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
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
                  <motion.div className={styles.answerArea} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={styles.answerContent}>{answer.text}</div>
                  </motion.div>
                ) : (
                  <motion.div className={styles.hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Press Enter to search
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Icon Slider — drag/swipe directly on icons or space between ── */}
      <div className={styles.sliderWrapper}>
        <motion.div
          className={styles.sliderTrack}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
        >
          {ICONS.map((icon, index) => {
            const offset = index - activeIconIndex;
            const isCenter = index === activeIconIndex;
            const isGlowing = index === glowingIndex;
            const isFlashing = index === flashIndex;
            const isExploding = index === explodingIndex;

            // Cover flow: center is largest, adjacent smaller, further smaller
            const absOffset = Math.abs(offset);
            const scale = isCenter ? 1.5 : Math.max(0.5, 1.35 - absOffset * 0.25);
            const x = offset * (isDesktop ? 190 : 130);
            const zIndex = isCenter || isGlowing || isExploding ? 20 : 10 - absOffset;

            // During animation (glow → video → explosion), only the clicked icon is visible
            const animationActiveIndex = glowingIndex ?? clickedIconIndex;
            const isAnimationActive = animationActiveIndex !== null;
            const isIconHidden = isAnimationActive && index !== animationActiveIndex;

            let opacity;
            if (isIconHidden) {
              opacity = 0; // hide non-clicked icons
            } else if (isExploding) {
              opacity = 0; // exploded icon fades out
            } else {
              opacity = isCenter ? 1 : Math.max(0.35, 1 - absOffset * 0.18);
            }

            // Shrink + shake animation values when exploding
            const explodingX = isExploding ? [0, -6, 5, -3, 0] : undefined;
            const explodingScale = isExploding ? [1.5, 1.2, 0.8, 0.4, 0] : undefined;
            const explodingOpacity = isExploding ? [1, 0.8, 0.5, 0.2, 0] : undefined;

            return (
              <motion.div
                key={icon.id}
                className={`
                  ${styles.iconItem}
                  ${isCenter ? styles.iconCenter : ''}
                  ${isGlowing ? styles.glowing : ''}
                  ${isFlashing ? styles.flashing : ''}
                  ${isExploding ? styles.exploding : ''}
                `}
                initial={false}
                animate={{
                  x: isExploding ? explodingX : x,
                  scale: isExploding ? explodingScale : scale,
                  zIndex,
                  opacity: isExploding ? explodingOpacity : opacity,
                }}
                transition={isExploding ? {
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1],
                  times: [0, 0.15, 0.4, 0.7, 1],
                } : {
                  type: 'spring',
                  stiffness: 260,
                  damping: 28,
                  mass: 0.8,
                }}
                onClick={() => handleIconClick(index)}
              >
                <img src={icon.src} alt={icon.id} className={styles.iconImage} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Green glow overlay during particle animation ── */}
      {explodingIndex !== null && (
        <div className={styles.greenGlowWrap}>
          <motion.div
            className={styles.greenGlow}
            initial={{ opacity: 0, width: 120, height: 120 }}
            animate={{
              opacity: [0, 0.5, 0.2, 0.4, 0],
              width: [120, 520, 300, 600, 200],
              height: [120, 520, 300, 600, 200],
            }}
            transition={{
              duration: particleDuration,
              times: [0, 0.15, 0.4, 0.7, 1],
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* ── Screen-center dust particles (played over bg video) ── */}
      {explodingIndex !== null && (
        <div className={styles.dustContainer}>
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: p.isGreen
                  ? `0 0 6px ${p.color}, 0 0 16px rgba(178, 245, 72, 0.25)`
                  : `0 0 4px ${p.color}, 0 0 10px rgba(128, 128, 128, 0.15)`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{
                x: p.isGreen
                  ? [0, Math.cos(p.angle) * p.spread * 0.6, Math.cos(p.angle) * p.spread, Math.cos(p.angle) * p.spread * 1.15]
                  : [0, Math.cos(p.angle) * 12, Math.cos(p.angle) * 20, Math.cos(p.angle) * 25],
                y: p.isGreen
                  ? [0, Math.sin(p.angle) * p.spread * 0.6, Math.sin(p.angle) * p.spread, Math.sin(p.angle) * p.spread * 1.15]
                  : [0, -p.spread * 0.3, -p.spread * 0.7, -p.spread * 1.05],
                opacity: [1, 1, 0.8, 0],
                scale: [1, 1.3, 1, 0.3],
                rotate: [0, p.spin * 0.3, p.spin * 0.7, p.spin],
              }}
              transition={{
                duration: particleDuration,
                delay: p.delay,
                times: [0, 0.15, 0.7, 1],
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
            />
          ))}
        </div>
      )}


    </div>
  );
}
