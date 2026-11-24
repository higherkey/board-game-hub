import { TableauEntry } from '../../game-room/services/game-chrome.service';

/** The parts of Farkle's game data the shared chrome reads, on both Table and Hand. */
export interface FarkleChromeState {
    activePlayerId: string;
    phase: string;
    winningPlayerId?: string;
    playerStates: Record<string, { playerId: string; playerName: string; totalScore: number }>;
}

export function farkleStatus(state: FarkleChromeState | null | undefined, myId: string): string {
    if (!state) return '';
    const name = (id?: string) => (id && state.playerStates[id]?.playerName) || 'Someone';
    if (state.phase === 'GameOver') return `${name(state.winningPlayerId)} wins`;
    return state.activePlayerId === myId ? 'Your turn' : `${name(state.activePlayerId)}’s turn`;
}

export function farkleEntries(state: FarkleChromeState | null | undefined, myId: string): TableauEntry[] {
    if (!state?.playerStates) return [];
    return Object.values(state.playerStates)
        .sort((a, b) => b.totalScore - a.totalScore)
        .map(p => ({ id: p.playerId, name: p.playerName, score: p.totalScore, active: p.playerId === state.activePlayerId, isMe: p.playerId === myId }));
}
