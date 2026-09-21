import { createBracket } from './src/lib/bracket';
const participants = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const bracket = createBracket(participants);
const totalRounds = bracket.rounds.length;
console.log('Total rounds:', totalRounds);
console.log('Round 0 matches:', bracket.rounds[0].length);
bracket.rounds[0].forEach((m, i) => console.log('Match', i, m.players));
