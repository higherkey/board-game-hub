import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, Type, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map, Observable, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { GameSettings, Player, Room, SignalRService } from '../../services/signalr.service';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { UserProfileDropdownComponent } from '../../shared/components/user-profile-dropdown/user-profile-dropdown.component';
import { ToastService } from '../../shared/services/toast.service';
import { GAME_REGISTRY } from '../games/game.registry';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { GameRoomTab, MobileTabBarComponent } from './components/mobile-tab-bar/mobile-tab-bar.component';
import { UndoToastComponent } from './components/undo-toast/undo-toast.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    HostSettingsComponent,
    VideoChatComponent,
    GameReviewComponent,
    SocialPanelComponent,
    UndoToastComponent,
    FormsModule,
    UserProfileDropdownComponent,
    RouterModule,
    MobileTabBarComponent
  ],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit {
  roomCode = '';
  isCreating = false;
  needsName = false;
  promptPlayerName = '';
  players$: Observable<Player[]>;
  connectionStatus$: Observable<string>;
  connectionId$: Observable<string | null>;
  gameStarted$: Observable<boolean>;
  session$: Observable<any>;
  isHost$: Observable<boolean>;
  currentRoom$: Observable<Room | null>;
  me$: Observable<Player | null>;

  private readonly authService = inject(AuthService);

  // Creation options
  selectedGameType = 'None';
  isPublic = true;
  availableGames: GameDefinition[] = [];
  gameComponent: Type<any> | null = null;
  public gameInputs: Record<string, any> = {};
  public activeGameComponent: any = null; // Reference to the active game instance

  // Mobile views: 'game' | 'players' | 'host'
  mobileView: GameRoomTab = 'game';

  // Session flags
  isScreen = false;
  joinType: 'player' | 'table' | null = null;

  // Desktop Big Screen Mode (Theatre Mode)
  isBigScreen = false;
  isSidebarCollapsed = false;

  // Video layout: 'sidebar' (default) | 'docked-top' | 'docked-bottom'
  public videoLayout: 'sidebar' | 'docked-top' | 'docked-bottom' = 'sidebar';

  get selectedGame(): GameDefinition | undefined {
    const type = this.selectedGameType.toLowerCase();
    return this.availableGames.find(g => g.id.toLowerCase() === type || g.name.toLowerCase() === type);
  }

  setMobileView(view: GameRoomTab) {
    this.mobileView = view;
  }

  onVideoLayoutChange(mode: any) {
    this.videoLayout = mode;
  }

  @HostListener('window:keydown.shift.f', ['$event'])
  toggleBigScreen(event?: KeyboardEvent) {
    // Ignore if user is typing in an input text field
    if (event && /INPUT|TEXTAREA|SELECT|DIALOG/i.test((event.target as HTMLElement).tagName)) {
      return;
    }

    // Only allow if not in lobby? Or allow anytime. Roadmap said "Activates on Game Start", but toggle is fine.
    // Also check if not on mobile?
    if (window.innerWidth < 768) return;

    this.isBigScreen = !this.isBigScreen;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  constructor(
    private readonly route: ActivatedRoute,
    public readonly signalRService: SignalRService,
    private readonly router: Router,
    // authService injected via property
    private readonly toastService: ToastService,
    private readonly gameDataService: GameDataService
  ) {
    this.session$ = this.authService.session$;
    this.players$ = this.signalRService.players$;
    this.connectionStatus$ = this.signalRService.connectionStatus$;
    this.currentRoom$ = this.signalRService.currentRoom$;
    this.me$ = this.signalRService.me$;
    this.connectionId$ = this.signalRService.connectionId$;

    // Subscribe to room updates to select component
    this.currentRoom$.subscribe(room => {
      if (room) {
        // Sync local isScreen state with the server-side player state
        const me = room.players.find(p => p.connectionId === this.signalRService.getConnectionId());
        if (me) {
          this.isScreen = me.isScreen;
        }
        this.updateActiveGame(room);

        // If host joins a fresh lobby with a pre-selected game type from query params, apply it
        if (room.gameType === 'None' && this.selectedGameType !== 'None') {
          const isHost = this.signalRService.checkIsHost(room, this.signalRService.getConnectionId() || '');
          if (isHost) {
            this.signalRService.setGameType(room.code, this.selectedGameType);
            this.selectedGameType = 'None'; // Clear once applied
          }
        }
      }
    });

    // Game started if state is Playing or Finished
    this.gameStarted$ = this.currentRoom$.pipe(map(r => r?.state === 'Playing' || r?.state === 'Finished'));

    this.isHost$ = this.signalRService.isHost$;
  }

  get isIntermission$(): Observable<boolean> {
    return this.currentRoom$.pipe(map(r => r?.state === 'Finished'));
  }

  getPlayers(players: Player[] | null): Player[] {
    return (players || []).filter(p => !p.isScreen);
  }

  getTables(players: Player[] | null): Player[] {
    return (players || []).filter(p => p.isScreen);
  }

  getQrCodeUrl(): string {
    if (!this.roomCode) return '';
    const url = globalThis.location.origin + '/game/' + this.roomCode;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
  }

  async toggleReady() {
    console.log('toggleReady called', this.roomCode);
    if (this.roomCode) {
      await this.signalRService.toggleReady(this.roomCode);
    }
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.roomCode = params.get('code') || '';
      this.isCreating = this.roomCode === 'create';

      if (this.isCreating) {
        this.signalRService.clearState();
        this.needsName = true;
      }
    });

    // Check query params for pre-selected game or name
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['gameType']) {
        this.selectedGameType = params['gameType'];
      }
      if (params['name']) {
        this.promptPlayerName = params['name'];
      }
    });

    this.signalRService.startConnection();

    // Load available games for creation
    this.gameDataService.games$.subscribe(games => {
      if (games) {
        this.availableGames = games.filter(g => g.status === 'Deployed' || g.status === 'Testing');

        // If we have a selectedGameType from query params, ensure it's valid
        if (this.selectedGameType !== 'None' && !this.availableGames.some(g => g.id === this.selectedGameType)) {
          // Check if input was a name instead of ID
          const found = this.availableGames.find(g => g.name.toLowerCase() === this.selectedGameType.toLowerCase());
          if (found) {
            this.selectedGameType = found.id;
          }
        }

        if (this.selectedGame) {
          // No-op, label is handled in HostSettingsComponent
        }
      }
    });
    this.gameDataService.refreshGames();

    // Restore role from localStorage if available
    const savedRole = localStorage.getItem('bgh_preferred_role');
    if (savedRole) {
      this.joinType = savedRole as 'player' | 'table';
      this.isScreen = this.joinType === 'table';
    } else {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.isScreen = !isMobile;
    }

    const guestName = this.authService.getGuestName() || (this.authService.currentUserValue?.displayName);

    if (this.isCreating) {
      if (guestName) this.promptPlayerName = guestName;
      this.needsName = true; // Always show setup form when creating
    } else if (guestName) {
      this.autoJoin(guestName, this.isScreen);
    } else {
      this.needsName = true;
    }
  }

  private autoJoin(name: string, isScreen: boolean = false) {
    const currentRoom = this.signalRService.currentRoomSubject.value;
    if (!currentRoom || currentRoom.code !== this.roomCode) {
      this.signalRService.joinRoom(this.roomCode, name, isScreen).then(success => {
        if (!success) {
          this.toastService.showError(`Room ${this.roomCode} not found or no longer active.`);
          this.signalRService.removeActiveRoom(this.roomCode);
          this.router.navigate(['/games']);
        }
      });
    }
  }

  async submitEntry() {
    if (!this.promptPlayerName) return;
    if (!this.joinType) {
      this.toastService.showError('Please select whether you are joining as a Player or a Table.');
      return;
    }

    this.authService.setGuestName(this.promptPlayerName);
    this.needsName = false;

    if (this.isCreating) {
      try {
        const newCode = await this.signalRService.createRoom(
          this.promptPlayerName,
          this.isPublic,
          this.selectedGameType,
          this.joinType === 'table'
        );
        this.router.navigate(['/game', newCode]);
      } catch (err) {
        console.error('Failed to create room', err);
        this.toastService.showError('Failed to create room.');
        this.needsName = true;
      }
    } else {
      await this.signalRService.joinRoom(this.roomCode, this.promptPlayerName, this.isScreen);
    }
  }

  async changeRole(isScreen: boolean) {
    this.isScreen = isScreen;
    this.joinType = isScreen ? 'table' : 'player';
    localStorage.setItem('bgh_preferred_role', this.joinType);
    await this.signalRService.changeRole(isScreen);
  }



  startGame(settings: GameSettings) {
    this.signalRService.startGame(settings);
  }

  async onNextRound(settings: GameSettings) {
    try {
      await this.signalRService.updateSettings(settings);
      await this.signalRService.nextRound();
    } catch (err) {
      this.toastService.showError('Failed to start next round');
      console.error(err);
    }
  }

  async onEndGame() {
    // This is for "Finish Game" (Results), usually called when max rounds reached
    if (confirm('Are you sure you want to finish the game and see results?')) {
      await this.signalRService.endGame();
    }
  }

  async onExitGame() {
    // This is for "End Session" (Return to Lobby)
    if (confirm('Are you sure you want to end the session and return to the lobby?')) {
      if (this.roomCode) {
        await this.signalRService.setGameType(this.roomCode, 'None');
      }
    }
  }

  onBabbleWordsUpdated(words: string[]) {
    this.signalRService.submitAnswers(words);
  }

  onClueSubmitted(clue: string) {
    this.signalRService.submitClue(clue);
  }

  onGuessSubmitted(event: { guess: string, isPass: boolean } | string) {
    if (typeof event === 'string') {
      this.signalRService.submitGuess(event);
    } else {
      this.signalRService.submitGuess(event.guess, event.isPass);
    }
  }

  onPoppycockDefSubmitted(def: string) {
    this.signalRService.submitPoppycockDefinition(def);
  }

  onPoppycockVoteSubmitted(vote: string) {
    this.signalRService.submitPoppycockVote(vote);
  }

  getMyConnectionId(players: Player[] | null | undefined): string {
    // If we have direct access to connectionId via service, use it, otherwise fallback
    const directId = this.signalRService.getConnectionId();
    if (directId) return directId;

    const list = players || [];
    const myName = this.authService.getGuestName() || this.authService.currentUserValue?.displayName;
    const me = list.find((p) => p.name === myName);
    return me?.connectionId || '';
  }

  @ViewChild('undoDialog') undoDialog!: ElementRef<HTMLDialogElement>;

  requestUndo() {
    this.undoDialog.nativeElement.showModal();
  }

  confirmUndo() {
    this.signalRService.requestUndo();
    this.undoDialog.nativeElement.close();
  }

  cancelUndo() {
    this.undoDialog.nativeElement.close();
  }

  async leaveRoom() {
    if (this.roomCode) {
      await this.signalRService.leaveRoom(this.roomCode);
    }
    this.router.navigate(['/games']);
  }

  private updateActiveGame(room: Room) {
    this.gameInputs = {
      room: room,
      myConnectionId: this.getMyConnectionId(room.players),
      isHost: this.signalRService.checkIsHost(room, this.signalRService.getConnectionId() || '')
    };

    let gameConfig = GAME_REGISTRY[room.gameType];

    // Fallback for case mismatches (e.g., "BABBLE" vs "Babble")
    if (!gameConfig && room.gameType) {
      const pascalCase = room.gameType.charAt(0).toUpperCase() + room.gameType.slice(1).toLowerCase();
      gameConfig = GAME_REGISTRY[pascalCase];
    }

    if (gameConfig) {
      const isHost = this.signalRService.checkIsHost(room, this.signalRService.getConnectionId() || '');
      if (!isHost && gameConfig.playerComponent) {
        this.gameComponent = gameConfig.playerComponent;
      } else {
        this.gameComponent = gameConfig.hostComponent;
      }
    } else {
      console.warn(`Game type ${room.gameType} not found in registry.`);
      this.gameComponent = null;
    }
  }

  onGameComponentActivate(component: any) {
    this.activeGameComponent = component;
  }


  onSetHostPlayer(targetId: string) {
    if (this.roomCode) {
      this.signalRService.setHostPlayer(this.roomCode, targetId);
    }
  }
}
