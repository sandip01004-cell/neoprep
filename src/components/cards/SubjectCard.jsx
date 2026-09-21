import React, { memo } from 'react';
import { useApp } from '../../context/AppContext';
import ProgressBar from '../ui/ProgressBar';
import styles from './SubjectCard.module.css';

/**
 * Subject card showing today's progress vs target.
 * Memoized — only re-renders when this subject's data changes.
 */
const SubjectCard = memo(function SubjectCard({ subject, onLog }) {
  const { subjectProgress } = useApp();
  const { value, target, pct, unitLabel } = subjectProgress(subject.id);

  const done = pct >= 100;

  return (
    <div
      className={`${styles.card} ${done ? styles.done : ''}`}
      style={{ '--subject-color': subject.color }}
    >
      {/* Color strip */}
      <div className={styles.strip} />

      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>{subject.icon}</span>
          <span className={styles.name}>{subject.name}</span>
          {done && <span className={styles.doneBadge}>✓ Done</span>}
        </div>

        <button
          className={styles.logBtn}
          onClick={() => onLog(subject.id)}
          aria-label={`Log ${subject.name}`}
          id={`log-btn-${subject.id}`}
        >
          + Log
        </button>
      </div>

      {/* Progress numbers */}
      <div className={styles.numbers}>
        <span className={styles.current}>{value}</span>
        <span className={styles.divider}>/</span>
        <span className={styles.target}>{target} {unitLabel}</span>
      </div>

      {/* Progress bar */}
      <ProgressBar pct={pct} color={subject.color} height={6} />

      {/* Pct label */}
      <div className={styles.footer}>
        <span className={styles.pct} style={{ color: done ? 'var(--accent-emerald)' : subject.color }}>
          {pct}%
        </span>
        {!done && (
          <span className={styles.remaining}>
            {target - value > 0 ? `${target - value} ${unitLabel} left` : 'Almost there!'}
          </span>
        )}
      </div>
    </div>
  );
});

export default SubjectCard;
