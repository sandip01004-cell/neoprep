// ── Date Utilities ────────────────────────────────────────────────────

/** Get a date as a YYYY-MM-DD string */
function dateToKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get today's date as YYYY-MM-DD string */
export function getToday() {
  return dateToKey(new Date());
}

/** Format a YYYY-MM-DD string to a human-readable label */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Get days remaining until exam date */
export function getDaysUntilExam(examDateStr) {
  if (!examDateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exam = new Date(examDateStr + 'T00:00:00');
  const diff = exam - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Get last N days as YYYY-MM-DD strings (including today) */
export function getLastNDays(n = 7) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateToKey(d));
  }
  return days;
}

/** Get short day label (Mon, Tue…) from YYYY-MM-DD string */
export function getDayLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
}

/**
 * Compute current logging streak from logs object.
 *
 * FIX: Replaced the original while(true) with a bounded for-loop (max 365
 *      iterations). Safe on corrupted data. Starts from yesterday if today
 *      has no log yet (streak still active).
 */
export function computeStreak(logs) {
  const today = getToday();
  const todayLog = logs[today];
  const todayHasLog = todayLog && Object.values(todayLog).some(v => v > 0);

  const d = new Date();
  // If nothing logged today yet, start checking from yesterday
  if (!todayHasLog) d.setDate(d.getDate() - 1);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = dateToKey(d);
    const dayLog = logs[key];
    const hasLog = dayLog && Object.values(dayLog).some(v => v > 0);
    if (!hasLog) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Get greeting based on time of day */
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late night grind';
}
