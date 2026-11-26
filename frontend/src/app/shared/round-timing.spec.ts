import { roundClock, secondsUntilPlay } from './round-timing';

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

describe('roundClock', () => {
    const now = Date.parse('2026-01-01T00:00:00Z');
    const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();
    const playing = (extra: object) => ({ state: 'Playing' as const, isPaused: false, ...extra });

    it('is idle without an end time or outside play', () => {
        expect(roundClock(playing({}), now)).toEqual({ state: 'idle', text: '', urgent: false });
        expect(roundClock({ state: 'Lobby', isPaused: false, roundEndTime: at(60000) }, now).state).toBe('idle');
        expect(roundClock(null, now).state).toBe('idle');
    });

    it('counts the lead-in from the server start time', () => {
        expect(roundClock(playing({ roundStartTime: at(2500), roundEndTime: at(62500) }), now))
            .toEqual({ state: 'leadIn', text: '3', urgent: false });
    });

    it('reads Paused while the room is paused', () => {
        expect(roundClock(playing({ isPaused: true, roundEndTime: at(60000) }), now))
            .toEqual({ state: 'paused', text: 'Paused', urgent: false });
    });

    it('shows minutes and seconds left, urgent under ten seconds', () => {
        expect(roundClock(playing({ roundEndTime: at(125000) }), now)).toEqual({ state: 'running', text: '02:05', urgent: false });
        expect(roundClock(playing({ roundEndTime: at(9000) }), now)).toEqual({ state: 'running', text: '00:09', urgent: true });
    });

    it('is ended once the end time has passed', () => {
        expect(roundClock(playing({ roundEndTime: at(-1) }), now)).toEqual({ state: 'ended', text: '00:00', urgent: true });
    });
});
