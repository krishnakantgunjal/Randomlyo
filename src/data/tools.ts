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
    related: ['randomNamePicker', 'giveawayWinnerPicker'],
  },
  randomNamePicker: {
    id: 'randomNamePicker',
    name: 'Random Name Picker',
    slug: 'random-name-picker',
    url: '/random-name-picker/',
    description: 'Pick one or more names at random.',
    category: 'pick',
    icon: 'person',
    related: ['randomPicker', 'giveawayWinnerPicker'],
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
    related: ['randomGroupGenerator', 'tournamentDraw'],
  },
  randomGroupGenerator: {
    id: 'randomGroupGenerator',
    name: 'Random Group Generator',
    slug: 'random-group-generator',
    url: '/random-group-generator/',
    description: 'Divide people into random groups.',
    category: 'play',
    icon: 'people',
    related: ['randomTeamGenerator', 'tournamentDraw'],
  },
  tournamentDraw: {
    id: 'tournamentDraw',
    name: 'Tournament Draw',
    slug: 'tournament-draw',
    url: '/tournament-draw/',
    description: 'Generate random matchups for tournaments.',
    category: 'play',
    icon: 'target',
    related: ['randomTeamGenerator', 'randomGroupGenerator'],
  },
  coinToss: {
    id: 'coinToss',
    name: 'Coin Toss',
    slug: 'coin-toss',
    url: '/coin-toss/',
    description: 'Flip a coin to get heads or tails.',
    category: 'decide',
    icon: 'coin',
    related: ['whoGoesFirst', 'yesOrNo'],
  },
  whoGoesFirst: {
    id: 'whoGoesFirst',
    name: 'Who Goes First?',
    slug: 'who-goes-first',
    url: '/who-goes-first/',
    description: 'Randomly decide who goes first.',
    category: 'decide',
    icon: 'people',
    related: ['coinToss', 'yesOrNo'],
  },
  yesOrNo: {
    id: 'yesOrNo',
    name: 'What Should We Eat?',
    slug: 'what-should-we-eat',
    url: '/what-should-we-eat/',
    description: 'Let Randomlyo choose dinner.',
    category: 'decide',
    icon: 'food',
    related: ['coinToss', 'whoGoesFirst'],
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
  giveawayWinnerPicker: {
    id: 'giveawayWinnerPicker',
    name: 'Giveaway / Random Winner Picker',
    slug: 'giveaway-winner-picker',
    url: '/giveaway-winner-picker/',
    description: 'Select random winner(s) for giveaways.',
    category: 'play',
    icon: 'target',
    related: ['randomNamePicker', 'randomPicker'],
  },
  randomGamePicker: {
    id: 'randomGamePicker',
    name: 'Random Game Picker',
    slug: 'random-game-picker',
    url: '/random-game-picker/',
    description: "Can't decide what to play? Pick one at random.",
    category: 'play',
    icon: 'game',
    related: ['randomPicker', 'randomNamePicker'],
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
    tools: [TOOLS.coinToss, TOOLS.whoGoesFirst, TOOLS.yesOrNo],
  },
  play: {
    name: 'PLAY & WIN',
    description: 'Randomize teams, games and winners.',
    tools: [TOOLS.randomTeamGenerator, TOOLS.giveawayWinnerPicker, TOOLS.randomGamePicker],
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
