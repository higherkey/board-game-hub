/**
 * Whole seconds left before play starts this round, from the server's roundStartTime.
 * The server owns the lead-in, so a refresh or late join shows only what is left of it.
 * Paused rooms report 0: the server moves the start when play resumes.
 */
export function secondsUntilPlay(
    room: { state?: string; isPaused?: boolean; roundStartTime?: string } | null | undefined,
    now = Date.now()
): number {
    if (room?.state !== 'Playing' || room.isPaused || !room.roundStartTime) return 0;
    const start = Date.parse(room.roundStartTime);
    return Number.isFinite(start) ? Math.max(0, Math.ceil((start - now) / 1000)) : 0;
}

export type ClockState = 'idle' | 'leadIn' | 'running' | 'paused' | 'ended';
export interface RoundClock { state: ClockState; text: string; urgent: boolean; }

/** The one round clock every game shows, read from the server's round times. */
export function roundClock(
    room: { state?: string; isPaused?: boolean; roundStartTime?: string; roundEndTime?: string } | null | undefined,
    now = Date.now()
): RoundClock {
    const end = room?.roundEndTime ? Date.parse(room.roundEndTime) : Number.NaN;
    if (room?.state !== 'Playing' || !Number.isFinite(end)) return { state: 'idle', text: '', urgent: false };
    const leadIn = secondsUntilPlay(room, now);
    if (leadIn > 0) return { state: 'leadIn', text: String(leadIn), urgent: false };
    if (room.isPaused) return { state: 'paused', text: 'Paused', urgent: false };
    const left = Math.floor((end - now) / 1000);
    if (end - now <= 0) return { state: 'ended', text: '00:00', urgent: true };
    const pad = (n: number) => n.toString().padStart(2, '0');
    return { state: 'running', text: `${pad(Math.floor(left / 60))}:${pad(left % 60)}`, urgent: left < 10 };
}
