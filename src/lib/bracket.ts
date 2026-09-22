/** Pure single-elimination bracket logic for Tournament Draw. */

export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 32;

export type MatchSide = 'left' | 'right' | 'final';
export type Slot = 0 | 1;

interface FeedTarget {
  matchId: string;
  side: Slot;
}

export interface BracketMatch {
  id: string;
  number: number;
  side: MatchSide;
  round: number;
  index: number;
  slotA: string | null;
  slotB: string | null;
  winner: Slot | null;
  bye: boolean;
  feedsTo: FeedTarget | null;
  feedsFrom: [string | null, string | null];
}

export interface Bracket {
  participantCount: number;
  size: number;
  leftRounds: BracketMatch[][];
  rightRounds: BracketMatch[][];
  final: BracketMatch;
  totalRounds: number;
}

function nextPowerOfTwo(value: number): number {
  let size = 1;
  while (size < value) size *= 2;
  return size;
}

/** Standard recursive seeding order: each round pairs seed s with size + 1 - s. */
export function seedOrder(size: number): number[] {
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error('Bracket size must be a power of two');
  }
  if (size === 2) return [1, 2];

  const previous = seedOrder(size / 2);
  const current: number[] = [];
  for (const seed of previous) {
    current.push(seed, size + 1 - seed);
  }
  return current;
}

function makeMatch(
  id: string,
  side: MatchSide,
  round: number,
  index: number,
  slots: [string | null, string | null],
  feedsFrom: [string | null, string | null],
): BracketMatch {
  const [slotA, slotB] = slots;
  const bye = round === 0 && (slotA === null) !== (slotB === null);

  return {
    id,
    number: 0,
    side,
    round,
    index,
    slotA,
    slotB,
    winner: bye ? (slotA === null ? 1 : 0) : null,
    bye,
    feedsTo: null,
    feedsFrom,
  };
}

function buildSide(
  seeds: number[],
  seedToName: Map<number, string>,
  side: Exclude<MatchSide, 'final'>,
  feedsTo: FeedTarget,
): BracketMatch[][] {
  const firstRound: BracketMatch[] = [];
  for (let index = 0; index < seeds.length / 2; index += 1) {
    const seedA = seeds[index * 2];
    const seedB = seeds[index * 2 + 1];
    firstRound.push(
      makeMatch(
        `${side}-r0-m${index}`,
        side,
        0,
        index,
        [seedToName.get(seedA) ?? null, seedToName.get(seedB) ?? null],
        [null, null],
      ),
    );
  }

  const rounds = [firstRound];
  for (let round = 1; round < Math.log2(seeds.length); round += 1) {
    const previous = rounds[round - 1];
    const matches: BracketMatch[] = [];
    for (let index = 0; index < previous.length / 2; index += 1) {
      const feedA = previous[index * 2];
      const feedB = previous[index * 2 + 1];
      matches.push(
        makeMatch(
          `${side}-r${round}-m${index}`,
          side,
          round,
          index,
          [null, null],
          [feedA.id, feedB.id],
        ),
      );
    }
    rounds.push(matches);
  }

  for (let round = 0; round < rounds.length - 1; round += 1) {
    for (const match of rounds[round]) {
      match.feedsTo = {
        matchId: rounds[round + 1][Math.floor(match.index / 2)].id,
        side: match.index % 2 as Slot,
      };
    }
  }

  rounds[rounds.length - 1][0].feedsTo = feedsTo;
  return rounds;
}

export function roundName(round: number, totalRounds: number): string {
  if (round === totalRounds - 1) return 'Finals';
  if (round === totalRounds - 2) return 'Semifinals';
  if (round === totalRounds - 3) return 'Quarterfinals';
  return `Round ${round + 1}`;
}

export function getDisplayRounds(bracket: Bracket) {
  return [...bracket.leftRounds, [bracket.final], ...[...bracket.rightRounds].reverse()];
}

export function getAllMatches(bracket: Bracket): BracketMatch[] {
  return [
    ...bracket.leftRounds.flat(),
    ...bracket.rightRounds.flat(),
    bracket.final,
  ];
}

export function findMatch(bracket: Bracket, matchId: string): BracketMatch | undefined {
  return getAllMatches(bracket).find((match) => match.id === matchId);
}

function getSlot(match: BracketMatch, side: Slot): string | null {
  return side === 0 ? match.slotA : match.slotB;
}

function setSlot(match: BracketMatch, side: Slot, name: string | null): void {
  if (side === 0) match.slotA = name;
  else match.slotB = name;
}

function propagateWinner(bracket: Bracket, match: BracketMatch): void {
  if (match.winner === null) return;

  let current: BracketMatch | undefined = match;
  while (current?.feedsTo) {
    const winnerName = getSlot(current, current.winner!);
    if (!winnerName) return;

    const next = findMatch(bracket, current.feedsTo.matchId);
    if (!next) return;

    setSlot(next, current.feedsTo.side, winnerName);
    if (next.winner === null) return;
    current = next;
  }
}

function clearDownstreamFrom(bracket: Bracket, match: BracketMatch): void {
  if (match.winner === null) return;

  const oldWinner = getSlot(match, match.winner);
  if (match.feedsTo) {
    const next = findMatch(bracket, match.feedsTo.matchId);
    if (next && getSlot(next, match.feedsTo.side) === oldWinner) {
      if (next.winner === match.feedsTo.side) {
        clearDownstreamFrom(bracket, next);
      }
      setSlot(next, match.feedsTo.side, null);
    }
  }

  match.winner = null;
}

export function setWinner(
  bracket: Bracket,
  matchId: string,
  side: Slot,
): boolean {
  const match = findMatch(bracket, matchId);
  if (!match || match.bye) return false;

  const selectedName = getSlot(match, side);
  if (!selectedName || match.winner === side) return false;

  if (match.winner !== null) {
    clearDownstreamFrom(bracket, match);
  }

  match.winner = side;
  propagateWinner(bracket, match);
  return true;
}

export function champion(bracket: Bracket): string | null {
  const { final } = bracket;
  return final.winner === null ? null : getSlot(final, final.winner);
}

export function bracketProgress(bracket: Bracket): { decided: number; total: number } {
  const matches = getAllMatches(bracket);
  const relevant = matches.filter((match) => !match.bye);
  return {
    decided: relevant.filter((match) => match.winner !== null).length,
    total: relevant.length,
  };
}

export function createBracket(participants: string[]): Bracket {
  const count = participants.length;
  if (count < MIN_PARTICIPANTS || count > MAX_PARTICIPANTS) {
    throw new Error(`Enter between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS} participants.`);
  }

  const size = nextPowerOfTwo(count);
  const totalRounds = Math.log2(size);
  const seedToName = new Map<number, string>();
  participants.forEach((name, index) => seedToName.set(index + 1, name));

  const final: BracketMatch = makeMatch(
    'final',
    'final',
    0,
    0,
    [null, null],
    [null, null],
  );

  if (size === 2) {
    final.slotA = participants[0];
    final.slotB = participants[1];
    return { participantCount: count, size, leftRounds: [], rightRounds: [], final, totalRounds: 1 };
  }

  const order = seedOrder(size);
  const halfSize = size / 2;
  const leftRounds = buildSide(
    order.slice(0, halfSize),
    seedToName,
    'left',
    { matchId: final.id, side: 0 },
  );
  const rightRounds = buildSide(
    order.slice(halfSize),
    seedToName,
    'right',
    { matchId: final.id, side: 1 },
  );

  final.feedsFrom = [
    leftRounds[leftRounds.length - 1][0].id,
    rightRounds[rightRounds.length - 1][0].id,
  ];

  const bracket: Bracket = { participantCount: count, size, leftRounds, rightRounds, final, totalRounds: Math.log2(size) };

  for (const match of getAllMatches(bracket)) {
    if (match.winner !== null) propagateWinner(bracket, match);
  }

  return bracket;
}
