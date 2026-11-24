import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnChanges, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../services/signalr.service';
import { YACHT_CATEGORIES, YachtState } from './yacht.models';
import { DiceTrayComponent } from '../../../shared/components/dice-tray/dice-tray.component';
import { TrayDie } from '../../../shared/components/dice-tray/dice-math';
import { GameChromeService } from '../../game-room/services/game-chrome.service';
import { ActionDockComponent } from '../shared/components/action-dock/action-dock.component';

@Component({
  selector: 'app-yacht',
  standalone: true,
  imports: [CommonModule, DiceTrayComponent, ActionDockComponent],
  templateUrl: './yacht.component.html',
  styleUrl: './yacht.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class YachtComponent implements OnInit, OnChanges {
  private readonly chrome = inject(GameChromeService);
  @ViewChild('rules', { static: true }) private readonly rules!: TemplateRef<unknown>;
  @Input() room!: Room;
  @Input() myConnectionId = '';
  @Input() isHost = false;
  @Input() isScreen = false;
  @Input() isTable = false;
  @Input() isHand = true;

  readonly categories = YACHT_CATEGORIES;
  /** Kept dice stay out of the throw and show as the player's pick. Remembered so the tray only sees real changes. */
  protected trayDice(game: YachtState): readonly TrayDie[] {
    if (game.dice !== this.trayCache.dice || game.held !== this.trayCache.held) {
      this.trayCache = { dice: game.dice, held: game.held, out: game.dice.map((value, i) => ({ value, held: game.held[i], selected: game.held[i] })) };
    }
    return this.trayCache.out;
  }
  private trayCache: { dice?: number[]; held?: boolean[]; out: readonly TrayDie[] } = { out: [] };

  readonly identity = (value: boolean): boolean => value;
  readonly sameAsFirst = (value: number): boolean => value === this.state?.dice[0];
  pendingCategory: string | null = null;
  busy = false;
  error = '';

  private readonly signalR = inject(SignalRService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  get state(): YachtState | null { return this.room?.gameData as YachtState ?? null; }
  get canAct(): boolean {
    return !this.isScreen && !this.isTable && this.room?.state === 'Playing' && !this.room?.isPaused &&
      this.state?.phase === 'Playing' && this.state?.activePlayerId === this.myConnectionId;
  }
  get canRoll(): boolean {
    return this.canAct && !this.busy && !!this.state && this.state.rollsUsed < 3 &&
      (this.state.rollsUsed === 0 || !this.state.held.every(Boolean));
  }
  get activeName(): string { return this.state?.scorecards[this.state.activePlayerId]?.playerName ?? ''; }
  /** The game bar line: whose turn, or who won. */
  get status(): string {
    const game = this.state;
    if (!game) return '';
    if (game.phase === 'GameOver') {
      const names = game.winnerIds.map(id => game.scorecards[id]?.playerName ?? '');
      return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)} tie` : `${names[0] ?? 'Nobody'} wins`;
    }
    return game.activePlayerId === this.myConnectionId && !this.isScreen && !this.isTable ? 'Your turn' : `${this.activeName}’s turn`;
  }
  get pendingLabel(): string { return this.categories.find(c => c.key === this.pendingCategory)?.label ?? ''; }
  get pendingPoints(): number { return this.state?.availableScores[this.pendingCategory ?? ''] ?? 0; }

  isAvailableCategory(category: string): boolean {
    // Merge patches retain removed dictionary keys as null; zero remains a legal score.
    return typeof this.state?.availableScores[category] === 'number';
  }

  ngOnInit(): void {
    this.chrome.rules.set(this.rules);
  }

  ngOnChanges(): void {
    const game = this.state;
    this.chrome.publish({
      status: this.status,
      progress: game && game.phase !== 'GameOver' ? `Turn ${game.turnNumber} of 13` : '',
      ended: game?.phase === 'GameOver',
      scores: game ? game.playerOrder.map(id => ({ id, name: game.scorecards[id].playerName, score: game.scorecards[id].total, active: game.phase === 'Playing' && id === game.activePlayerId, isMe: id === this.myConnectionId })) : null
    });
    if (!this.canAct || !this.isAvailableCategory(this.pendingCategory ?? '')) {
      this.pendingCategory = null;
    }
  }

  async roll(): Promise<void> {
    if (!this.canRoll) return;
    this.pendingCategory = null;
    await this.send('ROLL', {});
  }

  async toggleDie(index: number): Promise<void> {
    if (!this.canAct || this.busy || !this.state || this.state.rollsUsed < 1 || this.state.rollsUsed >= 3) return;
    await this.send('TOGGLE_DIE', { index });
  }

  chooseCategory(category: string): void {
    if (this.canAct && !this.busy && this.isAvailableCategory(category)) {
      this.pendingCategory = category;
      this.changeDetector.markForCheck();
    }
  }

  async confirmScore(): Promise<void> {
    if (!this.canAct || this.busy || !this.pendingCategory ||
      !this.isAvailableCategory(this.pendingCategory)) return;
    const category = this.pendingCategory;
    this.pendingCategory = null;
    await this.send('SCORE', { category });
  }

  private async send(type: string, payload: object): Promise<void> {
    this.busy = true;
    this.error = '';
    this.changeDetector.markForCheck();
    try {
      await this.signalR.submitGameAction(type, payload);
    } catch {
      this.error = 'Your action could not be sent. Check your connection and try again.';
    } finally {
      this.busy = false;
      this.changeDetector.markForCheck();
    }
  }
}
