import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GameDataService } from '../../services/game-data.service';
import { SignalRService } from '../../services/signalr.service';
import { GameRoomStateService } from './services/game-room-state.service';
import { GameRoomComponent } from './game-room.component';

import { ConfirmService } from '../../shared/services/confirm.service';

// Stub Components

@Component({ selector: 'app-host-settings', template: '', standalone: true, imports: [] })
class HostSettingsStubComponent {
  @Input() roomCode: any;
  @Input() currentGameType: any;
  @Output() gameStart = new EventEmitter<any>();
}

@Component({ selector: 'app-video-chat', template: '', standalone: true, imports: [] })
class VideoChatStubComponent {
  isVideoActive = false;
  joinVideo() { /* stub for testing */ }
}

@Component({ selector: 'app-word-hunt', template: '', standalone: true, imports: [] })
class BabbleStubComponent {
  @Input() grid: any;
  @Input() isPlaying: any;
  @Output() wordsUpdated = new EventEmitter<any>();
}

@Component({ selector: 'app-game-review', template: '', standalone: true, imports: [] })
class GameReviewStubComponent {
  @Input() room: any;
  @Input() isHost: any;
}

@Component({ selector: 'app-social-panel', template: '', standalone: true, imports: [] })
class SocialPanelStubComponent { }

@Component({ selector: 'app-one-and-only-board', template: '', standalone: true, imports: [] })
class OneAndOnlyBoardStubComponent {
  @Input() room: any;
}

@Component({ selector: 'app-one-and-only-player', template: '', standalone: true, imports: [] })
class OneAndOnlyPlayerStubComponent {
  @Input() room: any;
  @Input() myConnectionId: any;
  @Output() clueSubmitted = new EventEmitter<any>();
  @Output() guessSubmitted = new EventEmitter<any>();
}

@Component({ selector: 'app-user-profile-dropdown', template: '', standalone: true, imports: [] })
class UserProfileDropdownStubComponent {
  @Input() session: any;
  @Input() compactMode: boolean = false;
}

@Component({ selector: 'app-room-header', template: '', standalone: true, imports: [] })
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

@Component({ selector: 'app-room-sidebar', template: '', standalone: true, imports: [] })
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

@Component({ selector: 'app-room-entry', template: '', standalone: true, imports: [] })
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

@Component({ selector: 'app-lobby', template: '', standalone: true, imports: [] })
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

  xit('should call exitGame on stateService when confirmed', fakeAsync(() => {
    component.roomCode = 'TEST';
    component.onExitGame();
    tick();
    expect(mockStateService.exitGame).toHaveBeenCalledWith('TEST');
  }));

  it('should show entry-stage when needsName is true', () => {
    mockStateService.needsName = true;
    fixture.detectChanges();
    const entryStage = fixture.nativeElement.querySelector('app-room-entry');
    expect(entryStage).toBeTruthy();
  });
});

