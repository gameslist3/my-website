'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LeftNav.module.css';

interface LeftNavProps {
  activeSection: number;
  setActiveSection: (sec: number) => void;
}

const sections = ['Overview', 'Work', 'Experience', 'Profiles', 'Contact'];
const ease: [number, number, number, number] = [0.19, 1, 0.22, 1];

export default function LeftNav({ activeSection, setActiveSection }: LeftNavProps) {
  const [stackHovered, setStackHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [card1Closing, setCard1Closing] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState({ left: 0, top: 0, width: 220, height: 220 });
  const [searchTarget, setSearchTarget] = useState({ left: 0, top: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [answer, setAnswer] = useState<{ text: string; generic: boolean } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const card1Ref = useRef<HTMLDivElement>(null);
  const optionARef = useRef<HTMLDivElement>(null);
  const optionBRef = useRef<HTMLDivElement>(null);
  const optionCRef = useRef<HTMLDivElement>(null);
  const optionDRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Focus search input after modal opens ──
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 750);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // ── ESC to close search ──
  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

  // ── Social card hold interaction ──
  useEffect(() => {
    if (!holding) return;
    const handleUp = () => { setHolding(false); setActiveOption(null); };
    const handleMove = (e: MouseEvent) => {
      const inside = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return false;
        const r = ref.current.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right &&
               e.clientY >= r.top && e.clientY <= r.bottom;
      };
      if (inside(optionARef)) setActiveOption('a');
      else if (inside(optionBRef)) setActiveOption('b');
      else if (inside(optionCRef)) setActiveOption('c');
      else if (inside(optionDRef)) setActiveOption('d');
      else setActiveOption(null);
    };
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mousemove', handleMove);
    return () => { window.removeEventListener('mouseup', handleUp); window.removeEventListener('mousemove', handleMove); };
  }, [holding]);

  // ── Handle Ask card click → morph to search bar ──
  const handleAskClick = useCallback(() => {
    if (card1Ref.current) {
      const rect = card1Ref.current.getBoundingClientRect();
      setSearchOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setSearchTarget({ left: window.innerWidth / 2 - 440, top: window.innerHeight / 2 - 200 });
    }
    setSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    setCard1Closing(true);
    setSearchQuery('');
    setAnswer(null);
    setIsSearching(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setAnswer(null);
    
    try {
      // 1. Try secure Serverless API route (Vercel / SSR hosting)
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (response.ok) {
        const res = await response.json();
        setAnswer({ text: res.answer, generic: res.generic });
        setIsSearching(false);
        return;
      }
    } catch (serverError) {
      console.warn("Serverless route /api/ask unavailable, trying static client fallback...", serverError);
    }

    // 2. Client-side static fallback (useful for static hosts like Firebase or GitHub Pages)
    const clientKey = process.env.NEXT_PUBLIC_PORTFOLIO_API_KEY;
    if (clientKey) {
      try {
        const { getExperienceDuration, formatExperience } = await import('@/lib/dateUtils');
        const { profileData } = await import('@/lib/profileData');
        const exp = formatExperience(getExperienceDuration(profileData.experienceStart));

        const systemPrompt = `You are a helpful, professional, and friendly AI assistant representing Shubham Roy.
You only answer questions about Shubham Roy using the context details below. 
Speak in the first person ("I", "my", "me") as if you are Shubham himself. Keep answers concise, premium, and focused (around 2-3 sentences max).
If the user asks something completely unrelated to Shubham's professional or personal background, politely state that you can only answer questions related to Shubham Roy, and suggest they use the "Contact Me" option below.

Context about Shubham Roy:
- Full Name: ${profileData.fullName}
- Profession: ${profileData.profession}
- Current Experience: ${exp} of professional experience (dynamic calculation)
- Location: ${profileData.location}
- Availability: ${profileData.availability}
- Languages: ${profileData.languages.join(', ')}
- Location: ${profileData.contact.location}
- Email: ${profileData.contact.email}
- Phone: ${profileData.contact.phone}
- Behance: ${profileData.socials.behance}
- LinkedIn: ${profileData.socials.linkedin}

About Me summary:
${profileData.aboutMe}

Design Philosophy:
"${profileData.designPhilosophy.statement}"
Focus Areas: ${profileData.designPhilosophy.focusAreas.join(', ')}

Inspiration:
${profileData.inspiration}

Experience Timeline:
${profileData.experience.map((e: any) => `- ${e.role} at ${e.company} (${e.duration}): ${e.description}`).join('\n')}

Skills:
${profileData.skills.join(', ')}

AI Experience & Tools:
Summary: ${profileData.aiExperience.summary}
Tools Used: ${profileData.aiExperience.tools.join(', ')}

Tools & Software:
- Design: ${profileData.tools.design.join(', ')}
- Motion: ${profileData.tools.motion.join(', ')}
- Dev: ${profileData.tools.development.join(', ')}

Estimation of work:
- Basic Website: ${profileData.estimations.basicWebsite}
- Portfolio Website: ${profileData.estimations.portfolioWebsite}
- Advanced SaaS Dashboard: ${profileData.estimations.advancedDashboard}
- Full Product Ecosystem: ${profileData.estimations.fullEcosystem}

Long-term Goals:
${profileData.longTermGoals}
`;

        // Direct client fetch to Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Question: ${searchQuery}` }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            setAnswer({ text, generic: false });
            setIsSearching(false);
            return;
          }
        }
      } catch (clientApiError) {
        console.error("Client-side direct API query failed:", clientApiError);
      }
    }

    // 3. Local offline keyword matching fallback
    try {
      const { askAgent } = await import('@/lib/agentLogic');
      const res = askAgent(searchQuery);
      setAnswer({ text: res.answer, generic: res.generic });
    } catch (error) {
      console.error("Fallback error, falling back to basic prompt:", error);
      setAnswer({ text: "I couldn't load a live answer, but I would love to connect and chat directly!", generic: true });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // ── Card fan-out transforms ──
  const getCardAnimate = (cardNum: number) => {
    // Card 1 stays hidden during search AND during the exit animation
    if (cardNum === 1 && (searchOpen || card1Closing)) {
      return { opacity: 0, rotate: -8, y: 0, x: 60, scale: 0.9 };
    }
    if (!stackHovered) {
      switch (cardNum) {
        case 1: return { opacity: 1, rotate: -8, y: 0, x: 60, scale: 0.9 };
        case 2: return { opacity: 1, rotate: 0, y: 0, x: 72, scale: 0.9 };
        case 3: return { opacity: 1, rotate: 8, y: 0, x: 56, scale: 0.9 };
        default: return { opacity: 1 };
      }
    }
    switch (cardNum) {
      case 1: return { opacity: 1, rotate: -18, y: -90, x: 30, scale: 0.95 };
      case 2: return { opacity: 1, rotate: 0, y: 0, x: 72, scale: 0.95 };
      case 3: return { opacity: 1, rotate: 18, y: 90, x: 30, scale: 0.95 };
      default: return { opacity: 1 };
    }
  };

  return (
    <div className={`${styles.leftNav} ${mobileExpanded ? styles.expanded : ''}`}>
      {/* Ambient neon-green glow in corners */}
      <div className={styles.ambientGlow} />

      {/* ── Stacked Cards ── */}
      <div
        className={styles.stack}
        onClick={() => setMobileExpanded(!mobileExpanded)}
        onMouseEnter={() => setStackHovered(true)}
        onMouseLeave={() => { setStackHovered(false); setHoveredCard(null); }}
      >
        <motion.div
          className={styles.floatWrapper}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* ── CARD 1 — Ask ── */}
          <motion.div
            ref={card1Ref}
            className={`${styles.card} ${styles.card1} ${hoveredCard === 1 ? styles.cardGreen : ''} interactive`}
            animate={getCardAnimate(1)}
            transition={{ duration: 0.8, ease }}
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={handleAskClick}
          >
            <div className={styles.shine} />
            <div className={styles.content}>
              <div className={styles.icon}>
                <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.title}>Ask</div>
            </div>
          </motion.div>

          {/* ── CARD 2 — Resume ── */}
          <motion.div
            className={`${styles.card} ${styles.card2} ${hoveredCard === 2 ? styles.cardGreen : ''} interactive`}
            animate={getCardAnimate(2)}
            transition={{ duration: 0.8, ease }}
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className={styles.shine} />
            <div className={styles.content}>
              <div className={styles.icon}>
                <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
                  <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.title}>Resume</div>
            </div>
          </motion.div>

          {/* ── CARD 3 — Social ── */}
          <motion.div
            className={`${styles.card} ${styles.card3} ${styles.socialCard} ${hoveredCard === 3 ? styles.cardGreen : ''} ${holding ? styles.holding : ''} interactive`}
            animate={getCardAnimate(3)}
            transition={{ duration: 0.8, ease }}
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            onMouseDown={(e) => { if (e.button === 0) setHolding(true); }}
          >
            <div className={styles.shine} />
            <div className={styles.socialGrid}>
              <div ref={optionARef} className={`${styles.option} ${styles.optionA} ${activeOption === 'a' ? styles.active : ''}`}>
                <div className={styles.socialItem}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
              </div>
              <div ref={optionBRef} className={`${styles.option} ${styles.optionB} ${activeOption === 'b' ? styles.active : ''}`}>
                <div className={styles.socialItem}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.722-.902 1.143-1.642.982-.721-.16-1.142-.902-.981-1.643.18-.722.902-1.143 1.642-.981.74.16 1.142.902.981 1.643zm-1.383 5.673c-1.242 1.322-3.156 1.984-5.51 1.984-1.463 0-2.484-.28-3.807-.882l-2.103.722.722-1.964c-1.102-.882-1.723-2.123-1.723-3.566 0-2.203 1.242-5.55 6.91-5.55 2.445 0 4.288.641 5.35 1.442l1.923-.56-.64 1.984c.561.882.882 2.042.882 3.526 0 1.601-.52 2.903-2.004 3.908zm-4.849-2.884c0 .56-.24 1.082-.641 1.442-.48.4-1.082.56-1.764.56-1.042 0-1.643-.48-1.643-1.562 0-1.082.64-2.324 1.603-2.324.48 0 .961.16 1.322.48.4.321.64.802.64 1.322.16.08.483.08.483.08zm3.446 0c0-.56-.24-1.082-.64-1.442-.481-.4-1.082-.56-1.764-.56-1.042 0-1.643.48-1.643 1.562 0 1.082.64 2.324 1.603 2.324.481 0 .961-.16 1.322-.48.4-.321.64-.802.64-1.322.16-.08.482-.08.482-.08z"/></svg>
                </div>
              </div>
              <div ref={optionCRef} className={`${styles.option} ${styles.optionC} ${activeOption === 'c' ? styles.active : ''}`}>
                <div className={styles.socialItem}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                </div>
              </div>
              <div ref={optionDRef} className={`${styles.option} ${styles.optionD} ${activeOption === 'd' ? styles.active : ''}`}>
                <div className={styles.socialItem}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.691 2.28 24 3.434 24 5.457z"/></svg>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Search Modal (morph overlay) ── */}
      <AnimatePresence onExitComplete={() => setCard1Closing(false)}>
        {searchOpen && (
          <motion.div
            key="search-group"
            className={styles.searchGroup}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Overlay backdrop */}
            <div className={styles.overlay} onClick={handleCloseSearch} />
            {/* Morphing search bar */}
            <motion.div
              className={styles.searchModal}
              initial={{
                left: searchOrigin.left,
                top: searchOrigin.top,
                width: searchOrigin.width,
                height: searchOrigin.height,
                borderRadius: '36px',
              }}
              animate={{
                left: searchTarget.left,
                top: searchTarget.top,
                width: 880,
                height: (answer || isSearching) ? 380 : 120,
                borderRadius: '30px',
              }}
              exit={{
                left: searchOrigin.left,
                top: searchOrigin.top,
                width: searchOrigin.width,
                height: searchOrigin.height,
                borderRadius: '36px',
              }}
              transition={{ duration: 0.7, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.searchContent}>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Ask about me.."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                />
                <button className={styles.searchButton} onClick={handleSearch}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* ── Search Results Area ── */}
              <AnimatePresence>
                {(answer || isSearching) && (
                  <motion.div
                    className={styles.searchResults}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isSearching ? (
                      <motion.div 
                        className={styles.searchStatus}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        Analyzing document...
                      </motion.div>
                    ) : (
                      <>
                        <div className={styles.searchStatus}>Agent Response</div>
                        <div className={styles.searchAnswer}>{answer?.text}</div>
                        {answer?.generic && (
                          <div className={styles.searchContactBtn}>
                            Contact Me
                            <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section Progress ── */}
      <div className={styles.progressTrack}>
        <div className={styles.progressLine} />
        {sections.map((title, idx) => {
          const num = idx + 1;
          const isActive = activeSection === num;
          return (
            <div
              key={num}
              className={`${styles.sectionItem} ${isActive ? styles.sectionActive : ''} interactive`}
              onClick={() => setActiveSection(num)}
            >
              <div className={styles.numBadge}>{num}</div>
              {isActive && (
                <motion.span
                  className={styles.sectionLabel}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease }}
                >
                  {title}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
