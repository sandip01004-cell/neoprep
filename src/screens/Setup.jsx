import React, { useState } from 'react';
import { useApp, DEFAULT_SUBJECTS } from '../context/AppContext';
import Neo from '../components/mascot/Neo';
import styles from './Setup.module.css';

const METRIC_OPTIONS = [
  { value: 'questions', label: 'Questions', unit: 'Qs',  icon: '❓' },
  { value: 'time',      label: 'Minutes',   unit: 'min', icon: '⏱️' },
  { value: 'pages',     label: 'Pages',     unit: 'pgs', icon: '📄' },
];

function getDefaultPresets(metric) {
  if (metric === 'time')  return [30, 60, 90, 120];
  if (metric === 'pages') return [5, 10, 20, 30];
  return [5, 10, 25, 50];
}

export default function Setup() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(1); // 1 or 2

  // Step 1 state — subjects list
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Step 2 state — per-subject metric + target, plus exam date
  const [subjectSettings, setSubjectSettings] = useState(() =>
    Object.fromEntries(DEFAULT_SUBJECTS.map(s => [s.id, { metric: s.metric, unitLabel: s.unitLabel, dailyTarget: s.dailyTarget }]))
  );
  const [examDate, setExamDate] = useState('');

  const addSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const colors = ['#818cf8', '#fb7185', '#34d399', '#fbbf24', '#60a5fa'];
    const icons  = ['📚', '🧠', '🔬', '📊', '✏️'];
    const idx    = subjects.length % colors.length;
    const newSub = { id, name, color: colors[idx], icon: icons[idx], metric: 'questions', unitLabel: 'Qs', dailyTarget: 30, weeklyTarget: null };
    setSubjects(prev => [...prev, newSub]);
    setSubjectSettings(prev => ({ ...prev, [id]: { metric: 'questions', unitLabel: 'Qs', dailyTarget: 30 } }));
    setNewSubjectName('');
  };

  const removeSubject = (id) => {
    if (subjects.length <= 1) return; // at least one
    setSubjects(prev => prev.filter(s => s.id !== id));
    setSubjectSettings(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const updateSubjectSetting = (id, key, val) => {
    setSubjectSettings(prev => {
      const updated = { ...prev[id], [key]: val };
      if (key === 'metric') {
        const opt = METRIC_OPTIONS.find(m => m.value === val);
        updated.unitLabel = opt?.unit || val;
      }
      return { ...prev, [id]: updated };
    });
  };

  const handleFinish = () => {
    // Merge settings back into subjects
    const finalSubjects = subjects.map(s => ({
      ...s,
      ...subjectSettings[s.id],
    }));
    dispatch({
      type: 'SETUP_COMPLETE',
      payload: { subjects: finalSubjects, examDate },
    });
  };

  const canGoNext = subjects.length > 0;
  const canFinish = subjects.every(s => (subjectSettings[s.id]?.dailyTarget || 0) > 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Neo state="happy" size={70} />
        <div>
          <h1 className={styles.title}>
            {step === 1 ? "Let's set up NeoPrep" : 'Set your targets'}
          </h1>
          <p className={styles.subtitle}>
            {step === 1 ? 'Your subjects for this year' : 'How much do you aim to do daily?'}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className={styles.steps}>
        <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>1</div>
        <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineDone : ''}`} />
        <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>2</div>
      </div>

      {/* ── Step 1: Subjects ── */}
      {step === 1 && (
        <div className={styles.content}>
          <div className={styles.subjectList}>
            {subjects.map(s => (
              <div key={s.id} className={styles.subjectChip}>
                <span>{s.icon}</span>
                <span className={styles.subjectChipName}>{s.name}</span>
                {subjects.length > 1 && (
                  <button className={styles.removeBtn} onClick={() => removeSubject(s.id)} aria-label={`Remove ${s.name}`}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={styles.addRow}>
            <input
              id="new-subject-input"
              className="input"
              placeholder="Add a subject…"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()}
              maxLength={30}
            />
            <button className={`btn btn-secondary btn-sm ${styles.addBtn}`} onClick={addSubject}>Add</button>
          </div>
        </div>
      )}

      {/* ── Step 2: Metric + Target per subject + Exam Date ── */}
      {step === 2 && (
        <div className={styles.content}>
          {subjects.map(s => {
            const settings = subjectSettings[s.id] || {};
            return (
              <div key={s.id} className={styles.settingCard}>
                <div className={styles.settingCardHeader}>
                  <span style={{ color: s.color }}>{s.icon} {s.name}</span>
                </div>

                {/* Metric selector */}
                <div className={styles.metricRow}>
                  {METRIC_OPTIONS.map(m => (
                    <button
                      key={m.value}
                      className={`${styles.metricBtn} ${settings.metric === m.value ? styles.metricBtnActive : ''}`}
                      onClick={() => updateSubjectSetting(s.id, 'metric', m.value)}
                      style={{ '--m-color': s.color }}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>

                {/* Daily target */}
                <div className={styles.targetRow}>
                  <label className={styles.targetLabel}>Daily target</label>
                  <div className={styles.targetInput}>
                    <input
                      id={`target-${s.id}`}
                      type="number"
                      className="input"
                      min="1"
                      max="9999"
                      value={settings.dailyTarget || ''}
                      onChange={e => updateSubjectSetting(s.id, 'dailyTarget', parseInt(e.target.value) || 0)}
                    />
                    <span className={styles.unitLabel}>{settings.unitLabel || 'units'}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Exam Date */}
          <div className={styles.examRow}>
            <label className={styles.targetLabel} htmlFor="exam-date">📅 Exam date <span className={styles.optional}>(optional)</span></label>
            <input
              id="exam-date"
              type="date"
              className="input"
              value={examDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setExamDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className={styles.navRow}>
        {step === 2 && (
          <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
        )}
        {step === 1 && (
          <button
            id="setup-next-btn"
            className="btn btn-primary btn-full"
            onClick={() => setStep(2)}
            disabled={!canGoNext}
          >
            Next →
          </button>
        )}
        {step === 2 && (
          <button
            id="setup-finish-btn"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleFinish}
            disabled={!canFinish}
          >
            Let's go! 🚀
          </button>
        )}
      </div>
    </div>
  );
}
