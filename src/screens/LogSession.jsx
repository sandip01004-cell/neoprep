import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import DialInput from '../components/dial/DialInput';
import Neo from '../components/mascot/Neo';
import styles from './LogSession.module.css';

function getPresets(metric) {
  if (metric === 'time')  return [30, 60, 90, 120];
  if (metric === 'pages') return [5, 10, 20, 30];
  return [5, 10, 25, 50];
}

export default function LogSession({ onClose, preselectSubjectId }) {
  const { state, dispatch, subjectProgress } = useApp();
  const { subjects } = state.config;

  const [activeSubjectId, setActiveSubjectId] = useState(
    preselectSubjectId || subjects[0]?.id || ''
  );
  const [value, setValue] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const { value: currentToday, target } = subjectProgress(activeSubjectId);

  // Reset dial when switching subjects
  useEffect(() => { setValue(0); }, [activeSubjectId]);

  const handleConfirm = useCallback(() => {
    if (value <= 0 || !activeSubjectId) return;
    dispatch({ type: 'LOG_SESSION', payload: { subjectId: activeSubjectId, value } });
    setSubmitted(true);
    // Haptic
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    // Auto-close after short celebration moment
    setTimeout(onClose, 800);
  }, [value, activeSubjectId, dispatch, onClose]);

  const maxValue = target * 2; // FIX: dynamic max, not hardcoded 100
  const neoState = submitted ? 'celebrate' : value > 0 ? 'happy' : 'idle';

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Bottom sheet */}
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Log study session">
        {/* Handle */}
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Log session</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Subject tabs */}
        <div className={styles.tabs} role="tablist">
          {subjects.map(s => (
            <button
              key={s.id}
              role="tab"
              id={`log-tab-${s.id}`}
              className={`${styles.tab} ${activeSubjectId === s.id ? styles.tabActive : ''}`}
              style={{ '--tab-color': s.color }}
              onClick={() => setActiveSubjectId(s.id)}
              aria-selected={activeSubjectId === s.id}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        {/* Current progress reminder */}
        {activeSubject && (
          <p className={styles.todaySoFar}>
            Today so far: <strong>{currentToday}</strong> / {target} {activeSubject.unitLabel}
          </p>
        )}

        {/* Dial + Neo row */}
        <div className={styles.dialRow}>
          <Neo state={neoState} size={68} />
          <DialInput
            value={value}
            onChange={setValue}
            maxValue={maxValue}
            presets={getPresets(activeSubject?.metric)}
            unitLabel={activeSubject?.unitLabel || 'units'}
          />
        </div>

        {/* Manual input row */}
        <div className={styles.manualRow}>
          <span className={styles.orLabel}>or type manually</span>
          <input
            id="log-manual-input"
            type="number"
            className={`input ${styles.manualInput}`}
            placeholder="0"
            min="0"
            max={maxValue}
            value={value || ''}
            onChange={e => setValue(Math.max(0, Math.min(maxValue, parseInt(e.target.value) || 0)))}
          />
          <span className={styles.unitLabel}>{activeSubject?.unitLabel}</span>
        </div>

        {/* Confirm */}
        <button
          id="log-confirm-btn"
          className={`btn btn-primary btn-full btn-lg ${styles.confirmBtn} ${submitted ? styles.submitted : ''}`}
          onClick={handleConfirm}
          disabled={value <= 0 || submitted}
        >
          {submitted ? '✓ Logged!' : `Confirm +${value} ${activeSubject?.unitLabel || 'units'}`}
        </button>
      </div>
    </>
  );
}
