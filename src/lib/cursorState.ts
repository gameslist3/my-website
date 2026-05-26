// Singleton to share live cursor physics state between Cursor + VideoManager
// Updated every rAF frame by Cursor.tsx, read by VideoManager.tsx
export const cursorState = {
  x: 0,
  y: 0,
  r1: 50,
  r2: 50,
  r3: 50,
  r4: 50,
  size: 84,       // 84 = normal, 126 = over video (50% bigger)
  isOverVideo: true,
};
