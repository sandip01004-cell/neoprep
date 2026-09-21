import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportJSON, importJSON, getStorageUsedKB } from '../utils/storage';
import { formatDate } from '../utils/date';
import styles from './Settings.module.css';

export default function Settings() {
  const { state, dispatch } = useApp();
  const fileRef = useRef(null);

  const [importStatus, setImportStatus]   = useState(''); // '' | 'success' | 'error'
  const [importMessage, setImportMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport]  = useState(null);
  const [showFirebase, setShowFirebase]    = useState(false);

  const storageKB = getStorageUsedKB();

  const handleExport = () => {
    exportJSON(state);
    dispatch({ type: 'MARK_EXPORTED' });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      setPendingImport(data);
      setShowImportConfirm(true);
    } catch (err) {
      setImportStatus('error');
      setImportMessage(err.message || 'Invalid file.');
    }
    e.target.value = ''; // reset input
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    dispatch({ type: 'IMPORT_DATA', payload: pendingImport });
    setShowImportConfirm(false);
    setImportStatus('success');
    setImportMessage('Data imported successfully!');
    setPendingImport(null);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_APP' });
    setShowResetConfirm(false);
  };

  const storageColor = storageKB > 3000 ? 'var(--accent-rose)' : storageKB > 1500 ? 'var(--accent-amber)' : 'var(--accent-emerald)';

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      {/* ── Stats summary ── */}
      <div className={styles.statsRow}>
        <StatChip label="Total XP"   value={state.xp.total}           />
        <StatChip label="Level"      value={state.xp.level}           />
        <StatChip label="Best Streak" value={`${state.streak.longest}d`} />
        <StatChip label="Tests"      value={state.tests.length}       />
      </div>

      {/* ── Data section ── */}
      <Section title="Data & Backup">
        <div className={styles.storageBar}>
          <div className={styles.storageHeader}>
            <span className={styles.storageLabel}>Storage used</span>
            <span className={styles.storageVal} style={{ color: storageColor }}>{storageKB} KB / ~5000 KB</span>
          </div>
          <div className={styles.storageTrack}>
            <div
              className={styles.storageFill}
              style={{ width: `${Math.min(100, (storageKB / 5000) * 100)}%`, background: storageColor }}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <p className={styles.rowLabel}>Export backup</p>
            <p className={styles.rowSub}>
              {state.config.lastExportDate
                ? `Last exported: ${formatDate(state.config.lastExportDate)}`
                : 'Never exported'}
            </p>
          </div>
          <button id="export-btn" className="btn btn-secondary btn-sm" onClick={handleExport}>
            Export JSON
          </button>
        </div>

        <div className={styles.row}>
          <div>
            <p className={styles.rowLabel}>Import backup</p>
            <p className={styles.rowSub}>Restore from a previous export file</p>
          </div>
          <button id="import-btn" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {importStatus && (
          <div className={`${styles.statusMsg} ${importStatus === 'success' ? styles.success : styles.errorMsg}`}>
            {importStatus === 'success' ? '✓ ' : '⚠ '}{importMessage}
          </div>
        )}
      </Section>

      {/* ── Exam date ── */}
      <Section title="Exam">
        <div className={styles.row}>
          <p className={styles.rowLabel}>Exam date</p>
          <input
            id="settings-exam-date"
            type="date"
            className="input"
            style={{ maxWidth: 160 }}
            value={state.config.examDate || ''}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => dispatch({ type: 'UPDATE_CONFIG', payload: { examDate: e.target.value } })}
          />
        </div>
      </Section>

      {/* ── Danger zone ── */}
      <Section title="Danger zone">
        <div className={styles.row}>
          <div>
            <p className={styles.rowLabel}>Reset everything</p>
            <p className={styles.rowSub}>Wipes all logs, tests, XP, and settings</p>
          </div>
          <button id="reset-btn" className="btn btn-danger btn-sm" onClick={() => setShowResetConfirm(true)}>
            Reset
          </button>
        </div>
      </Section>

      {/* ── Advanced (Firebase) ── */}
      <div className={styles.advancedToggle}>
        <button className={styles.advancedBtn} onClick={() => setShowFirebase(v => !v)}>
          ⚠️ Advanced settings {showFirebase ? '▲' : '▼'}
        </button>
        {showFirebase && (
          <div className={styles.advancedPanel}>
            <p className={styles.advancedNote}>
              Firebase sync is optional and for advanced users. Provide your own Firebase config.
              This is NOT built-in — you need a personal Firebase project.
            </p>
            <input className="input" placeholder="Firebase API key" disabled style={{ opacity: 0.5 }} />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Coming in a future version.</p>
          </div>
        )}
      </div>

      {/* Import confirm modal */}
      {showImportConfirm && (
        <ConfirmModal
          title="Import data?"
          message="This will replace ALL your current data with the backup file. This cannot be undone."
          confirmLabel="Yes, import"
          onConfirm={confirmImport}
          onCancel={() => { setShowImportConfirm(false); setPendingImport(null); }}
          danger
        />
      )}

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <ConfirmModal
          title="Reset NeoPrep?"
          message="All your logs, XP, streaks, and test results will be permanently deleted."
          confirmLabel="Yes, reset everything"
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
          danger
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionContent}>{children}</div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className={styles.statChip}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, danger }) {
  return (
    <>
      <div className={styles.modalBackdrop} onClick={onCancel} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalMsg}>{message}</p>
        <div className={styles.modalActions}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
