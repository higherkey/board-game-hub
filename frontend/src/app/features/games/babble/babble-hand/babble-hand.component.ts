import { Component, Input, OnChanges, SimpleChanges, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../../services/signalr.service';

@Component({
  selector: 'app-babble-hand',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './babble-hand.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./babble-hand.component.scss']
})
export class BabbleHandComponent implements OnInit, OnChanges, OnDestroy {
  private readonly signalRService = inject(SignalRService);

  @Input() room: Room | null = null;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  @Input() isHand: boolean = true;
  @Input() isScreen: boolean = false;
  @Input() isTable: boolean = false;
  @Input() set playerId(v: string) {
    if (v) this.myConnectionId = v;
  }

  // Local game state
  gridChars: string[] = [];
  boardSize = 4;
  currentWord = '';
  foundWords: string[] = [];

  // Results state
  lastRoundResults: any[] = [];
  selectedWord: any = null;
  showOnlyMyWords = true;

  // Countdown & blur state
  isBlurred = true;
  countdownSeconds = 0;
  private countdownInterval: any;
  private lastHandledRound = 0;

  // Timer state
  timerText = '--:--';
  isUrgent = false;
  isEnding = false;
  private timerInterval: any;

  get isPlaying(): boolean {
    return this.room?.state === 'Playing';
  }

  get isFinished(): boolean {
    return this.room?.state === 'Finished';
  }

  get isPaused(): boolean {
    return this.room?.isPaused || false;
  }

  get displayResults(): any[] {
    if (this.showOnlyMyWords) {
      return this.lastRoundResults.filter(r => this.isMyWord(r));
    }
    return this.lastRoundResults;
  }

  get myWordsCount(): number {
    return this.lastRoundResults.filter(r => this.isMyWord(r)).length;
  }

  get myRoundScore(): number {
    return this.lastRoundResults
      .filter(r => this.isMyWord(r) && r.points > 0)
      .reduce((sum, r) => sum + (r.points || 0), 0);
  }

  ngOnInit() {
    if (this.room) {
      this.updateStateFromRoom();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['room'] && this.room) {
      this.updateStateFromRoom();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
    this.stopCountdown();
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

    // Blur & countdown handling
    if (this.isFinished) {
      this.isBlurred = false;
      this.stopCountdown();
    } else if (this.isPaused) {
      this.isBlurred = true;
    } else if (this.isPlaying && this.isBlurred && this.room?.roundNumber === this.lastHandledRound) {
      if (this.countdownSeconds <= 0 && !this.isPaused) {
        this.isBlurred = false;
      }
    } else if (this.isPlaying && this.room?.roundNumber !== this.lastHandledRound) {
      this.lastHandledRound = this.room?.roundNumber || 0;
      this.startCountdown();
    }
  }

  private processGridUpdate(grid: any) {
    const newGrid = typeof grid === 'string' ? grid : grid.join('');
    if (this.gridChars.join('') !== newGrid) {
      this.gridChars = newGrid.split('');
      this.boardSize = Math.max(3, Math.round(Math.sqrt(this.gridChars.length)) || 4);
      this.foundWords = [];
      this.currentWord = '';
    }
  }

  private startCountdown() {
    this.stopCountdown();
    this.isBlurred = true;
    this.countdownSeconds = 3;
    this.countdownInterval = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        if (!this.isPaused) {
          this.isBlurred = false;
        }
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private startTimer() {
    if (this.timerInterval) return;

    this.timerInterval = setInterval(() => {
      if (!this.room?.roundEndTime) {
        this.timerText = '--:--';
        return;
      }

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

  // Word input actions
  addLetter(char: string) {
    if (!this.isPlaying || this.isPaused || this.isBlurred) return;
    const letter = char === 'Q' ? 'QU' : char.toUpperCase();
    this.currentWord += letter;
  }

  backspace() {
    if (!this.currentWord || this.isPaused) return;
    if (this.currentWord.endsWith('QU')) {
      this.currentWord = this.currentWord.slice(0, -2);
    } else {
      this.currentWord = this.currentWord.slice(0, -1);
    }
  }

  clearWord() {
    this.currentWord = '';
  }

  submitWord() {
    if (!this.currentWord || this.isPaused || !this.isPlaying || this.isBlurred) return;
    const word = this.currentWord.trim().toUpperCase();
    if (word.length < 3) return;

    if (!this.foundWords.includes(word)) {
      this.foundWords.push(word);
      this.signalRService.submitAnswers(this.foundWords);
    }
    this.currentWord = '';
  }

  // Host toolbar actions
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

  // Results & validation actions
  isMyWord(res: any): boolean {
    if (!res?.foundBy || !this.myConnectionId) return false;
    return res.foundBy.includes(this.myConnectionId);
  }

  getPlayerName(connectionId: string): string {
    return this.room?.players.find(p => p.connectionId === connectionId)?.name || 'Unknown';
  }

  showDefinition(res: any) {
    this.selectedWord = this.selectedWord === res ? null : res;
  }

  toggleValidation(res: any, forceState?: boolean) {
    if (!this.isHost || !this.room) return;
    const isCurrentlyValid = res.isHostValidated || (res.isInDictionary && !res.isHostRejected);
    const targetState = forceState ?? !isCurrentlyValid;

    this.signalRService.sendGameAction('VALIDATE_WORD', {
      word: res.word,
      isValid: targetState
    });
  }
}
