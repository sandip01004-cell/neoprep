import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MCDTaskItem from './MCDTaskItem';
import styles from './MCDSection.module.css';

export default function MCDSection({ title, section, tasks, onAddTask, onToggle, onDelete, onDrop, onDragStart }) {
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    onAddTask({ text: text.trim(), time, duration });
    setText('');
    setTime('');
    setDuration('');
    setIsAdding(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    const fromSection = e.dataTransfer.getData('section');
    if (taskId && fromSection && fromSection !== section) {
      onDrop(taskId, fromSection, section);
    }
  };

  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const isDont = section === 'dont';

  return (
    <div 
      className={`${styles.section} ${styles[section]} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.count}>
            {completedCount}/{totalCount}
          </span>
        </div>
        {totalCount > 0 && !isDont && (
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className={styles.taskList}>
        <AnimatePresence>
          {tasks.map((task) => (
            <MCDTaskItem
              key={task.id}
              task={task}
              section={section}
              onToggle={onToggle}
              onDelete={onDelete}
              onDragStart={(e, id) => {
                e.dataTransfer.setData('taskId', id);
                e.dataTransfer.setData('section', section);
                onDragStart && onDragStart();
              }}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && !isAdding && (
          <div className={styles.emptyState}>
            No tasks yet. Drag here or add one.
          </div>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className={styles.addForm}>
          <input
            type="text"
            className={styles.input}
            placeholder="Task description..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className={styles.addMetaRow}>
            <input
              type="time"
              className={styles.inputSmall}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <input
              type="text"
              className={styles.inputSmall}
              placeholder="e.g. 30m"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className={styles.addActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setIsAdding(false)}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={!text.trim()}>Add Task</button>
          </div>
        </form>
      ) : (
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
          + Add Task
        </button>
      )}
    </div>
  );
}
