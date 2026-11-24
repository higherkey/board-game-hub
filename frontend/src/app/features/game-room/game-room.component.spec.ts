import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject } from '@angular/core';
import { GameChromeService } from './services/game-chrome.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GameDataService } from '../../services/game-data.service';
import { SignalRService } from '../../services/signalr.service';
import { GameRoomStateService } from './services/game-room-state.service';
import { GameRoomComponent } from './game-room.component';

import { ConfirmService } from '../../shared/services/confirm.service';

// Stub Components

@Component({ selector: 'app-host-settings', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class HostSettingsStubComponent {
  @Input() roomCode: any;
  @Input() currentGameType: any;
  @Input() compactMode: any;
  @Input() resultPhase: any;
  @Input() isIntermission: any;
  @Input() players: any;
  @Input() currentRound: any;
  @Input() totalRounds: any;
  @Input() meReady: any;
  @Input() isHost: any;
  @Input() isScreen: any;
  @Input() isHostOverride: any;
  @Output() gameStart = new EventEmitter<any>();
  @Output() playAgain = new EventEmitter<any>();
  @Output() nextRound = new EventEmitter<any>();
  @Output() endGame = new EventEmitter<any>();
  @Output() exitGame = new EventEmitter<any>();
  @Output() toggleReady = new EventEmitter<any>();
}

@Component({ selector: 'app-video-chat', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class VideoChatStubComponent {
  isVideoActive = false;
  joinVideo() { /* stub for testing */ }
}

@Component({ selector: 'app-word-hunt', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class BabbleStubComponent {
  @Input() grid: any;
  @Input() isPlaying: any;
  @Output() wordsUpdated = new EventEmitter<any>();
}

@Component({ selector: 'app-game-review', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class GameReviewStubComponent {
  @Input() room: any;
  @Input() isHost: any;
}

@Component({ selector: 'app-social-panel', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class SocialPanelStubComponent { }

@Component({ selector: 'app-one-and-only-board', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class OneAndOnlyBoardStubComponent {
  @Input() room: any;
}

@Component({ selector: 'app-one-and-only-player', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class OneAndOnlyPlayerStubComponent {
  @Input() room: any;
  @Input() myConnectionId: any;
  @Output() clueSubmitted = new EventEmitter<any>();
  @Output() guessSubmitted = new EventEmitter<any>();
}

@Component({ selector: 'app-user-profile-dropdown', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class UserProfileDropdownStubComponent {
  @Input() session: any;
  @Input() compactMode: boolean = false;
}

@Component({ selector: 'app-room-header', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class RoomHeaderStubComponent {
  @Input() isBigScreen: any;
  @Input() roomCode: any;
  @Input() isLobby: any;
  @Input() gameDisplayName: any;
  @Input() videoChatReady: any;
  @Input() isVideoActive: any;
  @Input() gameStarted: any;
  @Input() currentRound: any;
  @Input() totalRounds: any;
  @Input() session: any;
  @Input() showUndoButton: any;
  @Output() leaveRoom = new EventEmitter<any>();
  @Output() startVideoChat = new EventEmitter<any>();
  @Output() requestUndo = new EventEmitter<any>();
}

@Component({ selector: 'app-room-sidebar', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class RoomSidebarStubComponent {
  @Input() currentRoom: any;
  @Input() players: any;
  @Input() tables: any;
  @Input() connectionId: any;
  @Output() toggleSidebar = new EventEmitter<any>();
  @Output() changeRole = new EventEmitter<any>();
  @Output() setHostPlayer = new EventEmitter<any>();
  @Output() removeHostPlayer = new EventEmitter<any>();
}

@Component({ selector: 'app-room-entry', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class RoomEntryStubComponent {
  @Input() isCreating: any;
  @Input() isGuest: any;
  @Input() initialName: any;
  @Output() submitEntry = new EventEmitter<any>();
  @Output() login = new EventEmitter<void>();
}

// Import real components to override

import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { BabbleComponent } from '../games/babble/babble-game/babble.component';
import { OneAndOnlyBoardComponent } from '../games/one-and-only/one-and-only-board/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from '../games/one-and-only/one-and-only-player/one-and-only-player.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { UserProfileDropdownComponent } from '../../shared/components/user-profile-dropdown/user-profile-dropdown.component';
import { LoggerService } from '../../core/services/logger.service';
import { LobbyComponent } from '../room/lobby/lobby.component';
import { RoomHeaderComponent } from './components/room-header/room-header.component';
import { RoomSidebarComponent } from './components/room-sidebar/room-sidebar.component';
import { RoomEntryComponent } from './components/room-entry/room-entry.component';

@Component({ selector: 'app-lobby', template: '', standalone: true, changeDetection: ChangeDetectionStrategy.Eager,
 imports: [] })
class LobbyStubComponent {
  @Input() room: any;
  @Input() players: any;
  @Input() isHost: any;
  @Input() isScreen: any;
  @Input() availableGames: any;
  @Input() selectedGameType: any;
  @Input() connectionId: any;
  @Output() gameSelected = new EventEmitter<any>();
  @Output() toggleReady = new EventEmitter<any>();
  @Output() startGame = new EventEmitter<any>();
  @Output() setHost = new EventEmitter<any>();
  @Output() changeRole = new EventEmitter<any>();
}

describe('GameRoomComponent', () => {
  let component: GameRoomComponent;
  let fixture: ComponentFixture<GameRoomComponent>;
  let mockStateService: any;
  let mockActivatedRoute: any;

  const playersSubject = new BehaviorSubject<any[]>([]);
  const roomSubject = new BehaviorSubject<any>(null);
  const connectionSubject = new BehaviorSubject<string>('Connected');

  beforeEach(async () => {
    mockStateService = {
      players$: playersSubject.asObservable(),
      currentRoom$: roomSubject.asObservable(),
      connectionStatus$: connectionSubject.asObservable(),
      me$: new BehaviorSubject(null),
      connectionId$: new BehaviorSubject('conn1'),
      isHost$: new BehaviorSubject(false),
      gameStarted$: new BehaviorSubject(false),
      isIntermission$: new BehaviorSubject(false),
      gameComponent$: new BehaviorSubject(null),
      gameInputs$: new BehaviorSubject({}),
      needsName: false,
      selectedGameType: 'None',
      initializeRoom: jasmine.createSpy('initializeRoom'),
      submitEntry: jasmine.createSpy('submitEntry').and.returnValue(Promise.resolve(true)),
      toggleReady: jasmine.createSpy('toggleReady'),
      setGameType: jasmine.createSpy('setGameType'),
      startGame: jasmine.createSpy('startGame'),
      nextRound: jasmine.createSpy('nextRound'),
      endGame: jasmine.createSpy('endGame'),
      exitGame: jasmine.createSpy('exitGame'),
      requestUndo: jasmine.createSpy('requestUndo'),
      leaveRoom: jasmine.createSpy('leaveRoom'),
      changeRole: jasmine.createSpy('changeRole'),
      setHostPlayer: jasmine.createSpy('setHostPlayer'),
      removeHostPlayer: jasmine.createSpy('removeHostPlayer')
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ code: 'ABCD' }),
        queryParamMap: convertToParamMap({ name: 'TestUser' })
      },
      paramMap: of(convertToParamMap({ code: 'ABCD' })),
      queryParams: of({ name: 'TestUser' })
    };

    const mockAuthService = {
      currentUser$: new BehaviorSubject(null),
      session$: new BehaviorSubject(null),
      getGuestId: jasmine.createSpy('getGuestId').and.returnValue('guest-uuid'),
      getUserIdOrGuestId: jasmine.createSpy('getUserIdOrGuestId').and.returnValue('guest-uuid'),
      getGuestName: jasmine.createSpy('getGuestName').and.returnValue('Guest')
    };

    await TestBed.configureTestingModule({
      imports: [GameRoomComponent],
      providers: [
        provideRouter([]),
        { provide: GameRoomStateService, useValue: mockStateService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: GameDataService, useValue: {
            games$: new BehaviorSubject([]),
            refreshGames: jasmine.createSpy('refreshGames')
          }
        },
        {
          provide: LoggerService, useValue: {
            debug: jasmine.createSpy('debug'),
            info: jasmine.createSpy('info'),
            warn: jasmine.createSpy('warn'),
            error: jasmine.createSpy('error')
          }
        }
      ]
    })
      .overrideComponent(GameRoomComponent, {
        remove: {
          imports: [

            HostSettingsComponent,
            VideoChatComponent,
            BabbleComponent,
            GameReviewComponent,
            SocialPanelComponent,
            OneAndOnlyBoardComponent,
            OneAndOnlyPlayerComponent,
            LobbyComponent,
            UserProfileDropdownComponent,
            RoomHeaderComponent,
            RoomSidebarComponent,
            RoomEntryComponent
          ]
        },
        add: {
          imports: [

            HostSettingsStubComponent,
            VideoChatStubComponent,
            BabbleStubComponent,
            GameReviewStubComponent,
            SocialPanelStubComponent,
            OneAndOnlyBoardStubComponent,
            OneAndOnlyPlayerStubComponent,
            LobbyStubComponent,
            UserProfileDropdownStubComponent,
            RoomHeaderStubComponent,
            RoomSidebarStubComponent,
            RoomEntryStubComponent
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(GameRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize and join room', () => {
    // initializeRoom is called inside paramMap subscription
    expect(mockStateService.initializeRoom).toHaveBeenCalled();
  });

  it('should identify host correctly', (done) => {
    // Manually trigger the mock service's isHost$
    (mockStateService.isHost$ as BehaviorSubject<boolean>).next(true);

    component.stateService.isHost$.subscribe((isHost: boolean) => {
      expect(isHost).toBeTrue();
      done();
    });
  });

  it('startGame should call service', () => {
    const settings: any = { timerDurationSeconds: 60 };
    component.startGame(settings);
    expect(mockStateService.startGame).toHaveBeenCalledWith(settings);
  });

  it('should call exitGame on stateService when confirmed', async () => {
    spyOn(TestBed.inject(ConfirmService), 'confirm').and.resolveTo(true);
    component.roomCode = 'TEST';
    await component.onExitGame();
    expect(mockStateService.exitGame).toHaveBeenCalledWith('TEST');
  });

  it('END GAME mid-round warns that the game stops, then ends it', async () => {
    const confirm = spyOn(TestBed.inject(ConfirmService), 'confirm').and.resolveTo(true);
    roomSubject.next({ state: 'Playing' });
    await component.onEndGame();
    expect(confirm.calls.mostRecent().args[0].title).toBe('End the game now?');
    expect(mockStateService.endGame).toHaveBeenCalled();
  });

  it('END GAME between rounds offers to finish, and does nothing when cancelled', async () => {
    const confirm = spyOn(TestBed.inject(ConfirmService), 'confirm').and.resolveTo(false);
    roomSubject.next({ state: 'Intermission' });
    mockStateService.endGame.calls.reset();
    await component.onEndGame();
    expect(confirm.calls.mostRecent().args[0].title).toBe('Finish Game?');
    expect(mockStateService.endGame).not.toHaveBeenCalled();
  });

  it('should show entry-stage when needsName is true', () => {
    mockStateService.needsName = true;
    fixture.detectChanges();
    const entryStage = fixture.nativeElement.querySelector('app-room-entry');
    expect(entryStage).toBeTruthy();
  });

  it('setGameType and onGameSelected should call stateService.setGameType', () => {
    component.roomCode = 'TEST';
    component.setGameType('babble');
    expect(mockStateService.setGameType).toHaveBeenCalledWith('TEST', 'babble');

    component.onGameSelected('cloverminded');
    expect(mockStateService.setGameType).toHaveBeenCalledWith('TEST', 'cloverminded');
  });

  it('onSetHostPlayer and onRemoveHostPlayer should call stateService methods', () => {
    component.roomCode = 'TEST';
    component.onSetHostPlayer('user-123');
    expect(mockStateService.setHostPlayer).toHaveBeenCalledWith('TEST', 'user-123');

    component.onRemoveHostPlayer('user-123');
    expect(mockStateService.removeHostPlayer).toHaveBeenCalledWith('TEST', 'user-123');
  });

  it('goToLogin should navigate to /login with returnUrl query param', async () => {
    const router = TestBed.inject(ActivatedRoute);
    const navSpy = spyOn((component as any).router, 'navigate').and.returnValue(Promise.resolve(true));
    await component.goToLogin();
    expect(navSpy).toHaveBeenCalled();
  });

  describe('in-game chrome', () => {
    const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
    const games = [
      { id: 'Babble', name: 'Babble', timerType: 2, status: 'Testing' },
      { id: 'Farkle', name: 'Farkle', timerType: 0, status: 'Testing' }
    ];
    const el = () => fixture.nativeElement as HTMLElement;
    const play = (room: Record<string, unknown>, opts: { host?: boolean } = {}) => {
      mockStateService.needsName = false;
      (TestBed.inject(GameDataService).games$ as BehaviorSubject<any>).next(games);
      mockStateService.isHost$.next(opts.host ?? true);
      roomSubject.next({ code: 'ABCD', state: 'Playing', gameType: 'Babble', roundNumber: 1, isPaused: false, players: [], ...room });
      mockStateService.gameStarted$.next(true);
      fixture.detectChanges();
    };
    const menuButton = (label: string) =>
      [...el().querySelectorAll('app-game-menu button')].find(b => b.textContent!.includes(label)) as HTMLButtonElement | undefined;

    beforeEach(() => {
      mockStateService.pauseRound = jasmine.createSpy('pauseRound');
      mockStateService.resumeRound = jasmine.createSpy('resumeRound');
      mockStateService.endRound = jasmine.createSpy('endRound');
    });

    it('shows the room header in the lobby and the game bar in play', () => {
      expect(el().querySelector('app-room-header')).not.toBeNull();
      expect(el().querySelector('app-game-bar')).toBeNull();

      play({});
      expect(el().querySelector('app-game-bar')).not.toBeNull();
      expect(el().querySelector('app-room-header')).toBeNull();
      expect(el().querySelector('app-mobile-tab-bar')).toBeNull();
      expect(el().querySelector('.host-controls-bar')).toBeNull();
      expect(el().querySelector('.intermission-bar')).toBeNull();
    });

    it('keeps one set of host controls, inside the game menu', () => {
      play({});
      expect(el().querySelectorAll('app-host-settings').length).toBe(1);
      expect(el().querySelector('app-game-menu app-host-settings')).not.toBeNull();
    });

    it('shows what the active game publishes in the game bar', () => {
      mockStateService.gameComponent$.next(PublishingGameStubComponent);
      play({});
      fixture.detectChanges();
      expect(el().querySelector('app-game-bar [role=status]')!.textContent).toContain('Your turn');
    });

    it('clears the previous game from the chrome when the game changes', () => {
      play({});
      component.chrome.publish({ status: 'Guesty’s turn' });
      roomSubject.next({ code: 'ABCD', state: 'Playing', gameType: 'Farkle', roundNumber: 1, isPaused: false, players: [] });
      expect(component.chrome.status()).toBe('');
    });

    it('lets the host pause and resume a timed round', () => {
      play({ roundEndTime: at(60000) });
      menuButton('Pause round')!.click();
      expect(mockStateService.pauseRound).toHaveBeenCalled();

      play({ roundEndTime: at(60000), isPaused: true });
      component.tick();
      fixture.detectChanges();
      menuButton('Resume round')!.click();
      expect(mockStateService.resumeRound).toHaveBeenCalled();
      expect(el().querySelector('.room-overlay')!.textContent).toContain('Paused');
    });

    it('ends a round early only after the host confirms', async () => {
      play({ roundEndTime: at(60000) });
      const confirm = spyOn(TestBed.inject(ConfirmService), 'confirm').and.resolveTo(false);
      await component.endRoundEarly();
      expect(mockStateService.endRound).not.toHaveBeenCalled();
      confirm.and.resolveTo(true);
      await component.endRoundEarly();
      expect(mockStateService.endRound).toHaveBeenCalledTimes(1);
    });

    it('has no round controls for untimed games', () => {
      play({ gameType: 'Farkle' });
      expect(menuButton('Pause round')).toBeUndefined();
      expect(menuButton('End round')).toBeUndefined();
    });

    it('ends a timed-out round once, on the host only, never while paused', () => {
      play({ roundNumber: 2, roundEndTime: at(-1000) });
      component.tick(); component.tick(); component.tick();
      expect(mockStateService.endRound).toHaveBeenCalledTimes(1);

      mockStateService.endRound.calls.reset();
      play({ roundNumber: 3, roundEndTime: at(-1000) }, { host: false });
      component.tick();
      expect(mockStateService.endRound).not.toHaveBeenCalled();

      play({ roundNumber: 4, roundEndTime: at(-1000), isPaused: true });
      component.tick();
      expect(mockStateService.endRound).not.toHaveBeenCalled();
    });

    it('counts down the lead-in over the game', () => {
      play({ roundStartTime: at(2500), roundEndTime: at(62500) });
      component.tick();
      fixture.detectChanges();
      expect(el().querySelector('.room-overlay')!.textContent).toContain('3');
    });

    it('puts the host\'s next step on the game bar between rounds and after the game', () => {
      mockStateService.playAgain = jasmine.createSpy('playAgain');
      const settings = { timerDurationSeconds: 60 };
      mockStateService.isIntermission$.next(true);
      play({ resultPhase: 'RoundResults', settings });
      (el().querySelector('app-game-bar .bar-next') as HTMLButtonElement).click();
      expect(mockStateService.nextRound).toHaveBeenCalledWith(settings);

      play({ resultPhase: 'GameOver', settings });
      const next = el().querySelector('app-game-bar .bar-next') as HTMLButtonElement;
      expect(next.textContent).toContain('Play again');
      next.click();
      expect(mockStateService.playAgain).toHaveBeenCalledWith(settings);

      mockStateService.isIntermission$.next(false);
      play({ resultPhase: null, settings });
      expect(el().querySelector('app-game-bar .bar-next')).toBeNull();
    });

    it('collapses the player list on a Table when the game starts', () => {
      mockStateService.isScreen = true;
      component.isSidebarCollapsed = false;
      play({});
      expect(component.isSidebarCollapsed).toBeTrue();
    });
  });
});

@Component({ selector: 'app-publishing-game', template: '', standalone: true })
class PublishingGameStubComponent {
  private readonly chrome = inject(GameChromeService);
  constructor() { this.chrome.publish({ status: 'Your turn' }); }
}

