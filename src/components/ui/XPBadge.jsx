import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { computeLevel, getLevelTitle, levelProgress, xpForLevel } from '../../utils/xp';
import styles from './XPBadge.module.css';

/**
 * Compact XP badge showing level + total XP.
 * Pops with animation whenever XP changes.
 */
export default function XPBadge() {
  const { state } = useApp();
  const { total, level } = state.xp;

  const [popping, setPopping]   = useState(false);
  const [floatXP, setFloatXP]   = useState(null);
  const prevTotal = useRef(total);

  useEffect(() => {
    if (total > prevTotal.current) {
      const gained = total - prevTotal.current;
      setPopping(true);
      setFloatXP(`+${gained} XP`);
      setTimeout(() => setPopping(false), 450);
      setTimeout(() => setFloatXP(null), 900);
    }
    prevTotal.current = total;
  }, [total]);

  const title    = getLevelTitle(level);
  const progress = levelProgress(total);
  const nextXP   = xpForLevel(level + 1);
  const curXP    = xpForLevel(level);
  const xpInLevel = total - curXP;
  const xpToNext  = nextXP - curXP;

  return (
    <div className={`${styles.badge} ${popping ? styles.pop : ''}`} title={`${xpInLevel}/${xpToNext} XP to Level ${level + 1}`}>
      <div className={styles.levelDot}>
        <span className={styles.levelNum}>{level}</span>
      </div>
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
        <div className={styles.xpBar}>
          <div className={styles.xpFill} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      {floatXP && (
        <span className={styles.floatXP}>{floatXP}</span>
      )}
    </div>
  );
}
