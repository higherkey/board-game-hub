import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, Room } from '../../../services/signalr.service';

@Component({
  selector: 'app-babble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="babble-container text-center">
      <h2 class="mb-4 text-primary">Babble</h2>

      <!-- Grid Display -->
      <div class="grid-container d-inline-block p-3 bg-dark rounded shadow-sm mb-4">
        <div class="row g-2 mx-auto" [class.grid-row-4]="boardSize === 4" [class.grid-row-5]="boardSize === 5" [class.grid-row-6]="boardSize === 6">
           <div [class.die-col-4]="boardSize === 4" [class.die-col-5]="boardSize === 5" [class.die-col-6]="boardSize === 6" 
                *ngFor="let char of gridChars; let i = index">
              <div class="ratio ratio-1x1 bg-surface text-center rounded border border-secondary position-relative">
                   <div class="d-flex align-items-center justify-content-center h-100 fs-2 fw-bold text-light">
                       {{ char === 'Q' ? 'Qu' : char }}
                   </div>
              </div>
           </div>
        </div>
      </div>
      
      <!-- Info Toggle -->
      <button class="btn btn-sm btn-outline-info mb-3" (click)="toggleInfo()">
        <i class="bi bi-info-circle"></i> Show Board Info
      </button>
      
      <div *ngIf="showInfo" class="alert alert-secondary text-start mx-auto" style="max-width: 400px;">
          <small>
            <strong>Board Size:</strong> {{ boardSize }}x{{ boardSize }}<br>
            <strong>Total Letters:</strong> {{ gridChars.length }}<br>
            <strong>Grid:</strong> {{ gridChars.join('') }}
          </small>
      </div>

      <!-- Found Words -->
      <div class="mb-3">
         <h5>Found Words: {{ foundWords.length }}</h5>
         <div class="d-flex flex-wrap justify-content-center gap-2">
            <span class="badge bg-success" *ngFor="let word of foundWords">{{ word }}</span>
         </div>
      </div>

      <!-- Input -->
      <div class="input-group mb-3" style="max-width: 400px; margin: 0 auto;">
          <label for="babbleWord" class="visually-hidden">Type a word</label>
          <input id="babbleWord" [(ngModel)]="currentWord" (keyup.enter)="submitWord()" 
                 class="form-control form-control-lg text-center text-uppercase" 
                 placeholder="Type word..." [disabled]="!isPlaying" aria-label="Enter word found in grid" />
          <button class="btn btn-primary" (click)="submitWord()" [disabled]="!isPlaying" aria-label="Submit word">
             <i class="bi bi-check-lg" aria-hidden="true"></i>
          </button>
      </div>

      <p *ngIf="!isPlaying" class="text-warning">Game Paused or Waiting...</p>
    </div>
  `,
  styles: [`
    .bg-surface { background-color: #2b2d31; }
    .grid-row-4 { width: 300px; }
    .grid-row-5 { width: 375px; }
    .grid-row-6 { width: 450px; }
    .die-col-4 { width: 25%; }
    .die-col-5 { width: 20%; }
    .die-col-6 { width: 16.666%; }
  `]
})
export class BabbleComponent implements OnChanges {
  @Input() room: Room | null = null;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  // Computed property compatibility
  get isPlaying(): boolean {
    return this.room?.state === 'Playing';
  }

  constructor(private readonly signalRService: SignalRService) { }

  // Local state for UI
  gridChars: string[] = [];
  currentWord = '';
  foundWords: string[] = [];

  boardSize = 4;
  showInfo = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['room'] && this.room) {
      // Prioritize gameData if available (new standard), fallback to gameState
      const data = this.room.gameData || this.room.gameState;
      const grid = data?.grid;

      if (grid) {
        if (typeof grid === 'string') {
          this.gridChars = (grid).split('');
        } else {
          this.gridChars = grid;
        }

        // Deduce size
        const count = this.gridChars.length;
        this.boardSize = Math.sqrt(count);
      }

      // We might want to sync found words from server if that existed, 
      // but for now local tracking is fine or derived from room logic if applicable.
      // Keeping local foundWords reset on new grid logic if needed, 
      // but simplistic check here:
      if (!this.foundWords.length && this.room.roundNumber > 0) {
        // reset if needed? 
      }
    }
  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
  }

  submitWord() {
    if (!this.currentWord) return;
    const word = this.currentWord.trim().toUpperCase();
    if (word.length < 3) return;

    if (!this.foundWords.includes(word)) {
      this.foundWords.push(word);
      // Call service directly
      this.signalRService.submitAnswers([word]);
    }
    this.currentWord = '';
  }
}
