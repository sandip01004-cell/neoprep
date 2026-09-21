import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { loadState, saveState } from '../utils/storage';
import { getToday, computeStreak } from '../utils/date';
import { calculateSessionXP, calculateStreakBonus, computeLevel } from '../utils/xp';

// ── Debounce helper ────────────────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Default State ──────────────────────────────────────────────────────

const DEFAULT_SUBJECTS = [
  {
    id: 'physics', name: 'Physics', color: '#3b82f6', icon: '⚛️',
    metric: 'questions', unitLabel: 'Qs', dailyTarget: 50, weeklyTarget: null,
  },
  {
    id: 'chemistry', name: 'Chemistry', color: '#34d399', icon: '🧪',
    metric: 'questions', unitLabel: 'Qs', dailyTarget: 40, weeklyTarget: null,
  },
  {
    id: 'biology', name: 'Biology', color: '#f59e0b', icon: '🌿',
    metric: 'questions', unitLabel: 'Qs', dailyTarget: 60, weeklyTarget: null,
  },
];

const INITIAL_STATE = {
  config: {
    subjects:       DEFAULT_SUBJECTS,
    examDate:       '',
    setupDone:      false,
    lastExportDate: '',
    version:        1,
  },
  logs:    {},   // { "YYYY-MM-DD": { subjectId: number } }
  xp: {
    total:          0,
    level:          1,
    todayEarned:    0,
    lastXpDate:     '',
  },
  streak: {
    current:        0,
    longest:        0,
    lastLogDate:    '',
    lastBonusDate:  '',   // FIX: guard — streak bonus fires once per day max
  },
  tests: [],   // [{ id, type, date, total, maxMarks, subjects: {} }]
};

// ── Reducer ────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    case 'SETUP_COMPLETE': {
      return {
        ...state,
        config: { ...state.config, ...action.payload, setupDone: true },
      };
    }

    case 'LOG_SESSION': {
      const { subjectId, value, date = getToday() } = action.payload;
      const today = getToday();
      const subject = state.config.subjects.find(s => s.id === subjectId);
      if (!subject || value <= 0) return state;

      // Merge units into day log
      const prevValue = state.logs[date]?.[subjectId] || 0;
      const dayLog = { ...(state.logs[date] || {}), [subjectId]: prevValue + value };
      const newLogs = { ...state.logs, [date]: dayLog };

      // Check target completions
      const subjectHitTarget = dayLog[subjectId] >= subject.dailyTarget
        && prevValue < subject.dailyTarget; // only first time crossing target
      const allTargetsHit = state.config.subjects.every(
        s => (dayLog[s.id] || 0) >= s.dailyTarget
      );

      // Base + bonus XP (mutually exclusive bonuses)
      const isFirstLog = Object.keys(state.logs).length === 0;
      const sessionXP = calculateSessionXP({
        unitsLogged: value,
        dailyTarget: subject.dailyTarget,
        subjectHitTarget,
        allTargetsHit,
        isFirstLog,
      });

      // Streak
      const newStreakCount = computeStreak(newLogs);

      // Streak bonus fires once per day max
      const streakBonusAlreadyAwarded = state.streak.lastBonusDate === today;
      const streakBonus = (!streakBonusAlreadyAwarded && date === today)
        ? calculateStreakBonus(newStreakCount)
        : 0;

      const isSameDay   = state.xp.lastXpDate === today;
      const totalXP     = state.xp.total + sessionXP + streakBonus;
      const prevLevel   = state.xp.level;
      const newLevel    = computeLevel(totalXP);
      const didLevelUp  = newLevel > prevLevel;

      return {
        ...state,
        logs: newLogs,
        xp: {
          total:       totalXP,
          level:       newLevel,
          todayEarned: (isSameDay ? state.xp.todayEarned : 0) + sessionXP + streakBonus,
          lastXpDate:  today,
        },
        streak: {
          current:       newStreakCount,
          longest:       Math.max(state.streak.longest, newStreakCount),
          lastLogDate:   today,
          lastBonusDate: streakBonus > 0 ? today : state.streak.lastBonusDate,
        },
        // Session metadata consumed by UI then cleared
        _lastSessionXP:           sessionXP + streakBonus,
        _lastAllTargetsHit:       allTargetsHit,
        _lastSubjectHitTarget:    subjectHitTarget ? subjectId : null,
        _lastDidLevelUp:          didLevelUp,
        _lastNewLevel:            didLevelUp ? newLevel : null,
      };
    }

    case 'ADD_TEST': {
      return { ...state, tests: [action.payload, ...state.tests] };
    }

    case 'DELETE_TEST': {
      return { ...state, tests: state.tests.filter(t => t.id !== action.payload) };
    }

    case 'UPDATE_SUBJECTS': {
      return { ...state, config: { ...state.config, subjects: action.payload } };
    }

    case 'UPDATE_CONFIG': {
      return { ...state, config: { ...state.config, ...action.payload } };
    }

    case 'MARK_EXPORTED': {
      return { ...state, config: { ...state.config, lastExportDate: getToday() } };
    }

    case 'CLEAR_SESSION_META': {
      const {
        _lastSessionXP, _lastAllTargetsHit, _lastSubjectHitTarget,
        _lastDidLevelUp, _lastNewLevel,
        ...rest
      } = state;
      return rest;
    }

    case 'IMPORT_DATA': {
      return { ...INITIAL_STATE, ...action.payload };
    }

    case 'RESET_APP': {
      return { ...INITIAL_STATE };
    }

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, (init) => {
    const saved = loadState();
    // Deep merge: saved config subjects may have new fields from defaults
    if (saved) return { ...init, ...saved };
    return init;
  });

  // FIX: Debounce saveState to 300ms — prevents 20+ writes/sec during dial drag
  const debouncedSave = useRef(debounce(saveState, 300));
  useEffect(() => {
    debouncedSave.current(state);
  }, [state]);

  // ── Computed selectors ──
  const today = getToday();

  const todayLogs = useCallback((subjectId) => {
    return state.logs[today]?.[subjectId] || 0;
  }, [state.logs, today]);

  const subjectProgress = useCallback((subjectId) => {
    const subject = state.config.subjects.find(s => s.id === subjectId);
    if (!subject) return { value: 0, target: 0, pct: 0, unitLabel: '' };
    const value  = todayLogs(subjectId);
    const target = subject.dailyTarget;
    return {
      value,
      target,
      pct: Math.min(100, Math.round((value / target) * 100)),
      unitLabel: subject.unitLabel || 'units',
    };
  }, [state.config.subjects, todayLogs]);

  const globalProgress = useCallback(() => {
    const subs = state.config.subjects;
    if (!subs.length) return { value: 0, target: 0, pct: 0 };
    const totalValue  = subs.reduce((acc, s) => acc + todayLogs(s.id), 0);
    const totalTarget = subs.reduce((acc, s) => acc + s.dailyTarget, 0);
    return {
      value: totalValue,
      target: totalTarget,
      pct: Math.min(100, Math.round((totalValue / totalTarget) * 100)),
    };
  }, [state.config.subjects, todayLogs]);

  return (
    <AppContext.Provider value={{ state, dispatch, todayLogs, subjectProgress, globalProgress }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { INITIAL_STATE, DEFAULT_SUBJECTS };
