'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCursor } from '@/context/CursorContext';
import styles from './CenterPortrait.module.css';

export default function CenterPortrait() {
  const { setCursorVariant } = useCursor();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax setup
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  
  const rotateX = useTransform(springY, [-100, 100], [5, -5]);
  const rotateY = useTransform(springX, [-100, 100], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center of portrait
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      
      x.set(distX);
      y.set(distY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y]);

  return (
    <div className={styles.portraitWrapper}>
      <motion.div
        ref={containerRef}
        className={styles.portraitContainer}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseEnter={() => setCursorVariant('reveal')}
        onMouseLeave={() => setCursorVariant('default')}
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, delay: 1 }}
      >
        <Image
          src="/images/portrait.png"
          alt="Designer Portrait"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
        {/* Glow behind portrait when hovered */}
        <div className={styles.portraitGlow} />
      </motion.div>
    </div>
  );
}
