import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
import { GameSettings, Player } from '../../services/signalr.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { GameRoomTab, MobileTabBarComponent } from './components/mobile-tab-bar/mobile-tab-bar.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { UndoToastComponent } from './components/undo-toast/undo-toast.component';
import { PlayerSettingsComponent } from './components/player-settings/player-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { LoggerService } from '../../core/services/logger.service';
import { RoomHeaderComponent } from './components/room-header/room-header.component';
import { RoomSidebarComponent } from './components/room-sidebar/room-sidebar.component';
import { RoomEntryComponent } from './components/room-entry/room-entry.component';
import { GameRoomStateService } from './services/game-room-state.service';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    VideoChatComponent,
    HostSettingsComponent,
    UndoToastComponent,
    FormsModule,
    PlayerSettingsComponent,
    RouterModule,
    MobileTabBarComponent,
    RoomHeaderComponent,
    RoomSidebarComponent,
    RoomEntryComponent
  ],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit, AfterViewInit {
  roomCode = '';
  isCreating = false;
  promptPlayerName = '';
  
  // Creation options
  availableGames: GameDefinition[] = [];
  public activeGameComponent: any = null; // Reference to the active game instance

  // Mobile views: 'game' | 'players' | 'host'
  mobileView: GameRoomTab = 'game';

  // Desktop Big Screen Mode (Theatre Mode)
  isBigScreen = false;
  isSidebarCollapsed = false;

  // Video layout: 'sidebar' (default) | 'docked-top' | 'docked-bottom'
  public videoLayout: 'sidebar' | 'docked-top' | 'docked-bottom' = 'sidebar';
  public isVideoActive = false;
  public isNavMenuOpen = false;

  get selectedGame(): GameDefinition | undefined {
    const type = this.stateService.selectedGameType.toLowerCase();
    return this.availableGames.find(g => g.id.toLowerCase() === type || g.name.toLowerCase() === type);
  }

  /**
   * Returns a clean, human-readable name for the current room state.
   */
  getCurrentGameDisplayName(gameType: string | undefined): string {
    if (!gameType || gameType === 'None') return 'Lobby';

    // Find in available games to get the formatted name
    const game = this.availableGames.find(g => g.id.toLowerCase() === gameType.toLowerCase());
    return game ? game.name : gameType;
  }

  onVideoLayoutChange(mode: any) {
    this.videoLayout = mode;
  }



  @HostListener('window:keydown.shift.f', ['$event'])
  toggleBigScreen(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    // Ignore if user is typing in an input text field
    if (keyboardEvent && /INPUT|TEXTAREA|SELECT|DIALOG/i.test((keyboardEvent.target as HTMLElement).tagName)) {
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

  setMobileView(tab: GameRoomTab) {
    this.mobileView = tab;
  }

  toggleNavMenu() {
    this.isNavMenuOpen = !this.isNavMenuOpen;
  }

  enableTransitions = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly gameDataService: GameDataService,
    private readonly logger: LoggerService,
    private readonly confirmService: ConfirmService,
    public readonly stateService: GameRoomStateService
  ) { }

  videoChatReady = false;

  ngAfterViewInit() {
    // Prevent NG0100 by delaying ViewChild dependent logic
    setTimeout(() => {
      this.videoChatReady = true;
    }, 0);

    // Enable transitions after initial layout to prevent sliding
    setTimeout(() => {
      this.enableTransitions = true;
    }, 300);
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

  async toggleReady(forcedState?: boolean) {
    if (forcedState) {
      this.logger.info(`[GameRoom] User triggered ready OVERRIDE (forcedState: ${forcedState})`);
    }
    await this.stateService.toggleReady(this.roomCode, forcedState);
  }

  setGameType(gameType: string) {
    this.stateService.setGameType(this.roomCode, gameType);
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.roomCode = (params.get('code') || '').toUpperCase();
      this.isCreating = this.roomCode === 'CREATE';

      if (this.isCreating) {
        this.logger.info('User initiated room creation');
        this.stateService.needsName = true;
      } else {
        this.logger.info(`User navigated to room: ${this.roomCode}`);
      }
      
      this.stateService.initializeRoom(this.roomCode, this.isCreating);
    });

    // Check query params for pre-selected game or name
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['gameType']) {
        this.stateService.selectedGameType = params['gameType'];
      }
      if (params['name']) {
        this.promptPlayerName = params['name'];
      }
    });

    // Load available games for creation
    this.gameDataService.games$.subscribe(games => {
      if (games) {
        this.availableGames = games.filter(g => g.status !== 'Backlog');

        // If we have a selectedGameType from query params, ensure it's valid
        if (this.stateService.selectedGameType !== 'None' && !this.availableGames.some(g => g.id === this.stateService.selectedGameType)) {
          // Check if input was a name instead of ID
          const found = this.availableGames.find(g => g.name.toLowerCase() === this.stateService.selectedGameType.toLowerCase());
          if (found) {
            this.stateService.selectedGameType = found.id;
          }
        }
      }
    });
    this.gameDataService.refreshGames();

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.stateService.isScreen = !isMobile;
    this.stateService.needsName = true;
  }

  async submitEntry(entryData: { name: string, joinType: 'player' | 'table', isPublic: boolean }) {
    this.stateService.needsName = false;

    // Briefly disable transitions when switching from entry to lobby
    this.enableTransitions = false;
    setTimeout(() => this.enableTransitions = true, 500);

    await this.stateService.submitEntry(this.roomCode, this.isCreating, entryData, this.stateService.selectedGameType);
  }

  async changeRole(isScreen: boolean) {
    await this.stateService.changeRole(isScreen);
  }

  onGameSelected(gameType: string) {
    this.stateService.setGameType(this.roomCode, gameType);
  }

  startGame(settings: GameSettings) {
    this.stateService.startGame(settings);
  }

  async onNextRound(settings: GameSettings) {
    await this.stateService.nextRound(settings);
  }

  async onEndGame(event?: MouseEvent) {
    const confirmed = await this.confirmService.confirm({
      title: 'Finish Game?',
      message: 'Are you sure you want to finish the game and see results?',
      confirmLabel: 'SEE RESULTS',
      cancelLabel: 'KEEP PLAYING'
    }, event);

    if (confirmed) {
      await this.stateService.endGame();
    }
  }

  async onExitGame(event?: MouseEvent) {
    const confirmed = await this.confirmService.confirm({
      title: 'End Session?',
      message: 'Are you sure you want to end the session and return to the lobby?',
      confirmLabel: 'END SESSION',
      cancelLabel: 'CANCEL',
      confirmButtonClass: 'btn-danger'
    }, event);

    if (confirmed) {
      await this.stateService.exitGame(this.roomCode);
    }
  }


  @ViewChild('videoChat') videoChat?: VideoChatComponent;

  async requestUndo() {
    const confirmed = await this.confirmService.confirm({
      title: 'Request Undo?',
      message: 'This will pause the game and ask all players to vote on the undo. Are you sure you want to proceed?',
      confirmLabel: 'REQUEST UNDO',
      cancelLabel: 'CANCEL'
    });

    if (confirmed) {
      await this.stateService.requestUndo();
    }
  }

  async leaveRoom() {
    await this.stateService.leaveRoom(this.roomCode);
  }


  onGameComponentActivate(component: any) {
    this.activeGameComponent = component;
  }


  onSetHostPlayer(targetId: string) {
    this.stateService.setHostPlayer(this.roomCode, targetId);
  }

  onRemoveHostPlayer(targetId: string) {
    this.stateService.removeHostPlayer(this.roomCode, targetId);
  }
}
