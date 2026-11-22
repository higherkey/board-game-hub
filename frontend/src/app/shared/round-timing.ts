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
