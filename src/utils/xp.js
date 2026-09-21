// ── XP System ─────────────────────────────────────────────────────────

/** XP multiplier: normalized by target so metrics are fair */
const XP_PER_TARGET_PCT = 50; // max base XP for hitting exactly the target

/** Bonus XP amounts */
export const XP_BONUSES = {
  SUBJECT_TARGET: 50,   // Hit daily target for one subject (but not all)
  ALL_TARGETS:    100,  // Hit ALL daily targets in one day
  STREAK_7:       75,   // 7-day logging streak milestone
  STREAK_30:      200,  // 30-day logging streak milestone
  FIRST_LOG:      25,   // First ever log
  LEVEL_UP:       30,   // Bonus for leveling up
};

/** Level thresholds (cumulative XP needed to reach each level) */
const LEVEL_THRESHOLDS = [
  0,    // Level 1
  200,  // Level 2
  500,  // Level 3
  1000, // Level 4
  2000, // Level 5
  3500, // Level 6
  5500, // Level 7
  8000, // Level 8
];

/** Compute level from total XP */
export function computeLevel(totalXP) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  // Beyond predefined levels: every 1500 XP = 1 level
  if (totalXP >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    const extra = totalXP - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    level = LEVEL_THRESHOLDS.length + Math.floor(extra / 1500);
  }
  return level;
}

/** Get XP required for a given level (cumulative from 0) */
export function xpForLevel(level) {
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[Math.max(0, level - 1)];
  }
  const extra = level - LEVEL_THRESHOLDS.length;
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + extra * 1500;
}

/** XP progress within current level (0–1 fraction) */
export function levelProgress(totalXP) {
  const level = computeLevel(totalXP);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  if (next === current) return 1;
  return Math.min(1, (totalXP - current) / (next - current));
}

/**
 * Calculate XP earned for a session log.
 *
 * FIX: Base XP is now normalized by target completion percentage so that
 *      "60 questions" and "60 minutes" don't earn the same XP — it's always
 *      relative to how much of the target you completed this session.
 *
 * FIX: allTargetsHit and subjectHitTarget bonuses are now mutually exclusive.
 *      You only get the bigger all-targets bonus, not both stacked.
 */
export function calculateSessionXP({
  unitsLogged,
  dailyTarget,
  subjectHitTarget,
  allTargetsHit,
  isFirstLog,
}) {
  // Base XP: capped at 1.5× target contribution to prevent infinite farming
  const cappedUnits = Math.min(unitsLogged, dailyTarget * 1.5);
  const pct = dailyTarget > 0 ? cappedUnits / dailyTarget : 0;
  let xp = Math.round(pct * XP_PER_TARGET_PCT);

  // FIX: mutually exclusive — all-targets bonus supersedes per-subject bonus
  if (allTargetsHit)         xp += XP_BONUSES.ALL_TARGETS;
  else if (subjectHitTarget) xp += XP_BONUSES.SUBJECT_TARGET;

  if (isFirstLog) xp += XP_BONUSES.FIRST_LOG;

  return Math.max(0, xp);
}

/**
 * Calculate streak milestone bonus.
 * Called only once per day (guarded by lastBonusDate in the reducer).
 */
export function calculateStreakBonus(streakDays) {
  if (streakDays > 0 && streakDays % 30 === 0) return XP_BONUSES.STREAK_30;
  if (streakDays > 0 && streakDays % 7  === 0) return XP_BONUSES.STREAK_7;
  return 0;
}

/** Get level title label */
export function getLevelTitle(level) {
  const titles = [
    '', 'Rookie', 'Scholar', 'Grinder', 'Veteran',
    'Elite', 'Master', 'Legend', 'Apex', 'Neo Pro',
  ];
  return titles[Math.min(level, titles.length - 1)] || `Lv.${level}`;
}
