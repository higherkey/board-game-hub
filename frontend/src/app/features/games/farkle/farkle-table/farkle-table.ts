import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../../../services/signalr.service';

@Component({
  selector: 'app-farkle-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farkle-table.html',
  styleUrl: './farkle-table.scss'
})
export class FarkleTableComponent {
  /** Platform-standard inputs — passed in via GameRoomComponent's gameInputs. */
  @Input() room!: Room;
  @Input() myConnectionId: string = '';
  @Input() isHost = false;
  @Input() isScreen = true;
  @Input() isTable = true;
  @Input() isHand = false;

  get state(): FarkleTableState | null {
    return (this.room?.gameData as FarkleTableState) ?? null;
  }

  constructor() {}

  getPlayerList(playerStates: Record<string, FarklePlayerState>): FarklePlayerState[] {
    if (!playerStates) return [];
    return Object.values(playerStates).sort((a, b) => b.totalScore - a.totalScore);
  }
}

interface FarklePlayerState {
  playerId: string;
  playerName: string;
  totalScore: number;
  lastTurnScore: number;
}

interface FarkleTableState {
  activePlayerId: string;
  currentTurnScore: number;
  dice: { value: number; isHeld: boolean; isReserved: boolean }[];
  phase: string;
  playerStates: Record<string, FarklePlayerState>;
  winningPlayerId?: string;
}
