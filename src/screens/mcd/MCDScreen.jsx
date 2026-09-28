import React, { useState, useEffect } from 'react';
import { useMCD } from '../../context/MCDContext';
import MCDSection from './MCDSection';
import MCDTutorial, { shouldShowTutorial } from './MCDTutorial';
import MCDResetPrompt from './MCDResetPrompt';
import styles from './MCDScreen.module.css';
import { motion } from 'framer-motion';

export default function MCDScreen() {
  const { state, dispatch, storedYesterday } = useMCD();
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showResetPrompt, setShowResetPrompt] = useState(false);

  useEffect(() => {
    // Check for tutorial
    if (shouldShowTutorial()) {
      setShowTutorial(true);
    }
    // Check for stale day
    if (storedYesterday) {
      setShowResetPrompt(true);
    }
  }, [storedYesterday]);

  const handleAddTask = (section, task) => {
    dispatch({ type: 'ADD_TASK', section, task });
  };

  const handleToggleTask = (section, id) => {
    dispatch({ type: 'TOGGLE_TASK', section, id });
  };

  const handleDeleteTask = (section, id) => {
    dispatch({ type: 'DELETE_TASK', section, id });
  };

  const handleDrop = (taskId, fromSection, toSection) => {
    dispatch({ type: 'MOVE_TASK', taskId, fromSection, toSection });
  };

  // Calculate overall progress for "Must Do" and "Can Do"
  const productiveTasks = [...state.must, ...state.can];
  const completedProductive = productiveTasks.filter(t => t.done).length;
  const progressPercent = productiveTasks.length === 0 ? 0 : Math.round((completedProductive / productiveTasks.length) * 100);

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Daily Plan</h1>
          <p className={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        
        {/* Simple Progress Indicator */}
        <div className={styles.progressWidget}>
          <div className={styles.progressCircle} style={{ background: `conic-gradient(var(--accent-emerald) ${progressPercent}%, var(--bg-elevated) 0)` }}>
            <div className={styles.progressInner}>
              {progressPercent}%
            </div>
          </div>
          <span className={styles.progressLabel}>Done</span>
        </div>
      </div>

      <div className={styles.board}>
        <MCDSection
          title="Must Do"
          section="must"
          tasks={state.must}
          onAddTask={(task) => handleAddTask('must', task)}
          onToggle={(id) => handleToggleTask('must', id)}
          onDelete={(id) => handleDeleteTask('must', id)}
          onDrop={handleDrop}
        />
        <MCDSection
          title="Can Do"
          section="can"
          tasks={state.can}
          onAddTask={(task) => handleAddTask('can', task)}
          onToggle={(id) => handleToggleTask('can', id)}
          onDelete={(id) => handleDeleteTask('can', id)}
          onDrop={handleDrop}
        />
        <MCDSection
          title="Don't Do"
          section="dont"
          tasks={state.dont}
          onAddTask={(task) => handleAddTask('dont', task)}
          onToggle={(id) => handleToggleTask('dont', id)}
          onDelete={(id) => handleDeleteTask('dont', id)}
          onDrop={handleDrop}
        />
      </div>

      {showTutorial && <MCDTutorial onDismiss={() => setShowTutorial(false)} />}
      {showResetPrompt && !showTutorial && <MCDResetPrompt onComplete={() => setShowResetPrompt(false)} />}
    </motion.div>
  );
}
