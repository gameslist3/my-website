'use client';

import { useState, useRef, MouseEvent } from 'react';
import { motion, PanInfo } from 'framer-motion';
import styles from './WorkShowcase.module.css';
import { behanceProjects, BehanceProject } from '@/lib/behanceProjects';

function TiltCard({ 
  project, 
  isActive, 
  relativeIndex, 
  onClick 
}: { 
  project: BehanceProject, 
  isActive: boolean, 
  relativeIndex: number, 
  onClick: () => void 
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Tilt mechanics
  const MAX_TILT = 18;
  const [tiltStyle, setTiltStyle] = useState({
    rotateX: 0,
    rotateY: 0,
    shineOpacity: 0,
    shineX: 50,
    shineY: 50
  });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isActive) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
    const cx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const cy = clamp((e.clientY - rect.top) / rect.height, 0, 1);

    setTiltStyle({
      rotateX: -(cy - 0.5) * MAX_TILT * 2,
      rotateY: (cx - 0.5) * MAX_TILT * 2,
      shineOpacity: 1,
      shineX: Math.round(cx * 100),
      shineY: Math.round(cy * 100)
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ rotateX: 0, rotateY: 0, shineOpacity: 0, shineX: 50, shineY: 50 });
  };

  // Base transforms depending on position
  let x = 0;
  let rY = 0;
  let scale = 1;
  let opacity = 1;
  let zIndex = 10;
  let filter = 'blur(0px)';

  if (relativeIndex < 0) {
    x = -260;
    rY = 20;
    scale = 0.8;
    opacity = 0.4;
    zIndex = 5;
    filter = 'blur(6px)';
  } else if (relativeIndex > 0) {
    x = 260;
    rY = -20;
    scale = 0.8;
    opacity = 0.4;
    zIndex = 5;
    filter = 'blur(6px)';
  }

  // Hide if too far
  if (Math.abs(relativeIndex) > 1) {
    opacity = 0;
    scale = 0.6;
    zIndex = 0;
  }

  return (
    <motion.div
      className={`${styles.cardWrap} ${isActive ? 'interactive' : ''}`}
      onClick={!isActive ? onClick : undefined}
      initial={false}
      animate={{
        x,
        rotateY: rY,
        scale,
        opacity,
        zIndex,
        filter
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
      style={{
        pointerEvents: Math.abs(relativeIndex) > 1 ? 'none' : 'auto',
        cursor: isActive ? 'auto' : 'pointer'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        ref={cardRef}
        className={styles.card}
        animate={{
          rotateX: isActive ? tiltStyle.rotateX : 0,
          rotateY: isActive ? tiltStyle.rotateY : 0,
          scale: isActive && tiltStyle.shineOpacity > 0 ? 1.03 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div 
          className={styles.cardShine} 
          style={{ 
            opacity: tiltStyle.shineOpacity, 
            background: `radial-gradient(circle at ${tiltStyle.shineX}% ${tiltStyle.shineY}%, rgba(178,245,72,0.18) 0%, transparent 65%)` 
          }} 
        />
        
        <div className={styles.cardImg}>
          <div className={styles.cardGrid} />
          <motion.img 
            src={project.coverUrl}
            alt={project.title}
            className={styles.cardImgInner}
            animate={{
               x: isActive ? tiltStyle.rotateY * 0.6 : 0,
               y: isActive ? tiltStyle.rotateX * -0.6 : 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            draggable={false}
          />
        </div>
        
        <motion.div 
          className={styles.cardBody}
          animate={{
             x: isActive ? tiltStyle.rotateY * 0.3 : 0,
             y: isActive ? tiltStyle.rotateX * -0.3 : 0
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className={styles.cardTag}>{project.type}</span>
          <h3 className={styles.cardTitle}>{project.title}</h3>
          <p className={styles.cardDesc}>
            {project.description.length > 80 ? project.description.slice(0, 80) + '...' : project.description}
          </p>
          
          <div className={styles.cardFooter}>
            <div className={styles.cardMeta}>{project.year}</div>
            <a 
              href={project.behanceUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.behanceBtn} interactive`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              View Project
            </a>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function WorkShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDragEnd = (e: any, info: PanInfo) => {
    const offset = info.offset.x;
    if (offset > 80 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (offset < -80 && currentIndex < behanceProjects.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className={styles.scene}>
      <motion.div 
        className={styles.deckContainer}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {behanceProjects.map((project, index) => {
          const relativeIndex = index - currentIndex;
          
          return (
            <TiltCard 
              key={project.id}
              project={project}
              isActive={relativeIndex === 0}
              relativeIndex={relativeIndex}
              onClick={() => setCurrentIndex(index)}
            />
          );
        })}
      </motion.div>
      <div className={styles.hintLabel}>drag to cycle • click to select • hover to tilt</div>
    </div>
  );
}
