import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import styles from './ManageSubjects.module.css';

// ── Constants ──────────────────────────────────────────────────────────

const METRIC_OPTIONS = [
  { value: 'questions', label: 'Questions', unit: 'Qs',  icon: '❓' },
  { value: 'time',      label: 'Minutes',   unit: 'min', icon: '⏱️' },
  { value: 'pages',     label: 'Pages',     unit: 'pgs', icon: '📄' },
];

const PALETTE = [
  '#7c3aed', '#9d5cf6', '#3b82f6', '#06b6d4', '#10b981',
  '#34d399', '#f59e0b', '#fb7185', '#f43f5e', '#818cf8',
];

const ICONS = ['📚', '🧠', '⚛️', '🧪', '🌿', '📊', '✏️', '🔬', '💡', '🎯'];

// ── SubjectRow ─────────────────────────────────────────────────────────

function SubjectRow({ subject, onDelete, disableDelete, todayProgress }) {
  const { dispatch } = useApp();
  const [expanded,    setExpanded]    = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState(subject.name);
  const [confirm,     setConfirm]     = useState(false);
  const nameRef = useRef(null);

  const commitRename = () => {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== subject.name) {
      dispatch({ type: 'RENAME_SUBJECT', payload: { id: subject.id, name: trimmed } });
    } else {
      setNameVal(subject.name);
    }
    setEditingName(false);
  };

  const updateField = (key, value) => {
    const changes = { [key]: value };
    if (key === 'metric') {
      const opt = METRIC_OPTIONS.find(m => m.value === value);
      changes.unitLabel = opt?.unit || value;
    }
    dispatch({ type: 'UPDATE_SUBJECT', payload: { id: subject.id, changes } });
  };

  const handleDelete = () => {
    onDelete(subject.id);
    setConfirm(false);
  };

  return (
    <div className={styles.row} style={{ '--s-color': subject.color }}>
      {/* Row header */}
      <div className={styles.rowHeader}>
        {/* Color swatch */}
        <span className={styles.colorDot} style={{ background: subject.color }} />

        {/* Name — inline edit on click */}
        {editingName ? (
          <input
            ref={nameRef}
            className={styles.nameInput}
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setNameVal(subject.name); setEditingName(false); }
            }}
            maxLength={30}
            autoFocus
          />
        ) : (
          <button
            className={styles.nameBtn}
            onClick={() => { setEditingName(true); }}
            title="Click to rename"
          >
            <span>{subject.icon}</span>
            <span>{subject.name}</span>
            <span className={styles.editIcon}>✎</span>
          </button>
        )}

        {/* Progress badge */}
        <span className={styles.progressBadge}>
          {todayProgress.value}/{todayProgress.target} {subject.unitLabel}
        </span>

        {/* Actions */}
        <div className={styles.rowActions}>
          <button
            className={`${styles.iconBtn} ${expanded ? styles.iconBtnActive : ''}`}
            onClick={() => setExpanded(v => !v)}
            title="Edit settings"
            aria-expanded={expanded}
          >
            ⚙
          </button>
          <button
            className={`${styles.iconBtn} ${styles.deleteBtn}`}
            onClick={() => setConfirm(true)}
            disabled={disableDelete}
            title={disableDelete ? 'Need at least 1 subject' : `Delete ${subject.name}`}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className={styles.expandedPanel}>
          {/* Icon picker */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Icon</label>
            <div className={styles.iconPicker}>
              {ICONS.map(ic => (
                <button
                  key={ic}
                  className={`${styles.iconOption} ${subject.icon === ic ? styles.iconOptionActive : ''}`}
                  onClick={() => updateField('icon', ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Color</label>
            <div className={styles.colorPicker}>
              {PALETTE.map(c => (
                <button
                  key={c}
                  className={`${styles.colorOption} ${subject.color === c ? styles.colorOptionActive : ''}`}
                  style={{ background: c }}
                  onClick={() => updateField('color', c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Metric */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Metric</label>
            <div className={styles.metricBtns}>
              {METRIC_OPTIONS.map(m => (
                <button
                  key={m.value}
                  className={`${styles.metricBtn} ${subject.metric === m.value ? styles.metricBtnActive : ''}`}
                  onClick={() => updateField('metric', m.value)}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily target */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={`target-${subject.id}`}>
              Daily target
            </label>
            <div className={styles.targetRow}>
              <input
                id={`target-${subject.id}`}
                className={`input ${styles.targetInput}`}
                type="number"
                min="1"
                max="9999"
                value={subject.dailyTarget}
                onChange={e => updateField('dailyTarget', parseInt(e.target.value) || 0)}
              />
              <span className={styles.unitLabel}>{subject.unitLabel || 'units'} / day</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirm && (
        <>
          <div className={styles.confirmBackdrop} onClick={() => setConfirm(false)} />
          <div className={styles.confirmBox} role="dialog">
            <p className={styles.confirmMsg}>
              Delete <strong>{subject.name}</strong>? All logged data for this subject will be permanently removed.
            </p>
            <div className={styles.confirmActions}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── AddSubjectForm ─────────────────────────────────────────────────────

function AddSubjectForm({ onAdd }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
    inputRef.current?.focus();
  };

  return (
    <div className={styles.addForm}>
      <input
        ref={inputRef}
        id="new-subject-name"
        className={`input ${styles.addInput}`}
        placeholder="New subject name…"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        maxLength={30}
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={handleAdd}
        disabled={!name.trim()}
        id="add-subject-btn"
      >
        + Add
      </button>
    </div>
  );
}

// ── ManageSubjects (main export) ───────────────────────────────────────

export default function ManageSubjects() {
  const { state, dispatch, todayLogs } = useApp();
  const [expanded, setExpanded] = useState(false);
  const subjects = state.config.subjects;

  const getTodayProgress = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return { value: 0, target: 0 };
    return {
      value:  todayLogs(subjectId),
      target: subject.dailyTarget,
    };
  };

  const handleAddSubject = (name) => {
    const colors = PALETTE;
    const idx    = subjects.length % colors.length;
    const id     = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    dispatch({
      type: 'ADD_SUBJECT',
      payload: {
        id,
        name,
        color:       colors[idx],
        icon:        ICONS[idx % ICONS.length],
        metric:      'questions',
        unitLabel:   'Qs',
        dailyTarget: 30,
        weeklyTarget: null,
      },
    });
  };

  const handleDeleteSubject = (id) => {
    dispatch({ type: 'DELETE_SUBJECT', payload: id });
  };

  // Drag-to-reorder state
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDropIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { resetDrag(); return; }
    const reordered = [...subjects];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    dispatch({ type: 'REORDER_SUBJECTS', payload: reordered });
    resetDrag();
  };

  const resetDrag = () => { setDragIdx(null); setDropIdx(null); };

  return (
    <div className={styles.wrap}>
      {/* Toggle header */}
      <button
        className={styles.headerBtn}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        id="manage-subjects-toggle"
      >
        <span className={styles.headerLeft}>
          <span className={styles.headerIcon}>📋</span>
          <span className={styles.headerTitle}>Manage Subjects &amp; Goals</span>
          <span className={styles.countBadge}>{subjects.length}</span>
        </span>
        <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className={styles.panel}>
          <p className={styles.hint}>
            Drag rows to reorder. Click a subject name to rename. Click ⚙ to edit icon, color, metric & target.
          </p>

          {/* Subject list */}
          <div className={styles.list}>
            {subjects.map((s, idx) => (
              <div
                key={s.id}
                draggable
                onDragStart={e => handleDragStart(e, idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={resetDrag}
                className={`${styles.draggableItem} ${dropIdx === idx && dragIdx !== idx ? styles.dropTarget : ''}`}
              >
                <span className={styles.dragHandle} title="Drag to reorder">⠿</span>
                <div className={styles.rowContent}>
                  <SubjectRow
                    subject={s}
                    onDelete={handleDeleteSubject}
                    disableDelete={subjects.length <= 1}
                    todayProgress={getTodayProgress(s.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add new subject */}
          <AddSubjectForm onAdd={handleAddSubject} />
        </div>
      )}
    </div>
  );
}
