import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ── Helpers ────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

const STORAGE_KEY = 'neoprep_mcd';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const INITIAL_STATE = {
  date: todayStr(),
  must: [],
  can: [],
  dont: [],
};

// ── Reducer ────────────────────────────────────────────────────────────
function mcdReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK': {
      const { section, task } = action;
      return {
        ...state,
        [section]: [...state[section], { id: uuidv4(), ...task, done: false }],
      };
    }
    case 'DELETE_TASK': {
      const { section, id } = action;
      return { ...state, [section]: state[section].filter(t => t.id !== id) };
    }
    case 'TOGGLE_TASK': {
      const { section, id } = action;
      return {
        ...state,
        [section]: state[section].map(t =>
          t.id === id ? { ...t, done: !t.done } : t
        ),
      };
    }
    case 'REORDER_TASKS': {
      const { section, tasks } = action;
      return { ...state, [section]: tasks };
    }
    case 'MOVE_TASK': {
      const { fromSection, toSection, taskId } = action;
      const task = state[fromSection].find(t => t.id === taskId);
      if (!task) return state;
      return {
        ...state,
        [fromSection]: state[fromSection].filter(t => t.id !== taskId),
        [toSection]: [...state[toSection], { ...task, done: false }],
      };
    }
    case 'RESET_DAY':
      return { ...INITIAL_STATE, date: todayStr() };
    case 'KEEP_TASKS':
      return {
        ...state,
        date: todayStr(),
        must: state.must.map(t => ({ ...t, done: false })),
        can: state.can.map(t => ({ ...t, done: false })),
        dont: state.dont.map(t => ({ ...t, done: false })),
      };
    case 'RESTORE':
      return action.state;
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────
const MCDContext = createContext(null);

export function MCDProvider({ children }) {
  const stored = loadState();
  const init = stored && stored.date === todayStr() ? stored : INITIAL_STATE;
  const [state, dispatch] = useReducer(mcdReducer, init);

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Detect stale day on mount — expose via context flag
  const isStaleDay = stored && stored.date && stored.date !== todayStr();

  return (
    <MCDContext.Provider value={{ state, dispatch, storedYesterday: isStaleDay ? stored : null }}>
      {children}
    </MCDContext.Provider>
  );
}

export function useMCD() {
  const ctx = useContext(MCDContext);
  if (!ctx) throw new Error('useMCD must be used inside MCDProvider');
  return ctx;
}
