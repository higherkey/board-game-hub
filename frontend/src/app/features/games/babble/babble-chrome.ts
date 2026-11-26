import { Room, getRoomResultPhase } from '../../../services/signalr.service';

/** Babble's line in the shared game bar, the same on Table and Hand. */
export function babbleStatus(room: Room | null): string {
    if (!room) return '';
    if (getRoomResultPhase(room) === 'GameOver') return 'Final results';
    return room.state === 'Finished' ? 'Round results' : 'Find words';
}

export function babbleProgress(room: Room | null): string {
    if (!room) return '';
    const total = room.totalRounds ?? room.settings?.totalRounds;
    return total ? `Round ${room.roundNumber} of ${total}` : `Round ${room.roundNumber}`;
}
