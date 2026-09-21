import { createBracket, setWinner, champion, seedOrder, bracketSize } from './src/lib/bracket';

function trace8() {
  console.log('=== TRACE: 8 participants ===');
  const names = ['A','B','C','D','E','F','G','H'];
  const b = createBracket(names);
  console.log('Size:', b.size, '| Rounds:', b.rounds.length, '| R0 matches:', b.rounds[0].length);
  // Verify seed order for size 8
  const order8 = seedOrder(8);
  console.log('Seed order (8):', order8);
  // Verify no team appears twice in R0
  const r0Names = new Set(b.rounds[0].flatMap(m => m.players.filter(Boolean)));
  console.log('Unique R0 names:', [...r0Names], '| Expected 8:', r0Names.size === 8);

  // Decide all the way through
  // Round 0: pick winners arbitrarily to force progression
  for (let i = 0; i < b.rounds[0].length; i++) {
    const m = b.rounds[0][i];
    if (!m.bye) {
      const w = m.players[0] ? 0 : 1;
      setWinner(b, 0, i, w as 0 | 1);
      console.log(`R0 M${i+1} -> ${m.players[w]}`);
    }
  }
  console.log('After R0 all decided, champion:', champion(b));

  // Round 1 (semi)
  for (let i = 0; i < b.rounds[1].length; i++) {
    const m = b.rounds[1][i];
    if (m.players[0] && m.players[1] && !m.bye) {
      const w = m.players[0].startsWith('A') ? 0 : 1;
      setWinner(b, 1, i, w as 0 | 1);
      console.log(`R1 M${i+1} -> ${m.players[w]}`);
    }
  }

  // Final
  const final = b.rounds[2][0];
  if (final.players[0] && final.players[1]) {
    setWinner(b, 2, 0, 0);
    console.log('Final winner:', champion(b));
  }

  // Now UNDO: change R0 M1 winner from A (side 0) to B (side 1)
  console.log('=== UNDO: change R0 M1 ===');
  setWinner(b, 0, 0, 1); // B wins instead of A
  console.log('After undo R0 M1:');
  console.log('R1 M1 players:', b.rounds[1][0].players);
  console.log('R1 M2 players:', b.rounds[1][1].players);
  console.log('Final players:', b.rounds[2][0].players);
  console.log('Champion after undo:', champion(b));
  console.log('');
}

function trace11() {
  console.log('=== TRACE: 11 participants (16-slot, 5 byes) ===');
  const names = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11'];
  const b = createBracket(names);
  console.log('Count:', names.length, '| Size:', b.size, '| Byes:', b.size - names.length);
  // Verify exactly 5 byes
  let byeCount = 0;
  for (const m of b.rounds[0]) {
    if (m.bye) byeCount++;
  }
  console.log('Bye matches in R0:', byeCount);

  // Verify no match has two empty slots
  let twoEmpty = 0;
  for (const round of b.rounds) {
    for (const m of round) {
      if (m.players[0] === null && m.players[1] === null && !m.bye) {
        twoEmpty++;
      }
    }
  }
  console.log('Matches with both slots empty (should be 0):', twoEmpty);

  // Verify byes pre-resolved (auto-propagated)
  for (const m of b.rounds[0]) {
    if (m.bye) {
      const winnerName = m.players[m.winner === 0 ? 0 : 1];
      console.log('Bye M', m.index + 1, '->', winnerName);
    }
  }

  // Verify propagation: round 1 should already have some names from byes
  const r1Names = new Set(b.rounds[1].flatMap(m => m.players.filter(Boolean)));
  console.log('Names propagated to R1:', [...r1Names], '| Count:', r1Names.size);
}

trace8();
trace11();
