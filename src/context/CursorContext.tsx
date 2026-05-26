'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type CursorVariant = 'default' | 'reveal' | 'hidden';

interface CursorContextProps {
  cursorVariant: CursorVariant;
  setCursorVariant: (variant: CursorVariant) => void;
}

const CursorContext = createContext<CursorContextProps>({
  cursorVariant: 'default',
  setCursorVariant: () => {},
});

export const CursorProvider = ({ children }: { children: ReactNode }) => {
  const [cursorVariant, setCursorVariant] = useState<CursorVariant>('default');

  return (
    <CursorContext.Provider value={{ cursorVariant, setCursorVariant }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => useContext(CursorContext);
