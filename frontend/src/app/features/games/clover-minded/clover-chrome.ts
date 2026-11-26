import { CloverMindedPhase, CloverMindedState } from './clover-minded.types';

/** Clover-Minded's line in the shared game bar, from the phase and this device's role. */
export function cloverStatus(state: CloverMindedState | null, myId: string, isTable: boolean, name: (id: string) => string): string {
    if (!state) return '';
    switch (state.phase) {
        case CloverMindedPhase.ClueWriting:
            if (isTable) return 'Everyone is writing clues';
            return state.clueSubmitted?.[myId] ? 'Waiting for clues' : 'Write your four clues';
        case CloverMindedPhase.Resolution:
        case CloverMindedPhase.ResolutionSecond:
            if (!isTable && state.currentSpectatorId === myId) return 'Your clover: watch, no hints';
            return `Solve ${name(state.currentSpectatorId ?? '')}’s clover`;
        case CloverMindedPhase.BetweenRounds: return 'Next clover coming up';
        case CloverMindedPhase.GameOver: return 'Game over';
        default: return '';
    }
}

/** The try number while a clover is being solved; the team's score the rest of the time. */
export function cloverProgress(state: CloverMindedState | null): string {
    if (!state) return '';
    const solving = state.phase === CloverMindedPhase.Resolution || state.phase === CloverMindedPhase.ResolutionSecond;
    return solving ? `Try ${state.resolutionAttempt} of 2` : `Team score ${state.totalScore ?? 0}`;
}
