'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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

export default function ContactShowcase() {
  const [activeIconIndex, setActiveIconIndex] = useState(Math.floor(ICONS.length / 2));
  const [explodingIndex, setExplodingIndex] = useState<number | null>(null);
  const [shakingIndex, setShakingIndex] = useState<number | null>(null);
  const [greenPeakIndex, setGreenPeakIndex] = useState<number | null>(null); // green glow at peak size
  const [flashGreen, setFlashGreen] = useState(false); // white↔green flash during shake
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [clickedIconIndex, setClickedIconIndex] = useState<number | null>(null);

  // ── Randomized shake keyframes (regenerated each click) ──
  const [shakeKF, setShakeKF] = useState<{ x: number[]; y: number[]; scale: number[] } | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);

  // ── Premium Dissolve Explosion Config ──
  // 1. Dust Particles: Hundreds of tiny glowing specs that drift and fade (mixing in air)
  const dustParticles = useMemo(() =>
    Array.from({ length: 150 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 80 + Math.random() * 400; // Faster spread for a larger area
      return {
        id: `dust-${i}`,
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + (Math.random() * -40), // slight upward drift
        size: 1 + Math.random() * 4,
        delay: Math.random() * 0.1,
        duration: 1.5 + Math.random() * 1.5, // 1.5s to 3s hang time
        color: Math.random() > 0.6 ? '#ffffff' : '#b2f548',
      };
    }), []
  );

  // 2. Subtle colored smoke puff
  const coloredSmokes = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 40;
      return {
        id: `csmoke-${i}`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 40 + Math.random() * 40,
        delay: Math.random() * 0.1,
      };
    }), []
  );

  // ── Progressive dribble particles emitted during shake ──
  const [dribbleParticles, setDribbleParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string }>>([]);

  // ── Track desktop for wider icon gaps ──
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Progressive dribble particles emitted in waves during shake ──
  useEffect(() => {
    if (shakingIndex === null) {
      setDribbleParticles([]);
      return;
    }

    let cancelled = false;
    const startTime = Date.now();
    let particleId = 0;

    const emitWave = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 1500, 1);

      const count = Math.ceil(1 + progress * 6);
      const wave: Array<{ id: number; x: number; y: number; size: number; color: string }> = [];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 8 + Math.random() * 70 * (0.2 + progress * 0.8);
        const size = 2 + Math.random() * 4 * (0.3 + progress * 0.7);
        wave.push({
          id: particleId++,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size,
          color: Math.random() > 0.3 ? '#b2f548' : '#ffffff',
        });
      }

      setDribbleParticles(prev => [...prev, ...wave]);

      if (progress < 1) {
        const nextDelay = Math.max(40, 250 - progress * 190);
        setTimeout(emitWave, nextDelay);
      }
    };

    setTimeout(emitWave, 80);

    return () => { cancelled = true; };
  }, [shakingIndex]);

  const videoRef = useRef<HTMLVideoElement>(null);

  // ── White/green flashing effect during shake ──
  useEffect(() => {
    if (shakingIndex === null) {
      setFlashGreen(false);
      return;
    }

    const interval = setInterval(() => {
      setFlashGreen(prev => !prev);
    }, 180);

    return () => clearInterval(interval);
  }, [shakingIndex]);

  // ── Handle video ending — open the link ──
  const handleVideoEnded = useCallback(() => {
    if (clickedIconIndex !== null) {
      window.open(ICONS[clickedIconIndex].url, '_blank');
    }
    setVideoPlaying(false);
    setClickedIconIndex(null);
    setGreenPeakIndex(null);
    setShakingIndex(null);
    setTimeout(() => setExplodingIndex(null), 800);
  }, [clickedIconIndex]);

  // ── Search/Ask State ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
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
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

  // ── Handle Mic / Voice Search ──
  const handleMicClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      setSearchQuery(''); // clear current to show incoming voice
    };
    
    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setSearchQuery(currentTranscript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // Let user manually hit enter to submit, or we could auto submit
    };
    
    recognition.start();
  };

  // ── Handle clicking an icon — instant shake+bubble → explode ──
  const handleIconClick = (index: number) => {
    if (index !== activeIconIndex) {
      setActiveIconIndex(index);
      return;
    }

    // If already animating or in the pre-animation delay, ignore
    if (shakingIndex !== null || explodingIndex !== null || clickedIconIndex !== null) return;

    // Store clicked icon & play video background
    setClickedIconIndex(index);
    setVideoPlaying(true);
    const v = videoRef.current;
    if (v) {
      v.loop = false;
      v.currentTime = 0;
      v.play().catch(() => {});
    }

    // Generate random shake keyframes — intense struggle, growing smoothly
    const numFrames = 30; // higher framerate for intense shake
    const xArr = [0];
    const yArr = [0];
    const scaleArr = [1.5]; // starts at current center scale
    for (let i = 1; i < numFrames; i++) {
      const t = i / (numFrames - 1);
      const intensity = t * 15; // Max 15px violent shake
      const angle = Math.random() * Math.PI * 2; // random direction every frame
      xArr.push(Math.cos(angle) * intensity);
      yArr.push(Math.sin(angle) * intensity);
      scaleArr.push(1.5 + Math.pow(t, 2) * 3.5); // non-linear growth up to 5x scale
    }
    setShakeKF({ x: xArr, y: yArr, scale: scaleArr });

    // ── Shake + flash starts instantly ──
    setShakingIndex(index);

    // After shake completes (~1.5s), first turn green then burst into particles
    setTimeout(() => {
      setGreenPeakIndex(index); // 🔥 green glow at peak size
      setShakingIndex(null);

      // Brief green moment, then explosion
      setTimeout(() => {
        setGreenPeakIndex(null);
        setExplodingIndex(index);

        // Auto-clear explosion after particles finish
        setTimeout(() => {
          setExplodingIndex(null);
          setShakeKF(null);
        }, 2000);
      }, 250);
    }, 1500);
  };

  // ── Drag handlers (replaces visual drag but captures gesture) ──
  const handleDragEnd = (_: any, info: any) => {
    const threshold = 40;
    if (info.offset.x < -threshold && activeIconIndex < ICONS.length - 1) {
      setActiveIconIndex(activeIconIndex + 1);
    } else if (info.offset.x > threshold && activeIconIndex > 0) {
      setActiveIconIndex(activeIconIndex - 1);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Video — plays once on icon click */}
      <video
        ref={videoRef}
        className={`${styles.bgVideo} ${videoPlaying ? styles.bgVideoPlaying : ''}`}
        src="/videos/hand%20video.mp4"
        muted
        playsInline
        onEnded={handleVideoEnded}
      />

      {/* Top Ask Bar — minimalist expanding pill */}
      <div className={styles.askBarContainer}>
        <motion.div
          ref={askBoxRef}
          className={`${styles.askPill} ${searchOpen ? styles.askPillOpen : ''}`}
          animate={{
            width: searchOpen ? 'min(640px, 85vw)' : '220px',
            backgroundColor: searchOpen ? 'rgba(15, 15, 20, 0.85)' : 'rgba(255, 255, 255, 0.03)',
            borderColor: searchOpen ? 'rgba(178, 245, 72, 0.4)' : 'rgba(255, 255, 255, 0.08)',
          }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
          onClick={() => {
            if (!searchOpen) {
              setSearchOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
        >
          {/* Left Search Icon */}
          <div className={`${styles.iconBase} ${styles.searchPillIcon}`}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Input Area */}
          <input
            ref={inputRef}
            className={styles.pillInput}
            placeholder={isListening ? "Listening..." : "Ask anything..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ pointerEvents: searchOpen ? 'auto' : 'none' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                 // trigger search logic if implemented, or just keep state
              }
            }}
          />

          {/* Right Mic Icon (only visible when open) */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className={`${styles.iconBase} ${styles.micPillIcon} ${isListening ? styles.micListening : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMicClick();
                }}
                title="Voice Search"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
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
          dragElastic={0}
          onDragEnd={handleDragEnd}
        >
          {ICONS.map((icon, index) => {
            const offset = index - activeIconIndex;
            const isCenter = index === activeIconIndex;
            const isShaking = index === shakingIndex;
            const isExploding = index === explodingIndex;
            const isGreenPeak = index === greenPeakIndex;

            // Cover flow: center is largest, adjacent smaller, further smaller
            const absOffset = Math.abs(offset);
            const scale = isCenter ? 1.5 : Math.max(0.5, 1.35 - absOffset * 0.25);
            const x = offset * (isDesktop ? 190 : 130);
            const zIndex = isCenter || isExploding ? 20 : 10 - absOffset;

            // During animation, only the animated icon is visible
            const activeAnimIndex = shakingIndex ?? greenPeakIndex ?? explodingIndex;
            const isAnimationActive = activeAnimIndex !== null;
            const isIconHidden = isAnimationActive && index !== activeAnimIndex;

            let opacity;
            if (isIconHidden) {
              opacity = 0;
            } else if (isExploding) {
              opacity = 0; // exploded icon fades out
            } else {
              opacity = isCenter ? 1 : Math.max(0.35, 1 - absOffset * 0.18);
            }

            // Shrink + fade out when exploding
            const explodingScale = isExploding ? 0 : undefined;
            const explodingOpacity = isExploding ? 0 : undefined;

            return (
              <motion.div
                key={icon.id}
                className={`
                  ${styles.iconItem}
                  ${isCenter ? styles.iconCenter : ''}
                  ${isShaking ? styles.shaking : ''}
                  ${(isShaking && flashGreen) ? styles.flashGreen : ''}
                  ${isGreenPeak ? styles.greenPeak : ''}
                  ${isExploding ? styles.exploding : ''}
                `}
                initial={false}
                animate={{
                  x: isExploding ? 0 : (isShaking && shakeKF ? shakeKF.x : x),
                  y: isShaking && shakeKF ? shakeKF.y : 0,
                  scale: isExploding ? explodingScale : (isShaking && shakeKF ? shakeKF.scale : (isGreenPeak && shakeKF ? shakeKF.scale[shakeKF.scale.length - 1] : scale)),
                  zIndex,
                  opacity: isExploding ? explodingOpacity : (isShaking ? 1 : opacity),
                }}
                transition={isExploding ? {
                  duration: 0.3,
                  ease: 'easeOut',
                } : isShaking ? {
                  duration: 1.5,
                  ease: 'easeInOut',
                  times: [0, 0.04, 0.08, 0.14, 0.22, 0.32, 0.44, 0.56, 0.68, 0.8, 0.9, 0.96, 0.99, 1],
                } : {
                  type: 'spring',
                  stiffness: 260,
                  damping: 28,
                  mass: 0.8,
                }}
                onClick={() => handleIconClick(index)}
              >
                <img src={icon.src} alt={icon.id} className={styles.iconImage} draggable={false} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Background dust particles (CSS box-shadow animation) ── */}
      <div className={styles.bgDust}>
        <div id={styles.particles} />
        <div id={styles.particles2} />
        <div id={styles.particles3} />
      </div>

      {/* ── Progressive dribble particles emitted during shake ── */}
      {dribbleParticles.length > 0 && (
        <div className={styles.burstContainer}>
          {dribbleParticles.map((p) => (
            <motion.div
              key={p.id}
              className={styles.burstParticle}
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: p.color === '#b2f548'
                  ? `0 0 3px ${p.color}, 0 0 8px rgba(178, 245, 72, 0.25)`
                  : `0 0 2px ${p.color}, 0 0 5px rgba(255, 255, 255, 0.15)`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Premium Dissolve Effects ── */}
      {explodingIndex !== null && (
        <div className={styles.burstContainer}>
          {/* Subtle Colored Smoke */}
          {coloredSmokes.map((s) => (
            <motion.div
              key={s.id}
              className={styles.coloredSmoke}
              style={{
                width: s.size,
                height: s.size,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
              animate={{
                x: s.x,
                y: s.y - 20, // drift up slightly
                opacity: [0, 0.4, 0],
                scale: [0.5, 1.2, 1.8],
              }}
              transition={{
                duration: 2 + Math.random() * 1,
                delay: s.delay,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Dust Particles mixing in air */}
          {dustParticles.map((p) => (
            <motion.div
              key={p.id}
              className={styles.dustSpec}
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: p.color === '#b2f548' ? `0 0 6px ${p.color}, 0 0 12px ${p.color}` : `0 0 4px #fff`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: [0, p.x * 0.6, p.x],
                y: [0, p.y * 0.6, p.y - 60], // drift upwards into air
                opacity: [1, 0.8, 0],
                scale: [1, Math.random() * 0.5 + 0.5, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                times: [0, 0.4, 1],
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
}
