import { Component, EventEmitter, Input, Output, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSettings, SignalRService, Player } from '../../../../services/signalr.service';
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
  @Input() players: Player[] = [];
  @Input() meReady = false;
  @Input() isHost = false;
  @Input() isScreen = false;
  @Output() gameStart = new EventEmitter<GameSettings>();
  @Output() nextRound = new EventEmitter<GameSettings>();
  @Output() endGame = new EventEmitter<void>();
  @Output() exitGame = new EventEmitter<void>();
  @Output() toggleReady = new EventEmitter<void>();

  selectedGameType = 'None';
  availableGames: GameDefinition[] = [];
  gameSearchQuery = '';

  settings: GameSettings = {
    timerDurationSeconds: 60,
    totalRounds: 5,
    letterMode: 0,
    boardSize: 4,
    listId: undefined
  };

  listSelectionMode: 'manual' | 'random' | 'generative' = 'manual';
  selectedListId: number = 1;
  scatterbrainLists: any[] = [];
  previewedList: any = null;

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
        this.syncSelectedGame();
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
      } else if (this.settings.isGenerative) {
        this.listSelectionMode = 'generative';
      }
    }

    // Fetch lists if Scatterbrain
    if (this.currentGameType === 'Scatterbrain' || this.selectedGameType === 'Scatterbrain') {
      this.signalRService.getScatterbrainLists().then(lists => {
        this.scatterbrainLists = lists;
        if (this.selectedListId) {
          this.previewList(this.selectedListId);
        }
      });
    }
  }

  ngOnChanges() {
    const type = this.currentGameType || 'None';
    if (type !== this.selectedGameType) {
      this.selectedGameType = type;
      this.syncSelectedGame();
    }
  }

  syncSelectedGame() {
    if (!this.selectedGameType || this.selectedGameType === 'None' || !this.availableGames.length) return;

    // Robust matching: Try ID (case-insensitive) then Name (case-insensitive)
    const query = this.selectedGameType.toLowerCase();
    const game = this.availableGames.find(g =>
      g.id.toLowerCase() === query ||
      g.name.toLowerCase() === query
    );

    if (game) {
      // Synchronize search query label if it's currently empty or generic
      if (!this.gameSearchQuery || this.gameSearchQuery === '...' || this.gameSearchQuery === 'None') {
        this.gameSearchQuery = game.name;
      }

      // Important: Only apply defaults if we don't already have specialized settings from the room
      // or if we are currently at standard defaults and switching games.
      if (game.defaultRoundLengthSeconds > 0) {
        this.settings.timerDurationSeconds = game.defaultRoundLengthSeconds;
      } else if (game.timerType === 0) {
        this.settings.timerDurationSeconds = 0;
      }

      // Apply other defaults if needed
      if (game.id === 'Babble' && (!this.settings.boardSize || this.settings.boardSize === 4)) {
        this.settings.boardSize = 4;
      }

      // Pre-fetch Scatterbrain lists if needed
      if (game.id === 'Scatterbrain') {
        if (!this.scatterbrainLists.length) {
          this.signalRService.getScatterbrainLists().then(lists => {
            this.scatterbrainLists = lists;
            if (this.selectedListId) this.previewList(this.selectedListId);
            // Ensure first list is selected if none is
            if (!this.settings.listId) {
              this.settings.listId = lists[0]?.id || 1;
              this.selectedListId = this.settings.listId as number;
            }
          });
        }
      }
    }
  }

  async changeGameType(typeOrName?: string) {
    if (typeOrName) {
      const found = this.availableGames.find(g =>
        g.id.toLowerCase() === typeOrName.toLowerCase() ||
        g.name.toLowerCase() === typeOrName.toLowerCase()
      );
      this.selectedGameType = found ? found.id : 'None';
    } else {
      this.selectedGameType = 'None';
    }

    if (this.roomCode && this.selectedGameType !== 'None') {
      if (this.isIntermission) return;

      this.gameSearchQuery = this.availableGames.find(g => g.id === this.selectedGameType)?.name || '';
      await this.signalRService.setGameType(this.roomCode, this.selectedGameType);
      this.syncSelectedGame();
    }
  }

  get filteredGames() {
    if (!this.gameSearchQuery) return this.availableGames;
    return this.availableGames.filter(g => g.name.toLowerCase().includes(this.gameSearchQuery.toLowerCase()));
  }

  get selectedGame(): GameDefinition | undefined {
    const type = this.selectedGameType.toLowerCase();
    return this.availableGames.find(g => g.id.toLowerCase() === type || g.name.toLowerCase() === type);
  }

  updateListId() {
    this.settings.listId = undefined;
    this.settings.isGenerative = false;

    if (this.listSelectionMode === 'manual') {
      this.settings.listId = this.selectedListId;
    } else if (this.listSelectionMode === 'generative') {
      this.settings.isGenerative = true;
    }
  }

  previewList(listId: number) {
    this.previewedList = this.scatterbrainLists.find(l => l.id === listId);
  }

  updateBoardSize(size: string) {
    this.settings.boardSize = Number.parseInt(size, 10);
  }

  saveUndoSettings() {
    this.signalRService.updateUndoSettings(this.undoSettings);
  }

  startGame() {
    const playersOnly = this.players.filter(p => !p.isScreen);
    const readyPlayers = playersOnly.filter(p => p.isReady).length;
    const totalPlayers = playersOnly.length;

    if (totalPlayers === 0) {
      alert('Cannot start the game! No players in the room.');
      return;
    }

    if (readyPlayers < totalPlayers) {
      alert(`Cannot start the game! ${totalPlayers - readyPlayers} player(s) are not ready.`);
      return;
    }

    if (this.isIntermission) {
      // Check for Game Over condition (Soft Stop)
      if (this.currentRound >= (this.settings.totalRounds || 5)) {
        this.endGame.emit();
      } else {
        this.nextRound.emit(this.settings);
      }
    } else {
      this.gameStart.emit(this.settings);
    }
  }

  emitExitGame() {
    this.exitGame.emit();
  }

  getQrCodeUrl(): string {
    const url = globalThis.location.origin + '/game/' + this.roomCode;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}&bgcolor=ffffff`;
  }

  onToggleReady() {
    if (this.selectedGameType === 'None') {
      alert('Please select a game first!');
      return;
    }
    this.toggleReady.emit();
  }
}
