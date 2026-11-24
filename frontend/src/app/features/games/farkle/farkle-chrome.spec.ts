import { farkleEntries, farkleStatus } from './farkle-chrome';

describe('farkle chrome', () => {
    const state = (extra: object = {}) => ({
        activePlayerId: 'b',
        currentTurnScore: 350,
        phase: 'Picking',
        playerStates: {
            a: { playerId: 'a', playerName: 'Ann', totalScore: 900 },
            b: { playerId: 'b', playerName: 'Bo', totalScore: 1200 }
        },
        ...extra
    });

    it('says whose turn it is, from my point of view', () => {
        expect(farkleStatus(state(), 'b')).toBe('Your turn');
        expect(farkleStatus(state(), 'a')).toBe('Bo’s turn');
    });

    it('names the winner once the game is over', () => {
        expect(farkleStatus(state({ phase: 'GameOver', winningPlayerId: 'a' }), 'b')).toBe('Ann wins');
    });

    it('lists scores highest first, marking the active player and me', () => {
        expect(farkleEntries(state(), 'a')).toEqual([
            { id: 'b', name: 'Bo', score: 1200, active: true, isMe: false },
            { id: 'a', name: 'Ann', score: 900, active: false, isMe: true }
        ]);
    });

    it('is quiet without a game state', () => {
        expect(farkleStatus(null, 'a')).toBe('');
        expect(farkleEntries(null, 'a')).toEqual([]);
    });
});
