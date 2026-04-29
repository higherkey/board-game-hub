import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Room } from '../../../../services/signalr.service';

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
  imports: [CommonModule],
  templateUrl: './farkle-hand.html',
  styleUrl: './farkle-hand.scss'
})
export class FarkleHandComponent {
  /** Platform-standard inputs — passed in via GameRoomComponent's gameInputs. */
  @Input() room!: Room;
  @Input() myConnectionId: string = '';
  @Input() isHost = false;
  @Input() isScreen = false;
  @Input() isTable = false;
  @Input() isHand = true;

  showScoringAid = false;

  get state(): FarkleState | null {
    return this.room?.gameData as FarkleState;
  }

  constructor(private readonly signalRService: SignalRService) {}

  roll(): void {
    this.signalRService.sendGameAction('ROLL', {});
  }

  bank(): void {
    this.signalRService.sendGameAction('BANK', {});
  }

  toggleDie(index: number): void {
    this.signalRService.sendGameAction('TOGGLE_DIE', { index });
  }

  toggleScoringAid(): void {
    this.showScoringAid = !this.showScoringAid;
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

  getPips(value: number): number[] {
    return Array(value).fill(0);
  }
}
