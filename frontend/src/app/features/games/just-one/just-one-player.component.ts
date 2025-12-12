import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasDrawComponent } from '../../../shared/components/canvas-draw/canvas-draw.component';

@Component({
    selector: 'app-just-one-player',
    standalone: true,
    imports: [CommonModule, FormsModule, CanvasDrawComponent],
    template: `
    <div class="player-container p-3 text-center">
        
        <!-- GUESSER VIEW -->
        <div *ngIf="isGuesser; else clueGiverView">
            <div class="alert alert-warning shadow-lg">
                <h2 class="alert-heading"><i class="bi bi-eye-slash-fill"></i> NO PEEKING!</h2>
                <p>You are the Guesser for this round.</p>
            </div>
            
            <div *ngIf="gameData?.phase === 1" class="mt-4">
                <h3>Make your guess!</h3>
                <p class="text-muted">Look at the TV screen for clues.</p>
                
                <div class="input-group mb-3">
                    <input type="text" class="form-control form-control-lg" [(ngModel)]="guess" placeholder="Enter guess...">
                    <button class="btn btn-primary" (click)="sendGuess()">Submit</button>
                </div>
            </div>

            <div *ngIf="gameData?.phase === 0" class="mt-5">
                <div class="spinner-border text-light" role="status"></div>
                <p class="mt-2 text-white">Using telepathy...</p>
            </div>
        </div>

        <!-- CLUE GIVER VIEW -->
        <ng-template #clueGiverView>
            <div *ngIf="gameData?.phase === 0; else waitView">
                <h3 class="text-white mb-3">Draw your clue!</h3>
                <div class="alert alert-light py-2">
                    <strong>Target Word:</strong> <span class="badge bg-primary fs-5">{{ gameData?.targetWord }}</span>
                </div>

                <div class="bg-white rounded mb-3">
                    <app-canvas-draw (imageGenerated)="currentImage = $event"></app-canvas-draw>
                </div>
                
                <button class="btn btn-success btn-lg w-100 py-3 fw-bold" (click)="submitClue()" [disabled]="!currentImage">
                    SUBMIT CLUE <i class="bi bi-send"></i>
                </button>
            </div>

            <ng-template #waitView>
                 <div class="text-white mt-5">
                     <h3><i class="bi bi-check-circle-fill text-success"></i> Submitted!</h3>
                     <p>Look at the main screen.</p>
                 </div>
            </ng-template>
        </ng-template>

    </div>
  `
})
export class JustOnePlayerComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
    @Output() clueSubmitted = new EventEmitter<string>();
    @Output() guessSubmitted = new EventEmitter<string>();

    guess: string = '';
    currentImage: string | null = null;

    get gameData() { return this.room?.gameData; }

    get isGuesser(): boolean {
        return this.myConnectionId === this.gameData?.guesserId;
    }

    submitClue() {
        if (this.currentImage) {
            this.clueSubmitted.emit(this.currentImage);
        }
    }

    sendGuess() {
        if (this.guess) {
            this.guessSubmitted.emit(this.guess);
        }
    }
}
