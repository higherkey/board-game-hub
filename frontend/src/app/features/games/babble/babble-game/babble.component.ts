import { Component, Input, OnChanges, SimpleChanges, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../../services/signalr.service';
import { EndRoundButtonComponent } from '../../shared/components/end-round-button/end-round-button.component';

@Component({
  selector: 'app-babble',
  standalone: true,
  imports: [CommonModule, FormsModule, EndRoundButtonComponent],
  templateUrl: './babble.component.html',
  styleUrl: './babble.component.scss'
})
export class BabbleComponent implements OnChanges, OnDestroy {
  @ViewChild('hostControlsTemplate') hostControlsTemplate!: TemplateRef<any>;

  @Input() room: Room | null = null;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;

  sidebarWidth = 450;
  isResizing = false;

  isBlurred = true;
  countdownSeconds = 0;

  get isPlaying(): boolean {
    return this.room?.state === 'Playing';
  }

  get isFinished(): boolean {
    return this.room?.state === 'Finished';
  }

  get isPaused(): boolean {
    return this.room?.isPaused || false;
  }

  showOnlyMyWords = false;

  get displayResults(): any[] {
    if (this.showOnlyMyWords && !this.isHost) {
      return this.lastRoundResults.filter(r => r.foundBy.includes(this.myConnectionId));
    }
    return this.lastRoundResults;
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
  selectedWord: any = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['room'] && this.room) {
      this.updateStateFromRoom();
    }
  }

  private updateStateFromRoom() {
    if (this.isFinished) {
      this.isEnding = false;
    }

    const data = this.room?.gameData || this.room?.gameState;
    if (data?.lastRoundResults) {
      this.lastRoundResults = data.lastRoundResults;
    }

    const grid = data?.grid || data?.Grid;
    if (grid) {
      this.processGridUpdate(grid);
    }

    this.isPlaying ? this.startTimer() : this.stopTimer();

    // Blur Logic
    if (this.isFinished) {
      this.isBlurred = false;
    } else if (this.isPaused) {
      this.isBlurred = true;
    } else if (this.isPlaying && this.isBlurred && this.room?.roundNumber === this.lastHandledRound) {
      // If we are playing, blurred, and it's not a new round:
      // Check if we should un-blur (e.g. came back from pause or countdown finished)
      if (this.countdownSeconds <= 0 && !this.isPaused) {
        this.isBlurred = false;
      }
    } else if (this.isPlaying && this.room?.roundNumber !== this.lastHandledRound) {
      // New Round Started
      this.lastHandledRound = this.room?.roundNumber || 0;
      this.startCountdown();
    }
  }

  private lastHandledRound = 0;

  private startCountdown() {
    this.isBlurred = true;
    this.countdownSeconds = 3;
    const interval = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        if (!this.isPaused) {
          this.isBlurred = false;
        }
        clearInterval(interval);
      }
    }, 1000);
  }

  private processGridUpdate(grid: any) {
    const newGrid = typeof grid === 'string' ? grid : grid.join('');
    if (this.gridChars.join('') !== newGrid) {
      this.gridChars = newGrid.split('');
      this.boardSize = Math.sqrt(this.gridChars.length);
      this.foundWords = [];
      this.lastRoundResults = [];
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

      // Don't show timer during countdown
      if (this.countdownSeconds > 0) {
        this.timerText = '--:--';
        return;
      }

      if (this.isPaused) {
        this.timerText = 'PAUSED';
        this.isUrgent = false;
        return;
      }

      const endTime = new Date(this.room.roundEndTime).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        this.handleTimerEnd();
        return;
      }

      const seconds = Math.floor(diff / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;

      this.timerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      this.isUrgent = seconds < 10;
    }, 500);
  }

  private handleTimerEnd() {
    this.timerText = '00:00';
    this.isUrgent = true;
    this.stopTimer();
    if (this.isHost && this.isPlaying) {
      this.handleEndRound();
    }
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  submitWord() {
    if (!this.currentWord || this.isPaused) return;
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
    if (this.isHost && this.room) {
      this.isEnding = true;
      this.signalRService.endRound().catch(() => {
        this.isEnding = false;
      });
    }
  }

  handleNextRound() {
    if (this.isHost && this.room) {
      this.signalRService.nextRound();
    }
  }

  handlePause() {
    if (this.isHost) {
      this.signalRService.pauseGame();
    }
  }

  handleResume() {
    if (this.isHost) {
      this.signalRService.resumeGame();
    }
  }

  getPlayerName(connectionId: string): string {
    return this.room?.players.find(p => p.connectionId === connectionId)?.name || 'Unknown';
  }

  isMyWord(res: any): boolean {
    return res.foundBy.includes(this.myConnectionId);
  }

  toggleResultsFilter() {
    this.showOnlyMyWords = !this.showOnlyMyWords;
  }

  showDefinition(res: any) {
    if (this.selectedWord === res) {
      this.selectedWord = null;
    } else {
      this.selectedWord = res;
    }
  }

  toggleValidation(res: any, forceState?: boolean) {
    if (!this.isHost || !this.room) return;

    // If forceState provided, use it. Otherwise toggle based on current "effective" validity.
    const isCurrentlyValid = res.isHostValidated || (res.isInDictionary && !res.isHostRejected);
    const targetState = forceState ?? !isCurrentlyValid;

    this.signalRService.sendGameAction('VALIDATE_WORD', {
      word: res.word,
      isValid: targetState
    });
  }

  // Resizing Logic
  startResizing(event: MouseEvent) {
    this.isResizing = true;
    event.preventDefault();
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isResizing) return;
    const newWidth = window.innerWidth - event.clientX;
    // Bounded between 300px and 70% of screen width
    this.sidebarWidth = Math.max(300, Math.min(newWidth, window.innerWidth * 0.7));
  };

  private onMouseUp = () => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };
}
