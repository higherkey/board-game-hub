import { secondsUntilPlay } from './round-timing';

describe('secondsUntilPlay', () => {
    const now = Date.parse('2026-11-20T12:00:00Z');
    const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();

    it('counts whole seconds down to the server start time', () => {
        expect(secondsUntilPlay({ state: 'Playing', roundStartTime: at(3000) }, now)).toBe(3);
        expect(secondsUntilPlay({ state: 'Playing', roundStartTime: at(2100) }, now)).toBe(3);
        expect(secondsUntilPlay({ state: 'Playing', roundStartTime: at(100) }, now)).toBe(1);
    });

    it('is zero once play has started, when paused, outside play, or without a start time', () => {
        expect(secondsUntilPlay({ state: 'Playing', roundStartTime: at(-5000) }, now)).toBe(0);
        expect(secondsUntilPlay({ state: 'Playing', isPaused: true, roundStartTime: at(3000) }, now)).toBe(0);
        expect(secondsUntilPlay({ state: 'Lobby', roundStartTime: at(3000) }, now)).toBe(0);
        expect(secondsUntilPlay({ state: 'Playing' }, now)).toBe(0);
        expect(secondsUntilPlay(null, now)).toBe(0);
        expect(secondsUntilPlay({ state: 'Playing', roundStartTime: 'not a date' }, now)).toBe(0);
    });
});
