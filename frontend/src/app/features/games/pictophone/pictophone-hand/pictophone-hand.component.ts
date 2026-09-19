import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Room } from '../../../../services/signalr.service';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { PictophoneInputComponent } from '../pictophone-input/pictophone-input.component';
import { PictophoneDrawingComponent } from '../pictophone-drawing/pictophone-drawing.component';
import { PictophoneResultsComponent } from '../pictophone-results/pictophone-results.component';

@Component({
    selector: 'app-pictophone-hand',
    standalone: true,
    imports: [CommonModule, PictophoneInputComponent, PictophoneDrawingComponent, PictophoneResultsComponent],
    templateUrl: './pictophone-hand.component.html',
    styleUrls: ['./pictophone-hand.component.scss']
})
export class PictophoneHandComponent {
    @Input() room?: Room;
    @Input() myConnectionId: string = '';
    @Input() isHost: boolean = false;
    @Input() isHand: boolean = true;
    @Input() isScreen: boolean = false;
    @Input() set playerId(v: string) {
        if (v) this.myConnectionId = v;
    }

    private readonly signalR = inject(SignalRService);
    readonly timeLeft$: Observable<number>;

    constructor() {
        this.timeLeft$ = timer(0, 1000).pipe(
            map(() => {
                if (!this.room?.roundEndTime || this.room?.isPaused) return 0;
                const end = new Date(this.room.roundEndTime).getTime();
                const now = Date.now();
                return Math.max(0, Math.ceil((end - now) / 1000));
            })
        );
    }

    getPhaseLabel(phase: string): string {
        switch (phase) {
            case 'Prompting': return 'Write a Prompt';
            case 'Drawing': return 'Draw It!';
            case 'Guessing': return 'What is this?';
            case 'Reveal': return 'Showcase';
            default: return phase;
        }
    }

    getPreviousPage(state: any) {
        const book = state?.books?.find((b: any) => b.currentHolderId === this.myConnectionId);
        if (!book || book.pages.length === 0) return null;
        return book.pages[book.pages.length - 1];
    }

    onDraftChanged(content: string) {
        this.signalR.submitPictophoneDraft(content);
    }

    onSubmit(content: string) {
        this.signalR.submitPictophonePage(content);
    }

    onRevealNext() {
        if (this.room) this.signalR.revealPictophoneNext(this.room.code);
    }

    onStarPage(event: { bookIndex: number, pageIndex: number }) {
        if (this.room) this.signalR.starPictophonePage(this.room.code, event.bookIndex, event.pageIndex);
    }

    pauseGame() {
        this.signalR.pauseGame();
    }

    resumeGame() {
        this.signalR.resumeGame();
    }

    forceNext() {
        if (this.room) this.signalR.forcePictophoneNext(this.room.code);
    }
}
