/**
 * Geometry for the Tournament Draw's single-elimination bracket.
 *
 * A bracket is a rectangular grid: `rounds[r][i]` is match `i` of round `r`,
 * and the winner of `rounds[r][i]` feeds slot `i % 2` of `rounds[r + 1][⌊i / 2⌋]`.
 * Round 0 is the only round that is seeded; every later round is filled by
 * propagation, so the bracket is always rebuilt from the top down rather than
 * patched in place. That is what keeps it consistent when a player changes an
 * earlier result.
 *
 * The field is padded up to the next power of two and the extra slots are left
 * empty. Because the standard seed order pairs every seed above `size / 2` with
 * one at or below it (each pair sums to `size + 1`), an empty slot can only ever
 * face a real participant — so a bye is simply "round 0 match with an empty
 * side", and no match can end up with two empty sides.
 *
 * This module is deliberately DOM-free so the bracket can be tested directly
 * (see the bracket-verification script). Everything here is plain erasable
 * TypeScript.
 */

/** Smallest and largest field this bracket supports. */
export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 32;

export interface BracketMatch {
  /** 0-based round number. */
  round: number;
  /** 0-based position within the round. */
  index: number;
  /** Participant on each side; null means empty (bye) or not yet decided. */
  players: [string | null, string | null];
  /** The side that advanced, or null while the match is undecided. */
  winner: 0 | 1 | null;
  /** Round 0 match with an empty side: the other side advances unopposed. */
  bye: boolean;
}

export interface Bracket {
  /** Padded field size — always a power of two, `size / 2` round 0 matches. */
  size: number;
  rounds: BracketMatch[][];
}

/** Next power of two at or above `count` — the size the field is padded to. */
export function bracketSize(count: number): number {
  let size = 2;
  while (size < count) size *= 2;
  return size;
}

/**
 * Seed numbers in bracket-slot order for a field of `size`.
 *
 * Position `i` holds the seed that occupies slot `i`, so slots `2i` and `2i + 1`
 * are the first-round match between those two seeds. Built by repeatedly
 * mirroring the order: each existing seed `s` becomes the pair `(s, size + 1 - s)`,
 * which keeps every pair summing to `size + 1` and holds the top seeds apart
 * until the later rounds.
 */
export function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const pairSum = order.length * 2 + 1;
    const next: number[] = [];
    for (const seed of order) {
      next.push(seed, pairSum - seed);
    }
    order = next;
  }
  return order;
}

/** Round label for a round with `matches` matches. */
export function roundName(matches: number): string {
  switch (matches) {
    case 1:
      return 'Final';
    case 2:
      return 'Semi-finals';
    case 4:
      return 'Quarter-finals';
    case 8:
      return 'Round of 16';
    case 16:
      return 'Round of 32';
    default:
      return `${matches * 2} players`;
  }
}

/**
 * Build a bracket from `participants` **in draw order**.
 *
 * Draw order is the caller's job (`shuffleArray`) so this stays deterministic
 * and directly testable. Seed 1 is `participants[0]`, so a shuffled list is what
 * randomizes both the matchups and which participants receive byes.
 */
export function createBracket(participants: string[]): Bracket {
  const count = participants.length;
  if (count < MIN_PARTICIPANTS) {
    throw new Error(`A bracket needs at least ${MIN_PARTICIPANTS} participants`);
  }
  if (count > MAX_PARTICIPANTS) {
    throw new Error(`A bracket holds at most ${MAX_PARTICIPANTS} participants`);
  }

  const size = bracketSize(count);
  const order = seedOrder(size);
  const bySeed = new Map<number, string>();
  participants.forEach((name, index) => bySeed.set(index + 1, name));

  const rounds: BracketMatch[][] = [];

  const first: BracketMatch[] = [];
  for (let index = 0; index < size / 2; index++) {
    const left = bySeed.get(order[index * 2]) ?? null;
    const right = bySeed.get(order[index * 2 + 1]) ?? null;
    // An empty side hands the match to the other side; two empty sides would be
    // an unreachable match, which the seed order makes impossible.
    const winner: 0 | 1 | null = left === null ? (right === null ? null : 1) : right === null ? 0 : null;
    first.push({ round: 0, index, players: [left, right], winner, bye: left === null || right === null });
  }
  rounds.push(first);

  const totalRounds = Math.log2(size);
  for (let round = 1; round < totalRounds; round++) {
    const matches = size / 2 ** (round + 1);
    rounds.push(
      Array.from({ length: matches }, (_, index) => ({
        round,
        index,
        players: [null, null] as [string | null, string | null],
        winner: null as 0 | 1 | null,
        bye: false,
      }))
    );
  }

  const bracket: Bracket = { size, rounds };
  propagate(bracket);
  return bracket;
}

/**
 * Re-derive every round after the first from the winners above it.
 *
 * Runs a single ascending pass: round `r` is complete before round `r + 1` is
 * read, and round 0's byes are already recorded, so one pass reaches a fixed
 * point. Callers must clear the rounds they want recomputed first.
 */
function propagate(bracket: Bracket): void {
  for (let round = 0; round < bracket.rounds.length - 1; round++) {
    for (const match of bracket.rounds[round]) {
      if (match.winner === null) continue;
      const name = match.players[match.winner];
      if (name === null) continue;
      const next = bracket.rounds[round + 1][Math.floor(match.index / 2)];
      next.players[match.index % 2] = name;
    }
  }
}

/**
 * Advance `side` of a match, or clear it if that side was already the winner.
 *
 * Changing a result invalidates everything downstream: the later picks were
 * made against a field that no longer exists, and a stale pick could even name
 * a player who is no longer in that slot. So every round after `round` is
 * cleared and rebuilt here rather than patched.
 *
 * Returns true when the bracket changed.
 */
export function setWinner(bracket: Bracket, round: number, index: number, side: 0 | 1): boolean {
  const match = bracket.rounds[round]?.[index];
  if (!match || match.bye) return false;
  if (match.players[side] === null) return false;

  match.winner = match.winner === side ? null : side;

  for (let later = round + 1; later < bracket.rounds.length; later++) {
    for (const downstream of bracket.rounds[later]) {
      downstream.players = [null, null];
      downstream.winner = null;
    }
  }

  propagate(bracket);
  return true;
}

/** The tournament winner, or null while the final is undecided. */
export function champion(bracket: Bracket): string | null {
  const final = bracket.rounds[bracket.rounds.length - 1][0];
  if (!final || final.winner === null) return null;
  return final.players[final.winner];
}

export interface BracketProgress {
  decided: number;
  total: number;
  remaining: number;
}

/** How many playable matches have a result, out of the playable total. */
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
  return { decided, total, remaining: total - decided };
}
