import { Component, OnInit, Type, ViewChild, ElementRef, inject, HostListener } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SignalRService, GameSettings, Room, Player } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { UserProfileDropdownComponent } from '../../shared/components/user-profile-dropdown/user-profile-dropdown.component';
import { MobileTabBarComponent, GameRoomTab } from './components/mobile-tab-bar/mobile-tab-bar.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { map, Observable, take } from 'rxjs';
import { UndoToastComponent } from './components/undo-toast/undo-toast.component';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { GAME_REGISTRY } from '../games/game.registry';

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
  gameStarted$: Observable<boolean>;
  session$: Observable<any>;
  isHost$: Observable<boolean>;
  currentRoom$: Observable<Room | null>;

  private readonly authService = inject(AuthService);

  // Creation options
  selectedGameType = 'None';
  isPublic = true;
  availableGames: GameDefinition[] = [];

  // Dynamic Loading
  gameComponent: Type<any> | null = null;
  public gameInputs: Record<string, any> = {};
  public activeGameComponent: any = null; // Reference to the active game instance

  // Mobile views: 'game' | 'players' | 'host'
  mobileView: GameRoomTab = 'game';

  // Desktop Big Screen Mode (Theatre Mode)
  isBigScreen = false;
  isSidebarCollapsed = false;

  // Video layout: 'sidebar' (default) | 'docked-top' | 'docked-bottom'
  public videoLayout: 'sidebar' | 'docked-top' | 'docked-bottom' = 'sidebar';

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
    private readonly signalRService: SignalRService,
    private readonly router: Router,
    // authService injected via property
    private readonly toastService: ToastService,
    private readonly gameDataService: GameDataService
  ) {
    this.session$ = this.authService.session$;
    this.players$ = this.signalRService.players$;
    this.connectionStatus$ = this.signalRService.connectionStatus$;
    this.currentRoom$ = this.signalRService.currentRoom$;

    // Subscribe to room updates to select component
    this.currentRoom$.subscribe(room => {
      if (room) {
        this.updateActiveGame(room);
      }
    });

    // Game started if state is Playing or Finished
    this.gameStarted$ = this.currentRoom$.pipe(map(r => r?.state === 'Playing' || r?.state === 'Finished'));

    this.isHost$ = this.currentRoom$.pipe(map(room => {
      if (!room) return false;
      const myId = this.signalRService.getConnectionId();
      return myId ? this.checkIsHost(room, myId) : false;
    }));
  }

  get isIntermission$(): Observable<boolean> {
    return this.currentRoom$.pipe(map(r => r?.state === 'Finished'));
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

    this.signalRService.startConnection();

    // Load available games for creation
    this.gameDataService.games$.subscribe(games => {
      if (games) {
        this.availableGames = games.filter(g => g.status === 'Deployed' || g.status === 'Testing');
      }
    });
    this.gameDataService.refreshGames();

    // Check query params for pre-selected game or name
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['gameType']) {
        this.selectedGameType = params['gameType'];
      }
      if (params['name']) {
        this.promptPlayerName = params['name'];
      }
    });

    const guestName = this.authService.getGuestName() || (this.authService.currentUserValue?.displayName);

    if (this.isCreating) {
      if (guestName) this.promptPlayerName = guestName;
      this.needsName = true; // Always show setup form when creating
    } else if (guestName) {
      this.autoJoin(guestName);
    } else {
      this.needsName = true;
    }
  }

  private autoJoin(name: string) {
    const currentRoom = this.signalRService.currentRoomSubject.value;
    if (!currentRoom || currentRoom.code !== this.roomCode) {
      this.signalRService.joinRoom(this.roomCode, name).then(success => {
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

    this.authService.setGuestName(this.promptPlayerName);
    this.needsName = false;

    if (this.isCreating) {
      try {
        const newCode = await this.signalRService.createRoom(
          this.promptPlayerName,
          this.isPublic,
          this.selectedGameType
        );
        this.router.navigate(['/game', newCode]);
      } catch (err) {
        console.error('Failed to create room', err);
        this.toastService.showError('Failed to create room.');
        this.needsName = true;
      }
    } else {
      await this.signalRService.joinRoom(this.roomCode, this.promptPlayerName);
    }
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
    if (confirm('Are you sure you want to end the game session?')) {
      await this.signalRService.endGame();
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

  private updateActiveGame(room: Room) { // Using 'any' for Room briefly to avoid import circle if specific type needed
    // Map GameType string to Component Class
    // We pass inputs: { room: room, myConnectionId: ... } typically
    // Each game component seems to take @Input() room.

    this.gameInputs = {
      room: room,
      myConnectionId: this.getMyConnectionId(room.players),
      // Some games take specific inputs like 'isHost', handle that?
      isHost: this.checkIsHost(room, this.getMyConnectionId(room.players))
    };

    // Select Component from Registry
    const gameConfig = GAME_REGISTRY[room.gameType];

    if (gameConfig) {
      const isHost = this.checkIsHost(room, this.getMyConnectionId(room.players));
      // Use playerComponent if it exists and we are not the host, otherwise use hostComponent
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

  private checkIsHost(room: Room, myId: string): boolean {
    const me = room.players.find(p => p.connectionId === myId);
    return me?.isHost || myId === room.hostPlayerId || myId === room.hostScreenId;
  }

  onSetHostPlayer(targetId: string) {
    if (this.roomCode) {
      this.signalRService.setHostPlayer(this.roomCode, targetId);
    }
  }
}
