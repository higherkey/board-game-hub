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
  @Input() currentGameType: string = 'Scatterbrain';
  @Output() gameStart = new EventEmitter<GameSettings>();

  selectedGameType = 'Scatterbrain';
  availableGames: GameDefinition[] = [];

  settings: GameSettings = {
    timerDurationSeconds: 60,
    letterMode: 0,
    boardSize: 4,
    listId: undefined
  };

  listSelectionMode: 'random' | 'manual' = 'random';
  selectedListId: number = 1;

  constructor(
    private readonly signalRService: SignalRService,
    private readonly gameDataService: GameDataService
  ) { }

  ngOnInit() {
    this.gameDataService.loadGames().subscribe(games => {
      // Allow Deployed and Testing
      this.availableGames = games.filter(g => g.status === 'Deployed' || g.status === 'Testing');
    });
  }

  ngOnChanges() {
    if (this.currentGameType) {
      this.selectedGameType = this.currentGameType;
    }
  }

  async changeGameType() {
    if (this.roomCode && this.selectedGameType) {
      await this.signalRService.setGameType(this.roomCode, this.selectedGameType);
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

  startGame() {
    this.gameStart.emit(this.settings);
  }
}
