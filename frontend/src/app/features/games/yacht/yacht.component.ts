import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../services/signalr.service';
import { YACHT_CATEGORIES, YachtState } from './yacht.models';

@Component({
  selector: 'app-yacht',
  standalone: true,
  imports: [CommonModule],
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
  readonly faces = ['·', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
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

  ngOnChanges(): void {
    if (!this.canAct || !Object.hasOwn(this.state?.availableScores ?? {}, this.pendingCategory ?? '')) {
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
    if (this.canAct && !this.busy && Object.hasOwn(this.state?.availableScores ?? {}, category)) {
      this.pendingCategory = category;
      this.changeDetector.markForCheck();
    }
  }

  async confirmScore(): Promise<void> {
    if (!this.canAct || this.busy || !this.pendingCategory ||
      !Object.hasOwn(this.state?.availableScores ?? {}, this.pendingCategory)) return;
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
