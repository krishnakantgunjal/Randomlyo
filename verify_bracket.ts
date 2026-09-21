import { createBracket } from './src/lib/bracket';

const participants = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H'];
const bracket = createBracket(participants);

console.log('Total rounds:', bracket.rounds.length);
console.log('First round matches:', bracket.rounds[0].length);

const round1Matches = bracket.rounds[0];
console.log('Round 1 Pairings:');
round1Matches.forEach((match, index) => {
  console.log(`Match ${index}:`, match.players);
});

// Verify uniqueness
const allPlayers = round1Matches.flatMap(m => m.players).filter(p => p !== null);
const uniquePlayers = new Set(allPlayers);
console.log('Total players in R1:', allPlayers.length);
console.log('Unique players in R1:', uniquePlayers.size);
console.log('Uniqueness confirmed:', allPlayers.length === uniquePlayers.size);
