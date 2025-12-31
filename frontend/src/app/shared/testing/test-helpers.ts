
import { Room } from '../../services/signalr.service';

export function createMockRoom(overrides: Partial<Room> = {}): Room {
    const defaultRoom: Room = {
        code: 'TEST',
        players: [],
        state: 'Playing',
        settings: { timerDurationSeconds: 60, letterMode: 0, boardSize: 4 }, // Added boardSize for Babble compatibility
        gameType: 'Scatterbrain', // Default, can be overridden
        gameState: {},
        gameData: { phase: 0 },
        roundNumber: 1,
        isPaused: false,
        roundScores: {},
        nextGameVotes: {},
        currentVote: null,
        undoSettings: { allowVoting: true, hostOnly: false }
    };

    return { ...defaultRoom, ...overrides };
}
