import { Injectable, TemplateRef, signal } from '@angular/core';
import { Room } from '../../../services/signalr.service';

export interface TableauEntry { id: string; name: string; score: number | string; active?: boolean; isMe?: boolean; }

/**
 * What the active game shows in the room's shared chrome (game bar, menu, rules).
 * Provided by the game room, so each game injects the same instance.
 */
@Injectable()
export class GameChromeService {
    readonly status = signal('');
    readonly progress = signal('');
    readonly rules = signal<TemplateRef<unknown> | null>(null);
    readonly scores = signal<TableauEntry[] | null>(null);
    /** True once the game has ended by its own rules, so its status (a winner) outranks the room's generic "Game over". */
    readonly ended = signal(false);

    publish(p: { status?: string; progress?: string; scores?: TableauEntry[] | null; ended?: boolean }): void {
        if (p.status !== undefined) this.status.set(p.status);
        if (p.progress !== undefined) this.progress.set(p.progress);
        if (p.scores !== undefined) this.scores.set(p.scores);
        if (p.ended !== undefined) this.ended.set(p.ended);
    }

    reset(): void {
        this.status.set('');
        this.progress.set('');
        this.rules.set(null);
        this.scores.set(null);
        this.ended.set(false);
    }
}

/** Hand players in room order, with their room scores. */
export function playersAsEntries(room: Room, activeId?: string, myId?: string): TableauEntry[] {
    return room.players.filter(p => !p.isScreen)
        .map(p => ({ id: p.connectionId, name: p.name, score: p.score, active: p.connectionId === activeId, isMe: p.connectionId === myId }));
}
