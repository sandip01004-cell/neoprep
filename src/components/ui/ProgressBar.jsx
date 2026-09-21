import React, { useRef, useEffect } from 'react';
import styles from './ProgressBar.module.css';

/**
 * Animated progress bar with glow effect.
 * Props:
 *   pct       – 0–100 percentage
 *   color     – CSS color string for fill + glow
 *   height    – bar height in px (default 8)
 *   animated  – whether to animate fill (default true)
 *   showLabel – show pct% label inside bar (default false)
 */
export default function ProgressBar({ pct = 0, color = 'var(--accent-violet)', height = 8, animated = true, showLabel = false }) {
  const fillRef = useRef(null);

  useEffect(() => {
    if (!fillRef.current) return;
    // Animate to new width via CSS transition
    fillRef.current.style.setProperty('--bar-pct', `${pct}%`);
    fillRef.current.style.setProperty('--bar-color', color);
  }, [pct, color]);

  return (
    <div
      className={styles.track}
      style={{ height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        ref={fillRef}
        className={`${styles.fill} ${animated ? styles.animated : ''}`}
        style={{
          width: `${pct}%`,
          background: color,
          '--bar-color': color,
        }}
      >
        {showLabel && pct >= 10 && (
          <span className={styles.label}>{pct}%</span>
        )}
      </div>
      {pct >= 100 && (
        <div className={styles.completeSpark} style={{ '--bar-color': color }} />
      )}
    </div>
  );
}
