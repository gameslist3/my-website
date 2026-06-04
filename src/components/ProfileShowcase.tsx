'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ProfileShowcase.module.css';
import { profileData } from '@/lib/profileData';

/* ── Social Icons (inline SVGs) ───────────── */

const BehanceIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M6.98 3.5c.46 0 .89.035 1.28.14.39.07.71.216.995.391s.497.426.641.747c.14.32.216.711.216 1.137 0 .496-.106.922-.356 1.242-.215.32-.566.606-.997.817.606.176 1.067.496 1.348.922s.46.957.46 1.563c0 .496-.104.922-.284 1.278a2.3 2.3 0 0 1-.782.887c-.32.215-.711.39-1.137.496a5.3 5.3 0 0 1-1.278.176H2.33V3.5h4.65zm-.285 3.978c.39 0 .71-.105.957-.285.246-.18.355-.497.355-.887 0-.216-.035-.426-.105-.567a1 1 0 0 0-.32-.355 1.8 1.8 0 0 0-.461-.176c-.176-.035-.356-.035-.567-.035H4.5v2.31c0-.005 2.195-.005 2.195-.005zm.105 4.193c.215 0 .426-.035.606-.07.176-.035.356-.106.496-.216s.25-.215.356-.39c.07-.176.14-.391.14-.641 0-.496-.14-.852-.426-1.102-.285-.215-.676-.32-1.137-.32H4.5v2.734h2.3zm6.858-.035q.428.427 1.278.426c.39 0 .746-.106 1.032-.286q.426-.32.53-.64h1.74c-.286.851-.712 1.457-1.278 1.848-.566.355-1.243.566-2.06.566a4.1 4.1 0 0 1-1.527-.285 2.8 2.8 0 0 1-1.137-.782 2.85 2.85 0 0 1-.712-1.172c-.175-.461-.25-.957-.25-1.528 0-.531.07-1.032.25-1.493.18-.46.426-.852.747-1.207.32-.32.711-.606 1.137-.782a4 4 0 0 1 1.493-.285c.606 0 1.137.105 1.598.355.46.25.817.532 1.102.958.285.39.496.851.641 1.348.07.496.105.996.07 1.563h-5.15c0 .58.21 1.11.496 1.396m2.24-3.732c-.25-.25-.642-.391-1.103-.391-.32 0-.566.07-.781.176l-.605.285v2.883l.566.176c.215.07.461.105.747.105.426 0 .817-.14 1.137-.39.32-.25.496-.641.496-1.137 0-.532-.176-.922-.496-1.172"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M12 12.713l11.985-8.713h-23.97l11.985 8.713zm0 2.574l-12-8.727v11.44h24v-11.44l-12 8.727z"/>
  </svg>
);

const DribbbleIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm8.487 7.15c.683 1.353 1.07 2.87 1.107 4.475-1.583-.34-3.21-.497-4.834-.457-.354-1.398-.79-2.77-1.306-4.09 1.83-1.042 3.614-1.428 5.033-1.472v1.544zm-2.073-2.09c-1.39.816-2.915 1.3-4.52 1.488-.857-1.558-1.85-3.04-2.96-4.42 2.37-.506 4.908.063 6.94 1.483l.54 1.45zm-9.358-1.564c1.196 1.442 2.25 2.993 3.142 4.622-1.99.197-3.955.704-5.836 1.5l.386-1.925c.574-1.637 1.54-3.14 2.825-4.323-.172.042-.34.086-.517.126zm-5.076 5.25c1.782-.72 3.655-1.18 5.572-1.365.176 1.305.244 2.628.2 3.945-2.02.665-3.972 1.536-5.82 2.585-.145-1.745.18-3.52 1.05-5.165zm1.5 8.163c1.79-1.096 3.69-2 5.66-2.695-.083 1.69-.328 3.364-.73 4.996-2.003-.52-3.83-1.55-5.31-2.986l.38.685zm7.397 3.013c.427-1.666.685-3.37.77-5.087 1.708.018 3.407.213 5.072.58-1.11 1.956-2.887 3.42-4.997 4.145l-.845.362zm6.27-5.914c-1.65-.333-3.32-.5-5-.497.55-1.31.99-2.65 1.31-4.015 1.6.035 3.19.22 4.75.55v1.278c-.062 1.052-.375 2.072-.916 2.985l-.144-.302z"/>
  </svg>
);

/* ── Platform Icons Data ───────────────────── */

interface Platform {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'behance',
    name: 'Behance',
    url: profileData.socials.behance,
    icon: <BehanceIcon />,
    color: '#1769FF',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: profileData.socials.linkedin,
    icon: <LinkedinIcon />,
    color: '#0A66C2',
  },
  {
    id: 'email',
    name: 'Email',
    url: `mailto:${profileData.contact.email}`,
    icon: <EmailIcon />,
    color: '#EA4335',
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    url: 'https://dribbble.com/',
    icon: <DribbbleIcon />,
    color: '#EA4C89',
  },
];

/* ── Hanging Card ──────────────────────────── */

function HangingCard({
  platform,
  index,
  total,
}: {
  platform: Platform;
  index: number;
  total: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const delay = index * 0.18;

  // Calculate horizontal position spread evenly
  const xPercent = total > 1 ? (index / (total - 1)) * 100 : 50;

  return (
    <motion.div
      className={styles.hangingGroup}
      initial={{ opacity: 0, y: -200 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.19, 1, 0.22, 1],
      }}
      style={{
        left: `${xPercent}%`,
        '--swing-delay': `${index * 0.6}s`,
      } as React.CSSProperties}
    >
      {/* Hanging line */}
      <div className={styles.hangingLine}>
        <motion.div
          className={styles.lineGlow}
          animate={
            isHovered
              ? { opacity: [0, 0.6, 0] }
              : { opacity: 0 }
          }
          transition={{ duration: 1.2, repeat: isHovered ? Infinity : 0, ease: 'easeInOut' }}
        />
      </div>

      {/* Icon Card */}
      <motion.a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.iconCard}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{
          scale: 1.12,
          y: -4,
          transition: { type: 'spring', stiffness: 300, damping: 18 },
        }}
        whileTap={{ scale: 0.95 }}
        style={
          {
            '--platform-color': platform.color,
          } as React.CSSProperties
        }
      >
        <motion.div
          className={styles.iconWrap}
          animate={
            isHovered
              ? {
                  rotate: [0, -5, 5, -3, 3, 0],
                  transition: { duration: 0.5, ease: 'easeInOut' },
                }
              : {}
          }
        >
          {platform.icon}
        </motion.div>

        {/* Hover glow ring */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className={styles.cardGlowRing}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </motion.a>

      {/* Platform Label */}
      <motion.span
        className={styles.platformLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4, duration: 0.6 }}
      >
        {platform.name}
      </motion.span>
    </motion.div>
  );
}

/* ── Background Decorations ───────────────── */

function BackgroundDecorations() {
  return (
    <div className={styles.bgDecorations}>
      <motion.div
        className={styles.bgOrbitRing}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className={styles.bgOrbitRingInner}
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className={styles.bgGlowOrb}
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className={styles.bgGrid} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */

export default function ProfileShowcase() {
  const [hoveredCta, setHoveredCta] = useState(false);

  return (
    <div className={styles.scene}>
      <BackgroundDecorations />

      {/* Section title */}
      <motion.h2
        className={styles.sectionTitle}
        initial={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        Connect With Me
      </motion.h2>

      {/* Hanging Platforms */}
      <div className={styles.hangingArea}>
        {PLATFORMS.map((platform, i) => (
          <HangingCard
            key={platform.id}
            platform={platform}
            index={i}
            total={PLATFORMS.length}
          />
        ))}
      </div>

      {/* CTA Button */}
      <motion.div
        className={styles.ctaArea}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.a
          href={`mailto:${profileData.contact.email}`}
          className={styles.ctaButton}
          onMouseEnter={() => setHoveredCta(true)}
          onMouseLeave={() => setHoveredCta(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            className={styles.ctaText}
            animate={hoveredCta ? { x: [0, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            Let&apos;s Work Together
          </motion.span>
          <motion.span
            className={styles.ctaArrow}
            animate={hoveredCta ? { x: [0, 6, 0], opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 0.8, repeat: hoveredCta ? Infinity : 0 }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </motion.span>
        </motion.a>
      </motion.div>
    </div>
  );
}
