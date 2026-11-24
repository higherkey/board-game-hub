import { Component, Input, ChangeDetectionStrategy, OnChanges, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceTrayComponent } from '../../../../shared/components/dice-tray/dice-tray.component';
import { FarkleLanding, farkleTrayDice } from '../farkle-dice';
import { SignalRService, Room } from '../../../../services/signalr.service';
import { GameChromeService } from '../../../game-room/services/game-chrome.service';
import { TableauRingComponent } from '../../shared/components/tableau-ring/tableau-ring.component';
import { ActionDockComponent } from '../../shared/components/action-dock/action-dock.component';
import { FarkleRulesComponent } from '../farkle-rules/farkle-rules.component';
import { farkleEntries, farkleStatus } from '../farkle-chrome';

export enum FarklePhase {
  Rolling = 'Rolling',
  Picking = 'Picking',
  Farkled = 'Farkled',
  Banked = 'Banked',
  GameOver = 'GameOver'
}

interface FarkleDie {
  value: number;
  isHeld: boolean;
  isScoring: boolean;
  isReserved: boolean;
}

interface FarklePlayerState {
  playerId: string;
  playerName: string;
  totalScore: number;
  lastTurnScore: number;
  isFinalTurn: boolean;
}

interface FarkleState {
  /** Goes up on every server roll; the dice tray throws only when it changes. */
  rollId?: number;
  activePlayerId: string;
  currentTurnScore: number;
  dice: FarkleDie[];
  phase: FarklePhase;
  playerStates: { [key: string]: FarklePlayerState };
  winningPlayerId?: string;
}

@Component({
  selector: 'app-farkle-hand',
  standalone: true,
  imports: [CommonModule, DiceTrayComponent, TableauRingComponent, ActionDockComponent, FarkleRulesComponent],
  templateUrl: './farkle-hand.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './farkle-hand.scss'
})
export class FarkleHandComponent implements OnInit, OnChanges {
  private readonly chrome = inject(GameChromeService);
  @ViewChild('rules', { static: true }) private readonly rules!: TemplateRef<unknown>;
  protected readonly trayDice = farkleTrayDice();
  protected readonly landing = new FarkleLanding();
  /** Platform-standard inputs — passed in via GameRoomComponent's gameInputs. */
  @Input() room!: Room;
  @Input() myConnectionId: string = '';
  @Input() isHost = false;
  @Input() isScreen = false;
  @Input() isTable = false;
  @Input() isHand = true;

  get state(): FarkleState | null {
    return this.room?.gameData as FarkleState;
  }

  constructor(private readonly signalRService: SignalRService) {}

  get entries() {
    return farkleEntries(this.state, this.myConnectionId);
  }

  ngOnInit(): void {
    this.chrome.rules.set(this.rules);
  }

  ngOnChanges(): void {
    const state = this.state;
    this.chrome.publish({
      status: farkleStatus(state, this.myConnectionId),
      progress: state && state.phase !== FarklePhase.GameOver && state.currentTurnScore > 0 ? `Turn score ${state.currentTurnScore}` : '',
      scores: this.entries,
      ended: state?.phase === FarklePhase.GameOver
    });
  }

  roll(): void {
    this.signalRService.sendGameAction('ROLL', {});
  }

  bank(): void {
    this.signalRService.sendGameAction('BANK', {});
  }

  toggleDie(index: number): void {
    this.signalRService.sendGameAction('TOGGLE_DIE', { index });
  }

  getGroupedDice(type: 'keeping' | 'reroll'): { die: FarkleDie, index: number }[] {
    if (!this.state) return [];
    return this.state.dice
      .map((die, index) => ({ die, index }))
      .filter(item => {
        if (type === 'keeping') return item.die.isHeld || item.die.isReserved;
        return !item.die.isHeld && !item.die.isReserved;
      });
  }

  getRollCount(): number {
    if (!this.state) return 0;
    return this.state.dice.filter(d => !d.isHeld && !d.isReserved).length;
  }

}
