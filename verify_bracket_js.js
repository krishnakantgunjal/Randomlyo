// Simplified logic replicating bracket.ts behavior
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 32;

function bracketSize(count) {
  let size = 2;
  while (size < count) size *= 2;
  return size;
}

function seedOrder(size) {
  let order = [1, 2];
  while (order.length < size) {
    const pairSum = order.length * 2 + 1;
    const next = [];
    for (const seed of order) {
      next.push(seed, pairSum - seed);
    }
    order = next;
  }
  return order;
}

function createBracket(participants) {
  const count = participants.length;
  const size = bracketSize(count);
  const order = seedOrder(size);
  const bySeed = new Map();
  participants.forEach((name, index) => bySeed.set(index + 1, name));

  const rounds = [];
  const first = [];
  for (let index = 0; index < size / 2; index++) {
    const left = bySeed.get(order[index * 2]) ?? null;
    const right = bySeed.get(order[index * 2 + 1]) ?? null;
    first.push({ players: [left, right] });
  }
  rounds.push(first);
  const totalRounds = Math.log2(size);
  // No need for full bracket generation just to verify R1
  return { rounds, totalRounds };
}

const participants = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H'];
const bracket = createBracket(participants);

console.log('Total rounds:', bracket.totalRounds);
console.log('First round matches:', bracket.rounds[0].length);

const round1Matches = bracket.rounds[0];
console.log('Round 1 Pairings:');
round1Matches.forEach((match, index) => {
  console.log(`Match ${index}:`, match.players);
});

const allPlayers = round1Matches.flatMap(m => m.players).filter(p => p !== null);
const uniquePlayers = new Set(allPlayers);
console.log('Total players in R1:', allPlayers.length);
console.log('Unique players in R1:', uniquePlayers.size);
console.log('Uniqueness confirmed:', allPlayers.length === uniquePlayers.size);
