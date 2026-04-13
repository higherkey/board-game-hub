import { inject, Injectable, DestroyRef, Type } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, map, Observable, take } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { GameSettings, Player, Room, SignalRService } from '../../../services/signalr.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { GAME_REGISTRY } from '../../games/game.registry';

@Injectable({
  providedIn: 'root'
})
export class GameRoomStateService {
  private readonly authService = inject(AuthService);
  private readonly signalRService = inject(SignalRService);
  private readonly gameDataService = inject(GameDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // Expose core streams
  public readonly session$ = this.authService.session$;
  public readonly players$ = this.signalRService.players$;
  public readonly connectionStatus$ = this.signalRService.connectionStatus$;
  public readonly currentRoom$ = this.signalRService.currentRoom$;
  public readonly me$ = this.signalRService.me$;
  public readonly connectionId$ = this.signalRService.connectionId$;

  // Derived states
  public readonly isHost$ = this.signalRService.isHost$;
  public readonly gameStarted$ = this.currentRoom$.pipe(
    map(r => r?.state === 'Playing' || r?.state === 'Finished')
  );
  public readonly isIntermission$ = this.currentRoom$.pipe(
    map(r => r?.state === 'Finished')
  );

  // Component Selection & Synchronization State
  private readonly _gameComponent = new BehaviorSubject<Type<any> | null>(null);
  public readonly gameComponent$ = this._gameComponent.asObservable();
  
  private readonly _gameInputs = new BehaviorSubject<Record<string, any>>({});
  public readonly gameInputs$ = this._gameInputs.asObservable();

  public isScreen = false;
  public selectedGameType = 'None';
  public needsName = false;

  constructor() {
    this.logger.info('[GameRoomStateService] Initializing');
    
    // Subscribe to room updates to sync state and select component
    this.currentRoom$
      .pipe(takeUntilDestroyed())
      .subscribe(room => {
        if (room) {
          this.syncRoomState(room);
        }
      });
  }

  private syncRoomState(room: Room) {
    // Sync local isScreen state with the server-side player state
    const me = room.players.find(p => p.connectionId === this.signalRService.getConnectionId());
    if (me && !this.needsName) {
      if (this.isScreen !== me.isScreen) {
        this.isScreen = me.isScreen;
      }
    }

    // Sync selected game type (respecting local override window if we decide to keep that logic here)
    if (room.gameType && this.selectedGameType !== room.gameType) {
      this.selectedGameType = room.gameType;
    }

    this.updateActiveGame(room);
  }

  private updateActiveGame(room: Room) {
    const isScreen = this.isScreen;
    const inputs = {
      room: room,
      myConnectionId: this.signalRService.getConnectionId() || '',
      isHost: this.signalRService.checkIsHost(room, this.signalRService.getConnectionId() || ''),
      isScreen,
      isTable: isScreen,
      isHand: !isScreen
    };
    this._gameInputs.next(inputs);

    const gameConfig = this.getGameConfig(room.gameType);
    if (gameConfig) {
      const component = gameConfig.playerComponent 
        ? (isScreen ? gameConfig.hostComponent : gameConfig.playerComponent)
        : gameConfig.hostComponent;
      this._gameComponent.next(component);
    } else {
      this._gameComponent.next(null);
    }
  }

  private getGameConfig(gameType: string) {
    if (!gameType || gameType === 'None') return null;
    
    let config = GAME_REGISTRY[gameType];

    // Fallback for case mismatches
    if (!config) {
      const pascalCase = gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase();
      config = GAME_REGISTRY[pascalCase];
    }

    return config;
  }

  /**
   * Initialize the room lifecycle: start connection and handle auto-join logic.
   */
  async initializeRoom(roomCode: string, isCreating: boolean) {
    this.signalRService.startConnection();

    if (isCreating) {
      this.signalRService.clearState();
    }

    const guestName = this.authService.getGuestName() || (this.authService.currentUserValue?.displayName);

    if (!isCreating && guestName) {
      this.autoJoin(roomCode, guestName);
    }
  }

  private autoJoin(roomCode: string, name: string) {
    const currentRoom = this.signalRService.currentRoomSubject.value;
    if (currentRoom?.code !== roomCode) {
      this.signalRService.joinRoom(roomCode, name, false)
        .then(success => {
          if (!success) {
            this.toastService.showError(`Room ${roomCode} not found or no longer active.`);
            this.signalRService.removeActiveRoom(roomCode);
            this.router.navigate(['/games']);
          }
        })
        .catch(err => {
          this.logger.error(`[GameRoomStateService] Auto-join failed for ${roomCode}`, err);
          this.toastService.showError('Failed to join room automatically.');
          this.router.navigate(['/games']);
        });
    }
  }

  async submitEntry(roomCode: string, isCreating: boolean, entryData: { name: string, joinType: 'player' | 'table', isPublic: boolean }, selectedGameType: string) {
    this.authService.setGuestName(entryData.name);
    const isScreen = entryData.joinType === 'table';

    try {
      if (isCreating) {
        const newCode = await this.signalRService.createRoom(
          entryData.name,
          entryData.isPublic,
          selectedGameType,
          isScreen
        );
        this.logger.info(`Room created successfully: ${newCode}`);
        this.signalRService.updateIsHostStatus();
        this.router.navigate(['/game', newCode]);
        return true;
      } else {
        this.logger.info(`User submitting entry to join room: ${roomCode}`);
        await this.signalRService.joinRoom(roomCode, entryData.name, isScreen);
        return true;
      }
    } catch (err) {
      this.logger.error(`Failed to ${isCreating ? 'create' : 'join'} room`, err);
      this.toastService.showError(`Failed to ${isCreating ? 'create' : 'join'} room. Please try again.`);
      return false;
    }
  }

  // Facade methods for game actions
  async toggleReady(roomCode: string, forcedState?: boolean) {
    if (roomCode) {
      try {
        await this.signalRService.toggleReady(roomCode, forcedState);
      } catch (err) {
        this.logger.error('Failed to toggle ready', err);
        this.toastService.showError('Communication error. Please try again.');
      }
    }
  }

  setGameType(roomCode: string, gameType: string) {
    try {
      this.signalRService.setGameType(roomCode, gameType);
    } catch (err) {
      this.logger.error('Failed to set game type', err);
    }
  }

  startGame(settings: GameSettings) {
    try {
      this.signalRService.startGame(settings);
    } catch (err) {
      this.logger.error('Failed to start game', err);
      this.toastService.showError('Failed to start game.');
    }
  }

  async nextRound(settings: GameSettings) {
    try {
      await this.signalRService.updateSettings(settings);
      await this.signalRService.nextRound();
    } catch (err) {
      this.logger.error('Next round failed', err);
      this.toastService.showError('Failed to start next round');
    }
  }

  async endGame() {
    try {
      await this.signalRService.endGame();
    } catch (err) {
      this.logger.error('Failed to end game', err);
    }
  }

  async exitGame(roomCode: string) {
    if (roomCode) {
      try {
        await this.signalRService.setGameType(roomCode, 'None');
      } catch (err) {
        this.logger.error('Failed to exit game', err);
      }
    }
  }

  async requestUndo() {
    try {
      await this.signalRService.requestUndo();
    } catch (err) {
      this.logger.error('Failed to request undo', err);
    }
  }

  async leaveRoom(roomCode: string) {
    try {
      if (roomCode) {
        await this.signalRService.leaveRoom(roomCode);
      }
    } catch (err) {
      this.logger.error('Failed to leave room', err);
    } finally {
      this.router.navigate(['/games']);
    }
  }

  async changeRole(isScreen: boolean) {
    try {
      await this.signalRService.changeRole(isScreen);
    } catch (err) {
      this.logger.error('Failed to change role', err);
    }
  }

  async setHostPlayer(roomCode: string, targetId: string) {
    if (roomCode) {
      try {
        await this.signalRService.setHostPlayer(roomCode, targetId);
      } catch (err) {
        this.logger.error('Failed to set host player', err);
      }
    }
  }

  async removeHostPlayer(roomCode: string, targetId: string) {
    if (roomCode) {
      try {
        await this.signalRService.removeHostPlayer(roomCode, targetId);
      } catch (err) {
        this.logger.error('Failed to remove host player', err);
      }
    }
  }
}
