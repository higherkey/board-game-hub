import { Component, Input, inject, ChangeDetectionStrategy, OnChanges, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';
import { FourInARowRoom } from '../four-in-a-row.models';
import { FourInARowBoardComponent } from '../four-in-a-row-board/four-in-a-row-board.component';
import { FourInARowPlayerComponent } from '../four-in-a-row-player/four-in-a-row-player.component';
import { FourInARowRulesComponent } from '../four-in-a-row-rules/four-in-a-row-rules.component';
import { GameChromeService, TableauEntry } from '../../../game-room/services/game-chrome.service';
import { TableauRingComponent } from '../../shared/components/tableau-ring/tableau-ring.component';

@Component({
  selector: 'app-four-in-a-row-game',
  standalone: true,
  imports: [CommonModule, FourInARowBoardComponent, FourInARowPlayerComponent, FourInARowRulesComponent, TableauRingComponent],
  templateUrl: './four-in-a-row-game.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./four-in-a-row-game.component.scss']
})
export class FourInARowGameComponent implements OnInit, OnChanges {
  @Input() room?: FourInARowRoom;
  private readonly signalr = inject(SignalRService);
  private readonly chrome = inject(GameChromeService);
  @ViewChild('rules', { static: true }) private readonly rules!: TemplateRef<unknown>;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  @Input() isCreator: boolean = false;
  @Input() isHand: boolean = false;
  @Input() isScreen: boolean = false;
  @Input() isTable: boolean = false;
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

  /** Who plays which colour, the player to move marked. */
  get entries(): TableauEntry[] {
    const state = this.room?.gameData;
    return (state?.playerOrder ?? []).map((id, index) => ({
      id, name: this.playerName(id), score: index === 0 ? 'Red' : 'Yellow',
      active: state?.phase === 'Playing' && id === state.currentPlayerId, isMe: id === this.myConnectionId
    }));
  }

  ngOnInit(): void {
    this.chrome.rules.set(this.rules);
  }

  ngOnChanges(): void {
    this.chrome.publish({ status: this.status, progress: '', scores: this.entries, ended: this.room?.gameData?.phase === 'GameOver' });
  }

  drop(column: number): void {
    if (this.isScreen || this.room?.isPaused || this.room?.state !== 'Playing' ||
        this.room?.gameData?.phase !== 'Playing' || this.room.gameData.currentPlayerId !== this.myConnectionId) return;
    this.signalr.sendGameAction('DROP', { column });
  }
}
