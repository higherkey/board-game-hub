export interface CloverCardModel {
    id: string;
    words: string[]; // 4 words, fixed order
}

export interface CloverSlotState {
    cardId: string | null;
    rotation: number; // 0..3 quarter turns
}

export interface CloverPlayerPrep {
    connectionId: string;
    name: string;
    cards: CloverCardModel[];
    slotPermutation: number[];
    slotRotations: number[];
    // For each clue zone (0..3): [keywordA, keywordB]
    pairWords: string[][];
}

export interface CloverMindedState {
    phase: string;
    message?: string;

    participantIds: string[];
    prepByPlayer: Record<string, CloverPlayerPrep>;
    clueSubmitted: Record<string, boolean>;

    spectatorIndex: number;
    resolutionAttempt: number;
    currentSpectatorId?: string | null;
    currentClues?: string[] | null; // 4 clue words (spectator's boards, face up on table)

    pool: CloverCardModel[]; // 5 cards (4 real + 1 decoy)
    slots?: CloverSlotState[] | null; // 4 slots for placed cards

    totalScore: number;
    lastResult?: string | null;

    // Hand-only: in a single resolution attempt, each Hand can rotate cards locked to one cardId.
    // null => they haven't rotated yet.
    rotationCardIdByPlayerThisAttempt?: Record<string, string | null>;

    /** Who is currently dragging which card (cardId -> connectionId) */
    cardOccupants?: Record<string, string | null>;
}

export enum CloverMindedPhase {
    ClueWriting = 'ClueWriting',
    Resolution = 'Resolution',
    ResolutionSecond = 'ResolutionSecond',
    BetweenRounds = 'BetweenRounds',
    GameOver = 'GameOver'
}

