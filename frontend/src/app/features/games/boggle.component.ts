import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-boggle',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="boggle-container text-center">
      <h2 class="mb-4 text-primary">Boggle</h2>

      <!-- Grid Display -->
      <div class="grid-container d-inline-block p-3 bg-dark rounded shadow-sm mb-4">
        <div class="row g-2" style="width: 300px; margin: 0 auto;">
           <div class="col-3" *ngFor="let char of gridChars; let i = index">
              <div class="ratio ratio-1x1 bg-surface text-center rounded border border-secondary position-relative">
                   <div class="d-flex align-items-center justify-content-center h-100 fs-2 fw-bold text-light">
                       {{ char === 'Q' ? 'Qu' : char }}
                   </div>
              </div>
           </div>
        </div>
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
          <label for="boggleWord" class="visually-hidden">Type a word</label>
          <input id="boggleWord" [(ngModel)]="currentWord" (keyup.enter)="submitWord()" 
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
  `]
})
export class BoggleComponent implements OnChanges {
    @Input() grid: string[] | null = null; // Should be 16 chars
    @Input() isPlaying = false;
    @Output() wordSubmitted = new EventEmitter<string>();

    // Local state for UI
    gridChars: string[] = [];
    currentWord = '';
    foundWords: string[] = [];

    ngOnChanges(changes: SimpleChanges) {
        if (changes['grid'] && this.grid) {
            if (typeof this.grid === 'string') {
                // Handle if backend sends string "ABC..." instead of array
                this.gridChars = (this.grid as string).split('');
            } else {
                this.gridChars = this.grid;
            }
            this.foundWords = []; // Reset on new grid? Or keep? Reset seems safer for new round.
        }
    }

    submitWord() {
        if (!this.currentWord) return;
        const word = this.currentWord.trim().toUpperCase();
        if (word.length < 3) return;

        // Optimistic UI update? Or wait for ack? 
        // For now, add to local list to show "submitted"
        if (!this.foundWords.includes(word)) {
            this.foundWords.push(word);
            this.wordSubmitted.emit(word);
        }
        this.currentWord = '';
    }
}
