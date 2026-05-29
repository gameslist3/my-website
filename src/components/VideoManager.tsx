'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cursorState } from '@/lib/cursorState';
import { FluidSimulation, FluidParams } from '@/lib/fluid';
import styles from './VideoManager.module.css';

export default function VideoManager({ onMidpointReached, activeSection }: { onMidpointReached?: () => void; activeSection: number }) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Hidden video elements used as textures
  const loadingVideoRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  // Mouse tracking for fluid simulation
  const lastMousePos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  
  // Track if we've already notified about midpoint
  const midpointNotified = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Initialize Fluid simulation
    const canvas = canvasRef.current;
    const fluid = new FluidSimulation(canvas);
    
    const params: FluidParams = {
      cursorSize: 3.5,     // Match the codepen cursor size
      cursorPower: 20,     // Reduced cursor power for subtler liquid
      distortionPower: 0.12, // Reduced distortion power for a subtler effect
    };

    // Handle mouse move event for splatting fluid forces
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight; // Flip Y for WebGL

      if (!hasMoved.current) {
        lastMousePos.current = { x, y };
        hasMoved.current = true;
        return;
      }

      const dx = x - lastMousePos.current.x;
      const dy = y - lastMousePos.current.y;

      // Only splat if there is actual movement
      if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
        fluid.splat(x, y, dx, dy, params);
      }

      lastMousePos.current = { x, y };
    };

    // Resize handler
    const handleResize = () => {
      fluid.resize();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Compute zoom-out factor from loading video progress
    let currentZoom = 1.0;

    // 2. Animation/simulation loop
    let rafId = 0;
    let lastTime = Date.now();
    // Smooth cursor tracking variables — heavy delay for trailing effect
    let smoothedX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    let smoothedY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
    // Smoothed speed for motion-gated reveal (0 = stopped, 1 = moving)
    let smoothedSpeed = 0;

    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;

      // Choose which video to bind as the texture
      const activeVideo = isVideoLoaded ? mainVideoRef.current : loadingVideoRef.current;

      // Compute zoom-out from loading video progress
      const loadingVideo = loadingVideoRef.current;
      if (loadingVideo && !isVideoLoaded) {
        const duration = loadingVideo.duration;
        const cTime = loadingVideo.currentTime;
        if (duration && isFinite(duration) && duration > 0) {
          // Zoom from 0.5 to 1.0 over the first 50% of the loading video
          const zoomDuration = duration * 0.50;
          const progress = Math.min(cTime / zoomDuration, 1.0);
          currentZoom = 0.5 + 0.5 * progress;
        } else {
          // Before metadata loaded — stay zoomed out
          currentZoom = 0.5;
        }
      } else {
        currentZoom = 1.0;
      }

      // Compute edge feathering from zoom level — more feather when zoomed out
      // No feather on main video; only during loading animation
      const edgeFeather = isVideoLoaded
        ? 0.0
        : Math.max(0.0, 0.4 + (1.0 / Math.max(currentZoom, 0.1) - 1.0) * 1.5);

      // Notify when midpoint is reached (zoom hits 1.0)
      if (currentZoom >= 1.0 && !midpointNotified.current) {
        midpointNotified.current = true;
        onMidpointReached?.();
      }

      if (activeVideo) {
        // Compute raw cursor velocity
        const rawDx = cursorState.x - smoothedX;
        const rawDy = cursorState.y - smoothedY;
        const rawSpeed = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

        // Interpolate cursor position with heavy delay
        smoothedX += rawDx * 0.04;
        smoothedY += rawDy * 0.04;

        // Smoothly ramp speed up when moving, fade out when stopped
        const targetSpeed = Math.min(rawSpeed / 8.0, 1.0);
        if (targetSpeed > smoothedSpeed) {
          smoothedSpeed += (targetSpeed - smoothedSpeed) * 0.15; // fast ramp up
        } else {
          smoothedSpeed += (targetSpeed - smoothedSpeed) * 0.03; // slow fade out
        }

        // Read the cursor physics from the shared singleton
        const cursorInfo = {
          x: smoothedX,
          y: smoothedY,
          r1: cursorState.r1,
          r2: cursorState.r2,
          r3: cursorState.r3,
          r4: cursorState.r4,
          size: cursorState.size,
          speed: smoothedSpeed,
          zoomOut: currentZoom,
          edgeFeather,
        };

        // Pass everything to the WebGL fluid simulation step
        fluid.step(
          dt,
          params,
          activeVideo,
          cursorInfo
        );
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [isVideoLoaded]);

  const handleVideoEnded = () => {
    setTimeout(() => setIsVideoLoaded(true), 300);
  };

  useEffect(() => {
    const playVideo = (vid: HTMLVideoElement | null) => {
      if (vid && vid.paused) {
        vid.play().catch(console.error);
      }
    };
    playVideo(loadingVideoRef.current);
    playVideo(mainVideoRef.current);
  }, [isVideoLoaded]);

  return (
    <div className={`${styles.videoContainer} ${activeSection > 1 ? styles.dimmed : ''}`}>
      {/* WebGL Canvas that displays both background video and portrait with fluid distortion */}
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Hidden DOM video elements to stream frames to WebGL textures */}
      <video
        ref={loadingVideoRef}
        src="/videos/loading.mp4"
        autoPlay muted playsInline
        onEnded={handleVideoEnded}
        style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.001, left: 0, top: 0, width: '100%', height: '100%', zIndex: -1 }}
      />

      <video
        ref={mainVideoRef}
        src="/videos/after-load.mp4"
        autoPlay muted loop playsInline
        style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.001, left: 0, top: 0, width: '100%', height: '100%', zIndex: -1 }}
      />

      {/* Vignette atmospheric overlay */}
      <div className={styles.vignette} />
    </div>
  );
}
