import React, { useEffect, useState } from 'react';
import styles from './Neo.module.css';

/**
 * Neo mascot — a round blob creature with big eyes.
 *
 * States:
 *   idle         → gentle float
 *   happy        → bounce, eyes widen
 *   excited      → wiggle + sparkles
 *   celebrate    → jump + stars
 *   encouraging  → soft pulse
 *   levelUp      → stars burst
 */
export default function Neo({ state = 'idle', size = 80 }) {
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    const map = {
      idle:        styles.idle,
      happy:       styles.happy,
      excited:     styles.excited,
      celebrate:   styles.celebrate,
      encouraging: styles.encouraging,
      levelUp:     styles.levelUp,
    };
    setAnimClass(map[state] || styles.idle);
  }, [state]);

  return (
    <div className={`${styles.wrapper} ${animClass}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* ── Body ── */}
        <defs>
          <radialGradient id="bodyGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#9d5cf6" />
            <stop offset="100%" stopColor="#5b21b6" />
          </radialGradient>
          <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#f472b6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </radialGradient>
          <filter id="bodyGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="50" cy="95" rx="22" ry="5" fill="rgba(0,0,0,0.25)" />

        {/* Body blob */}
        <ellipse cx="50" cy="55" rx="34" ry="36" fill="url(#bodyGrad)" filter="url(#bodyGlow)" />

        {/* Shine highlight */}
        <ellipse cx="38" cy="38" rx="9" ry="6" fill="rgba(255,255,255,0.2)" transform="rotate(-20 38 38)" />

        {/* Belly */}
        <ellipse cx="50" cy="64" rx="18" ry="14" fill="rgba(255,255,255,0.1)" />

        {/* Cheeks */}
        <circle cx="24" cy="62" r="10" fill="url(#cheekGrad)" className={styles.cheek} />
        <circle cx="76" cy="62" r="10" fill="url(#cheekGrad)" className={styles.cheek} />

        {/* Left eye */}
        <g className={styles.leftEye}>
          <circle cx="38" cy="50" r="9"  fill="white" />
          <circle cx="38" cy="50" r="5"  fill="#1e1e2e" />
          <circle cx="40" cy="47" r="2"  fill="white" />  {/* glint */}
        </g>

        {/* Right eye */}
        <g className={styles.rightEye}>
          <circle cx="62" cy="50" r="9"  fill="white" />
          <circle cx="62" cy="50" r="5"  fill="#1e1e2e" />
          <circle cx="64" cy="47" r="2"  fill="white" />
        </g>

        {/* Mouth — changes by state */}
        {(state === 'idle' || state === 'encouraging') && (
          <path d="M 43 70 Q 50 74 57 70" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {(state === 'happy' || state === 'excited') && (
          <path d="M 40 68 Q 50 78 60 68" stroke="white" strokeWidth="2.5" fill="rgba(255,255,255,0.15)" strokeLinecap="round" />
        )}
        {(state === 'celebrate' || state === 'levelUp') && (
          <>
            <path d="M 38 68 Q 50 82 62 68" stroke="white" strokeWidth="2.5" fill="rgba(255,255,255,0.2)" strokeLinecap="round" />
            {/* Excited tongue */}
            <ellipse cx="50" cy="76" rx="5" ry="3.5" fill="#f472b6" />
          </>
        )}

        {/* Sparkle stars (excited / celebrate / levelUp) */}
        {(state === 'excited' || state === 'celebrate' || state === 'levelUp') && (
          <>
            <text x="12" y="35" fontSize="10" className={styles.star}>✦</text>
            <text x="78" y="28" fontSize="8"  className={styles.star2}>✦</text>
            <text x="80" y="55" fontSize="7"  className={styles.star3}>✦</text>
          </>
        )}
      </svg>
    </div>
  );
}
