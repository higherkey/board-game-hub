import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GameDataService } from '../../services/game-data.service';
import { SignalRService } from '../../services/signalr.service';
import { GameRoomComponent } from './game-room.component';

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
  joinVideo() { }
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
  let mockSignalRService: any;
  let mockActivatedRoute: any;

  const playersSubject = new BehaviorSubject<any[]>([]);
  const roomSubject = new BehaviorSubject<any>(null);
  const connectionSubject = new BehaviorSubject<string>('Connected');
  const currentRoomSubject = new BehaviorSubject<any>(null); // Added for consistency with mock

  beforeEach(async () => {
    mockSignalRService = {
      players$: playersSubject.asObservable(),
      currentRoom$: roomSubject.asObservable(),
      connectionStatus$: connectionSubject.asObservable(),
      currentRoomSubject: currentRoomSubject, // Added missing subject
      me$: new BehaviorSubject(null),
      connectionId$: new BehaviorSubject('conn1'),
      isHost$: new BehaviorSubject(false),
      startConnection: jasmine.createSpy('startConnection').and.returnValue(Promise.resolve()),
      joinRoom: jasmine.createSpy('joinRoom').and.returnValue(Promise.resolve(true)),
      removeActiveRoom: jasmine.createSpy('removeActiveRoom'),
      startGame: jasmine.createSpy('startGame'),
      getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('conn1'),
      setGameType: jasmine.createSpy('setGameType')
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
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: AuthService, useValue: mockAuthService },
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
            UserProfileDropdownComponent
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
            UserProfileDropdownStubComponent
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
    expect(mockSignalRService.startConnection).toHaveBeenCalled();
    expect(mockSignalRService.joinRoom).toHaveBeenCalledWith('ABCD', 'Guest', jasmine.any(Boolean));
  });

  it('should identify host correctly', (done) => {
    // Manually trigger the mock service's isHost$
    (mockSignalRService.isHost$ as BehaviorSubject<boolean>).next(true);

    component.isHost$.subscribe(isHost => {
      expect(isHost).toBeTrue();
      done();
    });
  });

  it('startGame should call service', () => {
    const settings: any = { timerDurationSeconds: 60 };
    component.startGame(settings);
    expect(mockSignalRService.startGame).toHaveBeenCalledWith(settings);
  });

  it('should call setGameType None on exitGame', async () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.roomCode = 'TEST';
    await component.onExitGame();
    expect(mockSignalRService.setGameType).toHaveBeenCalledWith('TEST', 'None');
  });
});
