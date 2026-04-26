import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Room } from '../../../../services/signalr.service';
import { GameShellInputs } from '../../../../core/platform/table-hand.types';

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

  constructor(private signalRService: SignalRService) {}

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
}
