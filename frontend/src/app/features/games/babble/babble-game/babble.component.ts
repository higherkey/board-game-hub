import { Component, Input, OnChanges, SimpleChanges, OnDestroy, OnInit, ViewChild, TemplateRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../../services/signalr.service';
import { secondsUntilPlay } from '../../../../shared/round-timing';
import { GameChromeService, playersAsEntries } from '../../../game-room/services/game-chrome.service';
import { TableauRingComponent } from '../../shared/components/tableau-ring/tableau-ring.component';
import { BabbleRulesComponent } from '../babble-rules/babble-rules.component';
import { babbleProgress, babbleStatus } from '../babble-chrome';

@Component({
  selector: 'app-babble',
  standalone: true,
  imports: [CommonModule, FormsModule, TableauRingComponent, BabbleRulesComponent],
  templateUrl: './babble.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './babble.component.scss'
})
export class BabbleComponent implements OnInit, OnChanges, OnDestroy {
  private readonly chrome = inject(GameChromeService);
  @ViewChild('rules', { static: true }) private readonly rules!: TemplateRef<unknown>;

  @Input() room: Room | null = null;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  @Input() isHand: boolean = false;
  @Input() isScreen: boolean = false;
  @Input() isTable: boolean = false;

  sidebarWidth = 450;
  isResizing = false;

  /** Seconds left in the server lead-in; the room shows the countdown itself. */
  get countdownSeconds(): number {
    return secondsUntilPlay(this.room);
  }

  /** The board stays hidden while paused or during the lead-in. */
  get isBlurred(): boolean {
    return !this.isFinished && (this.isPaused || this.countdownSeconds > 0);
  }

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
    const data = this.room?.gameData || this.room?.gameState;
    if (data?.lastRoundResults) {
      this.lastRoundResults = data.lastRoundResults;
    }

    const grid = data?.grid || data?.Grid;
    if (grid) {
      this.processGridUpdate(grid);
    }

    this.chrome.publish({ status: babbleStatus(this.room), progress: babbleProgress(this.room), scores: this.room ? this.entries : null });
  }

  private processGridUpdate(grid: any) {
    const newGrid = typeof grid === 'string' ? grid : grid.join('');
    if (this.gridChars.join('') !== newGrid) {
      this.gridChars = newGrid.split('');
      this.boardSize = Math.sqrt(this.gridChars.length);
      this.foundWords = [];
      // Do NOT clear lastRoundResults here — host word overrides cause grid state
      // updates and would wipe the results panel. Results are set from data.lastRoundResults
      // in updateStateFromRoom() and are cleared only by fresh round starts above.
    }
  }

  get entries() {
    return this.room ? playersAsEntries(this.room, undefined, this.myConnectionId) : [];
  }

  ngOnInit() {
    this.chrome.rules.set(this.rules);
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
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
