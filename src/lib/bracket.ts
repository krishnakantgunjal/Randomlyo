/**
 * Tournament Draw — single-elimination bracket logic.
 * Full rewrite; previous versions had structural bugs (duplicate/missing
 * teams, wrong seeding, incorrect propagation). This version builds the
 * tree exactly once at creation, updates in-place with cascading undo,
 * and uses the standard recursive seeding algorithm for byes.
 */

export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 32;

export interface BracketMatch {
  round: number;
  index: number;
  players: [string | null, string | null];
  winner: 0 | 1 | null;
  bye: boolean;
}

export interface Bracket {
  size: number; // padded to next power of 2
  rounds: BracketMatch[][];
}

export function bracketSize(count: number): number {
  let s = 2;
  while (s < count) s *= 2;
  return s;
}

/**
 * Standard recursive seeding-order algorithm.
 * seeds(1) = [1]
 * seeds(n) from seeds(n/2) by pushing [s, n+1-s] for each s.
 */
export function seedOrder(size: number): number[] {
  if (size === 2) return [1, 2];
  const half = seedOrder(size / 2);
  const next: number[] = [];
  for (const s of half) {
    next.push(s, size + 1 - s);
  }
  return next;
}

export function roundName(matchCount: number): string {
  switch (matchCount) {
    case 1: return 'Final';
    case 2: return 'Semi-finals';
    case 4: return 'Quarter-finals';
    case 8: return 'Round of 16';
    case 16: return 'Round of 32';
    default: return `Round (${matchCount * 2})`;
  }
}

export function createBracket(participants: string[]): Bracket {
  const count = participants.length;
  if (count < MIN_PARTICIPANTS) throw new Error(`Need at least ${MIN_PARTICIPANTS} participants`);
  if (count > MAX_PARTICIPANTS) throw new Error(`Max ${MAX_PARTICIPANTS} participants`);

  const size = bracketSize(count);
  const byes = size - count;
  const order = seedOrder(size);

  // Assign real participants to seed slots; empty slots become byes
  const seedToName = new Map<number, string>();
  participants.forEach((name, i) => seedToName.set(i + 1, name));

  const rounds: BracketMatch[][] = [];
  const matchCountR0 = size / 2;

  const first: BracketMatch[] = [];
  for (let i = 0; i < matchCountR0; i++) {
    const seedA = order[i * 2];
    const seedB = order[i * 2 + 1];
    const p1 = seedToName.get(seedA) ?? null;
    const p2 = seedToName.get(seedB) ?? null;
    const isBye = p1 === null || p2 === null;
    // If exactly one side empty, that match is a bye — auto-resolve
    const winner: 0 | 1 | null =
      isBye ? (p1 === null ? 1 : 0) : null;
    first.push({
      round: 0,
      index: i,
      players: [p1, p2],
      winner,
      bye: isBye,
    });
  }
  rounds.push(first);

  const totalRounds = Math.log2(size);
  for (let r = 1; r < totalRounds; r++) {
    const matches = size / 2 ** (r + 1);
    rounds.push(
      Array.from({ length: matches }, (_, i) => ({
        round: r,
        index: i,
        players: [null, null] as [string | null, string | null],
        winner: null,
        bye: false,
      }))
    );
  }

  const bracket: Bracket = { size, rounds };
  propagate(bracket);
  return bracket;
}

/** Propagate winners from earlier rounds into later-round slots. */
function propagate(bracket: Bracket): void {
  for (let r = 0; r < bracket.rounds.length - 1; r++) {
    for (const match of bracket.rounds[r]) {
      if (match.winner === null) continue;
      const name = match.players[match.winner];
      if (name === null) continue;
      const nextMatch = bracket.rounds[r + 1][Math.floor(match.index / 2)];
      nextMatch.players[match.index % 2] = name;
    }
  }
}

/**
 * Set (or toggle) a match winner with full cascading undo/rebuild.
 */
export function setWinner(
  bracket: Bracket,
  round: number,
  index: number,
  side: 0 | 1
): boolean {
  const match = bracket.rounds[round]?.[index];
  if (!match || match.bye) return false;
  const selectedName = match.players[side];
  if (selectedName === null) return false; // empty slot can't win

  // Toggle: clicking the current winner clears the match
  const newWinner = match.winner === side ? null : side;
  match.winner = newWinner;

  // Clear every later round entirely, then propagate from scratch.
  for (let r = round + 1; r < bracket.rounds.length; r++) {
    for (const m of bracket.rounds[r]) {
      m.players = [null, null];
      m.winner = null;
    }
  }

  propagate(bracket);
  return true;
}

export function champion(bracket: Bracket): string | null {
  const final = bracket.rounds[bracket.rounds.length - 1][0];
  if (!final || final.winner === null) return null;
  return final.players[final.winner];
}

export interface BracketProgress {
  decided: number;
  total: number;
}

export function bracketProgress(bracket: Bracket): BracketProgress {
  let decided = 0;
  let total = 0;
  for (const round of bracket.rounds) {
    for (const match of round) {
      if (match.bye) continue;
      total++;
      if (match.winner !== null) decided++;
    }
  }
  return { decided, total };
}
