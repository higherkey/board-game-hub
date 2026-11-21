import { findGameBySlug, gameSlug } from './game-slug';

describe('gameSlug', () => {
    it('turns game ids into readable addresses', () => {
        expect(gameSlug('Babble')).toBe('babble');
        expect(gameSlug('CloverMinded')).toBe('clover-minded');
        expect(gameSlug('FourInARow')).toBe('four-in-a-row');
        expect(gameSlug('NomDeCode')).toBe('nom-de-code');
        expect(gameSlug('OneAndOnly')).toBe('one-and-only');
    });

    it('finds games by slug, or by an old-style id in any case', () => {
        const games = [{ id: 'CloverMinded' }, { id: 'Farkle' }];
        expect(findGameBySlug(games, 'clover-minded')?.id).toBe('CloverMinded');
        expect(findGameBySlug(games, 'CloverMinded')?.id).toBe('CloverMinded');
        expect(findGameBySlug(games, 'FARKLE')?.id).toBe('Farkle');
        expect(findGameBySlug(games, 'missing')).toBeUndefined();
    });
});
