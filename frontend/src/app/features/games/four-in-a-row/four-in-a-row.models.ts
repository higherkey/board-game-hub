export interface FourInARowCell { column: number; row: number; }
export interface FourInARowState {
    phase: 'Playing' | 'GameOver';
    grid: number[][];
    playerOrder: string[];
    currentPlayerId: string;
    winnerId: string;
    moveCount: number;
    lastMove: FourInARowCell | null;
    winningCells: FourInARowCell[];
}
export interface FourInARowRoom {
    gameData?: FourInARowState;
    players: { connectionId: string; name: string; isScreen?: boolean }[];
    isPaused?: boolean;
    state?: string;
    roundNumber?: number;
}
