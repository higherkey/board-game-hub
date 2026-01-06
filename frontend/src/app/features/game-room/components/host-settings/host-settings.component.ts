import { Component, EventEmitter, Input, Output, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSettings, SignalRService } from '../../../../services/signalr.service';
import { GameDataService, GameDefinition } from '../../../../services/game-data.service';

@Component({
  selector: 'app-host-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './host-settings.component.html',
  styleUrl: './host-settings.component.scss'
})
export class HostSettingsComponent implements OnChanges, OnInit {
  @Input() roomCode!: string;
  @Input() currentGameType: string | undefined = 'None';
  @Input() compactMode = false;
  @Input() isIntermission = false;
  @Input() currentRound = 1;
  @Input() totalRounds = 5;
  @Output() gameStart = new EventEmitter<GameSettings>();
  @Output() nextRound = new EventEmitter<GameSettings>();
  @Output() endGame = new EventEmitter<void>();

  selectedGameType = 'None';
  selectedGame: GameDefinition | undefined;
  availableGames: GameDefinition[] = [];

  settings: GameSettings = {
    timerDurationSeconds: 60,
    totalRounds: 5,
    letterMode: 0,
    boardSize: 4,
    listId: undefined
  };

  listSelectionMode: 'random' | 'manual' = 'random';
  selectedListId: number = 1;

  undoSettings = { allowVoting: true, hostOnly: false };

  constructor(
    private readonly signalRService: SignalRService,
    private readonly gameDataService: GameDataService
  ) { }

  ngOnInit() {
    this.gameDataService.games$.subscribe(games => {
      if (games) {
        // Allow Deployed and Testing
        this.availableGames = games.filter(g => g.status === 'Deployed' || g.status === 'Testing');
      }
    });

    this.gameDataService.refreshGames();

    const room = this.signalRService.currentRoomSubject.value;
    if (room?.undoSettings) {
      this.undoSettings = { ...room.undoSettings };
    }

    // Initialize settings from room if available (persists between rounds)
    if (room?.settings) {
      this.settings = { ...this.settings, ...room.settings };
      // Handle special mapping if needed
      if (this.settings.listId) {
        this.selectedListId = this.settings.listId;
        this.listSelectionMode = 'manual';
      }
    }
  }

  ngOnChanges() {
    if (this.currentGameType) {
      this.selectedGameType = this.currentGameType;
    }
  }

  async changeGameType() {
    if (this.roomCode && this.selectedGameType) {
      await this.signalRService.setGameType(this.roomCode, this.selectedGameType);

      // Update local defaults based on game definition
      this.selectedGame = this.availableGames.find(g => g.id === this.selectedGameType);
      if (this.selectedGame) {
        if (this.selectedGame.defaultRoundLengthSeconds > 0) {
          this.settings.timerDurationSeconds = this.selectedGame.defaultRoundLengthSeconds;
        } else if (this.selectedGame.timerType === 0) { // NotApplicable
          this.settings.timerDurationSeconds = 0;
        }
      }
    }
  }

  updateListId() {
    if (this.listSelectionMode === 'random') {
      this.settings.listId = undefined;
    } else {
      this.settings.listId = this.selectedListId;
    }
  }

  updateBoardSize(size: string) {
    this.settings.boardSize = Number.parseInt(size, 10);
  }

  saveUndoSettings() {
    this.signalRService.updateUndoSettings(this.undoSettings);
  }

  startGame() {
    if (this.isIntermission) {
      // Check for Game Over condition (Soft Stop)
      // The host can change totalRounds in the UI before clicking this.
      if (this.currentRound >= (this.settings.totalRounds || 5)) {
        this.endGame.emit();
      } else {
        this.nextRound.emit(this.settings);
      }
    } else {
      this.gameStart.emit(this.settings);
    }
  }

  emitEndGame() {
    this.endGame.emit();
  }
}
