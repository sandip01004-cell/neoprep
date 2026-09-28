import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MCDTutorial.module.css';

const TUTORIAL_KEY = 'neoprep_mcd_tutorial_seen';

export default function MCDTutorial({ onDismiss }) {
  const [dontShow, setDontShow] = useState(false);

  const handleGotIt = () => {
    if (dontShow) {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    }
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {/* Header */}
          <div className={styles.header}>
            <span className={styles.emoji}>🎯</span>
            <h2 className={styles.title}>What is MCD Planning?</h2>
            <p className={styles.subtitle}>
              A simple three-bucket system to stay focused every day.
            </p>
          </div>

          {/* Columns */}
          <div className={styles.columns}>
            <div className={`${styles.col} ${styles.colMust}`}>
              <span className={styles.colIcon}>🔥</span>
              <h3 className={styles.colTitle}>Must Do</h3>
              <p className={styles.colDesc}>Non-negotiable tasks. Highest priority. Get these done no matter what.</p>
              <div className={styles.example}>
                <span className={styles.exLabel}>e.g.</span>
                <span>"Finish Physics module"</span>
              </div>
            </div>

            <div className={`${styles.col} ${styles.colCan}`}>
              <span className={styles.colIcon}>✅</span>
              <h3 className={styles.colTitle}>Can Do</h3>
              <p className={styles.colDesc}>Nice-to-have tasks. Do these after Must Dos — they boost productivity.</p>
              <div className={styles.example}>
                <span className={styles.exLabel}>e.g.</span>
                <span>"Revise Bio NCERT"</span>
              </div>
            </div>

            <div className={`${styles.col} ${styles.colDont}`}>
              <span className={styles.colIcon}>🚫</span>
              <h3 className={styles.colTitle}>Don't Do</h3>
              <p className={styles.colDesc}>Distractions & bad habits to avoid today. Track what you resisted.</p>
              <div className={styles.example}>
                <span className={styles.exLabel}>e.g.</span>
                <span>"Scrolling reels"</span>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className={styles.tip}>
            <span>💡</span>
            <span>Keep Must Dos small and achievable — 3 to 5 is ideal.</span>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <label className={styles.checkLabel} htmlFor="mcd-dont-show">
              <input
                type="checkbox"
                id="mcd-dont-show"
                checked={dontShow}
                onChange={e => setDontShow(e.target.checked)}
                className={styles.checkbox}
              />
              Don't show this again
            </label>

            <motion.button
              className={styles.gotItBtn}
              onClick={handleGotIt}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
            >
              Got it — Let's Plan! 🚀
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function shouldShowTutorial() {
  return !localStorage.getItem(TUTORIAL_KEY);
}
