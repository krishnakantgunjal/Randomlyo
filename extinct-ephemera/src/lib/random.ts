/**
 * High-quality randomization utilities
 * Uses crypto.getRandomValues() for better quality than Math.random()
 */

/**
 * Get a cryptographically strong random number between min (inclusive) and max (exclusive)
 */
export function getRandomInt(min: number, max: number): number {
  if (min >= max) throw new Error('min must be less than max');
  
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log256(range));
  const randomBytes = new Uint8Array(bytesNeeded);
  
  let randomValue;
  do {
    crypto.getRandomValues(randomBytes);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }
  } while (randomValue >= Math.floor(256 ** bytesNeeded / range) * range);
  
  return min + (randomValue % range);
}

/**
 * Shuffle an array using Fisher-Yates algorithm with crypto randomness
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Pick a random item from an array
 */
export function pickRandom<T>(array: T[]): T {
  if (array.length === 0) throw new Error('Cannot pick from empty array');
  const index = getRandomInt(0, array.length);
  return array[index];
}

/**
 * Pick multiple random items from an array without replacement
 */
export function pickMultiple<T>(array: T[], count: number, allowDuplicates = false): T[] {
  if (count > array.length && !allowDuplicates) {
    throw new Error(`Cannot pick ${count} items without duplicates from array of ${array.length}`);
  }
  
  if (allowDuplicates) {
    return Array.from({ length: count }, () => pickRandom(array));
  }
  
  return shuffleArray(array).slice(0, count);
}

/**
 * Flip a coin (true = heads, false = tails)
 */
export function flipCoin(): boolean {
  return getRandomInt(0, 2) === 1;
}

/**
 * Generate random integers in a range
 */
export function generateRandomNumbers(
  min: number,
  max: number,
  count: number,
  allowDuplicates = false
): number[] {
  if (!allowDuplicates && count > (max - min + 1)) {
    throw new Error('Cannot generate enough unique numbers in range');
  }
  
  if (allowDuplicates) {
    return Array.from({ length: count }, () => getRandomInt(min, max + 1));
  }
  
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return pickMultiple(numbers, count);
}

/**
 * Roll a dice (default d6)
 */
export function rollDice(sides = 6): number {
  if (sides < 2) throw new Error('Dice must have at least 2 sides');
  return getRandomInt(1, sides + 1);
}

/**
 * Roll multiple dice
 */
export function rollMultipleDice(count: number, sides = 6): number[] {
  return Array.from({ length: count }, () => rollDice(sides));
}

// Polyfill for Math.log256 if needed
if (!Math.log256) {
  (Math as any).log256 = (x: number) => Math.log(x) / Math.log(256);
}
