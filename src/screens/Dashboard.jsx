import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import SubjectCard from '../components/cards/SubjectCard';
import ProgressBar from '../components/ui/ProgressBar';
import Neo from '../components/mascot/Neo';
import LogSession from './LogSession';
import { getGreeting } from '../utils/date';
import styles from './Dashboard.module.css';

export default function Dashboard({ onOpenLog }) {
  const { state, globalProgress } = useApp();
  const { subjects } = state.config;
  const { streak } = state;
  const progress = globalProgress();

  // Determine Neo state based on global progress
  const getNeoState = () => {
    if (progress.pct >= 100) return 'celebrate';
    if (progress.pct >= 50)  return 'excited';
    const h = new Date().getHours();
    if (h >= 18 && progress.pct === 0) return 'encouraging';
    return 'idle';
  };

  // Pre-log drawer: which subject to pre-select
  const [preselect, setPreselect] = useState(null);
  const [logOpen, setLogOpen] = useState(false);

  const openLogFor = (subjectId) => {
    setPreselect(subjectId);
    setLogOpen(true);
  };

  return (
    <div className={styles.page}>
      {/* ── Header row ── */}
      <div className={styles.heroRow}>
        <div className={styles.heroText}>
          <p className={styles.greeting}>{getGreeting()}</p>
          <h1 className={styles.headline}>
            {progress.pct >= 100
              ? "Today's done! 🎉"
              : progress.pct >= 50
              ? "Halfway there 💪"
              : "Let's get going 🔥"}
          </h1>

          {/* Streak */}
          <div className={styles.streakRow}>
            <span className={styles.streakFlame}>🔥</span>
            <span className={styles.streakNum}>{streak.current}</span>
            <span className={styles.streakLabel}>day streak</span>
            {streak.longest > 0 && (
              <span className={styles.streakBest}>· best: {streak.longest}</span>
            )}
          </div>
        </div>

        <Neo state={getNeoState()} size={72} />
      </div>

      {/* ── Global progress bar ── */}
      <div className={styles.globalBar}>
        <div className={styles.globalBarHeader}>
          <span className={styles.globalBarLabel}>Today's overall</span>
          <span className={styles.globalBarPct} style={{ color: progress.pct >= 100 ? 'var(--accent-emerald)' : 'var(--accent-violet-light)' }}>
            {progress.pct}%
          </span>
        </div>
        <ProgressBar
          pct={progress.pct}
          color={progress.pct >= 100 ? 'var(--accent-emerald)' : 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))'}
          height={10}
        />
        <p className={styles.globalBarSub}>
          {progress.value} / {progress.target} total units logged today
        </p>
      </div>

      {/* ── Subject cards ── */}
      <div className={styles.cardsSection}>
        <h2 className={styles.sectionTitle}>Subjects</h2>
        <div className={styles.cardGrid}>
          {subjects.map(s => (
            <SubjectCard key={s.id} subject={s} onLog={openLogFor} />
          ))}
        </div>
      </div>

      {/* ── Log FAB ── */}
      <button
        id="dashboard-fab"
        className={styles.fab}
        onClick={onOpenLog}
        aria-label="Log a study session"
      >
        <span className={styles.fabIcon}>+</span>
        <span>Log session</span>
      </button>

      {/* Inline log session drawer triggered from card */}
      {logOpen && (
        <LogSession
          preselectSubjectId={preselect}
          onClose={() => { setLogOpen(false); setPreselect(null); }}
        />
      )}
    </div>
  );
}
