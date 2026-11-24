import { Component, Input, ChangeDetectionStrategy, OnChanges, TemplateRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceTrayComponent } from '../../../../shared/components/dice-tray/dice-tray.component';
import { FarkleLanding, farkleTrayDice } from '../farkle-dice';
import { Room } from '../../../../services/signalr.service';
import { GameChromeService, TableauEntry } from '../../../game-room/services/game-chrome.service';
import { TableauRingComponent } from '../../shared/components/tableau-ring/tableau-ring.component';
import { FarkleRulesComponent } from '../farkle-rules/farkle-rules.component';
import { farkleEntries, farkleStatus } from '../farkle-chrome';

@Component({
  selector: 'app-farkle-table',
  standalone: true,
  imports: [CommonModule, DiceTrayComponent, TableauRingComponent, FarkleRulesComponent],
  templateUrl: './farkle-table.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './farkle-table.scss'
})
export class FarkleTableComponent implements OnInit, OnChanges {
  private readonly chrome = inject(GameChromeService);
  @ViewChild('rules', { static: true }) private readonly rules!: TemplateRef<unknown>;
  protected readonly trayDice = farkleTrayDice();
  protected readonly landing = new FarkleLanding();
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

  get status(): string {
    return farkleStatus(this.state, this.myConnectionId);
  }

  get entries(): TableauEntry[] {
    return farkleEntries(this.state, this.myConnectionId);
  }

  ngOnInit(): void {
    this.chrome.rules.set(this.rules);
  }

  ngOnChanges(): void {
    const state = this.state;
    this.chrome.publish({
      status: this.status,
      progress: state && state.phase !== 'GameOver' && state.currentTurnScore > 0 ? `Turn score ${state.currentTurnScore}` : '',
      scores: this.entries
    });
  }


}

interface FarklePlayerState {
  playerId: string;
  playerName: string;
  totalScore: number;
  lastTurnScore: number;
}

interface FarkleTableState {
  /** Goes up on every server roll; the dice tray throws only when it changes. */
  rollId?: number;
  activePlayerId: string;
  currentTurnScore: number;
  dice: { value: number; isHeld: boolean; isReserved: boolean }[];
  phase: string;
  playerStates: Record<string, FarklePlayerState>;
  winningPlayerId?: string;
}
