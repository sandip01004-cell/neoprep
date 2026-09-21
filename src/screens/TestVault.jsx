import React, { useState, lazy, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/date';
import { v4 as uuidv4 } from 'uuid';
import styles from './TestVault.module.css';

// Lazy load chart
const TrendChart = lazy(() => import('../components/charts/TrendChart'));

const TEST_TYPES = ['Full Test', 'Part Test', 'Custom'];

export default function TestVault() {
  const { state, dispatch } = useApp();
  const { subjects } = state.config;
  const { tests } = state;

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    type: 'Full Test',
    date: new Date().toISOString().slice(0, 10),
    total: '',
    maxMarks: '720',
    subjects: Object.fromEntries(subjects.map(s => [s.id, ''])),
  });
  const [formError, setFormError] = useState('');

  const updateForm = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setFormError('');
  };

  const updateSubjectMark = (id, val) => {
    setForm(prev => ({ ...prev, subjects: { ...prev.subjects, [id]: val } }));
    setFormError('');
  };

  const validateAndSubmit = () => {
    const total    = parseInt(form.total) || 0;
    const maxMarks = parseInt(form.maxMarks) || 720;
    const subSum   = Object.values(form.subjects).reduce((a, v) => a + (parseInt(v) || 0), 0);

    if (total <= 0) { setFormError('Total marks must be greater than 0.'); return; }
    if (maxMarks <= 0) { setFormError('Max marks must be greater than 0.'); return; }
    if (total > maxMarks) { setFormError('Total cannot exceed max marks.'); return; }

    const dateStr = form.date;
    if (dateStr > new Date().toISOString().slice(0, 10)) {
      setFormError('Date cannot be in the future.');
      return;
    }

    const subjectMarks = Object.fromEntries(
      Object.entries(form.subjects).map(([id, v]) => [id, parseInt(v) || 0])
    );

    dispatch({
      type: 'ADD_TEST',
      payload: {
        id:       uuidv4(),
        type:     form.type,
        date:     dateStr,
        total,
        maxMarks,
        subjects: subjectMarks,
      },
    });
    setShowAddModal(false);
    setForm(prev => ({ ...prev, total: '', subjects: Object.fromEntries(subjects.map(s => [s.id, ''])) }));
  };

  const deleteTest = (id) => {
    if (window.confirm('Delete this test result?')) {
      dispatch({ type: 'DELETE_TEST', payload: id });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Test Vault</h1>
        <button
          id="add-test-btn"
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
        >
          + Add Test
        </button>
      </div>

      {/* Trend chart */}
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Score trend</h2>
        <Suspense fallback={<div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading chart…</div>}>
          <TrendChart tests={tests} />
        </Suspense>
      </div>

      {/* Tests list */}
      <div className={styles.list}>
        {tests.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <p>No tests yet. Add your first test result!</p>
          </div>
        )}
        {tests.map(t => {
          const pct = Math.round((t.total / (t.maxMarks || 720)) * 100);
          return (
            <div key={t.id} className={styles.testCard}>
              <div className={styles.testCardRow}>
                <div>
                  <span className={`badge ${pct >= 70 ? 'badge-emerald' : pct >= 50 ? 'badge-amber' : 'badge-violet'}`}>
                    {t.type}
                  </span>
                  <p className={styles.testDate}>{formatDate(t.date)}</p>
                </div>
                <div className={styles.testScore}>
                  <span className={styles.testScoreNum}>{t.total}</span>
                  <span className={styles.testScoreMax}>/{t.maxMarks || 720}</span>
                  <span className={styles.testScorePct} style={{ color: pct >= 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Subject breakdown */}
              {t.subjects && Object.keys(t.subjects).length > 0 && (
                <div className={styles.breakdown}>
                  {subjects.map(s => {
                    const mark = t.subjects[s.id] || 0;
                    return (
                      <span key={s.id} className={styles.breakdownItem} style={{ color: s.color }}>
                        {s.icon} {mark}
                      </span>
                    );
                  })}
                </div>
              )}

              <button className={styles.deleteBtn} onClick={() => deleteTest(t.id)} aria-label="Delete test">🗑</button>
            </div>
          );
        })}
      </div>

      {/* Add Test Modal */}
      {showAddModal && (
        <>
          <div className={styles.modalBackdrop} onClick={() => setShowAddModal(false)} />
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Add test result">
            <h2 className={styles.modalTitle}>Add test result</h2>

            {/* Test type */}
            <div className={styles.typeRow}>
              {TEST_TYPES.map(t => (
                <button
                  key={t}
                  className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ''}`}
                  onClick={() => updateForm('type', t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Date */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="test-date">Date</label>
              <input id="test-date" type="date" className="input" value={form.date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => updateForm('date', e.target.value)} />
            </div>

            {/* Total + Max marks */}
            <div className={styles.marksRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="test-total">Score</label>
                <input id="test-total" type="number" className="input" min="0" max={form.maxMarks || 720}
                  placeholder="540" value={form.total}
                  onChange={e => updateForm('total', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="test-max">Out of</label>
                <input id="test-max" type="number" className="input" min="1"
                  placeholder="720" value={form.maxMarks}
                  onChange={e => updateForm('maxMarks', e.target.value)} />
              </div>
            </div>

            {/* Subject-wise marks */}
            <div className={styles.subjectMarks}>
              <p className={styles.label}>Subject-wise marks</p>
              {subjects.map(s => (
                <div key={s.id} className={styles.subjectMarkRow}>
                  <span className={styles.subjectMarkLabel} style={{ color: s.color }}>{s.icon} {s.name}</span>
                  <input
                    id={`test-sub-${s.id}`}
                    type="number" className="input" style={{ maxWidth: 90 }}
                    placeholder="0" min="0"
                    value={form.subjects[s.id] || ''}
                    onChange={e => updateSubjectMark(s.id, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {formError && <p className={styles.error}>{formError}</p>}

            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button id="add-test-confirm-btn" className="btn btn-primary" onClick={validateAndSubmit}>Save result</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
