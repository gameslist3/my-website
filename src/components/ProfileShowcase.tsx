'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ProfileShowcase.module.css';
import { profileData } from '@/lib/profileData';
import { DinoIcon } from './DinoIcon';

/* ── Inline SVG Social Icons ───────────── */

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const BehanceIcon = () => (
  <svg viewBox="1 1 22 22" width="28" height="28" fill="currentColor">
    <path d="M6.98 3.5c.46 0 .89.035 1.28.14.39.07.71.216.995.391s.497.426.641.747c.14.32.216.711.216 1.137 0 .496-.106.922-.356 1.242-.215.32-.566.606-.997.817.606.176 1.067.496 1.348.922s.46.957.46 1.563c0 .496-.104.922-.284 1.278a2.3 2.3 0 0 1-.782.887c-.32.215-.711.39-1.137.496a5.3 5.3 0 0 1-1.278.176H2.33V3.5h4.65zm-.285 3.978c.39 0 .71-.105.957-.285.246-.18.355-.497.355-.887 0-.216-.035-.426-.105-.567a1 1 0 0 0-.32-.355 1.8 1.8 0 0 0-.461-.176c-.176-.035-.356-.035-.567-.035H4.5v2.31c0-.005 2.195-.005 2.195-.005zm.105 4.193c.215 0 .426-.035.606-.07.176-.035.356-.106.496-.216s.25-.215.356-.39c.07-.176.14-.391.14-.641 0-.496-.14-.852-.426-1.102-.285-.215-.676-.32-1.137-.32H4.5v2.734h2.3zm6.858-.035q.428.427 1.278.426c.39 0 .746-.106 1.032-.286q.426-.32.53-.64h1.74c-.286.851-.712 1.457-1.278 1.848-.566.355-1.243.566-2.06.566a4.1 4.1 0 0 1-1.527-.285 2.8 2.8 0 0 1-1.137-.782 2.85 2.85 0 0 1-.712-1.172c-.175-.461-.25-.957-.25-1.528 0-.531.07-1.032.25-1.493.18-.46.426-.852.747-1.207.32-.32.711-.606 1.137-.782a4 4 0 0 1 1.493-.285c.606 0 1.137.105 1.598.355.46.25.817.532 1.102.958.285.39.496.851.641 1.348.07.496.105.996.07 1.563h-5.15c0 .58.21 1.11.496 1.396m2.24-3.732c-.25-.25-.642-.391-1.103-.391-.32 0-.566.07-.781.176l-.605.285v2.883l.566.176c.215.07.461.105.747.105.426 0 .817-.14 1.137-.39.32-.25.496-.641.496-1.137 0-.532-.176-.922-.496-1.172"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.691 2.28 24 3.434 24 5.457z"/>
  </svg>
);

interface Platform {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  logicalX: number; // percentage based horizontal coordinate (0 - 100)
}

const HANGING_PLATFORMS: Platform[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: profileData.socials.linkedin,
    icon: <LinkedinIcon />,
    logicalX: 20,
  },
  {
    id: 'behance',
    name: 'Behance',
    url: profileData.socials.behance,
    icon: <BehanceIcon />,
    logicalX: 40,
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/shubhamroy4',
    icon: <GithubIcon />,
    logicalX: 60,
  },
  {
    id: 'email',
    name: 'Email',
    url: `mailto:${profileData.contact.email}`,
    icon: <EmailIcon />,
    logicalX: 80,
  },
];

interface Obstacle {
  id: number;
  x: number;
  type: 'cactus' | 'bird';
  width: number;
  height: number;
  y: number; // 0 for ground, high for birds
}

export default function ProfileShowcase() {
  // Intro dropping state
  const [dropped, setDropped] = useState(false);

  // Game States
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Dino Coordinates
  const [dinoX, setDinoX] = useState(10); // horizontal percentage (0 - 100)
  const [dinoY, setDinoY] = useState(0); // pixels above ground path
  const [isJumping, setIsJumping] = useState(false);
  const dinoVelocityY = useRef(0);

  // Key holding
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Obstacles
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const obstacleIdCounter = useRef(0);

  // Physics State Ref to prevent stale closures and React re-renders interrupting the game loop
  const physicsRef = useRef({
    dinoX: 10,
    dinoY: 0,
    obstacles: [] as Obstacle[],
    glowingCardId: null as string | null
  });

  // Visual glows on hanging cards
  const [glowingCardId, setGlowingCardId] = useState<string | null>(null);

  // Refs for tracking DOM and game loop
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const obstacleSpawnTimer = useRef<number>(0);

  // Open high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dino_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
    
    // Trigger rope drop-down animation shortly after mount
    const timer = setTimeout(() => setDropped(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Jump function
  const triggerJump = () => {
    if (!isJumping && gameState === 'playing') {
      dinoVelocityY.current = 11; // smaller jump force
      setIsJumping(true);
    }
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;

      if (e.key === ' ') {
        e.preventDefault(); // prevent page scroll
        if (gameState === 'idle') {
          startGame();
        } else if (gameState === 'gameover') {
          startGame();
        } else {
          triggerJump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isJumping]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setDinoX(-10); // Start off-screen left
    setDinoY(0);
    setIsJumping(false);
    setObstacles([]);
    setGlowingCardId(null);
    
    physicsRef.current = {
      dinoX: -10,
      dinoY: 0,
      obstacles: [],
      glowingCardId: null
    };

    dinoVelocityY.current = 0;
    lastTimeRef.current = null;
    obstacleSpawnTimer.current = 0;
  };

  // Main run loops
  useEffect(() => {
    if (gameState !== 'playing') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const gameLoop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = Math.min((time - lastTimeRef.current) / 16.666, 4); // caps frame jumps
      lastTimeRef.current = time;

      // Update Score periodically to prevent React thrashing
      if (Math.random() < 0.1) {
        setScore(prev => {
          const next = prev + 1;
          if (next > highScore) {
            setHighScore(next);
            localStorage.setItem('dino_highscore', next.toString());
          }
          return next;
        });
      } else {
        setScore(prev => prev + 1); // We still need the value up
      }

      // Handle Auto-Run Movement (Faster speed)
      let nextDinoX = physicsRef.current.dinoX + 0.45 * delta;
      if (nextDinoX > 110) nextDinoX = -10; // Wrap around to the left
      physicsRef.current.dinoX = nextDinoX;
      setDinoX(nextDinoX);

      // Handle Jump Physics
      let nextDinoY = physicsRef.current.dinoY + dinoVelocityY.current * delta;
      dinoVelocityY.current -= 0.8 * delta; // Gravity

      if (nextDinoY <= 0) {
        nextDinoY = 0;
        dinoVelocityY.current = 0;
        setIsJumping(false);
      }
      physicsRef.current.dinoY = nextDinoY;
      setDinoY(nextDinoY);

      // Spawn obstacles
      obstacleSpawnTimer.current += delta;
      if (obstacleSpawnTimer.current > 90) {
        obstacleSpawnTimer.current = 0;
        const type = Math.random() > 0.4 ? 'cactus' : 'bird';
        const height = type === 'cactus' ? 40 : 24;
        const width = type === 'cactus' ? 24 : 36;
        const y = type === 'cactus' ? 0 : (Math.random() > 0.5 ? 45 : 85); // High or low bird

        physicsRef.current.obstacles.push({
          id: obstacleIdCounter.current++,
          x: 100, // percentage right side
          type,
          width,
          height,
          y,
        });
      }

      // Move obstacles and check collisions
      const remaining: Obstacle[] = [];
      const containerWidth = containerRef.current?.clientWidth || 800;
      
      const dinoLeft = (physicsRef.current.dinoX / 100) * containerWidth;
      const dinoRight = dinoLeft + 40;
      const dinoBottom = physicsRef.current.dinoY;
      const dinoTop = physicsRef.current.dinoY + 44;

      for (const obs of physicsRef.current.obstacles) {
        const nextX = obs.x - 0.35 * delta;

        // Bounding Box Collision Check
        const obsLeft = (nextX / 100) * containerWidth;
        const obsRight = obsLeft + obs.width;
        const obsBottom = obs.y;
        const obsTop = obs.y + obs.height;

        const isColliding =
          dinoLeft < obsRight &&
          dinoRight > obsLeft &&
          dinoBottom < obsTop &&
          dinoTop > obsBottom;

        if (isColliding) {
          setGameState('gameover');
          return;
        }

        if (nextX > -10) {
          remaining.push({ ...obs, x: nextX });
        }
      }
      physicsRef.current.obstacles = remaining;
      setObstacles(remaining);

      // Hanging cards interaction check
      if (physicsRef.current.dinoY > 60 && physicsRef.current.glowingCardId === null) {
        HANGING_PLATFORMS.forEach(platform => {
          const deltaX = Math.abs(physicsRef.current.dinoX - platform.logicalX);
          if (deltaX < 8) {
            const nearObstacle = physicsRef.current.obstacles.some(obs => Math.abs(obs.x - physicsRef.current.dinoX) < 18);

            if (!nearObstacle) {
              physicsRef.current.glowingCardId = platform.id;
              setGlowingCardId(platform.id);
              setTimeout(() => {
                window.open(platform.url, '_blank');
              }, 400);
            }
          }
        });
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]); // Removed physics dependencies so the loop never resets mid-game!

  // Mobile Button Actions
  const handleMobileClick = () => {
    if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
    } else {
      triggerJump();
    }
  };

  return (
    <div className={styles.scene} ref={containerRef}>
      {/* Retro CRT overlay effects */}
      <div className={styles.scanlines} />

      <motion.h2
        className={styles.sectionTitle}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Profiles & Retro Game
      </motion.h2>

      {/* Hanging Platforms with Realistic Pendulum Swing */}
      <div className={styles.hangingArea}>
        {HANGING_PLATFORMS.map((platform, i) => {
          const isGlowing = glowingCardId === platform.id;
          
          const randomOffset = (i * 35) % 80;
          const randomHeight = `calc(80vh - 135px - ${randomOffset}px)`; // Dynamic height targeting dino head jump height
          const swingDuration = 3 + (i * 0.5); // 3s to 4.5s
          const swingStart = -3 - (i % 3);
          const swingEnd = 3 + (i % 3);

          return (
            <div
              key={platform.id}
              className={styles.ropeAnchor}
              style={{ left: `${platform.logicalX}%` }}
            >
              <motion.div
                initial={{ y: '-100%' }}
                animate={{ y: dropped ? '0%' : '-100%' }}
                transition={{ type: 'spring', damping: 12, stiffness: 60, delay: i * 0.15 + 0.3 }}
                className={styles.ropeDrop}
              >
                <div
                  className={`${styles.ropePendulum} ${styles[`swing${i % 4}`]}`}
                  style={{
                    '--swing-dur': `${swingDuration}s`,
                    '--swing-del': `-${i * 0.5}s`
                  } as React.CSSProperties}
                >
                  {/* Rope Structure: A single long segment */}
                  <div className={styles.ropeLine} style={{ height: randomHeight }}>
                    {/* Social Icon Card */}
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.iconCard} ${isGlowing ? styles.glowing : ''}`}
                      onClick={(e) => {
                        // Prevent default click if jumping and opening via logic
                        if (isJumping) e.preventDefault();
                      }}
                    >
                      <div className={styles.iconWrap}>
                        {platform.icon}
                      </div>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Chrome Dino Style Retro Canvas - Appears after ropes drop */}
      <motion.div 
        className={styles.gameContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: dropped ? 1 : 0 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        {/* Scoreboard */}
        <div className={styles.scoreBoard}>
          <span className={styles.highScore}>HI {String(highScore).padStart(5, '0')}</span>
          <span>{String(score).padStart(5, '0')}</span>
        </div>

        {/* Dino */}
        <div
          className={`${styles.dino} ${gameState === 'playing' && !isJumping ? styles.running : ''} ${gameState === 'gameover' ? styles.dead : ''} ${isJumping ? styles.rainbowDino : ''}`}
          style={{
            left: `${dinoX}%`,
            bottom: `${16 + dinoY}px`,
          }}
        >
          <div className={styles.dinoSprite} />
        </div>

        {/* Obstacles */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            className={obs.type === 'cactus' ? styles.cactus : styles.bird}
            style={{
              left: `${obs.x}%`,
              bottom: `${16 + obs.y}px`,
              width: `${obs.width}px`,
              height: `${obs.height}px`,
            }}
          >
            {obs.type === 'cactus' ? (
              <div className={styles.cactusSprite}>
                <div className={styles.trunk} />
                <div className={styles.branchLeft} />
                <div className={styles.branchRight} />
              </div>
            ) : (
              <div className={styles.birdSprite}>
                <div className={styles.body} />
                <div className={styles.beak} />
                <div className={`${styles.wing} ${styles.wingUp}`} />
                <div className={`${styles.wing} ${styles.wingDown}`} />
              </div>
            )}
          </div>
        ))}

        {/* Walking Path */}
        <div className={`${styles.groundPath} ${gameState === 'playing' ? styles.scrolling : ''}`} />
        <div className={`${styles.groundDetails} ${gameState === 'playing' ? styles.scrolling : ''}`} />

        {/* Start / Game Over Overlays */}
        {gameState === 'idle' && (
          <div className={styles.overlay}>
            <div className={styles.gameOverTitle} style={{ color: '#b2f548' }}>DINO RUNNER</div>
            <div className={styles.instruction}>PRESS SPACE TO PLAY</div>
            <div className={styles.instruction} style={{ opacity: 0.4 }}>Use Arrow Keys / A & D to run Left / Right & Space to Jump!</div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className={styles.overlay}>
            <div className={styles.gameOverTitle}>GAME OVER</div>
            <div className={styles.instruction}>PRESS SPACE TO RESTART</div>
          </div>
        )}
      </motion.div>

      {/* Control Buttons for Mobile / Tablet */}
      <div className={`${styles.controlsArea} ${styles.mobileOnly}`}>
        <div className={styles.bottomInstruction}>
          Press Space to jump! Jump to touch an icon.
        </div>
        <button className={styles.actionButton} onClick={handleMobileClick}>
          {gameState === 'idle' && 'Play Now'}
          {gameState === 'playing' && 'Jump'}
          {gameState === 'gameover' && 'Play Again'}
        </button>
      </div>
    </div>
  );
}
