import { cloverProgress, cloverStatus } from './clover-chrome';

describe('clover chrome', () => {
    const names = (id: string) => ({ p1: 'Ann', p2: 'Bo' } as Record<string, string>)[id] ?? 'Someone';
    const state = (extra: object = {}) => ({
        phase: 'ClueWriting', participantIds: ['p1', 'p2'], clueSubmitted: { p1: false, p2: true },
        resolutionAttempt: 1, totalScore: 7, currentSpectatorId: 'p2', ...extra
    }) as any;

    it('asks a Hand for clues until it has sent them', () => {
        expect(cloverStatus(state(), 'p1', false, names)).toBe('Write your four clues');
        expect(cloverStatus(state(), 'p2', false, names)).toBe('Waiting for clues');
        expect(cloverStatus(state(), 'tv', true, names)).toBe('Everyone is writing clues');
    });

    it('names whose clover the team is solving, and tells the Spectator to watch', () => {
        const solving = state({ phase: 'Resolution' });
        expect(cloverStatus(solving, 'p1', false, names)).toBe('Solve Bo’s clover');
        expect(cloverStatus(solving, 'p2', false, names)).toBe('Your clover: watch, no hints');
        expect(cloverStatus(solving, 'tv', true, names)).toBe('Solve Bo’s clover');
    });

    it('covers the gaps between clovers and the end', () => {
        expect(cloverStatus(state({ phase: 'BetweenRounds' }), 'p1', false, names)).toBe('Next clover coming up');
        expect(cloverStatus(state({ phase: 'GameOver' }), 'p1', false, names)).toBe('Game over');
    });

    it('shows the try during a solve and the team score otherwise', () => {
        expect(cloverProgress(state({ phase: 'ResolutionSecond', resolutionAttempt: 2 }))).toBe('Try 2 of 2');
        expect(cloverProgress(state())).toBe('Team score 7');
        expect(cloverProgress(null)).toBe('');
    });
});
