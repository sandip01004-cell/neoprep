import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMCD } from '../../context/MCDContext';
import styles from './MCDResetPrompt.module.css';

export default function MCDResetPrompt({ onComplete }) {
  const { dispatch, storedYesterday } = useMCD();

  const handleStartFresh = () => {
    dispatch({ type: 'RESET_DAY' });
    onComplete();
  };

  const handleKeepTasks = () => {
    dispatch({ type: 'KEEP_TASKS' });
    onComplete();
  };

  // If no yesterday tasks, just silently reset
  if (!storedYesterday) {
    handleStartFresh();
    return null;
  }

  const hasTasks = storedYesterday.must.length > 0 || storedYesterday.can.length > 0 || storedYesterday.dont.length > 0;

  if (!hasTasks) {
     handleStartFresh();
     return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className={styles.icon}>🌅</div>
          <h2 className={styles.title}>It's a new day!</h2>
          <p className={styles.subtitle}>
            You have tasks left over from your previous session. 
            Would you like to start fresh or keep them for today?
          </p>

          <div className={styles.actions}>
            <button className={styles.freshBtn} onClick={handleStartFresh}>
              Start Fresh
            </button>
            <button className={styles.keepBtn} onClick={handleKeepTasks}>
              Keep Yesterday's Tasks
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
