import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Room } from '../../../services/signalr.service';

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
      <div class="d-flex justify-content-between align-items-center mb-3">
         <div class="badge bg-primary">Round: {{ state.roundIndex + 1 }} / {{ state.totalRounds || '?' }}</div>
         <div class="badge bg-info">{{ getPhaseLabel(state.phase) }}</div>
      </div>

      <!-- GAME CONTENT -->
      <div class="flex-grow-1 overflow-auto d-flex flex-column">
        
        <!-- PROMPTING / GUESSING PHASE -->
        <ng-container *ngIf="state.phase === 'Prompting' || state.phase === 'Guessing'">
           <app-pictophone-input 
              [phase]="state.phase"
              [previousPage]="getPreviousPage(state)"
              (submitted)="onSubmit($event)">
           </app-pictophone-input>
        </ng-container>

        <!-- DRAWING PHASE -->
        <ng-container *ngIf="state.phase === 'Drawing'">
           <app-pictophone-drawing
              [prompt]="getPreviousPage(state)?.content"
              (imageSubmitted)="onSubmit($event)">
           </app-pictophone-drawing>
        </ng-container>

        <!-- REVEAL PHASE -->
        <ng-container *ngIf="state.phase === 'Reveal'">
            <app-pictophone-results [books]="state.books"></app-pictophone-results>
        </ng-container>

        <!-- WAITING / LOBBY -->
        <div *ngIf="state.phase === 'Lobby'" class="alert alert-info">
            Waiting for game to start...
        </div>

      </div>
    </div>
  `
})
export class PictophoneGameComponent {
    @Input() room!: Room;
    @Input() myConnectionId!: string;

    constructor(private signalR: SignalRService) { }

    getPhaseLabel(phase: string): string {
        switch (phase) {
            case 'Prompting': return 'Write a Prompt';
            case 'Drawing': return 'Draw the Prompt';
            case 'Guessing': return 'Guess the Drawing';
            case 'Reveal': return 'Showcase!';
            default: return phase;
        }
    }

    getPreviousPage(state: any): any {
        // Find the book currently held by me
        if (!state.books) return null;
        const myBook = state.books.find((b: any) => b.currentHolderId === this.myConnectionId);
        if (!myBook || !myBook.pages || myBook.pages.length === 0) return null;

        // Return the last page
        return myBook.pages[myBook.pages.length - 1];
    }

    onSubmit(content: string) {
        this.signalR.submitPictophonePage(content);
    }
}
