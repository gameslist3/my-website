'use client';

import { motion } from 'framer-motion';
import styles from './ResumeModal.module.css';

interface ResumeModalProps {
  onClose: () => void;
  originRect: { top: number; left: number; width: number; height: number };
}

export default function ResumeModal({ onClose, originRect }: ResumeModalProps) {
  const ease: [number, number, number, number] = [0.19, 1, 0.22, 1];

  // Target bounds (centered)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const targetWidth = isMobile ? window.innerWidth * 0.9 : 880;
  const targetHeight = isMobile ? window.innerHeight * 0.8 : 600;
  const targetLeft = typeof window !== 'undefined' ? (window.innerWidth - targetWidth) / 2 : 0;
  const targetTop = typeof window !== 'undefined' ? (window.innerHeight - targetHeight) / 2 : 0;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <motion.div
        className={styles.modal}
        initial={{
          left: originRect.left,
          top: originRect.top,
          width: originRect.width,
          height: originRect.height,
          borderRadius: '36px',
        }}
        animate={{
          left: targetLeft,
          top: targetTop,
          width: targetWidth,
          height: targetHeight,
          borderRadius: '24px',
        }}
        exit={{
          left: originRect.left,
          top: originRect.top,
          width: originRect.width,
          height: originRect.height,
          borderRadius: '36px',
        }}
        transition={{ duration: 0.7, ease }}
      >
        <div className={styles.header}>
          <div className={styles.title}>Resume</div>
          <div className={styles.actions}>
            <a href="/resume.pdf" download="Shubham_Roy_Resume.pdf" className={`${styles.actionBtn} ${styles.downloadBtn}`}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download
            </a>
            <button className={styles.actionBtn} onClick={onClose}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Close
            </button>
          </div>
        </div>
        <div className={styles.pdfContainer}>
          <iframe src="/resume.pdf" className={styles.pdfViewer} title="Resume PDF" />
        </div>
      </motion.div>
    </>
  );
}
