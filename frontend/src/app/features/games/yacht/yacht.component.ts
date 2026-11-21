import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../services/signalr.service';
import { YACHT_CATEGORIES, YachtState } from './yacht.models';
import { DiceTrayComponent } from '../../../shared/components/dice-tray/dice-tray.component';
import { TrayDie } from '../../../shared/components/dice-tray/dice-math';

@Component({
  selector: 'app-yacht',
  standalone: true,
  imports: [CommonModule, DiceTrayComponent],
  templateUrl: './yacht.component.html',
  styleUrl: './yacht.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class YachtComponent implements OnChanges {
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
  get winnerNames(): string {
    return this.state?.winnerIds.map(id => this.state!.scorecards[id].playerName).join(' & ') ?? '';
  }
  get pendingLabel(): string { return this.categories.find(c => c.key === this.pendingCategory)?.label ?? ''; }
  get pendingPoints(): number { return this.state?.availableScores[this.pendingCategory ?? ''] ?? 0; }

  isAvailableCategory(category: string): boolean {
    // Merge patches retain removed dictionary keys as null; zero remains a legal score.
    return typeof this.state?.availableScores[category] === 'number';
  }

  ngOnChanges(): void {
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
