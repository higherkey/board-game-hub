import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Room } from '../../../services/signalr.service';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { PictophoneInputComponent } from './pictophone-input.component';
import { PictophoneDrawingComponent } from './pictophone-drawing.component';
import { PictophoneResultsComponent } from './pictophone-results.component';

@Component({
    selector: 'app-pictophone-game',
    standalone: true,
    imports: [CommonModule, PictophoneInputComponent, PictophoneDrawingComponent, PictophoneResultsComponent],
    template: `
    <div class="h-100 d-flex flex-column" *ngIf="room?.gameData as state">
      <!-- HEADER Info -->
      <div class="card shadow-sm mb-3 border-0 bg-light">
          <div class="card-body d-flex justify-content-between align-items-center py-2">
             <div class="d-flex align-items-center gap-2">
                <div class="badge bg-primary fs-6">Round: {{ state.roundIndex + 1 }} / {{ state.totalRounds || '?' }}</div>
                <div class="badge bg-info fs-6">{{ getPhaseLabel(state.phase) }}</div>
             </div>
             
             <!-- TIMER & ADMIN -->
             <div class="d-flex align-items-center gap-3">
                 <div *ngIf="room.roundEndTime && state.phase !== 'Reveal'" 
                      class="d-flex align-items-center gap-2 px-3 py-1 rounded-pill border"
                      [class.bg-danger-subtle]="(timeLeft$ | async)! < 10"
                      [class.text-danger]="(timeLeft$ | async)! < 10">
                    <i class="bi bi-clock-fill"></i>
                    <span class="fw-bold fs-5">{{ timeLeft$ | async }}s</span>
                 </div>

                 <div *ngIf="isHost && state.phase !== 'Reveal'" class="btn-group">
                    <button class="btn btn-outline-secondary btn-sm" (click)="pauseGame()" *ngIf="!room.isPaused" title="Pause">
                        <i class="bi bi-pause-fill"></i>
                    </button>
                    <button class="btn btn-outline-success btn-sm" (click)="resumeGame()" *ngIf="room.isPaused" title="Resume">
                        <i class="bi bi-play-fill"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" (click)="forceNext()" title="Skip Phase">
                        <i class="bi bi-fast-forward-fill"></i>
                    </button>
                 </div>
             </div>
          </div>
      </div>

      <!-- GAME CONTENT -->
      <div class="flex-grow-1 overflow-auto d-flex flex-column">
        
        <!-- PROMPTING / GUESSING PHASE -->
        <ng-container *ngIf="state.phase === 'Prompting' || state.phase === 'Guessing'">
           <app-pictophone-input 
              [phase]="state.phase"
              [previousPage]="getPreviousPage(state)"
              [timeLeft]="timeLeft$ | async"
              (submitted)="onSubmit($event)"
              (draftChanged)="onDraftChanged($event)">
           </app-pictophone-input>
        </ng-container>

        <!-- DRAWING PHASE -->
        <ng-container *ngIf="state.phase === 'Drawing'">
           <app-pictophone-drawing
              [prompt]="getPreviousPage(state)?.content"
              [timeLeft]="timeLeft$ | async"
              (imageSubmitted)="onSubmit($event)"
              (draftChanged)="onDraftChanged($event)">
           </app-pictophone-drawing>
        </ng-container>

        <!-- REVEAL PHASE -->
        <ng-container *ngIf="state.phase === 'Reveal'">
            <app-pictophone-results 
                [books]="state.books" 
                [isHost]="isHost"
                [myConnectionId]="myConnectionId"
                [showcaseBookIndex]="state.showcaseBookIndex"
                [showcasePageIndex]="state.showcasePageIndex"
                (starPage)="onStarPage($event)"
                (revealNext)="onRevealNext()">
            </app-pictophone-results>
        </ng-container>

        <!-- WAITING / LOBBY -->
        <div *ngIf="state.phase === 'Lobby'" class="alert alert-info py-5 text-center">
            <h3 class="fw-bold">Waiting for host to start...</h3>
            <p class="text-muted">Prepare your pens and your puns.</p>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .z-index-10 { z-index: 10; }
    .canvas-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
    }
    .fw-black { font-weight: 900; }
  `]
})
export class PictophoneGameComponent {
    @Input() room!: Room;
    @Input() myConnectionId!: string;
    @Input() isHost: boolean = false;

    readonly timeLeft$: Observable<number>;

    constructor(private readonly signalR: SignalRService) {
        this.timeLeft$ = timer(0, 1000).pipe(
            map(() => {
                if (!this.room?.roundEndTime || this.room.isPaused) return 0;
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
        const book = state.books.find((b: any) => b.currentHolderId === this.myConnectionId);
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
        this.signalR.revealPictophoneNext(this.room.code);
    }

    onStarPage(event: { bookIndex: number, pageIndex: number }) {
        this.signalR.starPictophonePage(this.room.code, event.bookIndex, event.pageIndex);
    }

    pauseGame() { this.signalR.pauseGame(); }
    resumeGame() { this.signalR.resumeGame(); }
    forceNext() { this.signalR.forcePictophoneNext(this.room.code); }
}
