import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../services/signalr.service';
import { EndRoundButtonComponent } from '../shared/components/end-round-button/end-round-button.component';

@Component({
  selector: 'app-babble',
  standalone: true,
  imports: [CommonModule, FormsModule, EndRoundButtonComponent],
  template: `
    <div class="babble-view" [class.showing-results]="isFinished">
      <div class="babble-header">
        <h2>Babble</h2>
        
        <div class="timer-card" *ngIf="isPlaying" [class.urgent]="isUrgent">
          <i class="bi bi-stopwatch-fill"></i>
          <span>{{ timerText }}</span>
        </div>
      </div>

      <!-- Grid Display (Shared Screen Only) -->
      <div class="grid-stage" *ngIf="isHost">
        <div class="babble-grid" [class]="'size-' + boardSize">
           <div class="letter-tile animate-pop" 
                *ngFor="let char of gridChars; let i = index"
                [style.animation-delay]="(i * 0.05) + 's'">
                {{ char === 'Q' ? 'Qu' : char }}
           </div>
        </div>
      </div>
      
      <!-- Host View -->
      <div *ngIf="isHost" class="controls-section host-dashboard">
          <app-end-round-button (endRound)="handleEndRound()" *ngIf="isPlaying" [disabled]="isEnding"></app-end-round-button>
          <div *ngIf="isEnding && isPlaying" class="mt-3 text-accent fw-bold">
              <span class="spinner-border spinner-border-sm me-2"></span> Ending...
          </div>
      </div>

      <!-- Player View -->
      <div *ngIf="!isHost && isPlaying" class="controls-section">
          <!-- Input -->
          <div class="word-input-wrapper mb-4">
              <input id="babbleWord" [(ngModel)]="currentWord" (keyup.enter)="submitWord()" 
                     placeholder="Type word..." [disabled]="!isPlaying" />
              <button class="btn-submit" (click)="submitWord()" [disabled]="!isPlaying">
                 <i class="bi bi-plus-lg"></i>
              </button>
          </div>

          <!-- Found Words -->
          <div class="found-words-area">
             <h5 class="mb-3">Found Words ({{ foundWords.length }})</h5>
             <div class="word-chips">
                <span class="word-chip" *ngFor="let word of foundWords">{{ word }}</span>
             </div>
          </div>
      </div>

      <!-- RESULTS VIEW (for both Host and Players when finished) -->
      <div *ngIf="isFinished" class="results-section fade-in">
          <div class="results-header">
              <h3>{{ isHost ? 'Round Results' : 'Your Results' }}</h3>
              <button class="btn-primary btn-next" (click)="handleNextRound()" *ngIf="isHost">
                  Start Next Round <i class="bi bi-arrow-right"></i>
              </button>
              <div *ngIf="!isHost" class="waiting-text">
                  <span class="spinner-border spinner-border-sm me-2"></span> Waiting for Host...
              </div>
          </div>

          <div class="results-list">
              <div class="result-row" *ngFor="let res of displayResults">
                  <div class="word-col">
                      <span class="word-text" [class.strike]="!res.isOnGrid">
                          {{ res.word }}
                      </span>
                      <span class="badge-tag bg-warning text-dark" *ngIf="!res.isOnGrid">Not on Grid</span>
                      <span class="badge-tag bg-danger" *ngIf="!res.isInDictionary">Unknown Word</span>
                      <span class="badge-tag bg-info" *ngIf="res.isDuplicate">Duplicate</span>
                  </div>
                  
                  <div class="players-col" *ngIf="isHost">
                      <div class="player-mini-chip" *ngFor="let pid of res.foundBy">
                          {{ getPlayerName(pid) }}
                      </div>
                  </div>
                  
                  <div class="points-col">
                      <span class="points-val" [class.zero]="res.points === 0">+{{ res.points }}</span>
                  </div>
              </div>
              
              <div *ngIf="displayResults.length === 0" class="text-center text-secondary py-4">
                  No words found this round!
              </div>
          </div>
      </div>

      <p *ngIf="!isPlaying && !isFinished && room?.state === 'Finished'" class="text-center text-dim mt-4">
         Round Over! Calculating scores...
      </p>
    </div>
  `,
  styleUrl: './babble.component.scss'
})
export class BabbleComponent implements OnChanges, OnDestroy {
  @Input() room: Room | null = null;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;

  get isPlaying(): boolean {
    return this.room?.state === 'Playing';
  }

  get isFinished(): boolean {
    return this.room?.state === 'Finished';
  }

  get displayResults(): any[] {
    if (this.isHost) return this.lastRoundResults;
    // For players, only show words they found
    return this.lastRoundResults.filter(r => r.foundBy.includes(this.myConnectionId));
  }

  // Timer Logic
  timerText: string = '--:--';
  isUrgent: boolean = false;
  isEnding: boolean = false;
  private timerInterval: any;

  constructor(private readonly signalRService: SignalRService) { }

  // Local state for UI
  gridChars: string[] = [];
  currentWord = '';
  foundWords: string[] = [];
  boardSize = 4;

  // Results
  lastRoundResults: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['room'] && this.room) {
      if (this.isFinished) {
        this.isEnding = false; // Reset ending flag when results arrive
      }

      const data = this.room.gameData || this.room.gameState;
      const grid = data?.grid;

      // Update Results
      if (data?.lastRoundResults) {
        this.lastRoundResults = data.lastRoundResults;
      }

      if (grid) {
        const oldGrid = this.gridChars.join('');
        const newGrid = typeof grid === 'string' ? grid : grid.join('');

        if (oldGrid !== newGrid) {
          this.gridChars = newGrid.split('');
          this.boardSize = Math.sqrt(this.gridChars.length);
          this.foundWords = []; // Reset on new word set
          this.lastRoundResults = [];
        }
      }

      if (this.isPlaying) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    if (this.timerInterval) return;

    this.timerInterval = setInterval(() => {
      if (!this.room?.roundEndTime) {
        this.timerText = '--:--';
        return;
      }

      const endTime = new Date(this.room.roundEndTime).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        this.timerText = '00:00';
        this.isUrgent = true;
        this.stopTimer();

        // Host triggers end round automatically when time is up
        if (this.isHost && this.isPlaying) {
          this.handleEndRound();
        }
        return;
      }

      const seconds = Math.floor(diff / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;

      this.timerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      this.isUrgent = seconds < 10;
    }, 500);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  submitWord() {
    if (!this.currentWord) return;
    const word = this.currentWord.trim().toUpperCase();
    if (word.length < 3) return;

    if (!this.foundWords.includes(word)) {
      this.foundWords.push(word);
      this.signalRService.submitAnswers(this.foundWords);
    }
    this.currentWord = '';
  }

  handleEndRound() {
    if (this.isEnding) return;
    console.log('[Babble] Host triggered End Round');
    if (this.isHost && this.room) {
      this.isEnding = true; // Show immediate feedback
      this.signalRService.endRound().catch(() => {
        this.isEnding = false;
      });
    }
  }

  handleNextRound() {
    console.log('[Babble] Host triggered Next Round');
    if (this.isHost && this.room) {
      this.signalRService.nextRound();
    }
  }

  getPlayerName(connectionId: string): string {
    return this.room?.players.find(p => p.connectionId === connectionId)?.name || 'Unknown';
  }
}
