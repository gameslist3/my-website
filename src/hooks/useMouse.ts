'use client';

import { useState, useEffect } from 'react';

export function useMouse() {
  const [mousePosition, setMousePosition] = useState({ x: -999, y: -999 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return mousePosition;
}
