import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
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
class VideoChatStubComponent { }

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

// Import real components to override

import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { BabbleComponent } from '../games/babble/babble-game/babble.component';
import { OneAndOnlyBoardComponent } from '../games/one-and-only/one-and-only-board/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from '../games/one-and-only/one-and-only-player/one-and-only-player.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';

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
      startConnection: jasmine.createSpy('startConnection').and.returnValue(Promise.resolve()),
      joinRoom: jasmine.createSpy('joinRoom').and.returnValue(Promise.resolve(true)),
      removeActiveRoom: jasmine.createSpy('removeActiveRoom'),
      startGame: jasmine.createSpy('startGame'),
      getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('conn1')
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ code: 'ABCD' }),
        queryParamMap: convertToParamMap({ name: 'TestUser' })
      }
    };

    const mockAuthService = {
      currentUser$: new BehaviorSubject(null),
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
            OneAndOnlyPlayerComponent
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
            OneAndOnlyPlayerStubComponent
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
    expect(component.roomCode).toBe('ABCD');
    expect(mockSignalRService.startConnection).toHaveBeenCalled();
    expect(mockSignalRService.joinRoom).toHaveBeenCalledWith('ABCD', 'Guest');
  });

  it('should identify host correctly', (done) => {
    const players = [
      { name: 'Other', isHost: false },
      { name: 'Guest', isHost: true }
    ];
    playersSubject.next(players);

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
});
