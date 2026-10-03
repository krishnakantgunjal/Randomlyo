/**
 * Tool metadata and configuration
 */

export interface Tool {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  category: 'pick' | 'decide' | 'play';
  icon: string;
  related: string[]; // Related tool IDs
}

export const TOOLS: Record<string, Tool> = {
  randomPicker: {
    id: 'randomPicker',
    name: 'Random Wheel',
    slug: 'random-wheel',
    url: '/random-wheel/',
    description: 'Spin a custom wheel to choose one option.',
    category: 'pick',
    icon: 'wheel',
    related: ['randomNamePicker', 'randomTeamGenerator'],
  },
  randomNamePicker: {
    id: 'randomNamePicker',
    name: 'Random Name Picker',
    slug: 'random-name-picker',
    url: '/random-name-picker/',
    description: 'Pick one or more names at random.',
    category: 'pick',
    icon: 'person',
    related: ['randomPicker', 'randomTeamGenerator'],
  },
  randomNumberGenerator: {
    id: 'randomNumberGenerator',
    name: 'Random Number',
    slug: 'random-number',
    url: '/random-number/',
    description: 'Generate random numbers within any range.',
    category: 'pick',
    icon: 'dice',
    related: ['diceRoller'],
  },
  randomTeamGenerator: {
    id: 'randomTeamGenerator',
    name: 'Random Team Generator',
    slug: 'random-team-generator',
    url: '/random-team-generator/',
    description: 'Split players into random teams quickly.',
    category: 'play',
    icon: 'people',
    related: ['tournamentDraw', 'randomNamePicker'],
  },
  tournamentDraw: {
    id: 'tournamentDraw',
    name: 'Tournament Draw',
    slug: 'tournament-draw',
    url: '/tournament-draw/',
    description: 'Generate random matchups for tournaments.',
    category: 'play',
    icon: 'target',
    related: ['randomTeamGenerator', 'coinToss'],
  },
  coinToss: {
    id: 'coinToss',
    name: 'Coin Toss',
    slug: 'coin-toss',
    url: '/coin-toss/',
    description: 'Flip a coin to get heads or tails.',
    category: 'decide',
    icon: 'coin',
    related: ['whoGoesFirst', 'whatShouldWeEat'],
  },
  whoGoesFirst: {
    id: 'whoGoesFirst',
    name: 'Who Goes First?',
    slug: 'who-goes-first',
    url: '/who-goes-first/',
    description: 'Randomly decide who goes first.',
    category: 'decide',
    icon: 'people',
    related: ['coinToss', 'whatShouldWeEat'],
  },
  whatShouldWeEat: {
    id: 'whatShouldWeEat',
    name: 'What Should We Eat?',
    slug: 'what-should-we-eat',
    url: '/what-should-we-eat/',
    description: 'Let Randomlyo choose dinner.',
    category: 'decide',
    icon: 'food',
    related: ['coinToss', 'whoGoesFirst', 'whatShouldWeWatch'],
  },
  whatShouldWeWatch: {
    id: 'whatShouldWeWatch',
    name: 'What Should We Watch?',
    slug: 'what-should-we-watch',
    url: '/what-should-we-watch/',
    description: 'Swipe through movies or shows to find what to watch tonight.',
    category: 'decide',
    icon: 'movie',
    related: ['whatShouldWeEat', 'whoGoesFirst'],
  },
  diceRoller: {
    id: 'diceRoller',
    name: 'Dice Roller',
    slug: 'dice-roller',
    url: '/dice-roller/',
    description: 'Roll dice with any number of sides.',
    category: 'play',
    icon: 'game',
    related: ['randomNumberGenerator'],
  },
  wordGame: {
    id: 'wordGame',
    name: 'Word Game',
    slug: 'play/word-game',
    url: '/play/word-game/',
    description: 'Guess the daily 5-letter word in 6 tries.',
    category: 'play',
    icon: 'game',
    related: ['ticTacToe', 'diceRoller'],
  },
  ticTacToe: {
    id: 'ticTacToe',
    name: 'Tic-Tac-Toe',
    slug: 'play/tic-tac-toe',
    url: '/play/tic-tac-toe/',
    description: 'Classic X vs O — play a friend or challenge the computer.',
    category: 'play',
    icon: 'game',
    related: ['wordGame', 'diceRoller'],
  },
  spinTheBottle: {
    id: 'spinTheBottle',
    name: 'Spin the Bottle',
    slug: 'play/spin-the-bottle',
    url: '/play/spin-the-bottle/',
    description: 'Spin a bottle to randomly pick a player from the circle.',
    category: 'play',
    icon: 'people',
    related: ['randomNamePicker', 'whoGoesFirst'],
  },
};

export const TOOL_CATEGORIES = {
  pick: {
    name: 'PICK',
    description: 'Choose something or someone at random.',
    tools: [TOOLS.randomPicker, TOOLS.randomNamePicker, TOOLS.randomNumberGenerator],
  },
  decide: {
    name: 'DECIDE',
    description: 'Let randomness make the decision.',
    tools: [TOOLS.coinToss, TOOLS.whoGoesFirst, TOOLS.whatShouldWeEat, TOOLS.whatShouldWeWatch],
  },
  play: {
    name: 'PLAY & WIN',
    description: 'Randomize teams, brackets and dice rolls.',
    tools: [TOOLS.randomTeamGenerator, TOOLS.tournamentDraw, TOOLS.diceRoller, TOOLS.wordGame, TOOLS.ticTacToe, TOOLS.spinTheBottle],
  },
};

export function getTool(id: string): Tool | undefined {
  return TOOLS[id];
}

export function getRelatedTools(toolId: string): Tool[] {
  const tool = getTool(toolId);
  if (!tool) return [];
  return tool.related.map(id => TOOLS[id]).filter(Boolean);
}

export function getToolsByCategory(category: 'pick' | 'decide' | 'play'): Tool[] {
  return Object.values(TOOLS).filter(t => t.category === category);
}

export function getAllTools(): Tool[] {
  return Object.values(TOOLS);
}
