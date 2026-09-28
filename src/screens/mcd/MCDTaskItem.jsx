import React from 'react';
import { motion } from 'framer-motion';
import styles from './MCDTaskItem.module.css';

export default function MCDTaskItem({ task, section, onToggle, onDelete, onDragStart }) {
  const isDont = section === 'dont';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${styles.taskItem} ${task.done ? styles.done : ''} ${styles[section]}`}
      draggable="true"
      onDragStart={(e) => onDragStart(e, task.id)}
    >
      <button 
        className={`${styles.checkbox} ${task.done ? styles.checked : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={isDont ? "Mark as avoided" : "Mark as done"}
      >
        {task.done && (isDont ? '🛡️' : '✓')}
      </button>

      <div className={styles.content}>
        <div className={styles.text}>{task.text}</div>
        {(task.time || task.duration) && (
          <div className={styles.meta}>
            {task.time && <span className={styles.time}>⏰ {task.time}</span>}
            {task.duration && <span className={styles.duration}>⏳ {task.duration}</span>}
          </div>
        )}
      </div>

      <button 
        className={styles.deleteBtn}
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
      >
        ✕
      </button>
    </motion.div>
  );
}
