/**
 * Word Game — core game logic and localStorage persistence.
 *
 * scoreGuess() is the most critical function here: it implements the correct
 * duplicate-letter handling algorithm used in the original Wordle.
 *
 * Algorithm (two-pass):
 *   Pass 1: Walk every position. If guess[i] === answer[i], mark GREEN and
 *           decrement that letter from the answer's frequency pool.
 *   Pass 2: Walk every non-green position. If the guess letter still has
 *           remaining count in the pool, mark YELLOW and decrement. Else GRAY.
 *
 * Proof trace — answer: "SPEED", guess: "ERASE"
 *   Initial pool: {S:1, P:1, E:2, D:1}
 *   Pass 1: no greens (no positions match)
 *   Pass 2:
 *     pos 0 'E': pool E=2 > 0 → YELLOW, pool E→1
 *     pos 1 'R': pool R=0   → GRAY
 *     pos 2 'A': pool A=0   → GRAY
 *     pos 3 'S': pool S=1 > 0 → YELLOW, pool S→0
 *     pos 4 'E': pool E=1 > 0 → YELLOW, pool E→0
 *   Result: [YELLOW, GRAY, GRAY, YELLOW, YELLOW] ✓
 *
 * Proof trace — answer: "SPEED", guess: "ESSEE" (n/a — 6 letters, shown for clarity)
 * Proof trace — answer: "SPELL", guess: "LLAMA"
 *   Pool: {S:1, P:1, E:1, L:2}
 *   Pass 1: none
 *   Pass 2:
 *     pos 0 'L': pool L=2 > 0 → YELLOW, pool L→1
 *     pos 1 'L': pool L=1 > 0 → YELLOW, pool L→0
 *     pos 2 'A': pool A=0   → GRAY
 *     pos 3 'M': pool M=0   → GRAY
 *     pos 4 'A': pool A=0   → GRAY
 *   Result: [YELLOW, YELLOW, GRAY, GRAY, GRAY] ✓
 *
 * Proof trace — answer: "SPELL", guess: "LLALL"
 *   Pool: {S:1, P:1, E:1, L:2}
 *   Pass 1:
 *     pos 4 'L' === 'L' → GREEN, pool L→1
 *   Pass 2:
 *     pos 0 'L': pool L=1 > 0 → YELLOW, pool L→0
 *     pos 1 'L': pool L=0   → GRAY
 *     pos 2 'A': pool A=0   → GRAY
 *     pos 3 'L': pool L=0   → GRAY
 *   Result: [YELLOW, GRAY, GRAY, GRAY, GREEN] ✓
 */

export type TileState = 'green' | 'yellow' | 'gray' | 'empty' | 'tbd';

export interface GuessResult {
  letter: string;
  state: TileState;
}

/**
 * Score a 5-letter guess against the answer using the correct two-pass
 * algorithm. Returns one GuessResult per letter position.
 */
export function scoreGuess(guess: string, answer: string): GuessResult[] {
  const G = guess.toUpperCase();
  const A = answer.toUpperCase();
  const len = A.length;

  // Build a mutable frequency pool from the answer
  const pool: Record<string, number> = {};
  for (const ch of A) {
    pool[ch] = (pool[ch] ?? 0) + 1;
  }

  const result: GuessResult[] = Array.from({ length: len }, (_, i) => ({
    letter: G[i],
    state: 'gray' as TileState,
  }));

  // Pass 1 — greens
  for (let i = 0; i < len; i++) {
    if (G[i] === A[i]) {
      result[i].state = 'green';
      pool[G[i]]--;
    }
  }

  // Pass 2 — yellows for non-green positions
  for (let i = 0; i < len; i++) {
    if (result[i].state === 'green') continue;
    const ch = G[i];
    if (pool[ch] && pool[ch] > 0) {
      result[i].state = 'yellow';
      pool[ch]--;
    }
    // else remains 'gray'
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface GameStats {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  /** Sum of guesses for all WON games (used to compute average). */
  totalWinGuesses: number;
  /** distribution[0] = wins in 1 guess, ..., distribution[5] = wins in 6 */
  distribution: [number, number, number, number, number, number];
  /**
   * History log keyed by date string (YYYY-MM-DD).
   * Stored so a calendar view can be added later without data migration.
   */
  history: Record<string, { won: boolean; guesses: number }>;
}

export interface TodayState {
  dateKey: string;
  /** Each entry is an array of GuessResult for one submitted guess row. */
  guesses: GuessResult[][];
  /** The player's current (unsubmitted) in-progress letters. */
  currentInput: string;
  gameState: 'playing' | 'won' | 'lost';
}

export interface LevelGameState {
  level: number;
  guesses: GuessResult[][];
  currentInput: string;
  gameState: 'playing' | 'won' | 'lost';
}

export type GameMode = 'daily' | 'levels';

/* ------------------------------------------------------------------ */
/* localStorage helpers                                                */
/* ------------------------------------------------------------------ */

const STATS_KEY = 'randomlyo:wg:stats';
const TODAY_KEY = 'randomlyo:wg:today';
export const LEVEL_KEY = 'randomlyo:wg:level';
export const LEVEL_STATE_KEY = 'randomlyo:wg:level_state';
export const MODE_KEY = 'randomlyo:wg:mode';
export const SOUND_KEY = 'randomlyo:wg:sound';
export const VIBRATE_KEY = 'randomlyo:wg:vibrate';
export const DARK_KEY = 'randomlyo:wg:dark';

function defaultStats(): GameStats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalWinGuesses: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    history: {},
  };
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as Partial<GameStats>;
    const def = defaultStats();
    return {
      played: parsed.played ?? def.played,
      wins: parsed.wins ?? def.wins,
      currentStreak: parsed.currentStreak ?? def.currentStreak,
      bestStreak: parsed.bestStreak ?? def.bestStreak,
      totalWinGuesses: parsed.totalWinGuesses ?? def.totalWinGuesses,
      distribution: parsed.distribution ?? def.distribution,
      history: parsed.history ?? def.history,
    };
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable */
  }
}

export function loadTodayState(): TodayState | null {
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TodayState;
  } catch {
    return null;
  }
}

export function saveTodayState(state: TodayState): void {
  try {
    localStorage.setItem(TODAY_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function loadCurrentLevel(): number {
  try {
    const raw = localStorage.getItem(LEVEL_KEY);
    if (!raw) return 1;
    const n = parseInt(raw, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  } catch {
    return 1;
  }
}

export function saveCurrentLevel(level: number): void {
  try {
    localStorage.setItem(LEVEL_KEY, String(Math.max(1, Math.floor(level))));
  } catch {
    /* storage unavailable */
  }
}

export function loadLevelState(): LevelGameState | null {
  try {
    const raw = localStorage.getItem(LEVEL_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LevelGameState;
  } catch {
    return null;
  }
}

export function saveLevelState(state: LevelGameState): void {
  try {
    localStorage.setItem(LEVEL_STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

export function clearLevelState(): void {
  try {
    localStorage.removeItem(LEVEL_STATE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function loadGameMode(): GameMode {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    return raw === 'levels' ? 'levels' : 'daily';
  } catch {
    return 'daily';
  }
}

export function saveGameMode(mode: GameMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------------------------------------------ */
/* Streak calculation                                                  */
/* ------------------------------------------------------------------ */

/**
 * Compute the current streak given the history log and the result of
 * today's game (called after a win or loss).
 *
 * Rules:
 * - Streak increments on a WIN and the player played yesterday (or this is
 *   their first game / played consecutive days).
 * - Streak resets to 0 on a LOSS.
 * - Streak resets to 0 if the player missed one or more days (last played
 *   date is not yesterday or today).
 */
export function computeNewStreak(
  stats: GameStats,
  todayKey: string,
  won: boolean
): { currentStreak: number; bestStreak: number } {
  if (!won) {
    return { currentStreak: 0, bestStreak: stats.bestStreak };
  }

  // Find the most recent previously played date (excluding today)
  const previousDates = Object.keys(stats.history)
    .filter((d) => d < todayKey)
    .sort();

  let newStreak = 1;

  if (previousDates.length > 0) {
    const lastDate = previousDates[previousDates.length - 1];
    const yesterday = getYesterdayKey(todayKey);

    if (lastDate === yesterday && stats.history[lastDate].won) {
      // Played yesterday AND won yesterday → extend streak
      newStreak = stats.currentStreak + 1;
    } else {
      // Either missed a day, or lost yesterday → start fresh at 1
      newStreak = 1;
    }
  }

  const bestStreak = Math.max(stats.bestStreak, newStreak);
  return { currentStreak: newStreak, bestStreak };
}

/**
 * Check if the streak should be reset because the player missed a day.
 * Call this on page load to handle the "opened after missing a day" case.
 */
export function adjustStreakForMissedDays(stats: GameStats, todayKey: string): GameStats {
  if (stats.currentStreak === 0) return stats;

  // Find the last date the player played
  const allDates = Object.keys(stats.history).sort();
  if (allDates.length === 0) return stats;

  const lastPlayed = allDates[allDates.length - 1];
  const yesterday = getYesterdayKey(todayKey);

  // If the last played date is before yesterday, the streak is broken
  if (lastPlayed < yesterday) {
    return { ...stats, currentStreak: 0 };
  }

  return stats;
}

function getYesterdayKey(todayKey: string): string {
  const [y, m, d] = todayKey.split('-').map(Number);
  const yesterday = new Date(y, m - 1, d - 1);
  const yy = yesterday.getFullYear();
  const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Compute win rate as a 0-100 integer percentage. */
export function winRate(stats: GameStats): number {
  if (stats.played === 0) return 0;
  return Math.round((stats.wins / stats.played) * 100);
}

/** Compute average guesses for won games, rounded to 1 decimal. */
export function avgGuesses(stats: GameStats): number {
  if (stats.wins === 0) return 0;
  return Math.round((stats.totalWinGuesses / stats.wins) * 10) / 10;
}
