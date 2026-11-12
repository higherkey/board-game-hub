import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';
import { FourInARowRoom } from '../four-in-a-row.models';
import { FourInARowBoardComponent } from '../four-in-a-row-board/four-in-a-row-board.component';
import { FourInARowPlayerComponent } from '../four-in-a-row-player/four-in-a-row-player.component';
import { FourInARowRulesComponent } from '../four-in-a-row-rules/four-in-a-row-rules.component';

@Component({
  selector: 'app-four-in-a-row-game',
  standalone: true,
  imports: [CommonModule, FourInARowBoardComponent, FourInARowPlayerComponent, FourInARowRulesComponent],
  templateUrl: './four-in-a-row-game.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./four-in-a-row-game.component.scss']
})
export class FourInARowGameComponent {
  @Input() room?: FourInARowRoom;
  private readonly signalr = inject(SignalRService);
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  @Input() isCreator: boolean = false;
  @Input() isHand: boolean = false;
  @Input() isScreen: boolean = false;
  @Input() isTable: boolean = false;
  showRules = false;

  playerName(id: string): string {
    return this.room?.players.find(p => p.connectionId === id)?.name ?? 'Player';
  }

  get status(): string {
    const state = this.room?.gameData;
    if (!state) return 'Waiting for the board…';
    if (state.phase === 'GameOver') return state.winnerId ? `${this.playerName(state.winnerId)} wins!` : 'Draw! The board is full.';
    if (this.room?.isPaused) return 'Game paused';
    return `${this.playerName(state.currentPlayerId)}’s turn`;
  }

  drop(column: number): void {
    if (this.isScreen || this.room?.isPaused || this.room?.state !== 'Playing' ||
        this.room?.gameData?.phase !== 'Playing' || this.room.gameData.currentPlayerId !== this.myConnectionId) return;
    this.signalr.sendGameAction('DROP', { column });
  }
}
