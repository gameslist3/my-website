'use client';

import { motion, AnimatePresence } from 'framer-motion';
import styles from './RightIdentity.module.css';

interface RightIdentityProps {
  activeSection: number;
}

const experiences = [
  { num: '01', name: 'Google', role: 'Senior Product Designer', year: '2023 - Pres' },
  { num: '02', name: 'Meta', role: 'Interaction Designer', year: '2021 - 2023' },
  { num: '03', name: 'Apple', role: 'UI/UX Design Specialist', year: '2019 - 2021' }
];

const profiles = [
  { num: '01', name: 'Behance', role: 'Curated Works & Case Studies', year: 'behance.net' },
  { num: '02', name: 'Dribbble', role: 'Micro-Interactions & UI Shots', year: 'dribbble.com' },
  { num: '03', name: 'LinkedIn', role: 'Professional Network & Writing', year: 'linkedin.com' }
];

const contacts = [
  { num: '01', name: 'Email Me', role: 'hello@antigravity.design', year: 'Instant' },
  { num: '02', name: 'Book a Call', role: 'calendly.com/antigravity', year: '30 Mins' },
  { num: '03', name: 'Location', role: 'San Francisco, CA', year: 'PST' }
];

export default function RightIdentity({ activeSection }: RightIdentityProps) {
  const text = "UI UX and Product Designer\nwith over 6+ Years of\nexperience designing\nscalable digital products\nfor SaaS, AI platforms,\ndashboards, and modern web\nor mobile applications.\nSkilled at turning complex\nworkflows into clean, user\nfriendly experiences through\nstrong product thinking,\ninteraction design, and\nscalable design systems.\nExperienced in working with\ncross functional teams to\ndeliver high quality\ninterfaces that improve\nusability and business\nimpact.";
  const lines = text.split('\n');

  const containerVariants = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as any } },
    exit: { opacity: 0, y: -45, filter: 'blur(12px)', transition: { duration: 0.7, ease: [0.3, 0, 0.2, 1] as any } }
  };

  const itemVariants = (i: number) => ({
    hidden: { opacity: 0, y: 25, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] as any } }
  });

  return (
    <div className={styles.rightIdentity}>
      <AnimatePresence mode="wait">
        {activeSection === 1 && (
          <motion.div
            key="overview"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={styles.aboutText}>
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.04 }}
                  className={styles.line}
                >
                  {line.includes('6+ Years') ? (
                    <>
                      {line.split('6+ Years')[0]}
                      <span className="text-neon">6+ Years</span>
                      {line.split('6+ Years')[1]}
                    </>
                  ) : (
                    line
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div 
              className={styles.signatureContainer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 + lines.length * 0.04 }}
            >
              <img 
                src="/images/signature.png" 
                alt="Signature" 
                className={styles.signatureImg}
              />
            </motion.div>
          </motion.div>
        )}

        {activeSection === 3 && (
          <motion.div
            key="experience"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={styles.projectsContainer}
          >
            {experiences.map((exp, i) => (
              <motion.div
                key={exp.num}
                variants={itemVariants(i)}
                initial="hidden"
                animate="visible"
                className={styles.projectItem}
              >
                <div className={styles.projHeader}>
                  <span className={styles.projNum}>{exp.num}</span>
                  <span className={styles.projYear}>{exp.year}</span>
                </div>
                <div className={styles.projTitle}>{exp.name}</div>
                <div className={styles.projRole}>{exp.role}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeSection === 4 && (
          <motion.div
            key="profiles"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={styles.projectsContainer}
          >
            {profiles.map((profile, i) => (
              <motion.div
                key={profile.num}
                variants={itemVariants(i)}
                initial="hidden"
                animate="visible"
                className={styles.projectItem}
              >
                <div className={styles.projHeader}>
                  <span className={styles.projNum}>{profile.num}</span>
                  <span className={styles.projYear}>{profile.year}</span>
                </div>
                <div className={styles.projTitle}>{profile.name}</div>
                <div className={styles.projRole}>{profile.role}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeSection === 5 && (
          <motion.div
            key="contact"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={styles.projectsContainer}
          >
            {contacts.map((contact, i) => (
              <motion.div
                key={contact.num}
                variants={itemVariants(i)}
                initial="hidden"
                animate="visible"
                className={styles.projectItem}
              >
                <div className={styles.projHeader}>
                  <span className={styles.projNum}>{contact.num}</span>
                  <span className={styles.projYear}>{contact.year}</span>
                </div>
                <div className={styles.projTitle}>{contact.name}</div>
                <div className={styles.projRole}>{contact.role}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
