import React, { useEffect, useState, useCallback } from 'react';
import Neo from '../mascot/Neo';
import styles from './CelebrationOverlay.module.css';

const CONFETTI_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#9d5cf6', '#fbbf24'];
const N_CONFETTI = 32;

function generateConfetti() {
  return Array.from({ length: N_CONFETTI }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:  `${5 + Math.random() * 90}%`,
    delay: `${Math.random() * 0.6}s`,
    duration: `${1.6 + Math.random() * 1}s`,
    size: 6 + Math.random() * 8,
    isCircle: Math.random() > 0.5,
  }));
}

export default function CelebrationOverlay({ isLevelUp = false, newLevel = null, onDone }) {
  const [confetti] = useState(generateConfetti);
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDone, 300);
  }, [onDone]);

  // Auto-dismiss after 3.5s
  useEffect(() => {
    const t = setTimeout(dismiss, 3500);
    return () => clearTimeout(t);
  }, [dismiss]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={dismiss} role="dialog" aria-modal="true" aria-label="Celebration">
      {/* Confetti */}
      {confetti.map(c => (
        <div
          key={c.id}
          className={`${styles.piece} ${c.isCircle ? styles.circle : styles.rect}`}
          style={{
            left: c.left,
            width: c.size,
            height: c.isCircle ? c.size : c.size * 2.5,
            backgroundColor: c.color,
            animationDelay: c.delay,
            animationDuration: c.duration,
          }}
        />
      ))}

      {/* Central card */}
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <Neo state={isLevelUp ? 'levelUp' : 'celebrate'} size={100} />

        {isLevelUp ? (
          <>
            <h2 className={styles.title}>Level Up! 🌟</h2>
            <p className={styles.subtitle}>You reached <span className={styles.highlight}>Level {newLevel}</span></p>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Goal Crushed! 🎯</h2>
            <p className={styles.subtitle}>All targets done for today. Neo is proud of you!</p>
          </>
        )}

        <button className={`btn btn-primary btn-sm ${styles.dismissBtn}`} onClick={dismiss}>
          Keep grinding →
        </button>
      </div>
    </div>
  );
}
