import { Component, Input, OnChanges, SimpleChanges, OnInit, ViewChild, TemplateRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../../services/signalr.service';
import { secondsUntilPlay } from '../../../../shared/round-timing';
import { GameChromeService, playersAsEntries } from '../../../game-room/services/game-chrome.service';
import { ActionDockComponent } from '../../shared/components/action-dock/action-dock.component';
import { BabbleRulesComponent } from '../babble-rules/babble-rules.component';
import { babbleProgress, babbleStatus } from '../babble-chrome';

@Component({
  selector: 'app-babble-hand',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionDockComponent, BabbleRulesComponent],
  templateUrl: './babble-hand.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./babble-hand.component.scss']
})
export class BabbleHandComponent implements OnInit, OnChanges {
  private readonly signalRService = inject(SignalRService);
  private readonly chrome = inject(GameChromeService);
  @ViewChild('rules', { static: true }) private readonly rules!: TemplateRef<unknown>;

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
    this.chrome.rules.set(this.rules);
    if (this.room) {
      this.updateStateFromRoom();
    }
  }

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

    this.chrome.publish({ status: babbleStatus(this.room), progress: babbleProgress(this.room), scores: this.room ? playersAsEntries(this.room, undefined, this.myConnectionId) : null, ended: babbleStatus(this.room) === 'Final results' });
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
