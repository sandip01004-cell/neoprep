import React from 'react';
import { useApp } from '../../context/AppContext';
import XPBadge from '../ui/XPBadge';
import { getDaysUntilExam, getGreeting } from '../../utils/date';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { state } = useApp();
  const { examDate } = state.config;
  const daysLeft = getDaysUntilExam(examDate);
  const greeting = getGreeting();

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <span className={styles.logo}>Neo<span className={styles.logoAccent}>Prep</span></span>
        <span className={styles.greeting}>{greeting} 👋</span>
      </div>
      <div className={styles.right}>
        {daysLeft !== null && (
          <div className={styles.countdown}>
            <span className={styles.countdownNum}>{daysLeft}</span>
            <span className={styles.countdownLabel}>days</span>
          </div>
        )}
        <XPBadge />
      </div>
    </header>
  );
}
