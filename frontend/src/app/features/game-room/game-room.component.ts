import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild, AfterViewInit, inject, DestroyRef, ChangeDetectionStrategy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { distinctUntilChanged, firstValueFrom, map, take } from 'rxjs';
import { GameDataService, GameDefinition, TimerType } from '../../services/game-data.service';
import { GameSettings, Player, Room } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
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
import { DeviceService } from '../../services/device.service';
import { SoundService } from '../../core/services/sound.service';
import { RoundClock, roundClock } from '../../shared/round-timing';
import { GameChromeService } from './services/game-chrome.service';
import { GameBarComponent } from './components/game-bar/game-bar.component';
import { GameMenuComponent } from './components/game-menu/game-menu.component';
import { RulesDrawerComponent } from '../games/shared/components/rules-drawer/rules-drawer.component';

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
    RoomEntryComponent,
    GameBarComponent,
    GameMenuComponent,
    RulesDrawerComponent
  ],
  providers: [GameChromeService],
  templateUrl: './game-room.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit, AfterViewInit {
  readonly deviceService = inject(DeviceService);
  private readonly authService = inject(AuthService);
  roomCode = '';
  isCreating = false;
  promptPlayerName = '';
  
  // Creation options
  availableGames: GameDefinition[] = [];

  /** What the active game publishes to the game bar, menu and rules (one instance per room). */
  readonly chrome = inject(GameChromeService);
  readonly soundService = inject(SoundService);
  readonly clock = signal<RoundClock | null>(null);
  private room: Room | null = null;
  private isHost = false;
  /** The round the host already ended on timeout, so the end call goes out once. */
  private autoEndedRound: number | null = null;

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
    void this.stateService.setGameType(this.roomCode, gameType);
  }

  async goToLogin() {
    await this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    document.body.classList.add('overflow-hidden');
    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('overflow-hidden');
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.roomCode = (params.get('code') || '').toUpperCase();
      this.isCreating = this.roomCode === 'CREATE';

      if (this.isCreating) {
        this.logger.info('User initiated room creation');
        this.stateService.needsName = true;
      } else {
        this.logger.info(`User navigated to room: ${this.roomCode}`);
      }
      
      void this.stateService.initializeRoom(this.roomCode, this.isCreating);
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
    this.gameDataService.games$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(games => {
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

    this.stateService.currentRoom$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(room => {
      this.room = room;
      this.tick();
    });
    this.stateService.currentRoom$.pipe(
      map(room => room?.gameType),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.chrome.reset());
    this.stateService.isHost$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isHost => this.isHost = isHost);
    // A Table is the shared screen: give the game the full width once play starts.
    this.stateService.gameStarted$.pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(started => {
      if (started && this.stateService.isScreen) this.isSidebarCollapsed = true;
      if (!started) this.mobileView = 'game';
    });
    const clockTimer = setInterval(() => this.tick(), 500);
    this.destroyRef.onDestroy(() => clearInterval(clockTimer));

    const isMobile = this.deviceService.isMobileValue;
    const savedRole = typeof localStorage !== 'undefined' ? localStorage.getItem('bgh_preferred_role') : null;
    this.stateService.isScreen = savedRole ? savedRole === 'table' : !isMobile;

    const guestName = this.authService.getGuestName() || this.authService.currentUserValue?.displayName;
    this.stateService.needsName = this.isCreating || !guestName;
    if (!this.promptPlayerName && guestName) {
      this.promptPlayerName = guestName;
    }
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
    void this.stateService.setGameType(this.roomCode, gameType);
  }

  startGame(settings: GameSettings) {
    void this.stateService.startGame(settings);
  }

  async onNextRound(settings: GameSettings) {
    await this.stateService.nextRound(settings);
  }

  async onEndGame(event?: MouseEvent) {
    const playing = (await firstValueFrom(this.stateService.currentRoom$))?.state === 'Playing';
    const confirmed = await this.confirmService.confirm(playing ? {
      title: 'End the game now?',
      message: 'The game stops here and everyone sees the final scores.',
      confirmLabel: 'END GAME',
      cancelLabel: 'KEEP PLAYING',
      confirmButtonClass: 'btn-danger'
    } : {
      title: 'Finish Game?',
      message: 'Final results are in. Finish the game and return everyone to game selection?',
      confirmLabel: 'FINISH GAME',
      cancelLabel: 'KEEP PLAYING'
    }, event);

    if (confirmed) {
      await this.stateService.endGame();
    }
  }

  async onExitGame(event?: MouseEvent) {
    const confirmed = await this.confirmService.confirm({
      title: 'End the game?',
      message: 'Everyone goes back to the lobby to pick the next game.',
      confirmLabel: 'END GAME',
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

  /** Timed games (timer required or optional) get pause, end round and auto-end. */
  get isTimedGame(): boolean {
    const type = this.room?.gameType?.toLowerCase();
    const game = this.availableGames.find(g => g.id.toLowerCase() === type);
    return !!game && game.timerType !== TimerType.NotApplicable;
  }

  pauseRound() {
    void this.stateService.pauseRound();
  }

  resumeRound() {
    void this.stateService.resumeRound();
  }

  async endRoundEarly(event?: MouseEvent) {
    const confirmed = await this.confirmService.confirm({
      title: 'End this round now?',
      message: 'Play stops and everyone sees this round\'s results.',
      confirmLabel: 'END ROUND',
      cancelLabel: 'KEEP PLAYING',
      confirmButtonClass: 'btn-danger'
    }, event);
    if (confirmed) await this.stateService.endRound();
  }

  /** Between rounds the host's next step sits on the game bar, not two taps deep in the menu. */
  hostNextLabel(room: Room | null): string {
    if (room?.resultPhase === 'GameOver') return 'Play again';
    return this.isLegacyFinish(room) ? 'Finish game' : 'Next round';
  }

  hostNext(room: Room | null, event?: MouseEvent) {
    if (!room) return;
    if (room.resultPhase === 'GameOver') void this.stateService.playAgain(room.settings);
    else if (this.isLegacyFinish(room)) void this.onEndGame(event);
    else void this.onNextRound(room.settings);
  }

  /** Games that predate result phases finish after their last round. */
  private isLegacyFinish(room: Room | null): boolean {
    return room?.resultPhase == null && (room?.roundNumber ?? 0) >= (room?.totalRounds ?? room?.settings?.totalRounds ?? 5);
  }

  /** One clock tick: refresh the shared clock, and on the host end a timed-out round once. */
  tick(now = Date.now()) {
    const clock = roundClock(this.room, now);
    this.clock.set(clock);
    const room = this.room;
    if (clock.state === 'ended' && this.isHost && room && this.isTimedGame && this.autoEndedRound !== room.roundNumber) {
      this.autoEndedRound = room.roundNumber;
      void this.stateService.endRound();
    }
  }

  /** Players live in the sidebar: a view of its own on phones, an expanded column on desktop. */
  openPlayers() {
    if (globalThis.innerWidth < 768) this.mobileView = 'players';
    else this.isSidebarCollapsed = false;
  }

  async leaveRoom() {
    await this.stateService.leaveRoom(this.roomCode);
  }



  onSetHostPlayer(targetId: string) {
    void this.stateService.setHostPlayer(this.roomCode, targetId);
  }

  onRemoveHostPlayer(targetId: string) {
    void this.stateService.removeHostPlayer(this.roomCode, targetId);
  }
}
