export const YACHT_CATEGORIES = [
  { key: 'Ones', label: 'Ones', hint: 'Sum of ones' },
  { key: 'Twos', label: 'Twos', hint: 'Sum of twos' },
  { key: 'Threes', label: 'Threes', hint: 'Sum of threes' },
  { key: 'Fours', label: 'Fours', hint: 'Sum of fours' },
  { key: 'Fives', label: 'Fives', hint: 'Sum of fives' },
  { key: 'Sixes', label: 'Sixes', hint: 'Sum of sixes' },
  { key: 'ThreeOfAKind', label: 'Three of a kind', hint: 'Sum of all dice' },
  { key: 'FourOfAKind', label: 'Four of a kind', hint: 'Sum of all dice' },
  { key: 'FullHouse', label: 'Full house', hint: 'Three + pair · 25 points' },
  { key: 'SmallStraight', label: 'Small straight', hint: 'Four in sequence · 30 points' },
  { key: 'LargeStraight', label: 'Large straight', hint: 'Five in sequence · 40 points' },
  { key: 'Yacht', label: 'Yacht', hint: 'Five of a kind · 50 points' },
  { key: 'Chance', label: 'Chance', hint: 'Sum of all dice' }
] as const;

export interface YachtScorecard {
  playerName: string;
  categories: Record<string, number>;
  yachtBonus: number;
  upperSubtotal: number;
  upperBonus: number;
  total: number;
}

export interface YachtState {
  phase: 'Playing' | 'GameOver';
  playerOrder: string[];
  scorecards: Record<string, YachtScorecard>;
  activePlayerId: string;
  turnNumber: number;
  rollsUsed: number;
  dice: number[];
  held: boolean[];
  availableScores: Record<string, number | null>;
  winnerIds: string[];
  lastMove: string;
}
